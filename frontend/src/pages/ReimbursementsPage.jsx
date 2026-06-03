import React, { useState, useEffect, useCallback, useRef } from 'react';
import Papa from 'papaparse';
import MainLayout from '../components/layout/MainLayout';
import { reimbursementService } from '../services/financeService';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

const CATEGORIES = ['Travel', 'Food & Meals', 'Transport', 'Accommodation', 'Medical', 'Stationery', 'Client Entertainment', 'Other'];

const StatusBadge = ({ status }) => {
    const map = {
        Pending:  'bg-yellow-100 text-yellow-800',
        Approved: 'bg-green-100 text-green-800',
        Rejected: 'bg-red-100 text-red-700',
    };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[status] || 'bg-gray-100 text-gray-600'}`}>{status}</span>;
};

const emptyForm = { employeeName: '', category: 'Travel', expenseDate: '', description: '', amount: '' };

export default function ReimbursementsPage() {
    const [records,    setRecords]    = useState([]);
    const [summary,    setSummary]    = useState({});
    const [categories, setCategories] = useState([]);
    const [loading,    setLoading]    = useState(true);
    const [error,      setError]      = useState('');
    const [filter,     setFilter]     = useState('all');
    const [search,     setSearch]     = useState('');

    const [showAddModal,    setShowAddModal]    = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(null); // reimbursement id
    const [rejectReason,    setRejectReason]    = useState('');
    const [form,            setForm]            = useState(emptyForm);
    const [saving,          setSaving]          = useState(false);
    const [csvPreview,      setCsvPreview]      = useState([]);
    const [importing,       setImporting]       = useState(false);
    const fileRef = useRef();

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res  = await reimbursementService.getAll({ status: filter === 'all' ? undefined : filter, search: search || undefined });
            setRecords(res.data.data || []);
            setSummary(res.data.summary || {});
            const catRes = await reimbursementService.getCategories();
            setCategories(catRes.data.data || []);
        } catch { setError('Failed to load reimbursements'); }
        finally  { setLoading(false); }
    }, [filter, search]);

    useEffect(() => { load(); }, [load]);

    const handleStatusChange = async (id, status, reason) => {
        try {
            await reimbursementService.updateStatus(id, status, reason);
            setRecords(prev => prev.map(r => r.id === id ? { ...r, status } : r));
            setShowRejectModal(null); setRejectReason('');
            load();
        } catch { setError('Failed to update status'); }
    };

    const handleAdd = async () => {
        setSaving(true);
        try {
            await reimbursementService.create(form);
            setShowAddModal(false);
            setForm(emptyForm);
            load();
        } catch (err) { setError(err.response?.data?.message || 'Failed to add'); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this claim?')) return;
        await reimbursementService.remove(id);
        load();
    };

    const handleCSVFile = (file) => {
        Papa.parse(file, {
            header: true, skipEmptyLines: true,
            complete: (res) => setCsvPreview(res.data)
        });
    };

    const handleImport = async () => {
        if (!csvPreview.length) return;
        setImporting(true);
        try {
            await reimbursementService.bulkImport(csvPreview);
            setShowImportModal(false);
            setCsvPreview([]);
            load();
        } catch (err) { setError(err.response?.data?.message || 'Import failed'); }
        finally { setImporting(false); }
    };

    const downloadTemplate = () => {
        const csv = 'employee_name,category,date,description,amount\nRahul Sharma,Travel,2026-05-28,Flight to Mumbai,8400\nPriya Mehta,Food & Meals,2026-05-25,Team lunch,2200';
        const a = document.createElement('a');
        a.href = 'data:text/csv,' + encodeURIComponent(csv);
        a.download = 'reimbursement_template.csv';
        a.click();
    };

    return (
        <MainLayout>
            <div className="p-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Reimbursements</h1>
                        <p className="text-sm text-gray-500 mt-1">Manage employee expense claims — approve, reject, or import in bulk.</p>
                    </div>
                    <div className="flex flex-wrap gap-2 flex-shrink-0">
                        <button onClick={downloadTemplate}
                            className="px-3 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 whitespace-nowrap">
                            ↓ CSV Template
                        </button>
                        <button onClick={() => setShowImportModal(true)}
                            className="px-3 py-2 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 whitespace-nowrap">
                            ↑ Import CSV
                        </button>
                        <button onClick={() => setShowAddModal(true)}
                            className="px-3 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 whitespace-nowrap">
                            + Add Claim
                        </button>
                    </div>
                </div>

                {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}

                {/* KPI strip */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-6">
                    {[
                        { label: 'Total Claims',  value: (parseInt(summary.pending||0)+parseInt(summary.approved||0)+parseInt(summary.rejected||0)),  color: 'text-gray-800' },
                        { label: 'Pending',       value: summary.pending  || 0, color: 'text-yellow-700' },
                        { label: 'Approved',      value: summary.approved || 0, color: 'text-green-700' },
                        { label: 'Rejected',      value: summary.rejected || 0, color: 'text-red-600' },
                        { label: 'Total Amount',  value: fmt(summary.total_amount), color: 'text-indigo-700', isText: true },
                    ].map(k => (
                        <div key={k.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
                            <div className="text-xs text-gray-400 font-medium">{k.label}</div>
                            <div className={`font-bold mt-1 ${k.isText ? 'text-base' : 'text-2xl'} ${k.color}`}>{k.value}</div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    {/* Main table */}
                    <div className="col-span-1 lg:col-span-8">
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            {/* Filters */}
                            <div className="px-4 py-3 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-2">
                                <input
                                    value={search} onChange={e => setSearch(e.target.value)}
                                    placeholder="Search employee or description…"
                                    className="w-full sm:flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                />
                                <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                                    {['all','Pending','Approved','Rejected'].map(f => (
                                        <button key={f} onClick={() => setFilter(f)}
                                            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-colors ${filter === f ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                                            {f}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {loading ? (
                                <div className="p-8 text-center text-sm text-gray-400">Loading…</div>
                            ) : records.length === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="text-3xl mb-2">🧾</div>
                                    <p className="text-gray-500 text-sm">No claims yet. Add manually or import a CSV.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr className="bg-gray-50 border-b border-gray-100">
                                                <th className="px-3 py-2.5 text-left text-gray-500 font-semibold">Employee</th>
                                                <th className="px-3 py-2.5 text-left text-gray-500 font-semibold">Category</th>
                                                <th className="px-3 py-2.5 text-left text-gray-500 font-semibold">Date</th>
                                                <th className="px-3 py-2.5 text-left text-gray-500 font-semibold">Description</th>
                                                <th className="px-3 py-2.5 text-right text-gray-500 font-semibold">Amount</th>
                                                <th className="px-3 py-2.5 text-left text-gray-500 font-semibold">Status</th>
                                                <th className="px-3 py-2.5 text-center text-gray-500 font-semibold">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {records.map(r => (
                                                <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                                                    <td className="px-3 py-2.5 font-semibold text-gray-800">{r.employee_name}</td>
                                                    <td className="px-3 py-2.5">
                                                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium">{r.category}</span>
                                                    </td>
                                                    <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">
                                                        {r.expense_date ? new Date(r.expense_date).toLocaleDateString('en-IN') : '—'}
                                                    </td>
                                                    <td className="px-3 py-2.5 text-gray-600 max-w-[160px] truncate" title={r.description}>{r.description || '—'}</td>
                                                    <td className="px-3 py-2.5 text-right font-semibold text-gray-800">{fmt(r.amount)}</td>
                                                    <td className="px-3 py-2.5"><StatusBadge status={r.status} /></td>
                                                    <td className="px-3 py-2.5">
                                                        {r.status === 'Pending' ? (
                                                            <div className="flex items-center justify-center gap-1.5">
                                                                <button onClick={() => handleStatusChange(r.id, 'Approved')}
                                                                    className="px-2.5 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">✓</button>
                                                                <button onClick={() => setShowRejectModal(r.id)}
                                                                    className="px-2.5 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium">✕</button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center justify-center gap-1.5">
                                                                <button onClick={() => handleStatusChange(r.id, 'Pending')}
                                                                    className="px-2 py-1 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 text-xs">Reset</button>
                                                                <button onClick={() => handleDelete(r.id)}
                                                                    className="text-red-300 hover:text-red-500">✕</button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Category breakdown */}
                    <div className="col-span-1 lg:col-span-4 space-y-4">
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                            <div className="font-semibold text-gray-800 text-sm mb-3">By Category</div>
                            {categories.length === 0 ? (
                                <p className="text-xs text-gray-400 text-center py-4">No data yet</p>
                            ) : categories.map(c => {
                                const total = categories.reduce((s, x) => s + parseFloat(x.total || 0), 0);
                                const pct = total > 0 ? Math.round((parseFloat(c.total) / total) * 100) : 0;
                                return (
                                    <div key={c.category} className="mb-3">
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-gray-700 font-medium">{c.category}</span>
                                            <span className="text-gray-500">{fmt(c.total)} ({pct}%)</span>
                                        </div>
                                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-1.5 bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                                        </div>
                                        <div className="text-xs text-gray-400 mt-0.5">{c.approved_count}/{c.count} approved</div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                            <div className="font-semibold text-gray-800 text-sm mb-2">Amount Summary</div>
                            <div className="space-y-2 text-xs">
                                <div className="flex justify-between"><span className="text-gray-500">Total Claimed</span><span className="font-semibold">{fmt(summary.total_amount)}</span></div>
                                <div className="flex justify-between"><span className="text-green-600">Approved</span><span className="font-semibold text-green-700">{fmt(summary.approved_amount)}</span></div>
                                <div className="flex justify-between"><span className="text-yellow-600">Pending</span><span className="font-semibold text-yellow-700">{fmt(summary.pending_amount)}</span></div>
                                <div className="h-1 bg-gray-100 rounded-full mt-2">
                                    <div className="h-1 bg-green-500 rounded-full"
                                        style={{ width: `${summary.total_amount > 0 ? Math.round((summary.approved_amount / summary.total_amount) * 100) : 0}%` }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Add Claim Modal ─────────────────────────────────────────── */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="font-bold text-gray-900">Add Expense Claim</h2>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Employee Name *</label>
                                <input value={form.employeeName} onChange={e => setForm(f => ({ ...f, employeeName: e.target.value }))}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                    placeholder="e.g. Rahul Sharma" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                                    <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Date *</label>
                                    <input type="date" value={form.expenseDate} onChange={e => setForm(f => ({ ...f, expenseDate: e.target.value }))}
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                    placeholder="e.g. Flight to Mumbai – client meeting" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Amount (₹) *</label>
                                <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                    placeholder="0.00" />
                            </div>
                            <div className="flex gap-3 pt-1">
                                <button onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50">Cancel</button>
                                <button onClick={handleAdd} disabled={saving}
                                    className="flex-1 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50">
                                    {saving ? 'Saving…' : 'Add Claim'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Import CSV Modal ─────────────────────────────────────────── */}
            {showImportModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="font-bold text-gray-900">Import from CSV</h2>
                            <button onClick={() => { setShowImportModal(false); setCsvPreview([]); }} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        <div className="p-6 space-y-4">
                            {csvPreview.length === 0 ? (
                                <div
                                    onClick={() => fileRef.current?.click()}
                                    className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
                                >
                                    <div className="text-3xl mb-2">📋</div>
                                    <p className="text-sm font-medium text-gray-700">Click to choose CSV file</p>
                                    <p className="text-xs text-gray-400 mt-1">Required columns: employee_name, category, date, description, amount</p>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-sm font-medium text-gray-700 mb-2">{csvPreview.length} rows ready to import:</p>
                                    <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl">
                                        <table className="w-full text-xs">
                                            <thead className="bg-gray-50 sticky top-0">
                                                <tr>
                                                    <th className="px-3 py-2 text-left text-gray-500">Employee</th>
                                                    <th className="px-3 py-2 text-left text-gray-500">Category</th>
                                                    <th className="px-3 py-2 text-left text-gray-500">Date</th>
                                                    <th className="px-3 py-2 text-right text-gray-500">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {csvPreview.slice(0, 10).map((r, i) => (
                                                    <tr key={i} className="border-t border-gray-50">
                                                        <td className="px-3 py-1.5">{r.employee_name || r.employeeName || '—'}</td>
                                                        <td className="px-3 py-1.5">{r.category || 'Other'}</td>
                                                        <td className="px-3 py-1.5">{r.date || r.expense_date || '—'}</td>
                                                        <td className="px-3 py-1.5 text-right">{r.amount ? `₹${r.amount}` : '—'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {csvPreview.length > 10 && <p className="text-xs text-gray-400 mt-1">+{csvPreview.length - 10} more rows</p>}
                                </div>
                            )}
                            <input ref={fileRef} type="file" accept=".csv" className="hidden"
                                onChange={e => { handleCSVFile(e.target.files[0]); e.target.value = ''; }} />
                            <div className="flex gap-3">
                                <button onClick={() => { setShowImportModal(false); setCsvPreview([]); }}
                                    className="flex-1 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50">Cancel</button>
                                <button onClick={handleImport} disabled={importing || csvPreview.length === 0}
                                    className="flex-1 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 disabled:opacity-50">
                                    {importing ? 'Importing…' : `Import ${csvPreview.length} Records`}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Reject Reason Modal ──────────────────────────────────────── */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
                        <h2 className="font-bold text-gray-900 mb-3">Rejection Reason</h2>
                        <textarea
                            value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                            placeholder="Optional — why is this being rejected?"
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 h-24 resize-none"
                        />
                        <div className="flex gap-3 mt-4">
                            <button onClick={() => { setShowRejectModal(null); setRejectReason(''); }}
                                className="flex-1 py-2 border border-gray-200 text-gray-700 text-sm rounded-xl hover:bg-gray-50">Cancel</button>
                            <button onClick={() => handleStatusChange(showRejectModal, 'Rejected', rejectReason)}
                                className="flex-1 py-2 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700">Reject</button>
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}
