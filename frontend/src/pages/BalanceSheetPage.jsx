import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { balanceSheetService } from '../services/financeService';

const fmt   = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
const fmtL  = (n) => { const l = n / 100000; return l >= 100 ? `₹${(l/100).toFixed(2)} Cr` : `₹${l.toFixed(2)} L`; };
const pct   = (a, b) => b > 0 ? Math.round((a / b) * 100) : 0;

const quarters = [
    { key: 'full', label: 'Full Year' },
    { key: 'Q1',   label: 'Q1 Apr–Jun' },
    { key: 'Q2',   label: 'Q2 Jul–Sep' },
    { key: 'Q3',   label: 'Q3 Oct–Dec' },
    { key: 'Q4',   label: 'Q4 Jan–Mar' },
];

const MiniBar = ({ value, max, color = 'bg-indigo-500' }) => (
    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1">
        <div className={`h-1.5 ${color} rounded-full transition-all duration-700`} style={{ width: `${max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0}%` }} />
    </div>
);

export default function BalanceSheetPage() {
    const [data,    setData]    = useState(null);
    const [years,   setYears]   = useState([]);
    const [fy,      setFy]      = useState(new Date().getMonth() >= 3 ? new Date().getFullYear() : new Date().getFullYear() - 1);
    const [period,  setPeriod]  = useState('full');
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState('');

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

    const pl = data?.profitLoss || {};
    const rev = data?.revenue   || {};
    const exp = data?.expenses  || {};
    const gst = data?.gst       || {};

    const quarterlyMap = {};
    (data?.quarterly || []).forEach(q => { quarterlyMap[q.quarter] = q; });

    return (
        <MainLayout>
            <div className="p-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Balance Sheet</h1>
                        <p className="text-sm text-gray-500 mt-1">Auto-calculated from GST invoices, vendor bills, and reimbursements.</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                        <select value={fy} onChange={e => setFy(parseInt(e.target.value))}
                            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                            {years.map(y => <option key={y} value={y}>FY {y}–{y+1}</option>)}
                        </select>
                        <button onClick={handleExport}
                            className="px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 whitespace-nowrap">
                            ↓ Export CSV
                        </button>
                    </div>
                </div>

                {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}

                {/* Quarter tabs */}
                <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl overflow-x-auto">
                    {quarters.map(q => (
                        <button key={q.key} onClick={() => setPeriod(q.key)}
                            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${period === q.key ? 'bg-white shadow-sm text-indigo-700 font-semibold' : 'text-gray-500 hover:text-gray-700'}`}>
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
                                { label: 'Total Expenses', value: fmtL(exp.total),   sub: 'Vendor + Reimbursements',        valCls: 'text-rose-600',    theme: 'kpi-red'    },
                                { label: 'Net Profit',     value: fmtL(pl.netProfit > 0 ? pl.netProfit : 0), sub: `${pl.profitMargin}% margin`, valCls: 'text-indigo-700', theme: 'kpi-indigo' },
                                { label: 'GST Payable',    value: fmtL(gst.payable), sub: 'Outstanding to Govt.',           valCls: 'text-amber-700',   theme: 'kpi-amber'  },
                            ].map(k => (
                                <div key={k.label} className={`rounded-2xl border shadow-sm p-5 kpi-accent-top ${k.theme}`}>
                                    <div className="text-xs text-gray-500 font-medium tracking-wide uppercase">{k.label}</div>
                                    <div className={`text-2xl font-bold mt-1.5 stat-num ${k.valCls}`}>{k.value}</div>
                                    <div className="text-xs text-gray-400 mt-0.5">{k.sub}</div>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                            {/* Left: P&L + Revenue/Expense breakdown */}
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
                                            <div className="icon-badge icon-badge-red w-7 h-7">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                                                </svg>
                                            </div>
                                            <span className="font-semibold text-gray-800 text-sm">Expenses</span>
                                        </div>
                                        <span className="text-sm font-bold text-rose-600">{fmt(exp.total)}</span>
                                    </div>
                                    <table className="w-full text-sm">
                                        <tbody>
                                            <tr className="border-b border-gray-50">
                                                <td className="px-4 py-2.5 text-gray-600">Vendor Payments (Purchase Invoices)</td>
                                                <td className="px-4 py-2.5 text-right font-semibold text-rose-600 stat-num">{fmt(exp.vendor)}</td>
                                                <td className="px-4 py-2.5 w-32">
                                                    <MiniBar value={exp.vendor} max={exp.total} color="bg-rose-400" />
                                                </td>
                                            </tr>
                                            <tr className="border-b border-gray-50">
                                                <td className="px-4 py-2.5 text-gray-600">Approved Reimbursements</td>
                                                <td className="px-4 py-2.5 text-right font-semibold text-rose-500 stat-num">{fmt(exp.reimbursement)}</td>
                                                <td className="px-4 py-2.5">
                                                    <MiniBar value={exp.reimbursement} max={exp.total} color="bg-amber-400" />
                                                </td>
                                            </tr>
                                            <tr className="bg-gray-50/80 border-t border-gray-100">
                                                <td className="px-4 py-2.5 font-bold text-gray-800">Total Expenses</td>
                                                <td className="px-4 py-2.5 text-right font-bold text-rose-600">{fmt(exp.total)}</td>
                                                <td></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                {/* Quarterly comparison (only in full view) */}
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
                                                    const qd = quarterlyMap[q];
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

                            {/* Right: Summary + Top Clients */}
                            <div className="col-span-1 lg:col-span-4 space-y-4">
                                {/* P&L Summary card */}
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
                                            <span className="font-bold text-rose-600 stat-num">– {fmtL(exp.total)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">GST Payable</span>
                                            <span className="font-bold text-amber-600 stat-num">– {fmtL(gst.payable)}</span>
                                        </div>
                                        <div className="border-t border-indigo-200/60 pt-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-bold text-gray-800">Net Profit</span>
                                                <span className={`font-bold text-lg stat-num ${pl.netProfit >= 0 ? 'text-indigo-700' : 'text-rose-700'}`}>
                                                    {pl.netProfit < 0 ? '– ' : ''}{fmtL(Math.abs(pl.netProfit))}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Profit margin bar */}
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
            </div>
        </MainLayout>
    );
}
