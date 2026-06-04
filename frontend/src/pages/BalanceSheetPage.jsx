import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { balanceSheetService } from '../services/financeService';

const fmt  = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
const fmtL = (n) => { const l = n / 100000; return l >= 100 ? `₹${(l/100).toFixed(2)} Cr` : `₹${l.toFixed(2)} L`; };
const pct  = (a, b) => b > 0 ? Math.round((a / b) * 100) : 0;
const sum  = (...args) => args.reduce((a, b) => a + (Number(b) || 0), 0);

const quarters = [
    { key: 'full', label: 'Full Year' },
    { key: 'Q1',   label: 'Q1 Apr–Jun' },
    { key: 'Q2',   label: 'Q2 Jul–Sep' },
    { key: 'Q3',   label: 'Q3 Oct–Dec' },
    { key: 'Q4',   label: 'Q4 Jan–Mar' },
];

const MAIN_TABS = [
    { key: 'summary', label: 'P&L Summary' },
    { key: 'bs',      label: 'Balance Sheet' },
    { key: 'pl',      label: 'P&L Statement' },
    { key: 'cf',      label: 'Cash Flow' },
];

const MiniBar = ({ value, max, color = 'bg-indigo-500' }) => (
    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1">
        <div className={`h-1.5 ${color} rounded-full transition-all duration-700`}
            style={{ width: `${max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0}%` }} />
    </div>
);

// Editable number input for manual-entry sections
const NumField = ({ value, onChange }) => (
    <input
        type="number"
        value={value || ''}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        placeholder="0"
        className="w-32 text-right px-2 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-300 bg-white"
    />
);

// Row for financial statement tables
const FinRow = ({ label, value, indent = 0, bold, subtotal, total, editable, auto, note, onChange }) => {
    const pl = indent === 1 ? 'pl-6' : indent === 2 ? 'pl-10' : '';
    const labelCls = total
        ? 'font-bold text-gray-900'
        : subtotal
        ? 'font-semibold text-gray-800'
        : bold
        ? 'font-semibold text-gray-800'
        : 'text-gray-600';
    const valCls = total
        ? 'font-bold text-indigo-700 text-base'
        : subtotal
        ? 'font-semibold text-gray-700'
        : 'font-medium text-gray-700';
    return (
        <tr className={`border-b border-gray-50 ${total ? 'bg-indigo-50/60' : subtotal ? 'bg-gray-50/70' : ''}`}>
            <td className={`px-4 py-2 text-sm ${pl} ${labelCls}`}>
                {label}
                {note && <span className="ml-2 text-xs text-gray-400 font-normal">{note}</span>}
                {auto && <span className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-600">auto</span>}
            </td>
            <td className="px-4 py-2 text-right">
                {editable ? (
                    <div className="flex items-center justify-end gap-1.5">
                        {auto && <span className="text-xs text-indigo-400 hidden sm:inline">from system</span>}
                        <NumField value={value} onChange={onChange} />
                    </div>
                ) : (
                    <span className={`text-sm stat-num ${valCls}`}>{fmt(value)}</span>
                )}
            </td>
        </tr>
    );
};

// Section header for financial statement tables
const SecHeader = ({ title, icon }) => (
    <tr className="bg-indigo-600 text-white">
        <td colSpan={2} className="px-4 py-2.5 text-xs font-bold uppercase tracking-widest">
            {icon && <span className="mr-1.5">{icon}</span>}{title}
        </td>
    </tr>
);

export default function BalanceSheetPage() {
    const [data,    setData]    = useState(null);
    const [years,   setYears]   = useState([]);
    const [fy,      setFy]      = useState(new Date().getMonth() >= 3 ? new Date().getFullYear() : new Date().getFullYear() - 1);
    const [period,  setPeriod]  = useState('full');
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState('');
    const [mainTab, setMainTab] = useState('summary');

    // ── Balance Sheet state ──────────────────────────────────────────────────
    const [bs, setBs] = useState({
        // Non-Current Assets
        ppe: 0, capitalWip: 0, investmentsNCA: 0, loansNCA: 0, otherFinAssetsNCA: 0,
        deferredTaxAssets: 0, otherNCA: 0,
        // Current Assets
        inventories: 0, tradeReceivables: 0, cashEquivalents: 0,
        bankBalancesOther: 0, currentInvestments: 0, loansCA: 0, otherCA: 0,
        // Equity
        shareCapital: 0, otherEquity: 0,
        // Non-Current Liabilities
        borrowingsNCL: 0, tradePayablesNCL: 0, otherFinLiabNCL: 0,
        deferredIncome: 0, otherNCL: 0, provisionsNCL: 0,
        // Current Liabilities
        borrowingsCL: 0, tradePayablesCL: 0, otherFinLiabCL: 0,
        otherCL: 0, provisionsCL: 0, currentTaxLiability: 0,
    });

    // ── P&L Statement state ──────────────────────────────────────────────────
    const [pls, setPls] = useState({
        revenueFromOps: 0, otherIncome: 0,
        purchasesStock: 0, costServices: 0, changesInventories: 0,
        employeeBenefits: 0, financeCost: 0, depreciation: 0, otherExpenses: 0,
        exceptionalItems: 0,
        currentTax: 0, deferredTax: 0,
        ociRemeasure: 0, ociOther: 0,
    });

    // ── Cash Flow state ──────────────────────────────────────────────────────
    const [cf, setCf] = useState({
        pbt: 0, deprecAdj: 0, financeChargesAdj: 0, interestIncomeAdj: 0, otherAdjOp: 0,
        tradeRecAdj: 0, inventoriesAdj: 0, loansAdvAdj: 0, tradePayAdj: 0, otherCLAdj: 0,
        taxPaid: 0,
        purchaseFA: 0, proceedsFA: 0, bankDepositsPlaced: 0, bankDepositsMatured: 0,
        interestReceived: 0, otherInvesting: 0,
        dividendPaid: 0, otherFinancing: 0,
        openingCashInHand: 0, openingBankCurrent: 0,
    });

    const upBs  = (f, v) => setBs(p => ({ ...p, [f]: v }));
    const upPls = (f, v) => setPls(p => ({ ...p, [f]: v }));
    const upCf  = (f, v) => setCf(p => ({ ...p, [f]: v }));

    // ── BS computed ──────────────────────────────────────────────────────────
    const totalNCA = sum(bs.ppe, bs.capitalWip, bs.investmentsNCA, bs.loansNCA, bs.otherFinAssetsNCA, bs.deferredTaxAssets, bs.otherNCA);
    const totalCA  = sum(bs.inventories, bs.tradeReceivables, bs.cashEquivalents, bs.bankBalancesOther, bs.currentInvestments, bs.loansCA, bs.otherCA);
    const totalAssets = totalNCA + totalCA;
    const totalEquity = sum(bs.shareCapital, bs.otherEquity);
    const totalNCL = sum(bs.borrowingsNCL, bs.tradePayablesNCL, bs.otherFinLiabNCL, bs.deferredIncome, bs.otherNCL, bs.provisionsNCL);
    const totalCL  = sum(bs.borrowingsCL, bs.tradePayablesCL, bs.otherFinLiabCL, bs.otherCL, bs.provisionsCL, bs.currentTaxLiability);
    const totalEqLiab = totalEquity + totalNCL + totalCL;

    // ── P&L computed ─────────────────────────────────────────────────────────
    const totalIncome    = sum(pls.revenueFromOps, pls.otherIncome);
    const totalPlExp     = sum(pls.purchasesStock, pls.costServices, pls.changesInventories, pls.employeeBenefits, pls.financeCost, pls.depreciation, pls.otherExpenses);
    const profitBeforeEx = totalIncome - totalPlExp;
    const profitBefore   = profitBeforeEx - (pls.exceptionalItems || 0);
    const totalTax       = sum(pls.currentTax, pls.deferredTax);
    const profitForYear  = profitBefore - totalTax;
    const totalOCI       = sum(pls.ociRemeasure, pls.ociOther);
    const totalCI        = profitForYear + totalOCI;

    // ── CF computed ──────────────────────────────────────────────────────────
    const opBeforeWC = sum(cf.pbt, cf.deprecAdj, cf.financeChargesAdj, -cf.interestIncomeAdj, cf.otherAdjOp);
    const wcChanges  = sum(cf.tradeRecAdj, cf.inventoriesAdj, cf.loansAdvAdj, cf.tradePayAdj, cf.otherCLAdj);
    const netOp      = opBeforeWC + wcChanges - cf.taxPaid;
    const netInv     = sum(-cf.purchaseFA, cf.proceedsFA, -cf.bankDepositsPlaced, cf.bankDepositsMatured, cf.interestReceived, cf.otherInvesting);
    const netFin     = sum(-cf.dividendPaid, cf.otherFinancing);
    const netChange  = netOp + netInv + netFin;
    const openingCash = sum(cf.openingCashInHand, cf.openingBankCurrent);
    const closingCash = openingCash + netChange;

    const load = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const [dataRes, yearsRes] = await Promise.all([
                balanceSheetService.getData(fy, period),
                balanceSheetService.getYears(),
            ]);
            setData(dataRes.data.data);
            const yrs = yearsRes.data.data || [];
            if (!yrs.includes(fy)) yrs.unshift(fy);
            setYears(yrs);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load balance sheet');
        } finally {
            setLoading(false);
        }
    }, [fy, period]);

    useEffect(() => { load(); }, [load]);

    // Auto-fill new tab fields from API data whenever data reloads
    useEffect(() => {
        if (!data) return;
        const rev = data.revenue   || {};
        const exp = data.expenses  || {};
        const pl  = data.profitLoss || {};

        // P&L Statement: revenue from invoices, vendor cost, reimbursements
        setPls(prev => ({
            ...prev,
            revenueFromOps:  parseFloat(rev.taxable     || 0),
            costServices:    parseFloat(exp.vendor       || 0),
            employeeBenefits: parseFloat(exp.reimbursement || 0),
        }));

        // Balance Sheet: trade receivables = outstanding invoices
        setBs(prev => ({
            ...prev,
            tradeReceivables: parseFloat(rev.outstanding || 0),
        }));

        // Cash Flow: PBT ≈ net profit (before tax/GST adjustment)
        setCf(prev => ({
            ...prev,
            pbt: parseFloat(pl.netProfit || 0),
        }));
    }, [data]);

    const handleExport = () => {
        if (!data) return;
        const lines = [
            `Balance Sheet — FY ${fy}–${fy+1} (${period})`,
            `Period: ${data.dateFrom} to ${data.dateTo}`,
            '',
            'P&L STATEMENT',
            `Total Revenue,${data.revenue.total}`,
            `Vendor Expenses,${data.expenses.vendor}`,
            `Reimbursements,${data.expenses.reimbursement}`,
            `Total Expenses,${data.expenses.total}`,
            `GST Payable,${data.gst.payable}`,
            `Net Profit,${data.profitLoss.netProfit}`,
            `Profit Margin,${data.profitLoss.profitMargin}%`,
        ];
        const a = document.createElement('a');
        a.href = 'data:text/csv,' + encodeURIComponent(lines.join('\n'));
        a.download = `balance_sheet_FY${fy}_${period}.csv`;
        a.click();
    };

    const pl  = data?.profitLoss || {};
    const rev = data?.revenue    || {};
    const exp = data?.expenses   || {};
    const gst = data?.gst        || {};

    const quarterlyMap = {};
    (data?.quarterly || []).forEach(q => { quarterlyMap[q.quarter] = q; });

    return (
        <MainLayout>
            <div className="p-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Balance Sheet</h1>
                        <p className="text-sm text-gray-500 mt-1">Auto-calculated from GST invoices, vendor bills & reimbursements. Manual entry available for BS, P&L and Cash Flow.</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                        {mainTab === 'summary' && (
                            <>
                                <select value={fy} onChange={e => setFy(parseInt(e.target.value))}
                                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                                    {years.map(y => <option key={y} value={y}>FY {y}–{y+1}</option>)}
                                </select>
                                <button onClick={handleExport}
                                    className="px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 whitespace-nowrap">
                                    ↓ Export CSV
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}

                {/* Main section tabs */}
                <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl overflow-x-auto">
                    {MAIN_TABS.map(t => (
                        <button key={t.key} onClick={() => setMainTab(t.key)}
                            className={`px-3 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0
                                ${mainTab === t.key ? 'bg-white shadow-sm text-indigo-700 font-semibold' : 'text-gray-500 hover:text-gray-700'}`}>
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* ── P&L SUMMARY TAB ─────────────────────────────────────────────────── */}
                {mainTab === 'summary' && (
                    <>
                        {/* Quarter tabs */}
                        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl overflow-x-auto">
                            {quarters.map(q => (
                                <button key={q.key} onClick={() => setPeriod(q.key)}
                                    className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0
                                        ${period === q.key ? 'bg-white shadow-sm text-indigo-700 font-semibold' : 'text-gray-500 hover:text-gray-700'}`}>
                                    {q.label}
                                </button>
                            ))}
                        </div>

                        {loading ? (
                            <div className="text-center py-16 text-gray-400">Loading…</div>
                        ) : (
                            <>
                                {/* Top KPI row */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                                    {[
                                        { label: 'Total Revenue',  value: fmtL(rev.total),   sub: `${rev.invoiceCount} invoices`,  valCls: 'text-emerald-700', theme: 'kpi-green'  },
                                        { label: 'Total Expenses', value: fmtL(exp.total),   sub: 'Vendor + Reimbursements',        valCls: 'text-slate-700',   theme: 'kpi-slate'  },
                                        { label: 'Net Profit',     value: fmtL(pl.netProfit > 0 ? pl.netProfit : 0), sub: `${pl.profitMargin}% margin`, valCls: 'text-indigo-700', theme: 'kpi-indigo' },
                                        { label: 'GST Payable',    value: fmtL(gst.payable), sub: 'Outstanding to Govt.',           valCls: 'text-amber-700',   theme: 'kpi-amber'  },
                                    ].map(k => (
                                        <div key={k.label} className="rounded-2xl border border-gray-100 shadow-sm p-5 bg-white">
                                            <div className="text-xs text-gray-500 font-medium tracking-wide uppercase">{k.label}</div>
                                            <div className={`text-2xl font-bold mt-1.5 stat-num ${k.valCls}`}>{k.value}</div>
                                            <div className="text-xs text-gray-400 mt-0.5">{k.sub}</div>
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                                    {/* Left: Revenue / Expense breakdown + Quarterly */}
                                    <div className="col-span-1 lg:col-span-8 space-y-4">
                                        {/* Revenue breakdown */}
                                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                            <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="icon-badge icon-badge-green w-7 h-7">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                                        </svg>
                                                    </div>
                                                    <span className="font-semibold text-gray-800 text-sm">Revenue</span>
                                                </div>
                                                <span className="text-sm font-bold text-emerald-700">{fmt(rev.total)}</span>
                                            </div>
                                            <table className="w-full text-sm">
                                                <tbody>
                                                    <tr className="border-b border-gray-50">
                                                        <td className="px-4 py-2.5 text-gray-600">GST Invoices (Taxable)</td>
                                                        <td className="px-4 py-2.5 text-right font-semibold text-emerald-700 stat-num">{fmt(rev.taxable)}</td>
                                                        <td className="px-4 py-2.5 text-right text-gray-400 text-xs">{pct(rev.taxable, rev.total)}%</td>
                                                    </tr>
                                                    <tr className="border-b border-gray-50">
                                                        <td className="px-4 py-2.5 text-gray-600">GST Collected (CGST+SGST+IGST)</td>
                                                        <td className="px-4 py-2.5 text-right font-semibold text-emerald-700 stat-num">{fmt(rev.gstCollected)}</td>
                                                        <td className="px-4 py-2.5 text-right text-gray-400 text-xs">{pct(rev.gstCollected, rev.total)}%</td>
                                                    </tr>
                                                    <tr className="border-b border-gray-50">
                                                        <td className="px-4 py-2.5 text-gray-500 text-sm">
                                                            <span className="inline-flex items-center gap-1.5">
                                                                Collected <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">{rev.paidCount} paid</span>
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-2.5 text-right text-emerald-700 stat-num">{fmt(rev.collected)}</td>
                                                        <td className="px-4 py-2.5"></td>
                                                    </tr>
                                                    <tr>
                                                        <td className="px-4 py-2.5 text-gray-500 text-sm">
                                                            <span className="inline-flex items-center gap-1.5">
                                                                Outstanding <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium">{rev.unpaidCount} unpaid</span>
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-2.5 text-right text-amber-700 font-semibold stat-num">{fmt(rev.outstanding)}</td>
                                                        <td className="px-4 py-2.5"></td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Expenses breakdown */}
                                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                            <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="icon-badge icon-badge-slate w-7 h-7">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                                                        </svg>
                                                    </div>
                                                    <span className="font-semibold text-gray-800 text-sm">Expenses</span>
                                                </div>
                                                <span className="text-sm font-bold text-slate-700">{fmt(exp.total)}</span>
                                            </div>
                                            <table className="w-full text-sm">
                                                <tbody>
                                                    <tr className="border-b border-gray-50">
                                                        <td className="px-4 py-2.5 text-gray-600">Vendor Payments (Purchase Invoices)</td>
                                                        <td className="px-4 py-2.5 text-right font-semibold text-slate-700 stat-num">{fmt(exp.vendor)}</td>
                                                        <td className="px-4 py-2.5 w-32">
                                                            <MiniBar value={exp.vendor} max={exp.total} color="bg-slate-400" />
                                                        </td>
                                                    </tr>
                                                    <tr className="border-b border-gray-50">
                                                        <td className="px-4 py-2.5 text-gray-600">Approved Reimbursements</td>
                                                        <td className="px-4 py-2.5 text-right font-semibold text-slate-600 stat-num">{fmt(exp.reimbursement)}</td>
                                                        <td className="px-4 py-2.5">
                                                            <MiniBar value={exp.reimbursement} max={exp.total} color="bg-amber-400" />
                                                        </td>
                                                    </tr>
                                                    <tr className="bg-gray-50/80 border-t border-gray-100">
                                                        <td className="px-4 py-2.5 font-bold text-gray-800">Total Expenses</td>
                                                        <td className="px-4 py-2.5 text-right font-bold text-slate-700">{fmt(exp.total)}</td>
                                                        <td></td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Quarterly comparison */}
                                        {period === 'full' && (
                                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                                <div className="px-4 py-3 border-b border-gray-100">
                                                    <span className="font-semibold text-gray-800 text-sm">Quarter-wise Revenue — FY {fy}–{fy+1}</span>
                                                </div>
                                                <table className="w-full text-sm">
                                                    <thead>
                                                        <tr className="bg-gray-50 border-b border-gray-100">
                                                            <th className="px-4 py-2.5 text-left text-gray-500 font-semibold text-xs uppercase">Quarter</th>
                                                            <th className="px-4 py-2.5 text-right text-gray-500 font-semibold text-xs uppercase">Revenue</th>
                                                            <th className="px-4 py-2.5 text-right text-gray-500 font-semibold text-xs uppercase">Invoices</th>
                                                            <th className="px-4 py-2.5 text-right text-gray-500 font-semibold text-xs uppercase">Share</th>
                                                            <th className="px-4 py-2.5 text-gray-500 font-semibold text-xs uppercase">Bar</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {['Q1','Q2','Q3','Q4'].map(q => {
                                                            const qd   = quarterlyMap[q];
                                                            const qRev = parseFloat(qd?.revenue || 0);
                                                            return (
                                                                <tr key={q} className="border-b border-gray-50 hover:bg-indigo-50/30 cursor-pointer transition-colors" onClick={() => setPeriod(q)}>
                                                                    <td className="px-4 py-2.5 font-semibold text-indigo-600">{q}</td>
                                                                    <td className="px-4 py-2.5 text-right font-semibold text-emerald-700 stat-num">{qd ? fmt(qRev) : '—'}</td>
                                                                    <td className="px-4 py-2.5 text-right text-gray-500">{qd?.invoice_count || '—'}</td>
                                                                    <td className="px-4 py-2.5 text-right text-gray-500">{qd ? `${pct(qRev, rev.total)}%` : '—'}</td>
                                                                    <td className="px-4 py-2.5 w-32">
                                                                        <MiniBar value={qRev} max={rev.total} color="bg-indigo-500" />
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>

                                    {/* Right: P&L Summary + GST + Top Clients */}
                                    <div className="col-span-1 lg:col-span-4 space-y-4">
                                        {/* P&L Summary */}
                                        <div className="rounded-2xl border shadow-sm p-5 kpi-indigo kpi-accent-top">
                                            <div className="font-semibold text-gray-800 mb-4 text-sm flex items-center gap-2">
                                                <div className="icon-badge icon-badge-indigo w-6 h-6">
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                    </svg>
                                                </div>
                                                P&L Summary
                                            </div>
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-600">Revenue</span>
                                                    <span className="font-bold text-emerald-700 stat-num">{fmtL(rev.total)}</span>
                                                </div>
                                                <div className="border-t border-dashed border-indigo-200/60" />
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-600">Expenses</span>
                                                    <span className="font-bold text-slate-600 stat-num">– {fmtL(exp.total)}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-600">GST Payable</span>
                                                    <span className="font-bold text-amber-600 stat-num">– {fmtL(gst.payable)}</span>
                                                </div>
                                                <div className="border-t border-indigo-200/60 pt-2">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm font-bold text-gray-800">Net Profit</span>
                                                        <span className={`font-bold text-lg stat-num ${pl.netProfit >= 0 ? 'text-indigo-700' : 'text-slate-700'}`}>
                                                            {pl.netProfit < 0 ? '– ' : ''}{fmtL(Math.abs(pl.netProfit))}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-4">
                                                <div className="flex justify-between text-xs mb-1.5">
                                                    <span className="text-gray-500">Profit Margin</span>
                                                    <span className={`font-bold ${pl.profitMargin >= 20 ? 'text-emerald-700' : 'text-amber-700'}`}>{pl.profitMargin}%</span>
                                                </div>
                                                <div className="h-2 bg-indigo-100 rounded-full overflow-hidden">
                                                    <div className="h-2 rounded-full transition-all duration-700"
                                                        style={{
                                                            width: `${Math.min(100, Math.max(0, pl.profitMargin))}%`,
                                                            background: pl.profitMargin >= 20
                                                                ? 'linear-gradient(90deg, #6366f1, #10b981)'
                                                                : 'linear-gradient(90deg, #f59e0b, #f97316)'
                                                        }} />
                                                </div>
                                            </div>
                                        </div>

                                        {/* GST card */}
                                        <div className="rounded-2xl border shadow-sm p-5 kpi-amber kpi-accent-top">
                                            <div className="font-semibold text-gray-800 mb-3 text-sm flex items-center gap-2">
                                                <div className="icon-badge icon-badge-amber w-6 h-6">
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                                                    </svg>
                                                </div>
                                                GST Position
                                            </div>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">Collected</span>
                                                    <span className="font-semibold text-gray-700 stat-num">{fmt(gst.collected)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">Input Credit (ITC)</span>
                                                    <span className="font-semibold text-emerald-700 stat-num">– {fmt(gst.paid)}</span>
                                                </div>
                                                <div className="border-t border-amber-200/60 pt-2 flex justify-between">
                                                    <span className="font-bold text-gray-800">Payable to Govt.</span>
                                                    <span className="font-bold text-amber-700 stat-num">{fmt(gst.payable)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Top clients */}
                                        {data?.topClients?.length > 0 && (
                                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                                                <div className="font-semibold text-gray-800 mb-3 text-sm flex items-center gap-2">
                                                    <div className="icon-badge icon-badge-indigo w-6 h-6">
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        </svg>
                                                    </div>
                                                    Top 5 Clients
                                                </div>
                                                <div className="space-y-2.5">
                                                    {data.topClients.map((c, i) => (
                                                        <div key={i}>
                                                            <div className="flex justify-between text-xs mb-1">
                                                                <span className="text-gray-700 font-medium truncate max-w-[130px]">{c.buyer_name}</span>
                                                                <span className="text-gray-500 font-semibold">{fmtL(c.revenue)}</span>
                                                            </div>
                                                            <MiniBar value={parseFloat(c.revenue)} max={parseFloat(data.topClients[0].revenue)} color="bg-indigo-400" />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </>
                )}

                {/* ── BALANCE SHEET TAB ────────────────────────────────────────────────── */}
                {mainTab === 'bs' && (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {/* Assets */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="px-4 py-3 bg-indigo-600 text-white">
                                <p className="font-bold text-sm tracking-wide uppercase">Assets</p>
                                <p className="text-xs text-indigo-200 mt-0.5">All amounts in ₹</p>
                            </div>
                            <table className="w-full">
                                <tbody>
                                    <SecHeader title="Non-Current Assets" />
                                    <FinRow label="Property, Plant & Equipment (PPE)" indent={1} value={bs.ppe} editable onChange={v => upBs('ppe', v)} />
                                    <FinRow label="Capital Work-in-Progress" indent={1} value={bs.capitalWip} editable onChange={v => upBs('capitalWip', v)} />
                                    <FinRow label="Investments" indent={1} value={bs.investmentsNCA} editable onChange={v => upBs('investmentsNCA', v)} />
                                    <FinRow label="Loans (Non-Current)" indent={1} value={bs.loansNCA} editable onChange={v => upBs('loansNCA', v)} />
                                    <FinRow label="Other Financial Assets" indent={1} value={bs.otherFinAssetsNCA} editable onChange={v => upBs('otherFinAssetsNCA', v)} />
                                    <FinRow label="Deferred Tax Assets (Net)" indent={1} value={bs.deferredTaxAssets} editable onChange={v => upBs('deferredTaxAssets', v)} />
                                    <FinRow label="Other Non-Current Assets" indent={1} value={bs.otherNCA} editable onChange={v => upBs('otherNCA', v)} />
                                    <FinRow label="TOTAL NON-CURRENT ASSETS" value={totalNCA} subtotal />

                                    <SecHeader title="Current Assets" />
                                    <FinRow label="Inventories" indent={1} value={bs.inventories} editable onChange={v => upBs('inventories', v)} />
                                    <FinRow label="Trade Receivables" indent={1} value={bs.tradeReceivables} editable auto onChange={v => upBs('tradeReceivables', v)} note="(outstanding invoices)" />
                                    <FinRow label="Cash & Cash Equivalents" indent={1} value={bs.cashEquivalents} editable onChange={v => upBs('cashEquivalents', v)} />
                                    <FinRow label="Bank Balances (Other)" indent={1} value={bs.bankBalancesOther} editable onChange={v => upBs('bankBalancesOther', v)} />
                                    <FinRow label="Short-term Investments" indent={1} value={bs.currentInvestments} editable onChange={v => upBs('currentInvestments', v)} />
                                    <FinRow label="Loans & Advances (Current)" indent={1} value={bs.loansCA} editable onChange={v => upBs('loansCA', v)} />
                                    <FinRow label="Other Current Assets" indent={1} value={bs.otherCA} editable onChange={v => upBs('otherCA', v)} />
                                    <FinRow label="TOTAL CURRENT ASSETS" value={totalCA} subtotal />

                                    <FinRow label="TOTAL ASSETS" value={totalAssets} total />
                                </tbody>
                            </table>
                        </div>

                        {/* Equity & Liabilities */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="px-4 py-3 bg-indigo-600 text-white">
                                <p className="font-bold text-sm tracking-wide uppercase">Equity &amp; Liabilities</p>
                                <p className="text-xs text-indigo-200 mt-0.5">All amounts in ₹</p>
                            </div>
                            <table className="w-full">
                                <tbody>
                                    <SecHeader title="Equity" />
                                    <FinRow label="Share Capital" indent={1} value={bs.shareCapital} editable onChange={v => upBs('shareCapital', v)} />
                                    <FinRow label="Other Equity (Retained Earnings)" indent={1} value={bs.otherEquity} editable onChange={v => upBs('otherEquity', v)} />
                                    <FinRow label="TOTAL EQUITY" value={totalEquity} subtotal />

                                    <SecHeader title="Non-Current Liabilities" />
                                    <FinRow label="Borrowings (Non-Current)" indent={1} value={bs.borrowingsNCL} editable onChange={v => upBs('borrowingsNCL', v)} />
                                    <FinRow label="Trade Payables (Non-Current)" indent={1} value={bs.tradePayablesNCL} editable onChange={v => upBs('tradePayablesNCL', v)} />
                                    <FinRow label="Other Financial Liabilities" indent={1} value={bs.otherFinLiabNCL} editable onChange={v => upBs('otherFinLiabNCL', v)} />
                                    <FinRow label="Deferred Income" indent={1} value={bs.deferredIncome} editable onChange={v => upBs('deferredIncome', v)} />
                                    <FinRow label="Other Non-Current Liabilities" indent={1} value={bs.otherNCL} editable onChange={v => upBs('otherNCL', v)} />
                                    <FinRow label="Provisions (Non-Current)" indent={1} value={bs.provisionsNCL} editable onChange={v => upBs('provisionsNCL', v)} />
                                    <FinRow label="TOTAL NON-CURRENT LIABILITIES" value={totalNCL} subtotal />

                                    <SecHeader title="Current Liabilities" />
                                    <FinRow label="Borrowings (Current)" indent={1} value={bs.borrowingsCL} editable onChange={v => upBs('borrowingsCL', v)} />
                                    <FinRow label="Trade Payables" indent={1} value={bs.tradePayablesCL} editable onChange={v => upBs('tradePayablesCL', v)} />
                                    <FinRow label="Other Financial Liabilities" indent={1} value={bs.otherFinLiabCL} editable onChange={v => upBs('otherFinLiabCL', v)} />
                                    <FinRow label="Other Current Liabilities" indent={1} value={bs.otherCL} editable onChange={v => upBs('otherCL', v)} />
                                    <FinRow label="Provisions (Current)" indent={1} value={bs.provisionsCL} editable onChange={v => upBs('provisionsCL', v)} />
                                    <FinRow label="Current Tax Liabilities" indent={1} value={bs.currentTaxLiability} editable onChange={v => upBs('currentTaxLiability', v)} />
                                    <FinRow label="TOTAL CURRENT LIABILITIES" value={totalCL} subtotal />

                                    <FinRow label="TOTAL EQUITY & LIABILITIES" value={totalEqLiab} total />
                                </tbody>
                            </table>

                            {/* Balance check */}
                            <div className={`mx-4 mb-4 mt-2 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2
                                ${Math.abs(totalAssets - totalEqLiab) < 1 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                <span>{Math.abs(totalAssets - totalEqLiab) < 1 ? '✓ Balance sheet tallies' : `⚠ Difference: ${fmt(Math.abs(totalAssets - totalEqLiab))}`}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── P&L STATEMENT TAB ────────────────────────────────────────────────── */}
                {mainTab === 'pl' && (
                    <div className="max-w-2xl">
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="px-4 py-3 bg-indigo-600 text-white">
                                <p className="font-bold text-sm tracking-wide uppercase">Statement of Profit &amp; Loss</p>
                                <p className="text-xs text-indigo-200 mt-0.5">Enter figures for the reporting period (₹)</p>
                            </div>
                            <table className="w-full">
                                <tbody>
                                    <SecHeader title="I. Income" />
                                    <FinRow label="Revenue from Operations" indent={1} value={pls.revenueFromOps} editable auto onChange={v => upPls('revenueFromOps', v)} />
                                    <FinRow label="Other Income" indent={1} value={pls.otherIncome} editable onChange={v => upPls('otherIncome', v)} />
                                    <FinRow label="TOTAL INCOME (I)" value={totalIncome} subtotal />

                                    <SecHeader title="II. Expenses" />
                                    <FinRow label="Purchases of Stock-in-Trade" indent={1} value={pls.purchasesStock} editable onChange={v => upPls('purchasesStock', v)} />
                                    <FinRow label="Cost of Services &amp; Maintenance" indent={1} value={pls.costServices} editable auto onChange={v => upPls('costServices', v)} />
                                    <FinRow label="Changes in Inventories" indent={1} value={pls.changesInventories} editable onChange={v => upPls('changesInventories', v)} note="(opening – closing)" />
                                    <FinRow label="Employee Benefits Expense" indent={1} value={pls.employeeBenefits} editable auto onChange={v => upPls('employeeBenefits', v)} note="(reimbursements)" />
                                    <FinRow label="Finance Cost" indent={1} value={pls.financeCost} editable onChange={v => upPls('financeCost', v)} />
                                    <FinRow label="Depreciation &amp; Amortization" indent={1} value={pls.depreciation} editable onChange={v => upPls('depreciation', v)} />
                                    <FinRow label="Other Expenses" indent={1} value={pls.otherExpenses} editable onChange={v => upPls('otherExpenses', v)} />
                                    <FinRow label="TOTAL EXPENSES (II)" value={totalPlExp} subtotal />

                                    <SecHeader title="III. Profit / Loss" />
                                    <FinRow label="Profit Before Exceptional Items &amp; Tax (I–II)" value={profitBeforeEx} subtotal />
                                    <FinRow label="Exceptional Items" indent={1} value={pls.exceptionalItems} editable onChange={v => upPls('exceptionalItems', v)} />
                                    <FinRow label="Profit Before Tax" value={profitBefore} subtotal />

                                    <SecHeader title="IV. Tax Expense" />
                                    <FinRow label="Current Tax" indent={1} value={pls.currentTax} editable onChange={v => upPls('currentTax', v)} />
                                    <FinRow label="Deferred Tax (Charge / Credit)" indent={1} value={pls.deferredTax} editable onChange={v => upPls('deferredTax', v)} />
                                    <FinRow label="Total Tax Expense" value={totalTax} subtotal />

                                    <FinRow label="PROFIT FOR THE YEAR" value={profitForYear} total />

                                    <SecHeader title="V. Other Comprehensive Income" />
                                    <FinRow label="Items not reclassified to P&L (e.g. remeasurement of defined benefit plans)" indent={1} value={pls.ociRemeasure} editable onChange={v => upPls('ociRemeasure', v)} />
                                    <FinRow label="Other OCI Items" indent={1} value={pls.ociOther} editable onChange={v => upPls('ociOther', v)} />
                                    <FinRow label="Other Comprehensive Income (net of tax)" value={totalOCI} subtotal />

                                    <FinRow label="TOTAL COMPREHENSIVE INCOME FOR THE YEAR" value={totalCI} total />
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ── CASH FLOW TAB ────────────────────────────────────────────────────── */}
                {mainTab === 'cf' && (
                    <div className="max-w-2xl">
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="px-4 py-3 bg-indigo-600 text-white">
                                <p className="font-bold text-sm tracking-wide uppercase">Cash Flow Statement</p>
                                <p className="text-xs text-indigo-200 mt-0.5">Indirect method — enter adjustments &amp; movements (₹)</p>
                            </div>
                            <table className="w-full">
                                <tbody>
                                    <SecHeader title="A. Cash Flow from Operating Activities" />
                                    <FinRow label="Profit Before Tax" indent={1} value={cf.pbt} editable auto onChange={v => upCf('pbt', v)} />
                                    <FinRow label="Adjustments:" bold />
                                    <FinRow label="Add: Depreciation &amp; Amortization" indent={2} value={cf.deprecAdj} editable onChange={v => upCf('deprecAdj', v)} />
                                    <FinRow label="Add: Finance Charges" indent={2} value={cf.financeChargesAdj} editable onChange={v => upCf('financeChargesAdj', v)} />
                                    <FinRow label="Less: Interest Income" indent={2} value={cf.interestIncomeAdj} editable onChange={v => upCf('interestIncomeAdj', v)} />
                                    <FinRow label="Other Adjustments" indent={2} value={cf.otherAdjOp} editable onChange={v => upCf('otherAdjOp', v)} />
                                    <FinRow label="Operating Profit Before Working Capital Changes" value={opBeforeWC} subtotal />

                                    <FinRow label="Working Capital Movements:" bold />
                                    <FinRow label="(Increase)/Decrease in Trade Receivables" indent={2} value={cf.tradeRecAdj} editable onChange={v => upCf('tradeRecAdj', v)} />
                                    <FinRow label="(Increase)/Decrease in Inventories" indent={2} value={cf.inventoriesAdj} editable onChange={v => upCf('inventoriesAdj', v)} />
                                    <FinRow label="(Increase)/Decrease in Loans &amp; Advances" indent={2} value={cf.loansAdvAdj} editable onChange={v => upCf('loansAdvAdj', v)} />
                                    <FinRow label="Increase/(Decrease) in Trade Payables" indent={2} value={cf.tradePayAdj} editable onChange={v => upCf('tradePayAdj', v)} />
                                    <FinRow label="Increase/(Decrease) in Other Current Liabilities" indent={2} value={cf.otherCLAdj} editable onChange={v => upCf('otherCLAdj', v)} />
                                    <FinRow label="Cash Generated from Operations" value={opBeforeWC + wcChanges} subtotal />
                                    <FinRow label="Less: Direct Taxes Paid (Net)" indent={1} value={cf.taxPaid} editable onChange={v => upCf('taxPaid', v)} />
                                    <FinRow label="NET CASH FROM OPERATING ACTIVITIES (A)" value={netOp} total />

                                    <SecHeader title="B. Cash Flow from Investing Activities" />
                                    <FinRow label="Purchase of Fixed Assets / CWIP" indent={1} value={cf.purchaseFA} editable onChange={v => upCf('purchaseFA', v)} note="(outflow)" />
                                    <FinRow label="Proceeds from Sale of Fixed Assets" indent={1} value={cf.proceedsFA} editable onChange={v => upCf('proceedsFA', v)} />
                                    <FinRow label="Bank Deposits Placed" indent={1} value={cf.bankDepositsPlaced} editable onChange={v => upCf('bankDepositsPlaced', v)} note="(outflow)" />
                                    <FinRow label="Bank Deposits Matured" indent={1} value={cf.bankDepositsMatured} editable onChange={v => upCf('bankDepositsMatured', v)} />
                                    <FinRow label="Interest Received" indent={1} value={cf.interestReceived} editable onChange={v => upCf('interestReceived', v)} />
                                    <FinRow label="Other Investing Activities" indent={1} value={cf.otherInvesting} editable onChange={v => upCf('otherInvesting', v)} />
                                    <FinRow label="NET CASH FROM INVESTING ACTIVITIES (B)" value={netInv} total />

                                    <SecHeader title="C. Cash Flow from Financing Activities" />
                                    <FinRow label="Dividend Paid" indent={1} value={cf.dividendPaid} editable onChange={v => upCf('dividendPaid', v)} note="(outflow)" />
                                    <FinRow label="Other Financing Activities" indent={1} value={cf.otherFinancing} editable onChange={v => upCf('otherFinancing', v)} />
                                    <FinRow label="NET CASH FROM FINANCING ACTIVITIES (C)" value={netFin} total />

                                    <SecHeader title="Net Change & Closing Balance" />
                                    <FinRow label="NET INCREASE / (DECREASE) IN CASH (A+B+C)" value={netChange} subtotal />

                                    <FinRow label="Opening Cash Balance:" bold />
                                    <FinRow label="Cash in Hand" indent={2} value={cf.openingCashInHand} editable onChange={v => upCf('openingCashInHand', v)} />
                                    <FinRow label="Bank — Current Account" indent={2} value={cf.openingBankCurrent} editable onChange={v => upCf('openingBankCurrent', v)} />
                                    <FinRow label="Total Opening Cash Balance" value={openingCash} subtotal />

                                    <FinRow label="CLOSING CASH BALANCE" value={closingCash} total />
                                    <FinRow label="(Cash in Hand + Bank balance at end of period)" indent={1} value={closingCash} />
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
