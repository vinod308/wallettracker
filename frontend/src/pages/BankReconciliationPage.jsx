import React, { useState, useEffect, useCallback, useRef } from 'react';
import Papa from 'papaparse';
import MainLayout from '../components/layout/MainLayout';
import { bankReconService } from '../services/financeService';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

const StatusBadge = ({ status }) => {
    const map = {
        Matched:    'bg-green-100 text-green-800',
        Unmatched:  'bg-red-100 text-red-700',
        Difference: 'bg-yellow-100 text-yellow-800',
        Debit:      'bg-gray-100 text-gray-600',
    };
    const icons = { Matched: '✓', Unmatched: '⚠', Difference: 'Δ', Debit: '↓' };
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${map[status] || 'bg-gray-100 text-gray-600'}`}>
            {icons[status]} {status}
        </span>
    );
};

const CATEGORIES = ['Travel', 'Food & Meals', 'Transport', 'Accommodation', 'Medical', 'Stationery', 'Other'];

// Column mapping presets for common Indian banks
const BANK_PRESETS = {
    HDFC:  { date: 'Date', description: 'Narration', credit: 'Deposit Amt', debit: 'Withdrawal Amt', balance: 'Closing Balance' },
    ICICI: { date: 'Transaction Date', description: 'Transaction Remarks', credit: 'Credit', debit: 'Debit', balance: 'Balance' },
    SBI:   { date: 'Txn Date', description: 'Description', credit: 'Credit', debit: 'Debit', balance: 'Balance' },
    Axis:  { date: 'Tran Date', description: 'PARTICULARS', credit: 'CR', debit: 'DR', balance: 'BAL' },
    Kotak: { date: 'Transaction Date', description: 'Description', credit: 'Credit Amount', debit: 'Debit Amount', balance: 'Balance' },
};

export default function BankReconciliationPage() {
    const [statements,   setStatements]   = useState([]);
    const [activeStmt,   setActiveStmt]   = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading,      setLoading]      = useState(true);
    const [uploading,    setUploading]    = useState(false);
    const [error,        setError]        = useState('');
    const [filter,       setFilter]       = useState('all');

    // Upload wizard state
    const [showWizard,   setShowWizard]   = useState(false);
    const [csvRows,      setCsvRows]      = useState([]);
    const [csvHeaders,   setCsvHeaders]   = useState([]);
    const [bankPreset,   setBankPreset]   = useState('HDFC');
    const [colMap,       setColMap]       = useState(BANK_PRESETS.HDFC);
    const [stmtName,     setStmtName]     = useState('');
    const [bankName,     setBankName]     = useState('HDFC');
    const fileRef = useRef();

    const loadStatements = useCallback(async () => {
        try {
            const res = await bankReconService.getStatements();
            setStatements(res.data.data || []);
        } catch { setError('Failed to load statements'); }
        finally { setLoading(false); }
    }, []);

    const loadStatement = useCallback(async (id, f = 'all') => {
        setLoading(true);
        try {
            const res = await bankReconService.getStatement(id, f === 'all' ? undefined : f);
            setActiveStmt(res.data.data.statement);
            setTransactions(res.data.data.transactions || []);
        } catch { setError('Failed to load statement'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { loadStatements(); }, [loadStatements]);

    const handleFile = (file) => {
        if (!file) return;
        Papa.parse(file, {
            header: true, skipEmptyLines: true,
            complete: (result) => {
                setCsvHeaders(result.meta.fields || []);
                setCsvRows(result.data);
                setStmtName(file.name.replace(/\.csv$/i, ''));
                setShowWizard(true);
            }
        });
    };

    const applyPreset = (preset) => {
        setBankPreset(preset);
        setBankName(preset);
        setColMap({ ...BANK_PRESETS[preset] });
    };

    const handleUpload = async () => {
        if (!csvRows.length) return;
        setUploading(true);
        setError('');
        try {
            const transactions = csvRows.map(row => ({
                date:        row[colMap.date]        || '',
                description: row[colMap.description] || '',
                credit:      parseFloat((row[colMap.credit] || '0').toString().replace(/,/g, '')) || 0,
                debit:       parseFloat((row[colMap.debit]  || '0').toString().replace(/,/g, '')) || 0,
                balance:     parseFloat((row[colMap.balance]|| '0').toString().replace(/,/g, '')) || 0,
            })).filter(t => t.date);

            await bankReconService.uploadStatement({ statementName: stmtName, bankName, transactions });
            setShowWizard(false);
            setCsvRows([]); setCsvHeaders([]);
            await loadStatements();
        } catch (err) {
            setError(err.response?.data?.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this statement?')) return;
        await bankReconService.deleteStatement(id);
        if (activeStmt?.id === id) { setActiveStmt(null); setTransactions([]); }
        loadStatements();
    };

    const handleFilterChange = (f) => {
        setFilter(f);
        if (activeStmt) loadStatement(activeStmt.id, f);
    };

    // Percentage bar helper
    const MatchBar = ({ matched, total }) => {
        const pct = total > 0 ? Math.round((matched / total) * 100) : 0;
        return (
            <div className="w-24">
                <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-green-700 font-semibold">{pct}%</span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-1.5 bg-green-500 rounded-full" style={{ width: `${pct}%` }} />
                </div>
            </div>
        );
    };

    return (
        <MainLayout>
            <div className="p-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Bank Reconciliation</h1>
                        <p className="text-sm text-gray-500 mt-1">Upload your bank statement CSV and auto-match against GST invoices.</p>
                    </div>
                    <button
                        onClick={() => fileRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors flex-shrink-0 self-start sm:self-auto whitespace-nowrap"
                    >
                        + Upload Statement
                    </button>
                    <input ref={fileRef} type="file" accept=".csv" className="hidden"
                        onChange={e => { handleFile(e.target.files[0]); e.target.value = ''; }} />
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    {/* Left: statement list */}
                    <div className="col-span-1 lg:col-span-4">
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-800 text-sm">
                                Uploaded Statements
                            </div>
                            {loading && !statements.length ? (
                                <div className="p-6 text-center text-sm text-gray-400">Loading…</div>
                            ) : statements.length === 0 ? (
                                <div
                                    onClick={() => fileRef.current?.click()}
                                    className="p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                                >
                                    <div className="text-3xl mb-2">📂</div>
                                    <p className="text-sm text-gray-500 font-medium">No statements yet</p>
                                    <p className="text-xs text-gray-400 mt-1">Click here or use the button above to upload a CSV</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {statements.map(s => (
                                        <div
                                            key={s.id}
                                            onClick={() => { setFilter('all'); loadStatement(s.id); }}
                                            className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors ${activeStmt?.id === s.id ? 'bg-indigo-50 border-l-4 border-indigo-500' : ''}`}
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm font-semibold text-gray-800 truncate max-w-[140px]">{s.statement_name}</span>
                                                <button onClick={e => { e.stopPropagation(); handleDelete(s.id); }}
                                                    className="text-red-300 hover:text-red-500 text-xs ml-1">✕</button>
                                            </div>
                                            <div className="text-xs text-gray-500 mb-1.5">{s.bank_name} · {s.total_transactions} txns</div>
                                            <MatchBar matched={s.matched_count} total={s.total_transactions - (parseInt(s.total_transactions) - parseInt(s.matched_count) - parseInt(s.unmatched_count) - parseInt(s.discrepancy_count))} />
                                            <div className="flex gap-2 mt-1.5 text-xs">
                                                <span className="text-green-700">{s.matched_count} ✓</span>
                                                <span className="text-red-600">{s.unmatched_count} ⚠</span>
                                                {s.discrepancy_count > 0 && <span className="text-yellow-700">{s.discrepancy_count} Δ</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Template download hint */}
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
                            <strong>CSV Format:</strong> date, description, credit, debit, balance<br/>
                            Most banks let you export this from Net Banking → Statements → Download CSV.
                        </div>
                    </div>

                    {/* Right: transactions */}
                    <div className="col-span-1 lg:col-span-8">
                        {!activeStmt ? (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                                <div className="text-4xl mb-3">🏦</div>
                                <p className="text-gray-500 text-sm">Select a statement from the left to view transactions</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* KPI strip */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {[
                                        { label: 'Total', value: activeStmt.total_transactions, color: 'text-gray-800', sub: 'transactions' },
                                        { label: 'Matched', value: activeStmt.matched_count, color: 'text-green-700', sub: `${Math.round((activeStmt.matched_count / Math.max(activeStmt.total_transactions,1))*100)}%` },
                                        { label: 'Unmatched', value: activeStmt.unmatched_count, color: 'text-red-600', sub: 'need attention' },
                                        { label: 'Discrepancy', value: activeStmt.discrepancy_count, color: 'text-yellow-700', sub: 'amount differs' },
                                    ].map(k => (
                                        <div key={k.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 text-center">
                                            <div className="text-xs text-gray-400 font-medium">{k.label}</div>
                                            <div className={`text-2xl font-bold mt-0.5 ${k.color}`}>{k.value}</div>
                                            <div className="text-xs text-gray-400 mt-0.5">{k.sub}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* Filter + Table */}
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                                        <div className="font-semibold text-gray-800 text-sm">{activeStmt.statement_name}</div>
                                        <div className="flex gap-1.5">
                                            {['all','matched','unmatched','discrepancy'].map(f => (
                                                <button key={f}
                                                    onClick={() => handleFilterChange(f)}
                                                    className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-colors ${filter === f ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                                >{f}</button>
                                            ))}
                                        </div>
                                    </div>
                                    {loading ? (
                                        <div className="p-8 text-center text-sm text-gray-400">Loading transactions…</div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-xs">
                                                <thead>
                                                    <tr className="bg-gray-50 border-b border-gray-100">
                                                        <th className="px-3 py-2.5 text-left text-gray-500 font-semibold">Date</th>
                                                        <th className="px-3 py-2.5 text-left text-gray-500 font-semibold">Description</th>
                                                        <th className="px-3 py-2.5 text-right text-gray-500 font-semibold">Credit</th>
                                                        <th className="px-3 py-2.5 text-right text-gray-500 font-semibold">Debit</th>
                                                        <th className="px-3 py-2.5 text-left text-gray-500 font-semibold">Matched Invoice</th>
                                                        <th className="px-3 py-2.5 text-right text-gray-500 font-semibold">Diff</th>
                                                        <th className="px-3 py-2.5 text-left text-gray-500 font-semibold">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {transactions.length === 0 ? (
                                                        <tr><td colSpan={7} className="text-center py-8 text-gray-400">No transactions for this filter</td></tr>
                                                    ) : transactions.map(t => (
                                                        <tr key={t.id} className={`border-b border-gray-50 hover:bg-gray-50 ${t.match_status === 'Unmatched' ? 'bg-red-50/30' : t.match_status === 'Difference' ? 'bg-yellow-50/30' : ''}`}>
                                                            <td className="px-3 py-2 text-gray-600 whitespace-nowrap">
                                                                {t.txn_date ? new Date(t.txn_date).toLocaleDateString('en-IN') : '—'}
                                                            </td>
                                                            <td className="px-3 py-2 text-gray-700 max-w-[200px] truncate" title={t.description}>
                                                                {t.description || '—'}
                                                            </td>
                                                            <td className="px-3 py-2 text-right font-semibold text-green-700">
                                                                {t.credit_amount > 0 ? fmt(t.credit_amount) : '—'}
                                                            </td>
                                                            <td className="px-3 py-2 text-right text-red-600">
                                                                {t.debit_amount > 0 ? fmt(t.debit_amount) : '—'}
                                                            </td>
                                                            <td className="px-3 py-2 text-indigo-600 font-mono text-xs">
                                                                {t.matched_invoice_number || <span className="text-gray-300">—</span>}
                                                            </td>
                                                            <td className="px-3 py-2 text-right">
                                                                {t.difference_amount !== 0 ? (
                                                                    <span className={t.difference_amount > 0 ? 'text-green-700' : 'text-red-600'}>
                                                                        {fmt(Math.abs(t.difference_amount))}
                                                                    </span>
                                                                ) : <span className="text-gray-300">—</span>}
                                                            </td>
                                                            <td className="px-3 py-2">
                                                                <StatusBadge status={t.match_status} />
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Upload Wizard Modal ────────────────────────────────────── */}
            {showWizard && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="font-bold text-gray-900">Map CSV Columns</h2>
                            <button onClick={() => setShowWizard(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        <div className="p-6 space-y-4">
                            {/* Statement details */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Statement Name</label>
                                    <input value={stmtName} onChange={e => setStmtName(e.target.value)}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Bank</label>
                                    <select value={bankPreset} onChange={e => applyPreset(e.target.value)}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                                        {Object.keys(BANK_PRESETS).map(b => <option key={b}>{b}</option>)}
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>

                            {/* Column mapping */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <p className="text-xs font-semibold text-gray-600 mb-3">Map your CSV columns (auto-filled for selected bank):</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {['date','description','credit','debit','balance'].map(field => (
                                        <div key={field}>
                                            <label className="block text-xs font-medium text-gray-600 mb-1 capitalize">{field} column</label>
                                            <select value={colMap[field] || ''} onChange={e => setColMap(m => ({ ...m, [field]: e.target.value }))}
                                                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                                                <option value="">— skip —</option>
                                                {csvHeaders.map(h => <option key={h}>{h}</option>)}
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Preview */}
                            <div>
                                <p className="text-xs font-semibold text-gray-600 mb-2">Preview (first 3 rows):</p>
                                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                                    <table className="w-full text-xs">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                {['date','description','credit','debit'].map(f => (
                                                    <th key={f} className="px-3 py-2 text-left text-gray-500 font-semibold capitalize">{f}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {csvRows.slice(0,3).map((row, i) => (
                                                <tr key={i} className="border-t border-gray-100">
                                                    <td className="px-3 py-2">{row[colMap.date] || '—'}</td>
                                                    <td className="px-3 py-2 max-w-[160px] truncate">{row[colMap.description] || '—'}</td>
                                                    <td className="px-3 py-2 text-green-700">{row[colMap.credit] || '—'}</td>
                                                    <td className="px-3 py-2 text-red-600">{row[colMap.debit] || '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">{csvRows.length} total rows in file</p>
                            </div>

                            {error && <p className="text-sm text-red-600">{error}</p>}

                            <div className="flex gap-3">
                                <button onClick={() => setShowWizard(false)}
                                    className="flex-1 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50">
                                    Cancel
                                </button>
                                <button onClick={handleUpload} disabled={uploading}
                                    className="flex-1 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50">
                                    {uploading ? 'Matching…' : `Upload & Match ${csvRows.length} Rows`}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}
