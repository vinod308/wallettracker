/**
 * ClientDetailPage
 * Google-Sheets-driven individual client analytics.
 * Route: /client/:id  (id = normalized client name)
 * Shows: header with badges, monthly tables, addon insight cards, comparison charts.
 */

import React, { useMemo, lazy, Suspense, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useClientData from '../hooks/useClientData';
import MainLayout from '../components/layout/MainLayout';
import MonthlyTable from '../components/clients/MonthlyTable';
import EditClientModal from '../components/clients/EditClientModal';
import AddonInsightCard from '../components/clients/AddonInsightCard';
import { formatCurrency } from '../utils/helpers';

const ClientComparisonCharts = lazy(() => import('../components/clients/ClientComparisonCharts'));

// Maps a detected service name → display category shown in the Package column
const SERVICE_CATEGORY = {
    'Digital Marketing':    'Marketing',
    'SEO':                  'Marketing',
    'Social Media':         'Marketing',
    'Content Marketing':    'Marketing',
    'Performance Marketing':'Marketing',
    'Paid Ads':             'Marketing',
    'Email Marketing':      'Marketing',
    'Lead Generation':      'Marketing',
    'Design':               'Creative',
    'Video Production':     'Creative',
    'Web Development':      'Technology',
    'Maintenance':          'Technology',
    'Analytics':            'Data',
    'E-Learning':           'eLearning',
    'Outdoor Advertising':  'Advertising',
    'Solar/Hardware':       'Hardware',
    'Travel Services':      'Travel',
    'General Services':     'General',
};

const getServiceCategory = (svcName) => SERVICE_CATEGORY[svcName] || 'Standard';

const ClientDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { loading, getClientById, upsellOpportunities, addRecord } = useClientData();
    const [showEditModal, setShowEditModal] = useState(false);

    const client = useMemo(() => getClientById(decodeURIComponent(id)), [id, getClientById]);

    // Build month-by-month analytics from invoice data
    const { months, lifetimeRevenue, badge } = useMemo(() => {
        if (!client) return { months: [], lifetimeRevenue: 0, badge: 'Stable' };

        const sortedMonths = Object.values(client.months)
            .sort((a, b) => b.monthOrder - a.monthOrder)
            .map(m => {
                // Build service breakdown from invoice line items
                const serviceMap = {};
                m.records.forEach(invoice => {
                    (invoice.lines || []).forEach(line => {
                        if (!line.description?.trim()) return;
                        const svcName = line.description.trim();
                        if (!serviceMap[svcName]) {
                            serviceMap[svcName] = {
                                serviceName: svcName,
                                category:    getServiceCategory(svcName),
                                amount:      0,
                                recordType:  'Recurring',
                                isAddon:     false,
                            };
                        }
                        serviceMap[svcName].amount +=
                            (parseFloat(line.rate) || 0) * (parseFloat(line.qty) || 1);
                    });
                });

                return {
                    month:           m.month,
                    monthKey:        m.monthKey,
                    monthOrder:      m.monthOrder,
                    services:        Object.values(serviceMap).map(s => ({ ...s, amount: Math.round(s.amount) })),
                    totalServiceMRR: Math.round(m.serviceMRR),
                    totalAddonsMRR:  0,
                    totalMRR:        Math.round(m.totalMRR),
                };
            });

        let badgeLabel = 'Stable';
        if (sortedMonths.length >= 2) {
            const latest   = sortedMonths[0].totalMRR;
            const previous = sortedMonths[1].totalMRR;
            const change   = previous > 0 ? ((latest - previous) / previous) * 100 : 0;
            if (change > 10) badgeLabel = 'Growth Client';
            else if (change < -10) badgeLabel = 'Declining';
        }

        const upsell = upsellOpportunities.find(u => u.clientId === client.id);
        if (upsell && upsell.missingServices.length >= 3 && badgeLabel === 'Stable') {
            badgeLabel = 'Upsell Potential';
        }

        return {
            months:          sortedMonths,
            lifetimeRevenue: client.totalRevenue,
            badge:           badgeLabel,
        };
    }, [client, upsellOpportunities]);

    const getStatusBadge = (status) => {
        const styles = {
            Active: 'bg-green-100 text-green-800',
            Inactive: 'bg-gray-100 text-gray-600',
            'At Risk': 'bg-red-100 text-red-800',
        };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
                {status}
            </span>
        );
    };

    const getBadgeStyle = (badgeLabel) => {
        const styles = {
            'Growth Client': 'bg-emerald-100 text-emerald-800 border border-emerald-200',
            'Declining': 'bg-red-100 text-red-800 border border-red-200',
            'Upsell Potential': 'bg-amber-100 text-amber-800 border border-amber-200',
            'Stable': 'bg-blue-100 text-blue-800 border border-blue-200',
        };
        const icons = {
            'Growth Client': (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
            ),
            'Declining': (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
            ),
            'Upsell Potential': (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            'Stable': (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                </svg>
            ),
        };
        return (
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${styles[badgeLabel] || styles.Stable}`}>
                {icons[badgeLabel] || icons.Stable}
                {badgeLabel}
            </span>
        );
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-32 mb-4"></div>
                    <div className="bg-white/80 rounded-2xl border border-gray-100/50 p-6 mb-6">
                        <div className="h-8 bg-gray-200 rounded w-1/3 mb-3"></div>
                        <div className="flex gap-3 mb-4">
                            <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                            <div className="h-6 bg-gray-200 rounded-full w-28"></div>
                        </div>
                        <div className="flex gap-8">
                            <div className="h-12 bg-gray-100 rounded w-40"></div>
                            <div className="h-12 bg-gray-100 rounded w-40"></div>
                            <div className="h-12 bg-gray-100 rounded w-40"></div>
                        </div>
                    </div>
                    {[1, 2].map(i => (
                        <div key={i} className="bg-white/80 rounded-2xl border border-gray-100/50 p-6 mb-6">
                            <div className="h-6 bg-gray-200 rounded w-40 mb-4"></div>
                            <div className="space-y-3">
                                {[1, 2, 3].map(j => <div key={j} className="h-10 bg-gray-100 rounded"></div>)}
                            </div>
                        </div>
                    ))}
                </div>
            </MainLayout>
        );
    }

    if (!client) {
        return (
            <MainLayout>
                <div className="mb-4">
                    <button
                        onClick={() => navigate('/clients')}
                        className="text-sm text-primary-blue hover:text-[#4338ca] font-medium flex items-center gap-1 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Clients
                    </button>
                </div>
                <div className="bg-red-50 border border-red-100 rounded-xl p-6 text-center">
                    <svg className="w-12 h-12 text-red-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-lg font-medium text-red-800">Client not found</p>
                    <p className="text-sm text-gray-500 mt-1">Client not found or has no invoice records</p>
                </div>
            </MainLayout>
        );
    }

    const avgMonthlyRevenue = months.length > 0
        ? months.reduce((sum, m) => sum + m.totalMRR, 0) / months.length
        : 0;
    const totalAddons = months.reduce((sum, m) => sum + m.totalAddonsMRR, 0);
    const latestMonth = months[0];

    return (
        <MainLayout>
            {/* Back Button */}
            <div className="mb-4">
                <button
                    onClick={() => navigate('/clients')}
                    className="text-sm text-primary-blue hover:text-[#4338ca] font-medium flex items-center gap-1 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Clients
                </button>
            </div>

            {/* Client Header Card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card border border-gray-100/50 p-6 mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="min-w-0">
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">{client.clientName}</h1>
                        <p className="text-sm text-gray-500 mt-0.5">Invoice: {client.invoiceNumber || 'N/A'}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-3">
                            {getStatusBadge(client.status)}
                            {getBadgeStyle(badge)}
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                {client.clientType || 'Retainer'}
                            </span>
                        </div>
                    </div>
                    <div className="sm:text-right flex-shrink-0">
                        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Lifetime Revenue</p>
                        <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{formatCurrency(lifetimeRevenue)}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{months.length > 0 ? `${months[months.length - 1].month} – ${months[0].month}` : 'No data'}</p>
                        <button
                            onClick={() => setShowEditModal(true)}
                            className="mt-3 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            Edit Client
                        </button>
                    </div>
                </div>

                {/* Quick Stats Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-5 pt-5 border-t border-gray-100">
                    <div>
                        <p className="text-xs text-gray-500">Current MRR</p>
                        <p className="text-sm sm:text-lg font-bold text-gray-900 break-all">
                            {latestMonth ? formatCurrency(latestMonth.totalMRR) : '-'}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Avg. Monthly Revenue</p>
                        <p className="text-sm sm:text-lg font-bold text-gray-900 break-all">{formatCurrency(Math.round(avgMonthlyRevenue))}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Total Add-on Revenue</p>
                        <p className="text-sm sm:text-lg font-bold text-primary-blue break-all">{formatCurrency(totalAddons)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Active Services</p>
                        <p className="text-sm sm:text-lg font-bold text-gray-900">{client.detectedServices.length}</p>
                    </div>
                </div>

                {/* Detected Services */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-2">Services from Invoice History</p>
                    <div className="flex flex-wrap gap-1.5">
                        {client.detectedServices.map((svc, idx) => (
                            <span key={idx} className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-lg font-medium">
                                {svc}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Comparison Charts (lazy loaded) */}
            <div className="mb-6">
                <Suspense fallback={
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {[1, 2].map(i => (
                            <div key={i} className="bg-white/80 rounded-2xl border border-gray-100/50 p-5 h-[340px] animate-pulse">
                                <div className="h-5 bg-gray-200 rounded w-48 mb-4"></div>
                                <div className="h-[280px] bg-gray-100 rounded"></div>
                            </div>
                        ))}
                    </div>
                }>
                    <ClientComparisonCharts months={months} />
                </Suspense>
            </div>

            {/* Monthly Tables */}
            <div className="space-y-6">
                {months.map((monthData) => (
                    <div key={monthData.monthKey}>
                        <MonthlyTable
                            month={monthData.month}
                            services={monthData.services}
                            totalServiceMRR={monthData.totalServiceMRR}
                            totalAddonsMRR={monthData.totalAddonsMRR}
                            totalMRR={monthData.totalMRR}
                            invoice={null}
                        />
                        <div className="mt-3">
                            <AddonInsightCard
                                month={monthData.month}
                                services={monthData.services}
                                totalAddonsMRR={monthData.totalAddonsMRR}
                                totalMRR={monthData.totalMRR}
                            />
                        </div>
                    </div>
                ))}

                {months.length === 0 && (
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card border border-gray-100/50 p-12 text-center">
                        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-lg font-medium text-gray-500">No revenue data found</p>
                        <p className="text-sm text-gray-400 mt-1">No invoices have been generated for this client yet</p>
                    </div>
                )}
            </div>

            <EditClientModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                client={client}
                onClientUpdated={(record) => {
                    addRecord(record);
                    setShowEditModal(false);
                }}
            />
        </MainLayout>
    );
};

export default ClientDetailPage;
