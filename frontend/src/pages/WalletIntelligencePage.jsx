/**
 * Wallet Intelligence Page
 * Google-Sheets-driven business analytics:
 *   - Business Health Score
 *   - Revenue Insights (trend + service breakdown)
 *   - Client Intelligence (status breakdown, at-risk, top growth)
 *   - Upsell Intelligence (opportunities, top add-on buyers, declining)
 *   - Revenue Share + Client Ranking charts
 *   - Month-over-Month growth table
 *   - Service Coverage analysis
 *   - Detailed Wallet table
 */

import React, { useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell, PieChart, Pie,
    AreaChart, Area,
} from 'recharts';
import useCSVData from '../hooks/useCSVData';
import MainLayout from '../components/layout/MainLayout';
import { formatCurrency } from '../utils/helpers';

const COLORS = [
    '#4F46E5', '#7C3AED', '#2563EB', '#0891B2',
    '#059669', '#D97706', '#DC2626', '#EC4899', '#8B5CF6', '#14B8A6',
];

// ── Reusable section card ─────────────────────────────────────────────────────
const Card = ({ children, className = '' }) => (
    <div className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-card border border-gray-100/50 hover:shadow-lg transition-shadow duration-300 ${className}`}>
        {children}
    </div>
);

// ── Section heading ───────────────────────────────────────────────────────────
const SectionTitle = ({ children }) => (
    <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">{children}</h2>
);

const WalletIntelligencePage = () => {
    const {
        loading,
        error,
        allClients,
        walletIntelligence,
        upsellOpportunities,
        serviceRevenueMix,
        monthlyTrend,
        kpis,
    } = useCSVData();

    // ── Revenue share for charts ──────────────────────────────────────────────
    const revenueShareData = useMemo(() => {
        if (!allClients.length) return [];
        const total = allClients.reduce((sum, c) => sum + c.totalRevenue, 0);
        return allClients
            .sort((a, b) => b.totalRevenue - a.totalRevenue)
            .map(c => ({
                name: c.clientName.length > 22 ? c.clientName.substring(0, 20) + '…' : c.clientName,
                fullName: c.clientName,
                value: Math.round(c.totalRevenue),
                percentage: total > 0 ? ((c.totalRevenue / total) * 100).toFixed(1) : 0,
            }));
    }, [allClients]);

    // ── Service coverage ──────────────────────────────────────────────────────
    const serviceCoverage = useMemo(() => {
        const map = {};
        allClients.forEach(c => {
            c.detectedServices.forEach(s => {
                if (!map[s]) map[s] = { name: s, clientCount: 0 };
                map[s].clientCount++;
            });
        });
        return Object.values(map).sort((a, b) => b.clientCount - a.clientCount);
    }, [allClients]);

    // ── Month-over-month growth per client ────────────────────────────────────
    const growthAnalysis = useMemo(() => {
        return allClients
            .filter(c => c.monthCount >= 2)
            .map(c => {
                const sorted = Object.values(c.months).sort((a, b) => b.monthOrder - a.monthOrder);
                const latest   = sorted[0]?.totalMRR || 0;
                const previous = sorted[1]?.totalMRR || 0;
                const growth   = previous > 0 ? ((latest - previous) / previous) * 100 : 0;
                return {
                    clientName:    c.clientName,
                    latestMRR:     latest,
                    previousMRR:   previous,
                    growth:        Math.round(growth * 10) / 10,
                    monthCount:    c.monthCount,
                    totalRevenue:  c.totalRevenue,
                };
            })
            .sort((a, b) => b.growth - a.growth);
    }, [allClients]);

    // ── Business Health Score ─────────────────────────────────────────────────
    const healthScore = useMemo(() => {
        if (!allClients.length || !monthlyTrend.length) return null;

        const latestMRR = monthlyTrend[monthlyTrend.length - 1]?.totalMRR || 0;
        const avgMRR    = monthlyTrend.reduce((s, m) => s + m.totalMRR, 0) / monthlyTrend.length;
        const growthPct = avgMRR > 0 ? ((latestMRR - avgMRR) / avgMRR) * 100 : 0;
        const growthScore = growthPct > 5 ? 30 : growthPct >= -5 ? 18 : 5;

        const multiMonth     = allClients.filter(c => c.monthCount >= 2).length;
        const retentionPct   = allClients.length > 0 ? (multiMonth / allClients.length) * 100 : 0;
        const retentionScore = retentionPct >= 80 ? 40 : retentionPct >= 60 ? 25 : 10;

        const atRiskPct   = allClients.length > 0 ? ((kpis?.atRiskCount || 0) / allClients.length) * 100 : 0;
        const riskScore   = atRiskPct < 10 ? 30 : atRiskPct < 25 ? 18 : 5;

        const total   = growthScore + retentionScore + riskScore;
        const label   = total >= 80 ? 'Healthy' : total >= 50 ? 'Moderate Risk' : 'Critical';
        const color   = total >= 80 ? '#059669'  : total >= 50 ? '#D97706'       : '#DC2626';
        const bgGrad  = total >= 80
            ? 'from-green-50/80 to-emerald-50/40 border-green-100'
            : total >= 50
            ? 'from-amber-50/80 to-yellow-50/40 border-amber-100'
            : 'from-red-50/80 to-rose-50/40 border-red-100';

        return {
            total, label, color, bgGrad,
            growthPct:    Math.round(growthPct * 10) / 10,
            retentionPct: Math.round(retentionPct),
            atRiskPct:    Math.round(atRiskPct * 10) / 10,
            growthScore, retentionScore, riskScore,
        };
    }, [allClients, monthlyTrend, kpis]);

    // ── Top add-on clients ────────────────────────────────────────────────────
    const topAddonClients = useMemo(() => (
        [...allClients]
            .filter(c => c.totalAddonsMRR > 0)
            .sort((a, b) => b.totalAddonsMRR - a.totalAddonsMRR)
            .slice(0, 5)
    ), [allClients]);

    // ── Clients with declining revenue ────────────────────────────────────────
    const decliningClients = useMemo(() => (
        growthAnalysis.filter(c => c.growth < -5).slice(0, 5)
    ), [growthAnalysis]);

    // ── Custom chart tooltips ─────────────────────────────────────────────────
    const PieTooltip = ({ active, payload }) => {
        if (!active || !payload?.length) return null;
        const d = payload[0].payload;
        return (
            <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-100 p-3 text-sm">
                <p className="font-semibold text-gray-900">{d.fullName}</p>
                <p className="text-gray-600">{formatCurrency(d.value)}</p>
                <p className="text-xs text-gray-500">{d.percentage}% of total</p>
            </div>
        );
    };

    // ── Loading skeleton ──────────────────────────────────────────────────────
    if (loading) {
        return (
            <MainLayout>
                <div className="space-y-6 animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-64 mb-2" />
                    <div className="h-4 bg-gray-100 rounded w-96 mb-8" />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
                        {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-gray-100 rounded-2xl" />)}
                    </div>
                    <div className="h-36 bg-gray-100 rounded-2xl mb-6" />
                    <div className="grid grid-cols-3 gap-6 mb-8">
                        {[1, 2, 3].map(i => <div key={i} className="h-52 bg-gray-100 rounded-2xl" />)}
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="h-64 bg-gray-100 rounded-2xl" />
                        <div className="h-64 bg-gray-100 rounded-2xl" />
                    </div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div>
                {/* ── Page header ──────────────────────────────────────────── */}
                <div className="mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Wallet Intelligence</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Business analytics and insights — powered by Google Sheets data (April – July 2025)
                    </p>
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 border border-red-100 rounded-xl p-4">
                        <p className="text-sm font-medium text-red-800">{error}</p>
                    </div>
                )}

                {/* ── Summary KPI cards ──────────────────────────────────────── */}
                {walletIntelligence && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5 mb-8">
                        {[
                            { label: 'Total Wallet', value: formatCurrency(walletIntelligence.totalWallet), sub: `${allClients.length} clients tracked`, color: 'text-gray-900' },
                            { label: 'Avg Client Revenue', value: formatCurrency(walletIntelligence.avgClientRevenue), sub: 'Across all months', color: 'text-indigo-600' },
                            { label: 'Highest Revenue', value: formatCurrency(walletIntelligence.highestRevenue?.totalRevenue), sub: walletIntelligence.highestRevenue?.clientName, color: 'text-green-600' },
                            { label: 'At Risk / Declining', value: walletIntelligence.declining?.length || 0, sub: 'Clients with revenue decline', color: 'text-red-600' },
                        ].map((card, i) => (
                            <div key={i} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card border border-gray-100/50 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{card.label}</p>
                                <h3 className={`text-xl sm:text-2xl font-bold ${card.color}`}>{card.value}</h3>
                                <p className="text-xs text-gray-500 mt-1 truncate">{card.sub}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── Business Health Score ─────────────────────────────────── */}
                {healthScore && (
                    <div className={`rounded-2xl border bg-gradient-to-r ${healthScore.bgGrad} p-6 mb-8`}>
                        <div className="flex items-start justify-between mb-5">
                            <div>
                                <h3 className="text-base font-semibold text-gray-900">Business Health Score</h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Based on revenue growth, client retention, and at-risk percentage
                                </p>
                            </div>
                            <div className="text-right">
                                <span className="text-4xl font-black" style={{ color: healthScore.color }}>
                                    {healthScore.total}
                                </span>
                                <span className="text-lg font-bold text-gray-400">/100</span>
                                <p className="text-sm font-bold mt-0.5" style={{ color: healthScore.color }}>
                                    {healthScore.label}
                                </p>
                            </div>
                        </div>

                        {/* Master progress bar */}
                        <div className="w-full bg-white/60 rounded-full h-3 mb-5">
                            <div
                                className="h-3 rounded-full transition-all duration-1000"
                                style={{ width: `${healthScore.total}%`, backgroundColor: healthScore.color }}
                            />
                        </div>

                        {/* 3 sub-metrics */}
                        <div className="grid grid-cols-3 gap-2 sm:gap-4">
                            {[
                                { label: 'Revenue Growth',   value: `${healthScore.growthPct > 0 ? '+' : ''}${healthScore.growthPct}%`, score: healthScore.growthScore,    max: 30 },
                                { label: 'Client Retention', value: `${healthScore.retentionPct}%`,                                      score: healthScore.retentionScore, max: 40 },
                                { label: 'At-Risk Rate',     value: `${healthScore.atRiskPct}%`,                                         score: healthScore.riskScore,      max: 30 },
                            ].map((m, i) => (
                                <div key={i} className="bg-white/50 backdrop-blur-sm rounded-xl p-4">
                                    <p className="text-xs text-gray-500 mb-1">{m.label}</p>
                                    <p className="text-base font-bold text-gray-900">{m.value}</p>
                                    <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                                        <div
                                            className="h-1.5 rounded-full transition-all duration-700"
                                            style={{ width: `${(m.score / m.max) * 100}%`, backgroundColor: healthScore.color }}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">{m.score}/{m.max} pts</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Revenue Insights ──────────────────────────────────────── */}
                <SectionTitle>Revenue Insights</SectionTitle>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

                    {/* Monthly MRR area chart */}
                    <Card className="lg:col-span-2 p-6">
                        <h3 className="text-base font-semibold text-gray-900 mb-0.5">Monthly Revenue Trend</h3>
                        <p className="text-xs text-gray-400 mb-4">Total MRR across all clients per month</p>
                        {monthlyTrend.length > 0 ? (
                            <ResponsiveContainer width="100%" height={200}>
                                <AreaChart data={monthlyTrend} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%"   stopColor="#4F46E5" stopOpacity={0.25} />
                                            <stop offset="100%" stopColor="#4F46E5" stopOpacity={0.02} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                                    <YAxis
                                        tickFormatter={v => v >= 100000 ? `${(v / 100000).toFixed(1)}L` : `${(v / 1000).toFixed(0)}K`}
                                        tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false}
                                    />
                                    <Tooltip
                                        formatter={v => [formatCurrency(v), 'Total MRR']}
                                        labelStyle={{ fontWeight: 600, color: '#111' }}
                                        contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
                                    />
                                    <Area type="monotone" dataKey="totalMRR" stroke="#4F46E5" strokeWidth={2.5} fill="url(#mrrGrad)" animationDuration={1200} />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[200px] flex items-center justify-center text-gray-300 text-sm">No trend data</div>
                        )}
                    </Card>

                    {/* Service revenue breakdown */}
                    <Card className="p-6">
                        <h3 className="text-base font-semibold text-gray-900 mb-0.5">Revenue by Service</h3>
                        <p className="text-xs text-gray-400 mb-4">Top performing categories</p>
                        <div className="space-y-3">
                            {serviceRevenueMix.slice(0, 6).map((s, i) => (
                                <div key={i}>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs font-medium text-gray-700 truncate max-w-[140px]">{s.name}</span>
                                        <span className="text-xs font-bold text-gray-900 flex-shrink-0 ml-2">{formatCurrency(Math.round(s.revenue))}</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                                        <div
                                            className="h-1.5 rounded-full transition-all duration-700"
                                            style={{ width: `${s.percentage}%`, backgroundColor: COLORS[i % COLORS.length] }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* ── Client Intelligence ───────────────────────────────────── */}
                <SectionTitle>Client Intelligence</SectionTitle>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

                    {/* Active / At Risk / Inactive breakdown */}
                    <Card className="p-6">
                        <h3 className="text-base font-semibold text-gray-900 mb-4">Client Status Breakdown</h3>
                        {(() => {
                            const active   = allClients.filter(c => c.status === 'Active').length;
                            const atRisk   = allClients.filter(c => c.status === 'At Risk').length;
                            const inactive = allClients.filter(c => c.status === 'Inactive').length;
                            const total    = allClients.length || 1;
                            return (
                                <div className="space-y-4">
                                    {[
                                        { label: 'Active',   count: active,   pct: Math.round((active   / total) * 100), color: '#059669', bar: 'bg-green-500' },
                                        { label: 'At Risk',  count: atRisk,   pct: Math.round((atRisk   / total) * 100), color: '#DC2626', bar: 'bg-red-500'   },
                                        { label: 'Inactive', count: inactive, pct: Math.round((inactive / total) * 100), color: '#6B7280', bar: 'bg-gray-400'  },
                                    ].map((item, i) => (
                                        <div key={i}>
                                            <div className="flex justify-between items-center mb-1.5">
                                                <span className="text-sm font-medium text-gray-700">{item.label}</span>
                                                <span className="text-sm font-bold" style={{ color: item.color }}>
                                                    {item.count} <span className="font-normal text-gray-400 text-xs">({item.pct}%)</span>
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-2">
                                                <div className={`${item.bar} h-2 rounded-full transition-all duration-700`} style={{ width: `${item.pct}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                    <p className="text-xs text-gray-400 pt-1">{total} total clients tracked</p>
                                </div>
                            );
                        })()}
                    </Card>

                    {/* At Risk clients list */}
                    <Card className="p-6">
                        <h3 className="text-base font-semibold text-gray-900 mb-4">At Risk Clients</h3>
                        {allClients.filter(c => c.status === 'At Risk').length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-[140px] text-center">
                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mb-2">
                                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <p className="text-sm font-medium text-green-600">All clients healthy</p>
                                <p className="text-xs text-gray-400 mt-1">No at-risk clients detected</p>
                            </div>
                        ) : (
                            <div className="space-y-2.5">
                                {allClients.filter(c => c.status === 'At Risk').map((c, i) => (
                                    <div key={i} className="flex items-center justify-between p-2.5 bg-red-50/60 rounded-xl group hover:bg-red-50 transition-colors duration-150">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                                            <span className="text-xs font-medium text-gray-800 truncate">{c.clientName}</span>
                                        </div>
                                        <span className="text-xs font-bold text-red-600 ml-3 flex-shrink-0">{formatCurrency(Math.round(c.totalRevenue))}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>

                    {/* Highest growth clients */}
                    <Card className="p-6">
                        <h3 className="text-base font-semibold text-gray-900 mb-4">Highest Growth Clients</h3>
                        {growthAnalysis.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-6">Need 2+ months of data</p>
                        ) : (
                            <div className="space-y-3">
                                {growthAnalysis.slice(0, 5).map((c, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="text-xs font-bold text-gray-400 w-4">{i + 1}</span>
                                            <span className="text-xs font-medium text-gray-700 truncate">{c.clientName}</span>
                                        </div>
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ml-2 ${
                                            c.growth > 0 ? 'bg-green-50 text-green-700' :
                                            c.growth > -5 ? 'bg-yellow-50 text-yellow-700' :
                                            'bg-red-50 text-red-700'
                                        }`}>
                                            {c.growth > 0 ? '+' : ''}{c.growth}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>

                {/* ── Upsell Intelligence ───────────────────────────────────── */}
                <SectionTitle>Upsell Intelligence</SectionTitle>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

                    {/* Top upsell opportunities */}
                    <Card className="lg:col-span-2 p-6">
                        <h3 className="text-base font-semibold text-gray-900 mb-0.5">Top Upsell Opportunities</h3>
                        <p className="text-xs text-gray-400 mb-4">Clients with highest expansion potential from Google Sheets data</p>
                        {upsellOpportunities.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-8">No upsell opportunities identified</p>
                        ) : (
                            <div className="space-y-3">
                                {upsellOpportunities.slice(0, 5).map((opp, i) => (
                                    <div key={i} className="flex items-start justify-between p-3.5 bg-gradient-to-r from-indigo-50/60 to-purple-50/40 rounded-xl hover:from-indigo-100/60 hover:to-purple-100/40 transition-colors duration-200">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <p className="text-sm font-semibold text-gray-900 truncate">{opp.clientName}</p>
                                                <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                                                    opp.priority === 'High'   ? 'bg-red-100 text-red-700'   :
                                                    opp.priority === 'Medium' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-green-100 text-green-700'
                                                }`}>{opp.priority}</span>
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                {opp.missingServices.slice(0, 3).map((s, idx) => (
                                                    <span key={idx} className="px-1.5 py-0.5 bg-white/80 text-indigo-600 text-xs rounded-md border border-indigo-100">{s}</span>
                                                ))}
                                                {opp.missingServices.length > 3 && (
                                                    <span className="text-xs text-gray-400 self-center">+{opp.missingServices.length - 3} more</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right ml-4 flex-shrink-0">
                                            <p className="text-sm font-bold text-green-600">{formatCurrency(opp.estimatedGain)}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">{opp.probability}% likely</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>

                    {/* Add-on buyers + Declining */}
                    <div className="flex flex-col gap-5">
                        <Card className="p-5 flex-1">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">Top Add-on Clients</h3>
                            {topAddonClients.length === 0 ? (
                                <p className="text-xs text-gray-400 text-center py-4">No add-on revenue recorded</p>
                            ) : (
                                <div className="space-y-2.5">
                                    {topAddonClients.map((c, i) => (
                                        <div key={i} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                                                <span className="text-xs text-gray-700 truncate">{c.clientName}</span>
                                            </div>
                                            <span className="text-xs font-bold text-indigo-600 ml-2 flex-shrink-0">
                                                {formatCurrency(Math.round(c.totalAddonsMRR))}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>

                        <Card className="p-5 flex-1">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">Declining Revenue</h3>
                            {decliningClients.length === 0 ? (
                                <div className="text-center py-4">
                                    <p className="text-xs font-medium text-green-600">No declining clients</p>
                                    <p className="text-xs text-gray-400 mt-0.5">All active clients stable or growing</p>
                                </div>
                            ) : (
                                <div className="space-y-2.5">
                                    {decliningClients.map((c, i) => (
                                        <div key={i} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                                                <span className="text-xs text-gray-700 truncate">{c.clientName}</span>
                                            </div>
                                            <span className="text-xs font-bold text-red-600 ml-2 flex-shrink-0">{c.growth}%</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    </div>
                </div>

                {/* ── Revenue Share + Rankings ───────────────────────────────── */}
                <SectionTitle>Revenue Distribution</SectionTitle>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <Card className="p-6">
                        <h3 className="text-base font-semibold text-gray-900 mb-4">Revenue Share Distribution</h3>
                        {revenueShareData.length > 0 ? (
                            <>
                                <ResponsiveContainer width="100%" height={240}>
                                    <PieChart>
                                        <Pie
                                            data={revenueShareData}
                                            cx="50%" cy="50%"
                                            outerRadius={95} innerRadius={42}
                                            dataKey="value"
                                            label={({ percentage }) => `${percentage}%`}
                                            labelLine={false}
                                            animationBegin={0} animationDuration={1000}
                                        >
                                            {revenueShareData.map((_, idx) => (
                                                <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<PieTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 max-h-36 overflow-y-auto">
                                    {revenueShareData.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-1.5 min-w-0">
                                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                            <span className="text-xs text-gray-600 truncate">{item.name}</span>
                                            <span className="text-xs text-gray-400 flex-shrink-0 ml-auto">{item.percentage}%</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center justify-center h-[300px] text-gray-300 text-sm">No data</div>
                        )}
                    </Card>

                    <Card className="p-6">
                        <h3 className="text-base font-semibold text-gray-900 mb-4">Client Revenue Ranking</h3>
                        {revenueShareData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={revenueShareData} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                                    <XAxis
                                        type="number"
                                        tickFormatter={v => v >= 100000 ? `${(v / 100000).toFixed(1)}L` : `${(v / 1000).toFixed(0)}K`}
                                        tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false}
                                    />
                                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#6B7280' }} width={145} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        formatter={val => [formatCurrency(val), 'Total Revenue']}
                                        labelStyle={{ fontWeight: 600 }}
                                        contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
                                    />
                                    <Bar dataKey="value" radius={[0, 6, 6, 0]} animationDuration={1200} maxBarSize={22}>
                                        {revenueShareData.map((_, idx) => (
                                            <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-[300px] text-gray-300 text-sm">No data</div>
                        )}
                    </Card>
                </div>

                {/* ── Month-over-Month Growth Table ──────────────────────────── */}
                <Card className="p-6 mb-8">
                    <h3 className="text-base font-semibold text-gray-900 mb-4">Month-over-Month Growth Analysis</h3>
                    {growthAnalysis.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-8">Need at least 2 months of data for growth analysis</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        {['Client', 'Previous MRR', 'Latest MRR', 'Growth', 'Months', 'Status'].map(h => (
                                            <th key={h} className={`px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider ${h === 'Client' ? 'text-left' : h === 'Months' || h === 'Status' ? 'text-center' : 'text-right'}`}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {growthAnalysis.map((c, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50/60 transition-colors duration-150">
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{c.clientName}</td>
                                            <td className="px-4 py-3 text-sm text-right text-gray-400">{formatCurrency(c.previousMRR)}</td>
                                            <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">{formatCurrency(c.latestMRR)}</td>
                                            <td className="px-4 py-3 text-sm text-right">
                                                <span className={`font-bold ${c.growth > 0 ? 'text-green-600' : c.growth < -5 ? 'text-red-600' : 'text-gray-500'}`}>
                                                    {c.growth > 0 ? '+' : ''}{c.growth}%
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-center text-gray-400">{c.monthCount}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                                    c.growth > 10  ? 'bg-green-100 text-green-700'   :
                                                    c.growth > 0   ? 'bg-emerald-50 text-emerald-600' :
                                                    c.growth > -5  ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                    {c.growth > 10 ? 'Fast Growing' : c.growth > 0 ? 'Growing' : c.growth > -5 ? 'Stable' : 'Declining'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>

                {/* ── Service Coverage ──────────────────────────────────────── */}
                <Card className="p-6 mb-8">
                    <h3 className="text-base font-semibold text-gray-900 mb-4">Service Coverage Analysis</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {serviceCoverage.map((service, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50/80 rounded-xl hover:bg-gray-100/60 transition-colors duration-150">
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{service.name}</p>
                                    <p className="text-xs text-gray-400">{service.clientCount} client{service.clientCount !== 1 ? 's' : ''}</p>
                                </div>
                                <div className="flex items-center gap-2 ml-3">
                                    <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                        <div
                                            className="h-1.5 rounded-full transition-all duration-700"
                                            style={{
                                                width: `${(service.clientCount / (allClients.length || 1)) * 100}%`,
                                                backgroundColor: COLORS[idx % COLORS.length],
                                            }}
                                        />
                                    </div>
                                    <span className="text-xs font-semibold text-gray-600">
                                        {Math.round((service.clientCount / (allClients.length || 1)) * 100)}%
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* ── Detailed Wallet Table ─────────────────────────────────── */}
                <Card className="p-6">
                    <h3 className="text-base font-semibold text-gray-900 mb-4">Detailed Client Wallet Analysis</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    {['Client', 'Type', 'Total Revenue', 'Service MRR', 'Addons MRR', 'Services', 'Months', 'Status'].map(h => (
                                        <th key={h} className={`px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider ${
                                            h === 'Client' || h === 'Type' ? 'text-left' :
                                            h === 'Services' || h === 'Months' || h === 'Status' ? 'text-center' : 'text-right'
                                        }`}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {[...allClients].sort((a, b) => b.totalRevenue - a.totalRevenue).map((c, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50/60 transition-colors duration-150">
                                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">{c.clientName}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                c.clientType === 'Retainer' ? 'bg-indigo-50 text-indigo-700' : 'bg-orange-50 text-orange-700'
                                            }`}>{c.clientType || '-'}</span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right font-bold text-gray-900">{formatCurrency(Math.round(c.totalRevenue))}</td>
                                        <td className="px-4 py-3 text-sm text-right text-gray-500">{formatCurrency(Math.round(c.totalServiceMRR))}</td>
                                        <td className="px-4 py-3 text-sm text-right text-indigo-600 font-medium">{formatCurrency(Math.round(c.totalAddonsMRR))}</td>
                                        <td className="px-4 py-3 text-center text-sm text-gray-500">{c.detectedServices.length}</td>
                                        <td className="px-4 py-3 text-center text-sm text-gray-500">{c.monthCount}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                                c.status === 'At Risk' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                            }`}>{c.status}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </MainLayout>
    );
};

export default WalletIntelligencePage;
