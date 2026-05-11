import { useState, useMemo, useCallback } from 'react';

const ALL_SERVICES = [
    'Social Media', 'Performance Marketing', 'SEO', 'Design', 'Web Development',
    'Analytics', 'Content Marketing', 'Paid Ads', 'Maintenance',
];

const detectServicesFromLines = (lines = []) => {
    const found = new Set();
    lines.forEach(line => {
        const desc = (line.description || '').toLowerCase();
        ALL_SERVICES.forEach(svc => {
            if (desc.includes(svc.toLowerCase())) found.add(svc);
        });
    });
    if (found.size === 0) {
        lines.forEach(l => { if (l.description?.trim()) found.add(l.description.trim()); });
    }
    return [...found];
};

const getMonthKey = (dateStr) => {
    if (!dateStr) return '';
    try {
        const d = new Date(String(dateStr).includes('T') ? dateStr : dateStr + 'T00:00:00');
        if (isNaN(d)) return '';
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    } catch { return ''; }
};

const getMonthLabel = (mk) => {
    if (!mk) return '';
    const [y, m] = mk.split('-');
    return new Date(parseInt(y), parseInt(m) - 1, 1)
        .toLocaleString('en-IN', { month: 'short', year: 'numeric' });
};

const getMonthOrder = (mk) => {
    if (!mk) return 0;
    const [y, m] = mk.split('-');
    return parseInt(y) * 100 + parseInt(m);
};

const readLS = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch { return fallback; }
};

const useClientData = () => {
    const [selectedRange, setSelectedRange] = useState('this_month');
    const [customRange,   setCustomRange]   = useState({ start: null, end: null });

    const clients  = useMemo(() => readLS('gw_onboarded_clients', []), []);
    const invoices = useMemo(() => readLS('gw_invoices', []), []);

    // Group invoices → clientId → monthKey
    const clientMonthsMap = useMemo(() => {
        const map = {};
        invoices.forEach(inv => {
            const cid = inv.clientId;
            if (!cid) return;
            const mk = getMonthKey(inv.invoiceDate || inv.createdAt);
            if (!mk) return;
            if (!map[cid]) map[cid] = {};
            if (!map[cid][mk]) {
                map[cid][mk] = {
                    monthKey: mk, month: getMonthLabel(mk),
                    monthOrder: getMonthOrder(mk),
                    records: [], serviceMRR: 0, addonsMRR: 0, totalMRR: 0,
                };
            }
            map[cid][mk].records.push(inv);
            map[cid][mk].serviceMRR += parseFloat(inv.subtotal) || 0;
            map[cid][mk].totalMRR   += parseFloat(inv.total)    || 0;
        });
        return map;
    }, [invoices]);

    // allClients — full analytics per onboarded client
    const allClients = useMemo(() => {
        const now          = new Date();
        const thisMk       = getMonthKey(now.toISOString());
        const prevMk       = getMonthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString());

        return clients.map(client => {
            const monthsMap     = clientMonthsMap[client.id] || {};
            const sortedMonths  = Object.values(monthsMap).sort((a, b) => b.monthOrder - a.monthOrder);
            const totalRevenue    = sortedMonths.reduce((s, m) => s + m.totalMRR,   0);
            const totalServiceMRR = sortedMonths.reduce((s, m) => s + m.serviceMRR, 0);
            const monthCount      = sortedMonths.length;

            const allLines         = invoices.filter(inv => inv.clientId === client.id).flatMap(inv => inv.lines || []);
            const detectedServices = detectServicesFromLines(allLines);

            let revenueChange = 0;
            if (sortedMonths.length >= 2) {
                const [latest, prev] = [sortedMonths[0].totalMRR, sortedMonths[1].totalMRR];
                revenueChange = prev > 0 ? ((latest - prev) / prev) * 100 : 0;
            }

            const hasRecent = monthsMap[thisMk] || monthsMap[prevMk];
            const status    = (monthCount > 0 && !hasRecent) || revenueChange < -20 ? 'At Risk' : 'Active';

            const clientInvs = invoices.filter(inv => inv.clientId === client.id);
            const latestInv  = [...clientInvs].sort((a, b) =>
                new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0];

            return {
                id:              client.id,
                clientName:      client.clientName,
                clientType:      client.clientType || 'Retainer',
                status,
                totalRevenue:    Math.round(totalRevenue),
                totalServiceMRR: Math.round(totalServiceMRR),
                totalAddonsMRR:  0,
                monthCount,
                months:          monthsMap,
                detectedServices,
                invoiceNumber:   latestInv?.invoiceNumber || '—',
                revenueChange:   Math.round(revenueChange * 10) / 10,
                addons:          '',
            };
        });
    }, [clients, clientMonthsMap, invoices]);

    // Date-range filter
    const getDateRangeFilter = useCallback(() => {
        const now = new Date();
        if (selectedRange === 'this_month') {
            const mk = getMonthKey(now.toISOString());
            return inv => getMonthKey(inv.invoiceDate || inv.createdAt) === mk;
        }
        if (selectedRange === 'last_month') {
            const mk = getMonthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString());
            return inv => getMonthKey(inv.invoiceDate || inv.createdAt) === mk;
        }
        if (selectedRange === 'ytd') {
            const yr = String(now.getFullYear());
            return inv => getMonthKey(inv.invoiceDate || inv.createdAt).startsWith(yr);
        }
        if (selectedRange === 'custom' && customRange.start && customRange.end) {
            return inv => {
                const mk = getMonthKey(inv.invoiceDate || inv.createdAt);
                return mk >= customRange.start && mk <= customRange.end;
            };
        }
        return () => true;
    }, [selectedRange, customRange]);

    const filteredData = useMemo(() => {
        const fn = getDateRangeFilter();
        return invoices.filter(fn);
    }, [invoices, getDateRangeFilter]);

    const filteredClients = useMemo(() => {
        const fn = getDateRangeFilter();
        const filteredInvs = invoices.filter(fn);

        return allClients.map(client => {
            const cf = filteredInvs.filter(inv => inv.clientId === client.id);
            const filteredRevenue    = cf.reduce((s, inv) => s + (parseFloat(inv.total)    || 0), 0);
            const filteredServiceMRR = cf.reduce((s, inv) => s + (parseFloat(inv.subtotal) || 0), 0);

            const filteredMonths = {};
            cf.forEach(inv => {
                const mk = getMonthKey(inv.invoiceDate || inv.createdAt);
                if (!mk) return;
                if (!filteredMonths[mk]) {
                    filteredMonths[mk] = {
                        monthKey: mk, monthOrder: getMonthOrder(mk),
                        records: [], totalMRR: 0, serviceMRR: 0,
                    };
                }
                filteredMonths[mk].records.push(inv);
                filteredMonths[mk].totalMRR   += parseFloat(inv.total)    || 0;
                filteredMonths[mk].serviceMRR += parseFloat(inv.subtotal) || 0;
            });

            return {
                ...client,
                filteredRevenue:    Math.round(filteredRevenue),
                filteredServiceMRR: Math.round(filteredServiceMRR),
                filteredAddonsMRR:  0,
                filteredMonths,
            };
        }).filter(c => Object.keys(c.filteredMonths).length > 0);
    }, [allClients, invoices, getDateRangeFilter]);

    const monthlyTrend = useMemo(() => {
        const map = {};
        invoices.forEach(inv => {
            const mk = getMonthKey(inv.invoiceDate || inv.createdAt);
            if (!mk) return;
            if (!map[mk]) {
                map[mk] = { month: getMonthLabel(mk), monthOrder: getMonthOrder(mk), totalMRR: 0, serviceMRR: 0, addonsMRR: 0, clients: new Set() };
            }
            map[mk].totalMRR   += parseFloat(inv.total)    || 0;
            map[mk].serviceMRR += parseFloat(inv.subtotal) || 0;
            map[mk].clients.add(inv.clientId);
        });
        return Object.values(map)
            .sort((a, b) => a.monthOrder - b.monthOrder)
            .map(m => ({ month: m.month, totalMRR: Math.round(m.totalMRR), serviceMRR: Math.round(m.serviceMRR), addonsMRR: 0, clientCount: m.clients.size }));
    }, [invoices]);

    const kpis = useMemo(() => {
        const fn      = getDateRangeFilter();
        const filtered = invoices.filter(fn);
        const totalMRR = filtered.reduce((s, inv) => s + (parseFloat(inv.total) || 0), 0);

        const now    = new Date();
        const prevMk = getMonthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString());
        const prevMRR = invoices
            .filter(inv => getMonthKey(inv.invoiceDate || inv.createdAt) === prevMk)
            .reduce((s, inv) => s + (parseFloat(inv.total) || 0), 0);
        const growth = prevMRR > 0 ? ((totalMRR - prevMRR) / prevMRR) * 100 : 0;
        const atRiskClients = allClients.filter(c => c.status === 'At Risk');

        return {
            totalMRR:      Math.round(totalMRR),
            clientCount:   clients.length,
            activeClients: allClients.filter(c => c.status === 'Active').length,
            atRiskCount:   atRiskClients.length,
            atRiskClients,
            growth:        Math.round(growth * 10) / 10,
            totalInvoices: invoices.length,
            avgMRR:        clients.length > 0 ? Math.round(totalMRR / clients.length) : 0,
        };
    }, [allClients, invoices, clients, getDateRangeFilter]);

    const serviceRevenueMix = useMemo(() => {
        const svcMap = {};
        invoices.forEach(inv => {
            (inv.lines || []).forEach(line => {
                const desc = line.description?.trim();
                if (!desc) return;
                let svcName = desc;
                ALL_SERVICES.forEach(svc => {
                    if (desc.toLowerCase().includes(svc.toLowerCase())) svcName = svc;
                });
                if (!svcMap[svcName]) svcMap[svcName] = { revenue: 0, clients: new Set() };
                svcMap[svcName].revenue += (parseFloat(line.rate) || 0) * (parseFloat(line.qty) || 1);
                svcMap[svcName].clients.add(inv.clientId);
            });
        });
        const total = Object.values(svcMap).reduce((s, x) => s + x.revenue, 0);
        return Object.entries(svcMap)
            .map(([name, d]) => ({
                name,
                revenue:     Math.round(d.revenue),
                clientCount: d.clients.size,
                percentage:  total > 0 ? ((d.revenue / total) * 100).toFixed(1) : '0',
            }))
            .sort((a, b) => b.revenue - a.revenue);
    }, [invoices]);

    const upsellOpportunities = useMemo(() => {
        return allClients
            .filter(c => c.totalRevenue > 0)
            .map(client => {
                const cur     = client.detectedServices;
                const missing = ALL_SERVICES.filter(s => !cur.some(cs => cs.toLowerCase().includes(s.toLowerCase())));
                const avgSvc  = client.totalRevenue / Math.max(cur.length, 1);
                return {
                    clientId:        client.id,
                    clientName:      client.clientName,
                    businessType:    client.clientType || 'Retainer',
                    currentServices: cur,
                    missingServices: missing,
                    estimatedGain:   Math.round(missing.length * avgSvc * 0.3),
                    probability:     Math.max(20, 80 - missing.length * 5),
                    priority:        missing.length >= 5 ? 'High' : missing.length >= 3 ? 'Medium' : 'Low',
                };
            })
            .filter(o => o.missingServices.length > 0)
            .sort((a, b) => b.estimatedGain - a.estimatedGain);
    }, [allClients]);

    const contracts = useMemo(() => {
        return allClients.map(client => {
            const ci = invoices.filter(inv => inv.clientId === client.id);
            if (!ci.length) return null;
            const sorted    = [...ci].sort((a, b) => new Date(a.invoiceDate || a.createdAt) - new Date(b.invoiceDate || b.createdAt));
            const startDate = (sorted[0].invoiceDate || sorted[0].createdAt || '').split('T')[0];
            const endD      = new Date(startDate);
            endD.setMonth(endD.getMonth() + 12);
            const endDate   = endD.toISOString().split('T')[0];
            const now       = new Date();
            const moRemain  = Math.round((endD - now) / (1000 * 60 * 60 * 24 * 30));
            const mrr       = client.monthCount > 0 ? client.totalRevenue / client.monthCount : 0;
            return {
                clientId:        client.id,
                clientName:      client.clientName,
                clientType:      client.clientType || 'Retainer',
                mrr:             Math.round(mrr),
                startDate,
                endDate,
                monthsRemaining: Math.max(0, moRemain),
                monthsActive:    client.monthCount,
                totalRevenue:    client.totalRevenue,
                status:          moRemain <= 0 ? 'Expired' : moRemain <= 2 ? 'Expiring' : 'Active',
                renewalStatus:   moRemain <= 1 ? 'Needs Renewal' : 'On Track',
                isExpiringSoon:  moRemain <= 2,
            };
        }).filter(Boolean);
    }, [allClients, invoices]);

    const walletIntelligence = useMemo(() => {
        const withRev = allClients.filter(c => c.totalRevenue > 0);
        return {
            fastestGrowing: [...withRev].sort((a, b) => b.revenueChange - a.revenueChange)[0] || null,
            declining:      withRev.filter(c => c.revenueChange < -10),
        };
    }, [allClients]);

    const revenueChartData = useMemo(() => {
        const fn = getDateRangeFilter();
        return allClients
            .map(c => ({
                name:    c.clientName,
                revenue: invoices.filter(fn).filter(inv => inv.clientId === c.id)
                    .reduce((s, inv) => s + (parseFloat(inv.total) || 0), 0),
            }))
            .filter(c => c.revenue > 0)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);
    }, [allClients, invoices, getDateRangeFilter]);

    const serviceAOVData = useMemo(() =>
        serviceRevenueMix.slice(0, 8).map(s => ({
            name:        s.name,
            aov:         s.clientCount > 0 ? Math.round(s.revenue / s.clientCount) : 0,
            clientCount: s.clientCount,
        })),
    [serviceRevenueMix]);

    const periodLabel = useMemo(() => {
        const labels = { this_month: 'This Month', last_month: 'Last Month', ytd: 'Year to Date', all_time: 'All Time' };
        return labels[selectedRange] || 'Custom Range';
    }, [selectedRange]);

    const handleRangeChange = useCallback(range => setSelectedRange(range), []);
    const handleCustomRange = useCallback((start, end) => {
        setCustomRange({ start, end });
        setSelectedRange('custom');
    }, []);

    const getClientById = useCallback(id => allClients.find(c => c.id === id) || null, [allClients]);
    const addRecord     = useCallback(() => {}, []);

    return {
        loading: false, error: null, rawData: invoices,
        selectedRange, periodLabel,
        kpis, allClients, filteredClients, filteredData,
        revenueChartData, serviceAOVData, monthlyTrend,
        serviceRevenueMix, upsellOpportunities, contracts, walletIntelligence,
        handleRangeChange, handleCustomRange, getClientById, addRecord,
    };
};

export default useClientData;
