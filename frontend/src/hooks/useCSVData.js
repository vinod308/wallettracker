/**
 * useCSVData Hook
 * Core data engine — fetches all Google Sheets data via backend proxy,
 * provides filtering, KPIs, charts. Single source of truth for the app.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
    loadAllCSVData,
    detectServices,
    normalizeClientName,
    ALL_DIGITAL_SERVICES,
    ALL_ELEARNING_SERVICES,
} from '../utils/csvParser';

// Module-level storage for manually added records (persists across component instances within session)
let manualRecords = [];

// Load persisted manual records from localStorage
try {
    const stored = localStorage.getItem('wallettracker_manual_records');
    if (stored) manualRecords = JSON.parse(stored);
} catch (e) { /* ignore parse errors */ }

const persistManualRecords = () => {
    try {
        localStorage.setItem('wallettracker_manual_records', JSON.stringify(manualRecords));
    } catch (e) { /* ignore storage errors */ }
};

const useCSVData = () => {
    const [rawData, setRawData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedRange, setSelectedRange] = useState('this_month');
    const [customRange, setCustomRange] = useState({ start: null, end: null });

    // Fetch all CSVs + merge manual records
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const data = await loadAllCSVData();
                setRawData([...data, ...manualRecords]);
            } catch (err) {
                console.error('Error loading CSV data:', err);
                setError('Failed to load data from CSV files');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Month mapping for range filter
    const MONTH_MAP = {
        this_month: ['july'],
        last_month: ['june'],
        ytd: ['april', 'may', 'june', 'july'],
        q1: ['april', 'may', 'june'],
    };

    // Full month order for all 12 months (supports manually added records for any month)
    const FULL_MONTH_ORDER = {
        january: -3, february: -2, march: -1,
        april: 0, may: 1, june: 2, july: 3,
        august: 4, september: 5, october: 6,
        november: 7, december: 8,
    };

    // Filter data based on selected range
    const filteredData = useMemo(() => {
        if (selectedRange === 'custom') {
            // For custom, filter by month keys
            if (customRange.start && customRange.end) {
                return rawData.filter(r => {
                    const ord = FULL_MONTH_ORDER[r.monthKey] ?? -99;
                    return ord >= (FULL_MONTH_ORDER[customRange.start] ?? 0) &&
                           ord <= (FULL_MONTH_ORDER[customRange.end] ?? 3);
                });
            }
            return rawData;
        }
        const allowedMonths = MONTH_MAP[selectedRange] || MONTH_MAP.this_month;
        return rawData.filter(r => allowedMonths.includes(r.monthKey));
    }, [rawData, selectedRange, customRange]);

    // Period label
    const periodLabel = useMemo(() => {
        const labels = {
            this_month: 'July 2025',
            last_month: 'June 2025',
            ytd: 'April - July 2025 (YTD)',
            q1: 'Q1: April - June 2025',
        };
        if (selectedRange === 'custom') {
            const s = customRange.start ? customRange.start.charAt(0).toUpperCase() + customRange.start.slice(1) : '';
            const e = customRange.end ? customRange.end.charAt(0).toUpperCase() + customRange.end.slice(1) : '';
            return `${s} - ${e} 2025`;
        }
        return labels[selectedRange] || 'July 2025';
    }, [selectedRange, customRange]);

    // Build unique client list across all months
    const allClients = useMemo(() => {
        const clientMap = new Map();

        rawData.forEach(record => {
            const normName = normalizeClientName(record.clientName);
            if (!clientMap.has(normName)) {
                clientMap.set(normName, {
                    id: normName,
                    clientName: record.clientName,
                    clientType: record.clientType,
                    invoiceNumber: record.invoiceNumber,
                    status: 'Active',
                    detectedServices: [],
                    months: {},
                    totalRevenue: 0,
                    totalServiceMRR: 0,
                    totalAddonsMRR: 0,
                    monthCount: 0,
                });
            }

            const client = clientMap.get(normName);
            // Keep the most recent name / type
            if (record.monthOrder >= (client._lastOrder || -1)) {
                client.clientName = record.clientName;
                if (record.clientType) client.clientType = record.clientType;
                if (record.invoiceNumber) client.invoiceNumber = record.invoiceNumber;
                client._lastOrder = record.monthOrder;
            }

            // Accumulate monthly data
            if (!client.months[record.monthKey]) {
                client.months[record.monthKey] = {
                    month: record.month,
                    monthKey: record.monthKey,
                    monthOrder: record.monthOrder,
                    records: [],
                    serviceMRR: 0,
                    addonsMRR: 0,
                    totalMRR: 0,
                };
            }

            const monthData = client.months[record.monthKey];
            monthData.records.push(record);
            monthData.serviceMRR += record.serviceMRR;
            monthData.addonsMRR += record.addonsMRR;
            monthData.totalMRR += record.totalMRR;

            client.totalRevenue += record.totalMRR;
            client.totalServiceMRR += record.serviceMRR;
            client.totalAddonsMRR += record.addonsMRR;

            // Detect services
            const services = detectServices(record.services, record.addons);
            services.forEach(s => {
                if (!client.detectedServices.includes(s)) {
                    client.detectedServices.push(s);
                }
            });
        });

        // Set month count and compute status
        clientMap.forEach(client => {
            client.monthCount = Object.keys(client.months).length;
            delete client._lastOrder;

            // Determine active months in filtered range
            const sortedMonths = Object.values(client.months)
                .sort((a, b) => b.monthOrder - a.monthOrder);

            if (sortedMonths.length >= 2) {
                const latest = sortedMonths[0].totalMRR;
                const previous = sortedMonths[1].totalMRR;
                const change = previous > 0 ? ((latest - previous) / previous) * 100 : 0;
                client.revenueChange = change;
                if (change <= -15) client.status = 'At Risk';
            }
        });

        return Array.from(clientMap.values());
    }, [rawData]);

    // Filtered clients (based on selected date range)
    const filteredClients = useMemo(() => {
        const clientMap = new Map();

        filteredData.forEach(record => {
            const normName = normalizeClientName(record.clientName);
            if (!clientMap.has(normName)) {
                // Find the full client object from allClients
                const fullClient = allClients.find(c => c.id === normName);
                clientMap.set(normName, {
                    ...fullClient,
                    filteredRevenue: 0,
                    filteredServiceMRR: 0,
                    filteredAddonsMRR: 0,
                    filteredMonths: {},
                });
            }

            const client = clientMap.get(normName);
            client.filteredRevenue += record.totalMRR;
            client.filteredServiceMRR += record.serviceMRR;
            client.filteredAddonsMRR += record.addonsMRR;

            if (!client.filteredMonths[record.monthKey]) {
                client.filteredMonths[record.monthKey] = {
                    month: record.month,
                    monthKey: record.monthKey,
                    records: [],
                    serviceMRR: 0,
                    addonsMRR: 0,
                    totalMRR: 0,
                };
            }
            const fm = client.filteredMonths[record.monthKey];
            fm.records.push(record);
            fm.serviceMRR += record.serviceMRR;
            fm.addonsMRR += record.addonsMRR;
            fm.totalMRR += record.totalMRR;
        });

        return Array.from(clientMap.values());
    }, [filteredData, allClients]);

    // KPIs
    const kpis = useMemo(() => {
        const totalMRR = filteredClients.reduce((sum, c) => sum + c.filteredRevenue, 0);
        const activeClients = filteredClients.length;
        const atRiskList = filteredClients.filter(c => c.status === 'At Risk');
        const atRiskRevenue = atRiskList.reduce((sum, c) => sum + c.filteredRevenue, 0);

        // Avg MRR per client
        const avgRevenue = activeClients > 0 ? totalMRR / activeClients : 0;

        // At-risk client details for hover tooltip on the KPI card
        const atRiskClients = atRiskList.map(c => ({
            clientName: c.clientName,
            revenue: Math.round(c.filteredRevenue),
        }));

        return {
            totalMRR,
            totalRevenue: rawData.reduce((sum, r) => sum + r.totalMRR, 0),
            activeClients,
            atRiskRevenue,
            avgRevenue,
            atRiskCount: atRiskList.length,
            atRiskClients,   // used by KPICard hover tooltip
        };
    }, [filteredClients, rawData]);

    // Revenue chart data (per client for filtered period)
    const revenueChartData = useMemo(() => {
        return filteredClients
            .map(c => ({
                clientName: c.clientName.length > 20 ? c.clientName.substring(0, 18) + '...' : c.clientName,
                fullName: c.clientName,
                serviceMRR: Math.round(c.filteredServiceMRR),
                addonsMRR: Math.round(c.filteredAddonsMRR),
                totalMRR: Math.round(c.filteredRevenue),
            }))
            .sort((a, b) => b.totalMRR - a.totalMRR);
    }, [filteredClients]);

    // AOV chart data — kept for backward compat but no longer used by dashboard
    const aovChartData = useMemo(() => {
        return filteredClients
            .map(c => {
                const monthCount = Object.keys(c.filteredMonths).length || 1;
                return {
                    clientName: c.clientName.length > 20 ? c.clientName.substring(0, 18) + '...' : c.clientName,
                    fullName: c.clientName,
                    aov: Math.round(c.filteredRevenue / monthCount),
                    monthsActive: monthCount,
                };
            })
            .sort((a, b) => b.aov - a.aov);
    }, [filteredClients]);

    // Service Category AOV — avg revenue per client for each service type
    // Used by the AOV chart to show a meaningfully different view from the revenue chart
    const serviceAOVData = useMemo(() => {
        const serviceMap = {};

        filteredData.forEach(record => {
            const services = detectServices(record.services, record.addons);
            const revenuePerService = record.totalMRR / (services.length || 1);
            const clientNorm = normalizeClientName(record.clientName);

            services.forEach(svc => {
                if (!serviceMap[svc]) {
                    serviceMap[svc] = { revenue: 0, clients: new Set() };
                }
                serviceMap[svc].revenue += revenuePerService;
                serviceMap[svc].clients.add(clientNorm);
            });
        });

        return Object.entries(serviceMap)
            .map(([name, data]) => ({
                service: name.length > 18 ? name.substring(0, 16) + '…' : name,
                fullName: name,
                aov: Math.round(data.revenue / data.clients.size),
                clientCount: data.clients.size,
                totalRevenue: Math.round(data.revenue),
            }))
            .sort((a, b) => b.aov - a.aov);
    }, [filteredData]);

    // Monthly trend data (dynamically includes all months that have data)
    const monthlyTrend = useMemo(() => {
        const MONTH_LABELS = {
            january: 'January', february: 'February', march: 'March',
            april: 'April', may: 'May', june: 'June', july: 'July',
            august: 'August', september: 'September', october: 'October',
            november: 'November', december: 'December',
        };

        // Collect all unique month keys present in data
        const monthKeysInData = [...new Set(rawData.map(r => r.monthKey))];
        // Sort by order
        monthKeysInData.sort((a, b) => (FULL_MONTH_ORDER[a] ?? 0) - (FULL_MONTH_ORDER[b] ?? 0));

        return monthKeysInData.map(key => {
            const monthRecords = rawData.filter(r => r.monthKey === key);
            const totalMRR = monthRecords.reduce((sum, r) => sum + r.totalMRR, 0);
            const serviceMRR = monthRecords.reduce((sum, r) => sum + r.serviceMRR, 0);
            const addonsMRR = monthRecords.reduce((sum, r) => sum + r.addonsMRR, 0);
            const clientCount = new Set(monthRecords.map(r => normalizeClientName(r.clientName))).size;

            return {
                month: MONTH_LABELS[key] || key,
                monthKey: key,
                totalMRR: Math.round(totalMRR),
                serviceMRR: Math.round(serviceMRR),
                addonsMRR: Math.round(addonsMRR),
                clientCount,
            };
        });
    }, [rawData]);

    // Service revenue mix
    const serviceRevenueMix = useMemo(() => {
        const serviceMap = {};

        filteredData.forEach(record => {
            const services = detectServices(record.services, record.addons);
            const revenuePerService = record.totalMRR / (services.length || 1);

            services.forEach(svc => {
                if (!serviceMap[svc]) {
                    serviceMap[svc] = { name: svc, revenue: 0, clientCount: 0, clients: new Set() };
                }
                serviceMap[svc].revenue += revenuePerService;
                serviceMap[svc].clients.add(normalizeClientName(record.clientName));
            });
        });

        const totalRevenue = Object.values(serviceMap).reduce((sum, s) => sum + s.revenue, 0);

        return Object.values(serviceMap)
            .map(s => ({
                name: s.name,
                revenue: Math.round(s.revenue),
                clientCount: s.clients.size,
                percentage: totalRevenue > 0 ? ((s.revenue / totalRevenue) * 100).toFixed(1) : 0,
            }))
            .sort((a, b) => b.revenue - a.revenue);
    }, [filteredData]);

    // Clients fully excluded from upsell analysis
    const UPSELL_EXCLUDED_CLIENTS = [
        'the computers india',
        'ntpc education and research society',
    ];

    // Per-client service restrictions: services that should NEVER appear as upsell
    // suggestions because the client is not interested in them.
    const UPSELL_BLOCKED_SERVICES = {
        // Shudanshu Rai is only interested in Solar and Hardware — block all digital marketing
        'shudanshu rai': ['SEO', 'PPC Ads', 'Social Media Management', 'Content Marketing', 'Email Marketing'],
    };

    // Upsell opportunities
    const upsellOpportunities = useMemo(() => {
        return allClients
            .filter(client => !UPSELL_EXCLUDED_CLIENTS.includes(client.clientName.toLowerCase().trim()))
            .map(client => {
                const normName = normalizeClientName(client.clientName);

                const isElearning = client.detectedServices.some(s =>
                    ['E-Learning', 'Course Creation'].includes(s)
                );
                const isDigital = client.detectedServices.some(s =>
                    ['Digital Marketing', 'Social Media', 'SEO', 'Paid Ads', 'Performance Marketing'].includes(s)
                );

                const allRelevant = isElearning ? ALL_ELEARNING_SERVICES :
                                    isDigital   ? ALL_DIGITAL_SERVICES :
                                                  ALL_DIGITAL_SERVICES;

                // Blocked services for this specific client (if any)
                const blocked = UPSELL_BLOCKED_SERVICES[normName] || [];

                const missing = allRelevant.filter(s => {
                    // Skip if blocked for this client
                    if (blocked.some(b => b.toLowerCase() === s.toLowerCase())) return false;
                    // Skip if already detected as an active service
                    return !client.detectedServices.some(ds =>
                        ds.toLowerCase().includes(s.toLowerCase()) ||
                        s.toLowerCase().includes(ds.toLowerCase())
                    );
                });

                const avgMonthlyRevenue = client.monthCount > 0 ? client.totalRevenue / client.monthCount : 0;
                const estimatedGain = missing.length * (avgMonthlyRevenue * 0.15);
                const probability = Math.min(85, 40 + (client.monthCount * 10) - (missing.length * 3));

                return {
                    clientName: client.clientName,
                    clientId: client.id,
                    currentServices: client.detectedServices,
                    missingServices: missing,
                    estimatedGain: Math.round(estimatedGain),
                    probability: Math.max(20, probability),
                    priority: missing.length >= 5 ? 'High' : missing.length >= 3 ? 'Medium' : 'Low',
                    businessType: isElearning ? 'eLearning' : 'Digital Marketing',
                };
            })
            .filter(o => o.missingServices.length > 0)
            .sort((a, b) => b.estimatedGain - a.estimatedGain);
    }, [allClients]);

    // Wallet intelligence
    const walletIntelligence = useMemo(() => {
        if (allClients.length === 0) return null;

        const sorted = [...allClients].sort((a, b) => b.totalRevenue - a.totalRevenue);
        const highestRevenue = sorted[0];
        const lowestRevenue = sorted[sorted.length - 1];

        // Growth calculation (latest vs previous month)
        const growthRanked = allClients
            .filter(c => c.monthCount >= 2)
            .map(c => {
                const months = Object.values(c.months).sort((a, b) => b.monthOrder - a.monthOrder);
                const growth = months[1].totalMRR > 0
                    ? ((months[0].totalMRR - months[1].totalMRR) / months[1].totalMRR) * 100
                    : 0;
                return { ...c, growth };
            })
            .sort((a, b) => b.growth - a.growth);

        const fastestGrowing = growthRanked[0] || null;
        const declining = growthRanked.filter(c => c.growth < -5);

        const totalWallet = allClients.reduce((sum, c) => sum + c.totalRevenue, 0);

        return {
            highestRevenue,
            lowestRevenue,
            fastestGrowing,
            declining,
            totalWallet,
            avgClientRevenue: totalWallet / allClients.length,
            clientsByRevenue: sorted,
        };
    }, [allClients]);

    // Contract data (auto-generated from CSV)
    const contracts = useMemo(() => {
        return allClients.map(client => {
            const months = Object.values(client.months).sort((a, b) => a.monthOrder - b.monthOrder);
            const firstMonth = months[0];
            const lastMonth = months[months.length - 1];

            // Estimate contract dates
            const startDate = firstMonth ? `01-${firstMonth.monthKey.charAt(0).toUpperCase() + firstMonth.monthKey.slice(1)}-2025` : 'N/A';
            const endMonthOrder = (lastMonth?.monthOrder || 0) + 3; // Assume 3-month contracts
            const ALL_MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            // Map order back to month name (order -3=Jan, -2=Feb ... 8=Dec)
            const endMonthIdx = Math.min(Math.max(endMonthOrder + 3, 0), 11);
            const endDate = `01-${ALL_MONTH_NAMES[endMonthIdx]}-2025`;

            const isExpiringSoon = endMonthOrder <= 4; // Expires within next month
            const monthsRemaining = endMonthOrder - 3; // 3 = July (current)

            return {
                clientName: client.clientName,
                clientId: client.id,
                clientType: client.clientType,
                startDate,
                endDate,
                mrr: client.totalRevenue / (client.monthCount || 1),
                totalRevenue: client.totalRevenue,
                status: monthsRemaining <= 0 ? 'Expiring' : 'Active',
                isExpiringSoon,
                monthsRemaining: Math.max(0, monthsRemaining),
                renewalStatus: monthsRemaining <= 0 ? 'Needs Renewal' : 'On Track',
                monthsActive: client.monthCount,
            };
        });
    }, [allClients]);

    // Handlers
    const handleRangeChange = useCallback((range) => {
        setSelectedRange(range);
    }, []);

    const handleCustomRange = useCallback((start, end) => {
        setCustomRange({ start, end });
        setSelectedRange('custom');
    }, []);

    // Get single client data by ID (normalized name)
    const getClientById = useCallback((clientId) => {
        return allClients.find(c => c.id === clientId) || null;
    }, [allClients]);

    // Get client by original name
    const getClientByName = useCallback((name) => {
        const normName = normalizeClientName(name);
        return allClients.find(c => c.id === normName) || null;
    }, [allClients]);

    // Add a new client record with upsert logic
    // If same client + month + services exists → UPDATE (replace), else → CREATE (append)
    const addRecord = useCallback((record) => {
        const normName = normalizeClientName(record.clientName);
        const existingIdx = manualRecords.findIndex(r =>
            normalizeClientName(r.clientName) === normName &&
            r.monthKey === record.monthKey &&
            r.services === record.services
        );

        if (existingIdx !== -1) {
            // Upsert: replace existing record
            manualRecords[existingIdx] = record;
            persistManualRecords();
            setRawData(prev => {
                // Find and replace in rawData too
                const updated = [...prev];
                const rawIdx = updated.findIndex(r =>
                    normalizeClientName(r.clientName) === normName &&
                    r.monthKey === record.monthKey &&
                    r.services === record.services
                );
                if (rawIdx !== -1) {
                    updated[rawIdx] = record;
                } else {
                    updated.push(record);
                }
                return updated;
            });
        } else {
            // Create: append new record
            manualRecords.push(record);
            persistManualRecords();
            setRawData(prev => [...prev, record]);
        }
    }, []);

    return {
        loading,
        error,
        rawData,
        filteredData,
        allClients,
        filteredClients,
        selectedRange,
        periodLabel,
        kpis,
        revenueChartData,
        aovChartData,
        serviceAOVData,
        monthlyTrend,
        serviceRevenueMix,
        upsellOpportunities,
        walletIntelligence,
        contracts,
        handleRangeChange,
        handleCustomRange,
        getClientById,
        getClientByName,
        addRecord,
    };
};

export default useCSVData;
