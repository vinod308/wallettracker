/**
 * Dashboard Page
 * Main dashboard with dynamic date filtering, KPIs, charts, and analytics.
 * Data is read from localStorage (gw_onboarded_clients + gw_invoices) via useClientData hook.
 * Fires notifications into NotificationContext whenever data changes.
 */

import React, { useMemo, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import useClientData from '../hooks/useClientData';
import { useNotifications } from '../context/NotificationContext';
import MainLayout from '../components/layout/MainLayout';
import KPISection from '../components/dashboard/KPISection';
import DateRangeSelector from '../components/dashboard/DateRangeSelector';
import ClientRevenueTable from '../components/dashboard/ClientRevenueTable';
import ServiceRevenueMix from '../components/dashboard/ServiceRevenueMix';
import ContractsExpiring from '../components/dashboard/ContractsExpiring';
import UpsellOpportunities from '../components/dashboard/UpsellOpportunities';
import RevenueChart from '../components/dashboard/RevenueChart';
import AOVChart from '../components/dashboard/AOVChart';
import MonthlyTrendChart from '../components/dashboard/MonthlyTrendChart';
import { formatCurrency } from '../utils/helpers';
import OnboardingModal from '../components/onboarding/OnboardingModal';

const DashboardPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { addNotification } = useNotifications();

    const [companySettings, setCompanySettings] = useState(() =>
        JSON.parse(localStorage.getItem('gw_settings') || 'null')
    );
    // Show onboarding only for brand-new users who haven't entered any company info yet.
    // If they already have a company name saved (even as draft), or have dismissed before, skip it.
    const needsOnboarding = !companySettings?.companyName &&
                            !localStorage.getItem('gw_onboarding_dismissed');
    const [showOnboarding, setShowOnboarding] = useState(needsOnboarding);

    const handleOnboardingComplete = (data) => {
        setCompanySettings(data);
        setShowOnboarding(false);
    };

    const handleOnboardingSkip = () => {
        localStorage.setItem('gw_onboarding_dismissed', 'true');
        setShowOnboarding(false);
    };

    // Core data hook — reads localStorage, filters instantly
    const {
        loading,
        error,
        selectedRange,
        periodLabel,
        kpis,
        allClients,
        filteredClients,
        filteredData,
        revenueChartData,
        serviceAOVData,
        monthlyTrend,
        serviceRevenueMix,
        upsellOpportunities,
        contracts,
        handleRangeChange,
        handleCustomRange,
    } = useClientData();

    // ── Notification logic ──────────────────────────────────────────────────
    // Fire a notification when data first loads or when at-risk clients appear.
    // Uses refs to track "previous" state so we only notify on actual changes.
    const prevClientCountRef  = useRef(null);
    const prevAtRiskCountRef  = useRef(null);
    const prevTotalMRRRef     = useRef(null);

    useEffect(() => {
        if (loading || allClients.length === 0) return;

        const currentCount   = allClients.length;
        const currentAtRisk  = kpis?.atRiskCount || 0;
        const currentMRR     = kpis?.totalMRR    || 0;

        // First load
        if (prevClientCountRef.current === null) {
            addNotification(
                'Dashboard data loaded',
                `${currentCount} clients · MRR ${formatCurrency(currentMRR)}`,
                'data_loaded'
            );
        } else {
            // New client appeared in the sheet
            if (currentCount > prevClientCountRef.current) {
                const diff = currentCount - prevClientCountRef.current;
                addNotification(
                    `${diff} new client${diff > 1 ? 's' : ''} added to the sheet`,
                    '',
                    'new_client'
                );
            }

            // At-risk count increased
            if (currentAtRisk > (prevAtRiskCountRef.current || 0)) {
                const names = (kpis?.atRiskClients || []).map(c => c.clientName).join(', ');
                addNotification(
                    `Client status changed to At Risk`,
                    names,
                    'status_change'
                );
            }

            // MRR changed (revenue update in sheet)
            if (prevTotalMRRRef.current !== null && prevTotalMRRRef.current !== currentMRR) {
                addNotification(
                    `Revenue data updated — ${periodLabel}`,
                    `Total MRR: ${formatCurrency(currentMRR)}`,
                    'revenue_update'
                );
            }
        }

        prevClientCountRef.current = currentCount;
        prevAtRiskCountRef.current = currentAtRisk;
        prevTotalMRRRef.current    = currentMRR;
    }, [loading, allClients, kpis]);

    // ── Invoice summary ─────────────────────────────────────────────────────
    const invoiceSummary = useMemo(() => {
        if (!filteredData || filteredData.length === 0) return null;
        const totalServiceMRR = filteredData.reduce((sum, r) => sum + (parseFloat(r.subtotal) || 0), 0);
        const totalAddonsMRR  = 0;
        const totalMRR        = filteredData.reduce((sum, r) => sum + (parseFloat(r.total)    || 0), 0);
        const totalInvoices   = filteredData.length;
        const paidCount       = filteredData.filter(r => (r.status || '').toLowerCase().includes('paid')).length;
        return { totalServiceMRR, totalAddonsMRR, totalMRR, totalInvoices, paidCount };
    }, [filteredData]);

    // ── Table data ──────────────────────────────────────────────────────────
    const clientTableData = useMemo(() => {
        return filteredClients.map(c => {
            const allRecords   = Object.values(c.filteredMonths || {}).flatMap(m => m.records || []);
            const latestRecord = allRecords.sort((a, b) =>
                new Date(b.invoiceDate || b.createdAt || 0) - new Date(a.invoiceDate || a.createdAt || 0))[0];
            return {
                id:            c.id,
                clientName:    c.clientName,
                invoiceNumber: latestRecord?.invoiceNumber || c.invoiceNumber || '—',
                clientType:    c.clientType,
                industry:      c.clientType || '',
                serviceMRR:    c.filteredServiceMRR,
                addonsMRR:     c.filteredAddonsMRR || 0,
                totalMRR:      c.filteredRevenue,
                paymentStatus: latestRecord?.status || 'Generated',
                status:        c.status || 'Active',
            };
        });
    }, [filteredClients]);

    // ── Upsell display data ─────────────────────────────────────────────────
    const upsellData = useMemo(() => {
        return upsellOpportunities.map(o => ({
            clientName:          o.clientName,
            projectName:         o.businessType,
            recommendedServices: o.missingServices.slice(0, 5),
            potentialGain:       o.estimatedGain,
            probability:         o.probability,
            priority:            o.priority,
            currentServices:     o.currentServices,
            status:              'Identified',
        }));
    }, [upsellOpportunities]);

    // ── Contracts display data ──────────────────────────────────────────────
    const contractsData = useMemo(() => {
        return contracts.map(c => ({
            id:            c.clientId,
            clientName:    c.clientName,
            projectName:   c.clientType || 'Retainer',
            mrr:           Math.round(c.mrr),
            daysUntilExpiry: c.monthsRemaining * 30,
            startDate:     c.startDate,
            endDate:       c.endDate,
            status:        c.status,
            renewalStatus: c.renewalStatus,
        }));
    }, [contracts]);

    return (
        <MainLayout>
            {/* Onboarding modal */}
            <OnboardingModal
                isOpen={showOnboarding}
                onComplete={handleOnboardingComplete}
                onSkip={handleOnboardingSkip}
            />

            {/* Page Header */}
            <div className="mb-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
                        {companySettings?.companyName && !companySettings.isDraft ? (
                            <p className="mt-1 text-sm text-gray-600">
                                Welcome, <span className="font-semibold text-primary-blue">{companySettings.companyName}</span>
                            </p>
                        ) : (
                            <p className="mt-1 text-sm text-gray-600">
                                Welcome back,{' '}
                                <span className="font-medium text-primary-blue">{user?.full_name || 'User'}</span>
                            </p>
                        )}
                    </div>
                    <button
                        onClick={() => navigate('/reports')}
                        className="self-start sm:self-auto px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                    >
                        Export Report
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div>
                {/* Error Message */}
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-100 rounded-xl p-4">
                        <div className="flex items-center">
                            <svg className="w-5 h-5 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <p className="text-sm font-medium text-red-800">{error}</p>
                        </div>
                    </div>
                )}

                {/* Date Range Selector */}
                <DateRangeSelector
                    selectedRange={selectedRange}
                    onRangeChange={handleRangeChange}
                    onCustomRangeChange={handleCustomRange}
                    periodLabel={periodLabel}
                />

                {/* KPI Cards */}
                <KPISection kpis={kpis} loading={loading} />

                {/* Invoice Summary Bar */}
                {invoiceSummary && (
                    <div className="mb-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-card border border-gray-100/50 p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <h3 className="text-sm font-semibold text-gray-900">{periodLabel} Invoice Summary</h3>
                            <div className="flex flex-wrap gap-3 sm:gap-6 text-sm">
                                <div>
                                    <span className="text-gray-500">Service MRR: </span>
                                    <span className="font-semibold text-gray-900">
                                        {formatCurrency(invoiceSummary.totalServiceMRR)}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-500">Addons MRR: </span>
                                    <span className="font-semibold text-primary-blue">
                                        {formatCurrency(invoiceSummary.totalAddonsMRR)}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-500">Total MRR: </span>
                                    <span className="font-bold text-primary-green">
                                        {formatCurrency(invoiceSummary.totalMRR)}
                                    </span>
                                </div>
                                {invoiceSummary.totalInvoices > 0 && (
                                    <div>
                                        <span className="text-gray-500">Invoices: </span>
                                        <span className="font-semibold">{invoiceSummary.totalInvoices}</span>
                                        <span className="ml-1 text-primary-green">
                                            ({invoiceSummary.paidCount} Paid)
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Charts Row */}
                {/* Left: Revenue Generated per Client (unchanged) */}
                {/* Right: Service Category AOV (new — different dataset from left chart) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <RevenueChart
                        data={revenueChartData}
                        loading={loading}
                        title="Revenue Generated per Client"
                    />
                    <AOVChart
                        data={serviceAOVData}
                        loading={loading}
                        title="Service Category AOV"
                    />
                </div>

                {/* Monthly Revenue Trend — Full Width */}
                <div className="mb-6">
                    <MonthlyTrendChart data={monthlyTrend} loading={loading} />
                </div>

                {/* Client Table + Service Mix */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <div className="lg:col-span-2">
                        <ClientRevenueTable
                            clients={clientTableData}
                            loading={loading}
                            periodLabel={periodLabel}
                            onClientClick={(client) => navigate(`/client/${client.id}`)}
                        />
                    </div>
                    <div className="lg:col-span-1">
                        <ServiceRevenueMix services={serviceRevenueMix} loading={loading} />
                    </div>
                </div>

                {/* Contracts Expiring + Upsell Opportunities */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ContractsExpiring contracts={contractsData} loading={loading} />
                    <UpsellOpportunities opportunities={upsellData} loading={loading} />
                </div>
            </div>

        </MainLayout>
    );
};

export default DashboardPage;
