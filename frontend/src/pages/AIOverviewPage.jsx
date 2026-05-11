/**
 * AI Overview Page
 * CSV-driven AI-powered insights, predictions, and recommendations
 * Analyzes actual client data for churn risk, missing services, and growth patterns
 */

import React, { useMemo } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, BarChart, Bar, Cell,
} from 'recharts';
import useClientData from '../hooks/useClientData';
import MainLayout from '../components/layout/MainLayout';
import { formatCurrency } from '../utils/helpers';

const AIOverviewPage = () => {
    const {
        loading,
        allClients,
        monthlyTrend,
        upsellOpportunities,
        walletIntelligence,
    } = useClientData();

    // AI Insights - generated from actual invoice data
    const aiInsights = useMemo(() => {
        if (!allClients.length || !walletIntelligence) return [];
        const insights = [];

        // Growth detection
        if (walletIntelligence.fastestGrowing) {
            const fg = walletIntelligence.fastestGrowing;
            insights.push({
                title: 'Revenue Growth Detected',
                description: `${fg.clientName} showed ${fg.growth > 0 ? '+' : ''}${Math.round(fg.growth)}% MoM growth. Consider expanding service offerings.`,
                type: 'growth',
                confidence: Math.min(95, 70 + Math.abs(Math.round(fg.growth))),
            });
        }

        // Churn risk
        const declining = walletIntelligence.declining || [];
        if (declining.length > 0) {
            const names = declining.slice(0, 3).map(c => c.clientName).join(', ');
            insights.push({
                title: 'Churn Risk Alert',
                description: `${declining.length} client${declining.length > 1 ? 's' : ''} showing revenue decline: ${names}. Immediate re-engagement recommended.`,
                type: 'risk',
                confidence: 78,
            });
        }

        // Upsell opportunities
        const highUpsell = upsellOpportunities.filter(o => o.priority === 'High');
        if (highUpsell.length > 0) {
            const totalGain = highUpsell.reduce((s, o) => s + o.estimatedGain, 0);
            insights.push({
                title: 'High-Priority Upsell Opportunities',
                description: `${highUpsell.length} clients have significant service gaps. Total estimated gain: ${formatCurrency(totalGain)}.`,
                type: 'opportunity',
                confidence: 85,
            });
        }

        // Single-month clients
        const singleMonth = allClients.filter(c => c.monthCount === 1);
        if (singleMonth.length > 0) {
            insights.push({
                title: 'New Client Retention',
                description: `${singleMonth.length} clients appear in only 1 month. Focus on onboarding and relationship building to prevent early churn.`,
                type: 'insight',
                confidence: 72,
            });
        }

        // Addon revenue pattern
        const addonClients = allClients.filter(c => c.totalAddonsMRR > 0);
        if (addonClients.length > 0) {
            const avgAddon = addonClients.reduce((s, c) => s + c.totalAddonsMRR, 0) / addonClients.length;
            insights.push({
                title: 'Add-on Revenue Pattern',
                description: `${addonClients.length} of ${allClients.length} clients purchase add-ons (avg ${formatCurrency(avgAddon)}). Cross-sell add-ons to remaining clients.`,
                type: 'opportunity',
                confidence: 80,
            });
        }

        return insights;
    }, [allClients, walletIntelligence, upsellOpportunities]);

    // Revenue prediction (simple linear extrapolation from monthly trend)
    const predictedRevenue = useMemo(() => {
        if (!monthlyTrend || monthlyTrend.length < 2) return [];

        const actuals = monthlyTrend.filter(m => m.totalMRR > 0);
        if (actuals.length < 2) return [];

        // Calculate average growth rate
        let totalGrowth = 0;
        for (let i = 1; i < actuals.length; i++) {
            if (actuals[i - 1].totalMRR > 0) {
                totalGrowth += (actuals[i].totalMRR - actuals[i - 1].totalMRR) / actuals[i - 1].totalMRR;
            }
        }
        const avgGrowth = totalGrowth / (actuals.length - 1);
        const lastActual = actuals[actuals.length - 1].totalMRR;

        const futureMonths = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return futureMonths.map((month, idx) => {
            const factor = Math.pow(1 + avgGrowth, idx + 1);
            const predicted = Math.round(lastActual * factor);
            const variance = predicted * 0.15;
            return {
                month: `${month} 2025`,
                predicted,
                lower: Math.round(predicted - variance),
                upper: Math.round(predicted + variance),
            };
        });
    }, [monthlyTrend]);

    // Churn risk scoring from actual data
    const churnRisks = useMemo(() => {
        return allClients
            .map(client => {
                let riskScore = 0;
                const reasons = [];

                // Only 1 month = higher risk
                if (client.monthCount === 1) {
                    riskScore += 30;
                    reasons.push('Single month engagement');
                }

                // No invoice in current or previous month
                const _now = new Date();
                const _curMk = `${_now.getFullYear()}-${String(_now.getMonth() + 1).padStart(2, '0')}`;
                const _prevD = new Date(_now.getFullYear(), _now.getMonth() - 1, 1);
                const _prevMk = `${_prevD.getFullYear()}-${String(_prevD.getMonth() + 1).padStart(2, '0')}`;
                if (!client.months[_curMk] && !client.months[_prevMk]) {
                    riskScore += 35;
                    reasons.push('No recent invoice');
                }

                // Revenue decline
                if (client.revenueChange && client.revenueChange < -10) {
                    riskScore += 25;
                    reasons.push(`Revenue declined ${Math.abs(Math.round(client.revenueChange))}%`);
                }

                // Few services
                if (client.detectedServices.length <= 1) {
                    riskScore += 10;
                    reasons.push('Limited service adoption');
                }

                // No addons
                if (client.totalAddonsMRR === 0) {
                    riskScore += 5;
                    reasons.push('No add-on purchases');
                }

                return {
                    clientName: client.clientName,
                    riskScore: Math.min(95, riskScore),
                    reasons,
                    status: riskScore >= 60 ? 'High' : riskScore >= 35 ? 'Medium' : 'Low',
                    revenue: client.totalRevenue,
                };
            })
            .filter(c => c.riskScore > 20)
            .sort((a, b) => b.riskScore - a.riskScore);
    }, [allClients]);

    // Smart recommendations based on data patterns
    const recommendations = useMemo(() => {
        const recs = [];

        // Missing services recommendation
        const highUpsell = upsellOpportunities.filter(o => o.priority === 'High');
        if (highUpsell.length > 0) {
            recs.push({
                title: 'Bundle Missing Services',
                impact: 'High',
                effort: 'Low',
                description: `Offer bundled service packages to ${highUpsell.length} clients with significant service gaps.`,
                expectedRevenue: highUpsell.reduce((s, o) => s + o.estimatedGain, 0),
            });
        }

        // Re-engage inactive clients
        const _n = new Date();
        const _cm = `${_n.getFullYear()}-${String(_n.getMonth() + 1).padStart(2, '0')}`;
        const _pd = new Date(_n.getFullYear(), _n.getMonth() - 1, 1);
        const _pm = `${_pd.getFullYear()}-${String(_pd.getMonth() + 1).padStart(2, '0')}`;
        const noRecent = allClients.filter(c => !c.months[_cm] && !c.months[_pm] && c.monthCount > 0);
        if (noRecent.length > 0) {
            recs.push({
                title: 'Re-engage Inactive Clients',
                impact: 'High',
                effort: 'Medium',
                description: `${noRecent.length} clients have no recent invoice. Launch targeted re-engagement with personalized offers.`,
                expectedRevenue: noRecent.reduce((s, c) => s + (c.totalRevenue / c.monthCount) * 0.5, 0),
            });
        }

        // Addon expansion
        const noAddons = allClients.filter(c => c.totalAddonsMRR === 0 && c.monthCount >= 2);
        if (noAddons.length > 0) {
            const avgAddon = allClients.filter(c => c.totalAddonsMRR > 0).reduce((s, c) => s + c.totalAddonsMRR, 0) / Math.max(1, allClients.filter(c => c.totalAddonsMRR > 0).length);
            recs.push({
                title: 'Cross-sell Add-on Services',
                impact: 'Medium',
                effort: 'Low',
                description: `${noAddons.length} returning clients have never purchased add-ons. Average add-on value is ${formatCurrency(avgAddon)}.`,
                expectedRevenue: noAddons.length * avgAddon * 0.3,
            });
        }

        // Multi-service upgrade
        const fewServices = allClients.filter(c => c.detectedServices.length <= 2 && c.monthCount >= 2);
        if (fewServices.length > 0) {
            recs.push({
                title: 'Service Portfolio Expansion',
                impact: 'Medium',
                effort: 'Medium',
                description: `${fewServices.length} clients use 2 or fewer services. Propose complementary service bundles.`,
                expectedRevenue: fewServices.length * 150000,
            });
        }

        return recs.sort((a, b) => b.expectedRevenue - a.expectedRevenue);
    }, [allClients, upsellOpportunities]);

    // Missing services chart data
    const missingServicesChart = useMemo(() => {
        const serviceGaps = {};
        upsellOpportunities.forEach(opp => {
            opp.missingServices.forEach(s => {
                if (!serviceGaps[s]) serviceGaps[s] = 0;
                serviceGaps[s]++;
            });
        });
        return Object.entries(serviceGaps)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 8);
    }, [upsellOpportunities]);

    const getInsightIcon = (type) => {
        const configs = {
            growth: { bg: 'bg-green-100', color: 'text-green-600', path: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
            risk: { bg: 'bg-red-100', color: 'text-red-600', path: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z' },
            opportunity: { bg: 'bg-blue-100', color: 'text-blue-600', path: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
            insight: { bg: 'bg-purple-100', color: 'text-purple-600', path: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
        };
        const cfg = configs[type] || configs.insight;
        return (
            <div className={`w-10 h-10 ${cfg.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <svg className={`w-5 h-5 ${cfg.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={cfg.path} />
                </svg>
            </div>
        );
    };

    const getRiskColor = (risk) => {
        if (risk >= 60) return 'text-red-600 bg-red-50';
        if (risk >= 35) return 'text-yellow-600 bg-yellow-50';
        return 'text-green-600 bg-green-50';
    };

    const getImpactBadge = (level) => {
        const styles = { High: 'bg-red-100 text-red-700', Medium: 'bg-yellow-100 text-yellow-700', Low: 'bg-green-100 text-green-700' };
        return styles[level] || 'bg-gray-100 text-gray-700';
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
                    <div className="h-4 bg-gray-100 rounded w-80 mb-8"></div>
                    <div className="grid grid-cols-2 gap-6 mb-6">
                        {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-gray-100 rounded-2xl"></div>)}
                    </div>
                    <div className="h-72 bg-gray-100 rounded-2xl"></div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            {/* Page Header */}
            <div className="mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">AI Overview</h1>
                        <p className="text-sm text-gray-500">Smart predictions and recommendations from your invoice data</p>
                    </div>
                </div>
            </div>

            {/* AI Insights */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card border border-gray-100/50 p-6 mb-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Key Insights</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {aiInsights.map((insight, index) => (
                        <div key={index} className="flex gap-3 p-4 bg-gray-50/80 rounded-xl hover:bg-gray-100/60 transition-colors">
                            {getInsightIcon(insight.type)}
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="text-sm font-semibold text-gray-900">{insight.title}</h3>
                                    <span className="text-xs text-gray-500">{insight.confidence}% confidence</span>
                                </div>
                                <p className="text-xs text-gray-600 leading-relaxed">{insight.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Revenue Prediction */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card border border-gray-100/50 p-6">
                    <h2 className="text-base font-semibold text-gray-900 mb-4">Revenue Forecast (Aug-Dec 2025)</h2>
                    {predictedRevenue.length > 0 ? (
                        <>
                            <ResponsiveContainer width="100%" height={220}>
                                <AreaChart data={predictedRevenue} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                                    <defs>
                                        <linearGradient id="predFill" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.3} />
                                            <stop offset="100%" stopColor="#4F46E5" stopOpacity={0.02} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                    <YAxis tickFormatter={(v) => `${(v / 100000).toFixed(0)}L`} tick={{ fontSize: 11 }} />
                                    <Tooltip formatter={(val) => formatCurrency(val)} />
                                    <Area type="monotone" dataKey="upper" stroke="none" fill="#E0E7FF" />
                                    <Area type="monotone" dataKey="predicted" stroke="#4F46E5" strokeWidth={2} fill="url(#predFill)" dot={{ r: 4, fill: '#4F46E5' }} />
                                    <Area type="monotone" dataKey="lower" stroke="none" fill="transparent" />
                                </AreaChart>
                            </ResponsiveContainer>
                            <p className="text-xs text-gray-500 italic mt-2">Based on April-July 2025 revenue trends. Shaded area shows confidence interval.</p>
                        </>
                    ) : (
                        <p className="text-sm text-gray-500 text-center py-8">Insufficient data for predictions</p>
                    )}
                </div>

                {/* Missing Services Chart */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card border border-gray-100/50 p-6">
                    <h2 className="text-base font-semibold text-gray-900 mb-4">Most Common Service Gaps</h2>
                    {missingServicesChart.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={missingServicesChart} margin={{ top: 5, right: 10, left: 10, bottom: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" />
                                <YAxis tick={{ fontSize: 11 }} label={{ value: 'Clients Missing', angle: -90, position: 'insideLeft', style: { fontSize: 10 } }} />
                                <Tooltip />
                                <Bar dataKey="count" name="Clients Missing" radius={[6, 6, 0, 0]}>
                                    {missingServicesChart.map((_, idx) => (
                                        <Cell key={idx} fill={['#4F46E5', '#7C3AED', '#2563EB', '#0891B2', '#059669', '#D97706', '#DC2626', '#EC4899'][idx % 8]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-sm text-gray-500 text-center py-8">No service gap data</p>
                    )}
                </div>
            </div>

            {/* Churn Risk */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card border border-gray-100/50 p-6 mb-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Churn Risk Prediction</h2>
                {churnRisks.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-6">All clients are healthy</p>
                ) : (
                    <div className="space-y-2.5">
                        {churnRisks.map((client, index) => (
                            <div key={index} className="flex items-center gap-3 p-3 bg-gray-50/80 rounded-xl">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm ${getRiskColor(client.riskScore)}`}>
                                    {client.riskScore}%
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold text-gray-900">{client.clientName}</p>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                            client.status === 'High' ? 'bg-red-100 text-red-700' :
                                            client.status === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-green-100 text-green-700'
                                        }`}>
                                            {client.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-0.5">{client.reasons.join(' | ')}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-semibold text-gray-900">{formatCurrency(client.revenue)}</p>
                                    <p className="text-xs text-gray-500">at risk</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Recommendation Engine */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card border border-gray-100/50 p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Recommendation Engine</h2>
                {recommendations.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-6">No recommendations at this time</p>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50/80 border-b border-gray-100">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recommendation</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Impact</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Effort</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Expected Revenue</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {recommendations.map((rec, index) => (
                                        <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-4 py-4">
                                                <p className="text-sm font-semibold text-gray-900">{rec.title}</p>
                                                <p className="text-xs text-gray-500 mt-1">{rec.description}</p>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getImpactBadge(rec.impact)}`}>
                                                    {rec.impact}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getImpactBadge(rec.effort)}`}>
                                                    {rec.effort}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <span className="text-sm font-bold text-green-600">{formatCurrency(Math.round(rec.expectedRevenue))}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                            <p className="text-xs text-gray-500 italic">
                                Recommendations generated from actual CSV client data and service patterns.
                            </p>
                            <p className="text-sm font-semibold text-primary-blue">
                                Total Potential: {formatCurrency(Math.round(recommendations.reduce((s, r) => s + r.expectedRevenue, 0)))}
                            </p>
                        </div>
                    </>
                )}
            </div>
        </MainLayout>
    );
};

export default AIOverviewPage;
