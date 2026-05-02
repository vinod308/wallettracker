/**
 * useInvoiceData Hook
 * Manages multi-month invoice/revenue data with client-side filtering
 * Fetches all data once, then filters/computes instantly on range change
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import dashboardService from '../services/dashboardService';

const useInvoiceData = () => {
    // Raw data from API (fetched once)
    const [rawData, setRawData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Selected date range
    const [selectedRange, setSelectedRange] = useState('this_month');
    const [customRange, setCustomRange] = useState({ start: null, end: null });

    // Fetch all monthly data once on mount
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await dashboardService.getMonthlyOverview();
            setRawData(response.data);
        } catch (err) {
            console.error('Error fetching monthly overview:', err);
            setError(err.response?.data?.error?.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    // Map range selection to actual months
    const selectedMonths = useMemo(() => {
        if (!rawData?.months) return [];

        const allMonths = rawData.months; // ['April 2025', 'May 2025', 'June 2025', 'July 2025']
        const latestMonth = allMonths[allMonths.length - 1];
        const previousMonth = allMonths.length >= 2 ? allMonths[allMonths.length - 2] : null;

        switch (selectedRange) {
            case 'this_month':
                return [latestMonth];
            case 'last_month':
                return previousMonth ? [previousMonth] : [];
            case 'ytd':
                return [...allMonths];
            case 'custom':
                // Filter months within custom date range
                if (!customRange.start || !customRange.end) return [latestMonth];
                return allMonths.filter(month => {
                    const monthDate = monthToDate(month);
                    const start = new Date(customRange.start);
                    const end = new Date(customRange.end);
                    return monthDate >= start && monthDate <= end;
                });
            default:
                return [latestMonth];
        }
    }, [rawData, selectedRange, customRange]);

    // Filtered clients with data for selected months (memoized)
    const filteredClients = useMemo(() => {
        if (!rawData?.clients || selectedMonths.length === 0) return [];

        return rawData.clients
            .map(client => {
                // Aggregate across selected months
                let totalServiceMRR = 0;
                let totalAddonsMRR = 0;
                let totalMRR = 0;
                let invoiceNumber = null;
                let paymentStatus = null;
                let monthCount = 0;

                selectedMonths.forEach(month => {
                    const md = client.monthlyData[month];
                    if (md) {
                        totalServiceMRR += md.serviceMRR;
                        totalAddonsMRR += md.addonsMRR;
                        totalMRR += md.totalMRR;
                        monthCount++;
                        // Use latest invoice info
                        if (md.invoiceNumber) invoiceNumber = md.invoiceNumber;
                        if (md.paymentStatus) paymentStatus = md.paymentStatus;
                    }
                });

                return {
                    ...client,
                    serviceMRR: totalServiceMRR,
                    addonsMRR: totalAddonsMRR,
                    totalMRR,
                    invoiceNumber,
                    paymentStatus: paymentStatus || 'No Invoice',
                    monthCount,
                    // AOV = Total MRR / number of months with data
                    aov: monthCount > 0 ? totalMRR / monthCount : 0,
                };
            })
            .filter(c => c.totalMRR > 0)
            .sort((a, b) => b.totalMRR - a.totalMRR);
    }, [rawData, selectedMonths]);

    // Computed KPIs (memoized)
    const kpis = useMemo(() => {
        if (!rawData?.summary || selectedMonths.length === 0) {
            return {
                totalMRR: { value: 0, growth: 0, trend: 'neutral' },
                totalRevenue: { value: 0, growth: 0, trend: 'neutral' },
                activeClients: { value: 0, growth: 0, trend: 'neutral' },
                atRiskRevenue: { value: 0, percentage: 0, trend: 'warning' },
            };
        }

        // Aggregate across selected months
        let totalMRR = 0;
        let totalServiceMRR = 0;
        let totalAddonsMRR = 0;
        let activeClients = 0;
        let atRiskRevenue = 0;

        selectedMonths.forEach(month => {
            const s = rawData.summary[month];
            if (s) {
                totalMRR += s.totalMRR;
                totalServiceMRR += s.totalServiceMRR;
                totalAddonsMRR += s.totalAddonsMRR;
                activeClients = Math.max(activeClients, s.activeClients);
            }
        });

        // Calculate at-risk revenue from filtered clients
        filteredClients.forEach(client => {
            if (client.status === 'At Risk') {
                atRiskRevenue += client.totalMRR;
            }
        });

        // Calculate growth vs previous period
        const allMonths = rawData.months;
        let previousMRR = 0;
        if (selectedRange === 'this_month' && allMonths.length >= 2) {
            const prevMonth = allMonths[allMonths.length - 2];
            previousMRR = rawData.summary[prevMonth]?.totalMRR || 0;
        } else if (selectedRange === 'last_month' && allMonths.length >= 3) {
            const prevMonth = allMonths[allMonths.length - 3];
            previousMRR = rawData.summary[prevMonth]?.totalMRR || 0;
        }

        const latestMonthMRR = selectedRange === 'ytd'
            ? totalMRR / selectedMonths.length
            : totalMRR;
        const mrrGrowth = previousMRR > 0
            ? parseFloat(((latestMonthMRR - previousMRR) / previousMRR * 100).toFixed(2))
            : 0;

        return {
            totalMRR: {
                value: selectedRange === 'ytd' ? totalMRR / selectedMonths.length : totalMRR,
                growth: mrrGrowth,
                trend: mrrGrowth >= 0 ? 'up' : 'down',
            },
            totalRevenue: {
                value: totalMRR,
                growth: mrrGrowth,
                trend: mrrGrowth >= 0 ? 'up' : 'down',
            },
            activeClients: {
                value: activeClients,
                growth: 0,
                trend: 'neutral',
            },
            atRiskRevenue: {
                value: atRiskRevenue,
                percentage: totalMRR > 0 ? (atRiskRevenue / totalMRR * 100).toFixed(2) : 0,
                trend: 'warning',
            },
        };
    }, [rawData, selectedMonths, filteredClients, selectedRange]);

    // Invoice summary for the bar
    const invoiceSummary = useMemo(() => {
        if (!rawData?.summary || selectedMonths.length === 0) return null;

        let totalServiceMRR = 0;
        let totalAddonsMRR = 0;
        let totalMRR = 0;
        let totalInvoices = 0;
        let paidCount = 0;

        selectedMonths.forEach(month => {
            const s = rawData.summary[month];
            if (s) {
                totalServiceMRR += s.totalServiceMRR;
                totalAddonsMRR += s.totalAddonsMRR;
                totalMRR += s.totalMRR;
                totalInvoices += s.totalInvoices;
                paidCount += s.paidCount;
            }
        });

        return { totalServiceMRR, totalAddonsMRR, totalMRR, totalInvoices, paidCount };
    }, [rawData, selectedMonths]);

    // Chart data: Revenue per client (memoized)
    const revenueChartData = useMemo(() => {
        return filteredClients.slice(0, 10).map(client => ({
            name: client.clientName.length > 15
                ? client.clientName.substring(0, 15) + '...'
                : client.clientName,
            fullName: client.clientName,
            serviceMRR: client.serviceMRR,
            addonsMRR: client.addonsMRR,
            totalMRR: client.totalMRR,
        }));
    }, [filteredClients]);

    // Chart data: AOV per client (memoized)
    const aovChartData = useMemo(() => {
        return filteredClients
            .filter(c => c.aov > 0)
            .slice(0, 10)
            .map(client => ({
                name: client.clientName.length > 15
                    ? client.clientName.substring(0, 15) + '...'
                    : client.clientName,
                fullName: client.clientName,
                aov: Math.round(client.aov),
                months: client.monthCount,
            }));
    }, [filteredClients]);

    // Monthly trend data for charts
    const monthlyTrend = useMemo(() => {
        if (!rawData?.months || !rawData?.summary) return [];

        return rawData.months.map(month => ({
            month: month.replace(' 2025', ''),
            totalMRR: rawData.summary[month]?.totalMRR || 0,
            serviceMRR: rawData.summary[month]?.totalServiceMRR || 0,
            addonsMRR: rawData.summary[month]?.totalAddonsMRR || 0,
            activeClients: rawData.summary[month]?.activeClients || 0,
        }));
    }, [rawData]);

    // Available months
    const availableMonths = rawData?.months || [];

    // Period label for display
    const periodLabel = useMemo(() => {
        if (selectedMonths.length === 0) return '';
        if (selectedMonths.length === 1) return selectedMonths[0];
        return `${selectedMonths[0]} - ${selectedMonths[selectedMonths.length - 1]}`;
    }, [selectedMonths]);

    const handleRangeChange = useCallback((range) => {
        setSelectedRange(range);
    }, []);

    const handleCustomRange = useCallback((start, end) => {
        setCustomRange({ start, end });
        setSelectedRange('custom');
    }, []);

    return {
        // State
        loading,
        error,
        selectedRange,
        selectedMonths,
        availableMonths,
        periodLabel,

        // Computed data (all memoized)
        kpis,
        filteredClients,
        invoiceSummary,
        revenueChartData,
        aovChartData,
        monthlyTrend,

        // Actions
        handleRangeChange,
        handleCustomRange,
        refetch: fetchData,
    };
};

// Helper: Convert month name to Date for comparison
function monthToDate(monthStr) {
    const parts = monthStr.split(' ');
    const monthNames = {
        January: 0, February: 1, March: 2, April: 3, May: 4, June: 5,
        July: 6, August: 7, September: 8, October: 9, November: 10, December: 11,
    };
    return new Date(parseInt(parts[1]), monthNames[parts[0]], 1);
}

export default useInvoiceData;
