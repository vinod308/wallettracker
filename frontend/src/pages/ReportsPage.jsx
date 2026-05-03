/**
 * Reports & Scheduling Page
 * Google-Sheets-driven report generation with PDF, Excel, CSV export.
 * Report types: Monthly Revenue, Client Expansion, Service Performance,
 *               Risk & Churn, At Risk Revenue, Addon Revenue.
 * Scheduling: localStorage-backed schedule manager (Daily/Weekly/Monthly).
 */

import React, { useState, useMemo } from 'react';
import useCSVData from '../hooks/useCSVData';
import MainLayout from '../components/layout/MainLayout';
import { formatCurrency } from '../utils/helpers';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { generateLogicDocument } from '../utils/generateLogicDoc';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Compute the next run date string (YYYY-MM-DD) for a schedule. */
const computeNextRun = (frequency, dayOfWeek, dayOfMonth) => {
    const now = new Date();
    if (frequency === 'Daily') {
        const next = new Date(now);
        next.setDate(next.getDate() + 1);
        return next.toISOString().split('T')[0];
    }
    if (frequency === 'Weekly') {
        const target = parseInt(dayOfWeek, 10);
        const next   = new Date(now);
        const diff   = (target - next.getDay() + 7) % 7 || 7;
        next.setDate(next.getDate() + diff);
        return next.toISOString().split('T')[0];
    }
    if (frequency === 'Monthly') {
        const dom  = parseInt(dayOfMonth, 10);
        const next = new Date(now.getFullYear(), now.getMonth(), dom);
        if (next <= now) next.setMonth(next.getMonth() + 1);
        return next.toISOString().split('T')[0];
    }
    return '';
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ── Component ─────────────────────────────────────────────────────────────────
const ReportsPage = () => {
    const {
        loading, allClients, rawData, kpis,
        serviceRevenueMix, upsellOpportunities, contracts,
        monthlyTrend, walletIntelligence,
    } = useCSVData();

    // ── Report state ──────────────────────────────────────────────────────────
    const [selectedReportType, setSelectedReportType] = useState('');
    const [generatedReport,    setGeneratedReport]    = useState(null);
    const [generating,         setGenerating]         = useState(false);
    const [generatingDoc,      setGeneratingDoc]      = useState(false);

    // ── Schedule state ────────────────────────────────────────────────────────
    const [schedules, setSchedules] = useState(() => {
        try {
            const stored = localStorage.getItem('wallettracker_schedules');
            return stored ? JSON.parse(stored) : [];
        } catch { return []; }
    });
    const [showScheduleForm, setShowScheduleForm] = useState(false);
    const [scheduleForm, setScheduleForm] = useState({
        reportType:  '',
        frequency:   'Monthly',
        time:        '08:00',
        dayOfWeek:   '1',
        dayOfMonth:  '1',
    });

    const saveSchedules = (updated) => {
        setSchedules(updated);
        try { localStorage.setItem('wallettracker_schedules', JSON.stringify(updated)); } catch { /* ignore */ }
    };

    const handleAddSchedule = () => {
        if (!scheduleForm.reportType) return;
        const next = computeNextRun(scheduleForm.frequency, scheduleForm.dayOfWeek, scheduleForm.dayOfMonth);
        const entry = {
            id:          Date.now(),
            reportType:  scheduleForm.reportType,
            frequency:   scheduleForm.frequency,
            time:        scheduleForm.time,
            dayOfWeek:   scheduleForm.dayOfWeek,
            dayOfMonth:  scheduleForm.dayOfMonth,
            nextRun:     next,
            status:      'Active',
            createdAt:   new Date().toISOString().split('T')[0],
        };
        saveSchedules([...schedules, entry]);
        setShowScheduleForm(false);
        setScheduleForm({ reportType: '', frequency: 'Monthly', time: '08:00', dayOfWeek: '1', dayOfMonth: '1' });
    };

    const handleToggleSchedule = (id) => {
        saveSchedules(schedules.map(s =>
            s.id === id ? { ...s, status: s.status === 'Active' ? 'Paused' : 'Active' } : s
        ));
    };

    const handleDeleteSchedule = (id) => {
        saveSchedules(schedules.filter(s => s.id !== id));
    };

    // ── Report type definitions ───────────────────────────────────────────────
    const reportTypes = [
        {
            value:       'Monthly Revenue',
            label:       'Monthly Revenue Report',
            description: 'Revenue breakdown by month and client with trends',
            color:       'text-primary-blue',
            accent:      'border-blue-200 bg-blue-50/30',
            icon: (
                <svg className="w-7 h-7 text-primary-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
        },
        {
            value:       'Client Expansion',
            label:       'Client Expansion Report',
            description: 'Upsell opportunities, missing services, growth potential',
            color:       'text-green-600',
            accent:      'border-green-200 bg-green-50/30',
            icon: (
                <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
            ),
        },
        {
            value:       'Service Performance',
            label:       'Service Performance Report',
            description: 'Service revenue, adoption rates, client distribution',
            color:       'text-purple-600',
            accent:      'border-purple-200 bg-purple-50/30',
            icon: (
                <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            ),
        },
        {
            value:       'Risk & Churn',
            label:       'Risk & Churn Report',
            description: 'At-risk clients, revenue exposure, churn indicators',
            color:       'text-red-600',
            accent:      'border-red-200 bg-red-50/30',
            icon: (
                <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
            ),
        },
        {
            value:       'At Risk Revenue',
            label:       'At Risk Revenue Report',
            description: 'Revenue at risk per client with risk scores and factors',
            color:       'text-orange-600',
            accent:      'border-orange-200 bg-orange-50/30',
            icon: (
                <svg className="w-7 h-7 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            ),
        },
        {
            value:       'Addon Revenue',
            label:       'Add-on Revenue Report',
            description: 'Add-on MRR breakdown, top adopters, adoption rates',
            color:       'text-indigo-600',
            accent:      'border-indigo-200 bg-indigo-50/30',
            icon: (
                <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
            ),
        },
    ];

    // ── Generate functions ────────────────────────────────────────────────────

    const generateMonthlyRevenueReport = () => {
        const sorted   = [...allClients].sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 10);
        const total    = allClients.reduce((s, c) => s + c.totalRevenue, 0);
        const svcTotal = allClients.reduce((s, c) => s + c.totalServiceMRR, 0);
        const addTotal = allClients.reduce((s, c) => s + c.totalAddonsMRR, 0);
        return {
            reportType:  'Monthly Revenue',
            generatedAt: new Date().toISOString(),
            summary: {
                totalRevenue:         total,
                totalServiceMRR:      svcTotal,
                totalAddonsMRR:       addTotal,
                clientCount:          allClients.length,
                avgRevenuePerClient:  total / (allClients.length || 1),
            },
            monthlyTrend,
            topClients: sorted.map(c => ({
                clientName:   c.clientName,
                clientType:   c.clientType || 'Retainer',
                totalRevenue: c.totalRevenue,
                serviceMRR:   c.totalServiceMRR,
                addonsMRR:    c.totalAddonsMRR,
                monthsActive: c.monthCount,
                avgMonthly:   c.totalRevenue / (c.monthCount || 1),
            })),
        };
    };

    const generateClientExpansionReport = () => {
        const clients = upsellOpportunities.map(o => ({
            clientName:            o.clientName,
            currentServices:       o.currentServices.join(', '),
            missingServices:       o.missingServices.join(', '),
            currentServiceCount:   o.currentServices.length,
            missingServiceCount:   o.missingServices.length,
            estimatedGain:         o.estimatedGain,
            probability:           o.probability,
            priority:              o.priority,
        }));
        const totalPotential = clients.reduce((s, c) => s + c.estimatedGain, 0);
        return {
            reportType:  'Client Expansion',
            generatedAt: new Date().toISOString(),
            summary: {
                totalClients:               allClients.length,
                clientsWithOpportunities:   clients.length,
                totalExpansionPotential:    totalPotential,
                avgExpansionPerClient:      totalPotential / (clients.length || 1),
                highPriority:               clients.filter(c => c.priority === 'High').length,
            },
            clients,
        };
    };

    const generateServicePerformanceReport = () => {
        const total    = serviceRevenueMix.reduce((s, x) => s + x.revenue, 0);
        const services = serviceRevenueMix.map(s => ({
            serviceName:          s.name,
            revenue:              s.revenue,
            clientCount:          s.clientCount,
            percentage:           parseFloat(s.percentage),
            avgRevenuePerClient:  s.clientCount > 0 ? s.revenue / s.clientCount : 0,
        }));
        return {
            reportType:  'Service Performance',
            generatedAt: new Date().toISOString(),
            summary: {
                totalRevenue:         total,
                totalServices:        services.length,
                avgRevenuePerService: total / (services.length || 1),
                topService:           services[0]?.serviceName || 'N/A',
            },
            services,
        };
    };

    const generateRiskChurnReport = () => {
        const clients = allClients
            .filter(c => c.status === 'At Risk' || c.monthCount <= 1)
            .map(c => {
                const months  = Object.values(c.months).sort((a, b) => b.monthOrder - a.monthOrder);
                const change  = months.length >= 2 && months[1].totalMRR > 0
                    ? ((months[0].totalMRR - months[1].totalMRR) / months[1].totalMRR) * 100
                    : 0;
                const factors = [];
                if (c.monthCount <= 1)       factors.push('Single month only');
                if (change < -10)            factors.push('Revenue declining');
                if (c.detectedServices.length <= 2) factors.push('Low service adoption');
                if (c.totalAddonsMRR === 0)  factors.push('No add-ons');
                return {
                    clientName:    c.clientName,
                    totalRevenue:  c.totalRevenue,
                    monthsActive:  c.monthCount,
                    revenueChange: Math.round(change * 10) / 10,
                    serviceCount:  c.detectedServices.length,
                    riskScore:     Math.min(95, factors.length * 25),
                    riskFactors:   factors.join('; '),
                    status:        c.status,
                };
            })
            .sort((a, b) => b.riskScore - a.riskScore);

        const atRiskRevenue       = clients.reduce((s, c) => s + c.totalRevenue, 0);
        const expiringContracts   = contracts.filter(c => c.isExpiringSoon || c.monthsRemaining <= 1);
        return {
            reportType:  'Risk & Churn',
            generatedAt: new Date().toISOString(),
            summary: {
                atRiskClients:      clients.length,
                atRiskRevenue,
                expiringContracts:  expiringContracts.length,
                avgRiskScore:       clients.length > 0
                    ? Math.round(clients.reduce((s, c) => s + c.riskScore, 0) / clients.length)
                    : 0,
            },
            clients,
        };
    };

    const generateAtRiskRevenueReport = () => {
        const atRiskList = allClients.filter(c => c.status === 'At Risk');
        const totalAtRisk = atRiskList.reduce((s, c) => s + c.totalRevenue, 0);
        const totalAll    = allClients.reduce((s, c) => s + c.totalRevenue, 0);

        const clients = atRiskList.map(c => {
            const months = Object.values(c.months).sort((a, b) => b.monthOrder - a.monthOrder);
            const latestMRR   = months[0]?.totalMRR  || 0;
            const previousMRR = months[1]?.totalMRR  || 0;
            const trend       = previousMRR > 0
                ? Math.round(((latestMRR - previousMRR) / previousMRR) * 1000) / 10
                : 0;
            return {
                clientName:   c.clientName,
                clientType:   c.clientType || 'Retainer',
                totalRevenue: c.totalRevenue,
                latestMRR,
                previousMRR,
                revenueTrend: trend,
                monthsActive: c.monthCount,
                services:     c.detectedServices.join(', '),
                addonsMRR:    c.totalAddonsMRR,
                exposurePct:  totalAll > 0 ? Math.round((c.totalRevenue / totalAll) * 1000) / 10 : 0,
            };
        }).sort((a, b) => b.totalRevenue - a.totalRevenue);

        return {
            reportType:  'At Risk Revenue',
            generatedAt: new Date().toISOString(),
            summary: {
                atRiskClients:    clients.length,
                atRiskRevenue:    totalAtRisk,
                totalRevenue:     totalAll,
                revenueExposure:  totalAll > 0 ? Math.round((totalAtRisk / totalAll) * 1000) / 10 : 0,
                avgAtRiskRevenue: totalAtRisk / (clients.length || 1),
            },
            clients,
        };
    };

    const generateAddonRevenueReport = () => {
        const withAddons    = allClients.filter(c => c.totalAddonsMRR > 0);
        const totalAddons   = allClients.reduce((s, c) => s + c.totalAddonsMRR,  0);
        const totalRevenue  = allClients.reduce((s, c) => s + c.totalRevenue, 0);
        const adoptionRate  = allClients.length > 0
            ? Math.round((withAddons.length / allClients.length) * 1000) / 10
            : 0;

        const clients = withAddons
            .sort((a, b) => b.totalAddonsMRR - a.totalAddonsMRR)
            .map(c => ({
                clientName:     c.clientName,
                clientType:     c.clientType || 'Retainer',
                addonsMRR:      c.totalAddonsMRR,
                serviceMRR:     c.totalServiceMRR,
                totalRevenue:   c.totalRevenue,
                addonShare:     c.totalRevenue > 0
                    ? Math.round((c.totalAddonsMRR / c.totalRevenue) * 1000) / 10
                    : 0,
                addons:         c.addons || '',
                monthsActive:   c.monthCount,
            }));

        return {
            reportType:  'Addon Revenue',
            generatedAt: new Date().toISOString(),
            summary: {
                totalAddonRevenue:   totalAddons,
                clientsWithAddons:   withAddons.length,
                adoptionRate,
                addonShareOfTotal:   totalRevenue > 0 ? Math.round((totalAddons / totalRevenue) * 1000) / 10 : 0,
                avgAddonPerClient:   totalAddons / (withAddons.length || 1),
            },
            clients,
        };
    };

    // ── Dispatch generate ─────────────────────────────────────────────────────
    const generateReport = () => {
        if (!selectedReportType) return;
        setGenerating(true);
        setTimeout(() => {
            const map = {
                'Monthly Revenue':   generateMonthlyRevenueReport,
                'Client Expansion':  generateClientExpansionReport,
                'Service Performance': generateServicePerformanceReport,
                'Risk & Churn':      generateRiskChurnReport,
                'At Risk Revenue':   generateAtRiskRevenueReport,
                'Addon Revenue':     generateAddonRevenueReport,
            };
            setGeneratedReport((map[selectedReportType] || (() => null))());
            setGenerating(false);
        }, 600);
    };

    // ── PDF export ────────────────────────────────────────────────────────────
    const exportPDF = () => {
        if (!generatedReport) return;
        const doc       = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const r         = generatedReport;

        doc.setFillColor(31, 71, 136);
        doc.rect(0, 0, pageWidth, 35, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.text('Garage WalletTracker', 14, 15);
        doc.setFontSize(12);
        doc.text(r.reportType + ' Report', 14, 25);
        doc.setFontSize(9);
        doc.text('Generated: ' + new Date(r.generatedAt).toLocaleString() + ' | Source: Google Sheets', 14, 32);
        doc.setTextColor(0, 0, 0);
        let y = 45;

        doc.setFontSize(14);
        doc.text('Summary', 14, y); y += 8;
        doc.setFontSize(10);
        Object.entries(r.summary).forEach(([k, v]) => {
            const label = k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
            const val   = typeof v === 'number' && v > 1000 ? formatCurrency(Math.round(v)) : String(v);
            doc.text(`${label}: ${val}`, 14, y); y += 6;
        });
        y += 8;

        const headStyle = { fillColor: [31, 71, 136] };
        const tblStyle  = { fontSize: 8, cellPadding: 3 };

        if (r.reportType === 'Monthly Revenue') {
            doc.setFontSize(14); doc.text('Top Clients', 14, y); y += 4;
            doc.autoTable({ startY: y, styles: tblStyle, headStyles: headStyle,
                head: [['Client', 'Type', 'Total Rev', 'Svc MRR', 'Add-ons', 'Months', 'Avg/mo']],
                body: r.topClients.map(c => [c.clientName, c.clientType, formatCurrency(Math.round(c.totalRevenue)), formatCurrency(Math.round(c.serviceMRR)), formatCurrency(Math.round(c.addonsMRR)), c.monthsActive, formatCurrency(Math.round(c.avgMonthly))]),
            });
            if (r.monthlyTrend) {
                y = doc.lastAutoTable.finalY + 10;
                doc.setFontSize(14); doc.text('Monthly Trend', 14, y); y += 4;
                doc.autoTable({ startY: y, styles: tblStyle, headStyles: headStyle,
                    head: [['Month', 'Total MRR', 'Service MRR', 'Add-ons MRR', 'Clients']],
                    body: r.monthlyTrend.map(m => [m.month, formatCurrency(m.totalMRR), formatCurrency(m.serviceMRR), formatCurrency(m.addonsMRR), m.clientCount]),
                });
            }
        }
        if (r.reportType === 'Client Expansion' && r.clients) {
            doc.setFontSize(14); doc.text('Expansion Opportunities', 14, y); y += 4;
            doc.autoTable({ startY: y, styles: tblStyle, headStyles: { fillColor: [40, 167, 69] },
                head: [['Client', 'Current', 'Missing', 'Potential', 'Prob.', 'Priority']],
                body: r.clients.map(c => [c.clientName, c.currentServiceCount, c.missingServiceCount, formatCurrency(c.estimatedGain), c.probability + '%', c.priority]),
            });
        }
        if (r.reportType === 'Service Performance' && r.services) {
            doc.setFontSize(14); doc.text('Service Breakdown', 14, y); y += 4;
            doc.autoTable({ startY: y, styles: tblStyle, headStyles: { fillColor: [111, 66, 193] },
                head: [['Service', 'Revenue', 'Clients', 'Share %', 'Avg/Client']],
                body: r.services.map(s => [s.serviceName, formatCurrency(Math.round(s.revenue)), s.clientCount, s.percentage.toFixed(1) + '%', formatCurrency(Math.round(s.avgRevenuePerClient))]),
            });
        }
        if ((r.reportType === 'Risk & Churn') && r.clients) {
            doc.setFontSize(14); doc.text('At-Risk Clients', 14, y); y += 4;
            doc.autoTable({ startY: y, styles: { fontSize: 7, cellPadding: 3 }, headStyles: { fillColor: [220, 53, 69] },
                head: [['Client', 'Revenue', 'Months', 'Rev Δ', 'Risk Score', 'Factors']],
                body: r.clients.map(c => [c.clientName, formatCurrency(Math.round(c.totalRevenue)), c.monthsActive, c.revenueChange + '%', c.riskScore + '/100', c.riskFactors]),
                columnStyles: { 5: { cellWidth: 45 } },
            });
        }
        if (r.reportType === 'At Risk Revenue' && r.clients) {
            doc.setFontSize(14); doc.text('At Risk Revenue Exposure', 14, y); y += 4;
            doc.autoTable({ startY: y, styles: tblStyle, headStyles: { fillColor: [253, 126, 20] },
                head: [['Client', 'Total Rev', 'Latest MRR', 'Trend', 'Exposure %', 'Months']],
                body: r.clients.map(c => [c.clientName, formatCurrency(Math.round(c.totalRevenue)), formatCurrency(Math.round(c.latestMRR)), (c.revenueTrend > 0 ? '+' : '') + c.revenueTrend + '%', c.exposurePct + '%', c.monthsActive]),
            });
        }
        if (r.reportType === 'Addon Revenue' && r.clients) {
            doc.setFontSize(14); doc.text('Add-on Revenue Breakdown', 14, y); y += 4;
            doc.autoTable({ startY: y, styles: tblStyle, headStyles: { fillColor: [79, 70, 229] },
                head: [['Client', 'Add-ons MRR', 'Service MRR', 'Addon Share %', 'Months']],
                body: r.clients.map(c => [c.clientName, formatCurrency(Math.round(c.addonsMRR)), formatCurrency(Math.round(c.serviceMRR)), c.addonShare + '%', c.monthsActive]),
            });
        }

        const pages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pages; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(180, 180, 180);
            doc.text(`Page ${i} of ${pages} | Garage WalletTracker | Confidential`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
        }
        doc.save(`${r.reportType.replace(/\s+/g, '_')}_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    // ── Excel export ──────────────────────────────────────────────────────────
    const exportExcel = () => {
        if (!generatedReport) return;
        const r  = generatedReport;
        const wb = XLSX.utils.book_new();

        const summaryWs = XLSX.utils.json_to_sheet(Object.entries(r.summary).map(([k, v]) => ({
            Metric: k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()),
            Value:  typeof v === 'number' && v > 1000 ? Math.round(v) : v,
        })));
        XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

        if (r.reportType === 'Monthly Revenue') {
            if (r.topClients) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(r.topClients.map(c => ({ 'Client': c.clientName, 'Type': c.clientType, 'Total Revenue': Math.round(c.totalRevenue), 'Service MRR': Math.round(c.serviceMRR), 'Add-ons MRR': Math.round(c.addonsMRR), 'Months': c.monthsActive, 'Avg/Month': Math.round(c.avgMonthly) }))), 'Top Clients');
            if (r.monthlyTrend) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(r.monthlyTrend.map(m => ({ 'Month': m.month, 'Total MRR': m.totalMRR, 'Service MRR': m.serviceMRR, 'Add-ons MRR': m.addonsMRR, 'Clients': m.clientCount }))), 'Monthly Trend');
        }
        if (r.reportType === 'Client Expansion' && r.clients)
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(r.clients.map(c => ({ 'Client': c.clientName, 'Current Services': c.currentServices, 'Count': c.currentServiceCount, 'Missing': c.missingServices, 'Missing Count': c.missingServiceCount, 'Est. Gain': c.estimatedGain, 'Probability %': c.probability, 'Priority': c.priority }))), 'Expansion');
        if (r.reportType === 'Service Performance' && r.services)
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(r.services.map(s => ({ 'Service': s.serviceName, 'Revenue': Math.round(s.revenue), 'Clients': s.clientCount, 'Share %': s.percentage, 'Avg/Client': Math.round(s.avgRevenuePerClient) }))), 'Services');
        if ((r.reportType === 'Risk & Churn') && r.clients)
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(r.clients.map(c => ({ 'Client': c.clientName, 'Revenue': Math.round(c.totalRevenue), 'Months': c.monthsActive, 'Rev Change %': c.revenueChange, 'Risk Score': c.riskScore, 'Risk Factors': c.riskFactors, 'Status': c.status }))), 'At-Risk');
        if (r.reportType === 'At Risk Revenue' && r.clients)
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(r.clients.map(c => ({ 'Client': c.clientName, 'Type': c.clientType, 'Total Revenue': Math.round(c.totalRevenue), 'Latest MRR': Math.round(c.latestMRR), 'Previous MRR': Math.round(c.previousMRR), 'Trend %': c.revenueTrend, 'Exposure %': c.exposurePct, 'Months': c.monthsActive }))), 'At Risk Revenue');
        if (r.reportType === 'Addon Revenue' && r.clients)
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(r.clients.map(c => ({ 'Client': c.clientName, 'Type': c.clientType, 'Add-ons MRR': Math.round(c.addonsMRR), 'Service MRR': Math.round(c.serviceMRR), 'Total Revenue': Math.round(c.totalRevenue), 'Addon Share %': c.addonShare, 'Months': c.monthsActive }))), 'Addon Revenue');

        const buf  = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        saveAs(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${r.reportType.replace(/\s+/g, '_')}_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    // ── CSV export ────────────────────────────────────────────────────────────
    const exportCSV = () => {
        if (!generatedReport) return;
        const r = generatedReport;
        let rows = [];
        if (r.reportType === 'Monthly Revenue' && r.topClients)       rows = r.topClients;
        else if (r.reportType === 'Client Expansion' && r.clients)    rows = r.clients;
        else if (r.reportType === 'Service Performance' && r.services) rows = r.services;
        else if ((r.reportType === 'Risk & Churn' || r.reportType === 'At Risk Revenue' || r.reportType === 'Addon Revenue') && r.clients) rows = r.clients;
        if (!rows.length) return;
        const headers = Object.keys(rows[0]).join(',');
        const data    = rows.map(row => Object.values(row).map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
        saveAs(new Blob([[headers, ...data].join('\n')], { type: 'text/csv;charset=utf-8;' }), `${r.reportType.replace(/\s+/g, '_')}_Report_${new Date().toISOString().split('T')[0]}.csv`);
    };

    // ── Report preview ────────────────────────────────────────────────────────
    const renderPreview = () => {
        if (!generatedReport) return null;
        const r = generatedReport;

        return (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card border border-gray-100/50 p-6 mt-6 animate-fadeIn">
                {/* Preview header + export buttons */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">{r.reportType} Report</h2>
                        <p className="text-xs text-gray-400 mt-0.5">
                            Generated {new Date(r.generatedAt).toLocaleString()} · Source: Google Sheets (Apr – Jul 2025) · {allClients.length} clients
                        </p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {[
                            { label: 'PDF',   fn: exportPDF,   cls: 'bg-primary-blue hover:bg-[#4338ca]' },
                            { label: 'Excel', fn: exportExcel, cls: 'bg-green-600 hover:bg-green-700' },
                            { label: 'CSV',   fn: exportCSV,   cls: 'bg-gray-600 hover:bg-gray-700' },
                        ].map(btn => (
                            <button key={btn.label} onClick={btn.fn}
                                className={`px-4 py-2 ${btn.cls} text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5`}>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                {btn.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {Object.entries(r.summary).map(([k, v]) => (
                        <div key={k} className="bg-gray-50/80 rounded-xl p-4 hover:bg-gray-100/60 transition-colors duration-150">
                            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
                                {k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                            </p>
                            <p className="text-xl font-bold text-gray-900">
                                {typeof v === 'number' && v > 100 ? formatCurrency(Math.round(v)) : v}
                            </p>
                        </div>
                    ))}
                </div>

                {/* ── Monthly Revenue data ─────────────────────────────────── */}
                {r.reportType === 'Monthly Revenue' && (
                    <div className="space-y-6">
                        {r.monthlyTrend && (
                            <div>
                                <h3 className="text-sm font-semibold text-gray-800 mb-3">Monthly Trend</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {r.monthlyTrend.map((m, i) => (
                                        <div key={i} className="bg-indigo-50/60 rounded-xl p-3 text-center hover:bg-indigo-100/60 transition-colors">
                                            <p className="text-xs text-gray-400 mb-1">{m.month}</p>
                                            <p className="text-lg font-bold text-gray-900">{formatCurrency(m.totalMRR)}</p>
                                            <p className="text-xs text-gray-400">{m.clientCount} clients</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-800 mb-3">Top Clients by Revenue</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-100">
                                            {['#', 'Client', 'Type', 'Total Revenue', 'Service MRR', 'Add-ons', 'Months'].map(h => (
                                                <th key={h} className={`py-2 px-3 text-xs font-medium text-gray-400 ${h === '#' || h === 'Months' ? 'text-center' : h === 'Client' || h === 'Type' ? 'text-left' : 'text-right'}`}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {r.topClients.map((c, i) => (
                                            <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="py-2.5 px-3 text-xs text-gray-300 text-center">{i + 1}</td>
                                                <td className="py-2.5 px-3 font-semibold text-gray-900">{c.clientName}</td>
                                                <td className="py-2.5 px-3 text-gray-500">{c.clientType}</td>
                                                <td className="py-2.5 px-3 text-right font-bold text-gray-900">{formatCurrency(Math.round(c.totalRevenue))}</td>
                                                <td className="py-2.5 px-3 text-right text-gray-600">{formatCurrency(Math.round(c.serviceMRR))}</td>
                                                <td className="py-2.5 px-3 text-right text-indigo-600">{formatCurrency(Math.round(c.addonsMRR))}</td>
                                                <td className="py-2.5 px-3 text-center text-gray-400">{c.monthsActive}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Client Expansion data ────────────────────────────────── */}
                {r.reportType === 'Client Expansion' && r.clients && (
                    <div>
                        <h3 className="text-sm font-semibold text-gray-800 mb-3">Expansion Opportunities</h3>
                        <div className="space-y-2.5">
                            {r.clients.map((c, i) => (
                                <div key={i} className="flex justify-between items-start p-3.5 bg-gray-50/80 rounded-xl hover:bg-green-50/40 transition-colors duration-150">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="text-sm font-semibold text-gray-900">{c.clientName}</p>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.priority === 'High' ? 'bg-red-100 text-red-700' : c.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{c.priority}</span>
                                        </div>
                                        <p className="text-xs text-gray-400 mb-1.5">{c.currentServiceCount} active · {c.missingServiceCount} upsell opportunities</p>
                                        <div className="flex flex-wrap gap-1">
                                            {c.missingServices.split(', ').slice(0, 4).map((s, idx) => (
                                                <span key={idx} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs rounded-md">{s}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="text-right ml-4 flex-shrink-0">
                                        <p className="text-sm font-bold text-green-600">{formatCurrency(c.estimatedGain)}</p>
                                        <p className="text-xs text-gray-400">{c.probability}% likely</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Service Performance data ─────────────────────────────── */}
                {r.reportType === 'Service Performance' && r.services && (
                    <div>
                        <h3 className="text-sm font-semibold text-gray-800 mb-3">Service Breakdown</h3>
                        <div className="space-y-2.5">
                            {r.services.map((s, i) => (
                                <div key={i} className="p-3 bg-gray-50/80 rounded-xl hover:bg-gray-100/60 transition-colors">
                                    <div className="flex justify-between items-center mb-1.5">
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-medium text-gray-900">{s.serviceName}</span>
                                            <span className="text-xs text-gray-400">{s.clientCount} clients</span>
                                        </div>
                                        <span className="text-sm font-bold text-primary-blue">{formatCurrency(Math.round(s.revenue))}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                                            <div className="bg-primary-blue h-1.5 rounded-full transition-all duration-500" style={{ width: `${s.percentage}%` }} />
                                        </div>
                                        <span className="text-xs font-medium text-gray-500 w-12 text-right">{s.percentage.toFixed(1)}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Risk & Churn data ────────────────────────────────────── */}
                {r.reportType === 'Risk & Churn' && r.clients && (
                    <div>
                        <h3 className="text-sm font-semibold text-gray-800 mb-3">At-Risk Clients</h3>
                        {r.clients.length === 0 ? (
                            <div className="text-center py-10">
                                <svg className="w-12 h-12 mx-auto mb-2 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-sm font-medium text-gray-500">All clients are healthy</p>
                            </div>
                        ) : (
                            <div className="space-y-2.5">
                                {r.clients.map((c, i) => (
                                    <div key={i} className="p-3.5 bg-red-50/60 rounded-xl hover:bg-red-50 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <p className="text-sm font-semibold text-gray-900">{c.clientName}</p>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.riskScore >= 75 ? 'bg-red-100 text-red-700' : c.riskScore >= 50 ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                        Risk: {c.riskScore}/100
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500">{c.riskFactors}</p>
                                            </div>
                                            <div className="text-right ml-4">
                                                <p className="text-sm font-bold text-red-600">{formatCurrency(Math.round(c.totalRevenue))}</p>
                                                <p className="text-xs text-gray-400">{c.revenueChange > 0 ? '+' : ''}{c.revenueChange}%</p>
                                            </div>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                                            <div className={`h-1.5 rounded-full ${c.riskScore >= 75 ? 'bg-red-500' : c.riskScore >= 50 ? 'bg-orange-500' : 'bg-yellow-500'}`} style={{ width: `${c.riskScore}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── At Risk Revenue data ─────────────────────────────────── */}
                {r.reportType === 'At Risk Revenue' && r.clients && (
                    <div>
                        <h3 className="text-sm font-semibold text-gray-800 mb-3">Revenue Exposure by Client</h3>
                        {r.clients.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-8">No at-risk clients identified</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-100">
                                            {['Client', 'Type', 'Total Revenue', 'Latest MRR', 'Prev MRR', 'Trend', 'Exposure', 'Months'].map(h => (
                                                <th key={h} className={`py-2 px-3 text-xs font-medium text-gray-400 ${h === 'Client' || h === 'Type' ? 'text-left' : 'text-right'}`}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {r.clients.map((c, i) => (
                                            <tr key={i} className="hover:bg-orange-50/30 transition-colors">
                                                <td className="py-2.5 px-3 font-semibold text-gray-900">{c.clientName}</td>
                                                <td className="py-2.5 px-3 text-gray-500">{c.clientType}</td>
                                                <td className="py-2.5 px-3 text-right font-bold text-orange-600">{formatCurrency(Math.round(c.totalRevenue))}</td>
                                                <td className="py-2.5 px-3 text-right text-gray-700">{formatCurrency(Math.round(c.latestMRR))}</td>
                                                <td className="py-2.5 px-3 text-right text-gray-400">{formatCurrency(Math.round(c.previousMRR))}</td>
                                                <td className="py-2.5 px-3 text-right">
                                                    <span className={`font-semibold ${c.revenueTrend < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                        {c.revenueTrend > 0 ? '+' : ''}{c.revenueTrend}%
                                                    </span>
                                                </td>
                                                <td className="py-2.5 px-3 text-right text-orange-600 font-medium">{c.exposurePct}%</td>
                                                <td className="py-2.5 px-3 text-right text-gray-400">{c.monthsActive}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Addon Revenue data ───────────────────────────────────── */}
                {r.reportType === 'Addon Revenue' && r.clients && (
                    <div>
                        <h3 className="text-sm font-semibold text-gray-800 mb-3">Add-on Revenue by Client</h3>
                        {r.clients.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-8">No add-on revenue recorded</p>
                        ) : (
                            <div className="space-y-2.5">
                                {r.clients.map((c, i) => (
                                    <div key={i} className="p-3 bg-indigo-50/40 rounded-xl hover:bg-indigo-100/40 transition-colors">
                                        <div className="flex justify-between items-center mb-1.5">
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900">{c.clientName}</p>
                                                <p className="text-xs text-gray-400">{c.monthsActive} months · {c.clientType}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-indigo-600">{formatCurrency(Math.round(c.addonsMRR))}</p>
                                                <p className="text-xs text-gray-400">{c.addonShare}% of revenue</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                                                <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${Math.min(c.addonShare, 100)}%` }} />
                                            </div>
                                            <span className="text-xs text-gray-400 w-12 text-right">Add-on</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    // ── Loading skeleton ──────────────────────────────────────────────────────
    if (loading) {
        return (
            <MainLayout>
                <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-gray-200 rounded w-64 mb-2" />
                    <div className="h-4 bg-gray-100 rounded w-96 mb-8" />
                    <div className="h-64 bg-gray-100 rounded-2xl" />
                    <div className="h-96 bg-gray-100 rounded-2xl" />
                </div>
            </MainLayout>
        );
    }

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <MainLayout>
            <div>
                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Reports & Scheduling</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Generate, export, and schedule reports from Google Sheets data — PDF, Excel, CSV
                    </p>
                </div>

                {/* ── Report Type Selection ────────────────────────────────── */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card border border-gray-100/50 p-6 mb-6">
                    <h2 className="text-base font-semibold text-gray-900 mb-4">Select Report Type</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {reportTypes.map(type => (
                            <button
                                key={type.value}
                                onClick={() => { setSelectedReportType(type.value); setGeneratedReport(null); }}
                                className={`p-4 border-2 rounded-2xl text-left transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
                                    selectedReportType === type.value
                                        ? `${type.accent} shadow-sm`
                                        : 'border-gray-100 bg-white/50 hover:border-gray-200'
                                }`}
                            >
                                <div className="mb-2">{type.icon}</div>
                                <p className="text-sm font-semibold text-gray-900 mb-0.5">{type.label}</p>
                                <p className="text-xs text-gray-400">{type.description}</p>
                            </button>
                        ))}
                    </div>

                    <div className="mt-6 flex items-center gap-4">
                        <button
                            onClick={generateReport}
                            disabled={generating || !selectedReportType}
                            className="px-6 py-2.5 bg-primary-blue text-white rounded-xl text-sm font-medium hover:bg-[#4338ca] hover:shadow-[0_4px_12px_rgba(79,70,229,0.3)] disabled:bg-gray-200 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
                        >
                            {generating ? (
                                <>
                                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Generating…
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Generate Report
                                </>
                            )}
                        </button>
                        {selectedReportType && (
                            <p className="text-sm text-gray-400">
                                Source: Google Sheets (April – July 2025) · {allClients.length} clients
                            </p>
                        )}
                    </div>
                </div>

                {/* ── Quick Data Export ────────────────────────────────────── */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card border border-gray-100/50 p-6 mb-6">
                    <h2 className="text-base font-semibold text-gray-900 mb-1">Quick Data Export</h2>
                    <p className="text-xs text-gray-400 mb-4">Export raw data directly from Google Sheets — no report generation required</p>
                    <div className="flex flex-wrap gap-3">
                        {/* All Clients Excel */}
                        <button
                            onClick={() => {
                                const data = allClients.map(c => ({ 'Client Name': c.clientName, 'Type': c.clientType || 'Retainer', 'Total Revenue': Math.round(c.totalRevenue), 'Service MRR': Math.round(c.totalServiceMRR), 'Add-ons MRR': Math.round(c.totalAddonsMRR), 'Services': c.detectedServices.join(', '), 'Months Active': c.monthCount, 'Status': c.status }));
                                const wb = XLSX.utils.book_new();
                                XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), 'All Clients');
                                saveAs(new Blob([XLSX.write(wb, { bookType: 'xlsx', type: 'array' })], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `All_Clients_${new Date().toISOString().split('T')[0]}.xlsx`);
                            }}
                            className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            All Clients (Excel)
                        </button>
                        {/* All Clients CSV */}
                        <button
                            onClick={() => {
                                const h = 'Client Name,Type,Total Revenue,Service MRR,Add-ons MRR,Services,Months,Status\n';
                                const r = allClients.map(c => `"${c.clientName}","${c.clientType || 'Retainer'}",${Math.round(c.totalRevenue)},${Math.round(c.totalServiceMRR)},${Math.round(c.totalAddonsMRR)},"${c.detectedServices.join(', ')}",${c.monthCount},"${c.status}"`).join('\n');
                                saveAs(new Blob([h + r], { type: 'text/csv;charset=utf-8;' }), `All_Clients_${new Date().toISOString().split('T')[0]}.csv`);
                            }}
                            className="px-4 py-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            All Clients (CSV)
                        </button>
                        {/* Monthly Trend CSV */}
                        <button
                            onClick={() => {
                                const h = 'Month,Total MRR,Service MRR,Add-ons MRR,Client Count\n';
                                const r = monthlyTrend.map(m => `"${m.month}",${m.totalMRR},${m.serviceMRR},${m.addonsMRR},${m.clientCount}`).join('\n');
                                saveAs(new Blob([h + r], { type: 'text/csv;charset=utf-8;' }), `Monthly_Trend_${new Date().toISOString().split('T')[0]}.csv`);
                            }}
                            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            Monthly Trend (CSV)
                        </button>
                    </div>
                </div>

                {/* ── System Logic Documentation ───────────────────────────── */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100/50 p-6 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div>
                            <h2 className="text-base font-semibold text-gray-900 mb-1">System Logic Documentation</h2>
                            <p className="text-xs text-gray-500 mb-1">Complete functional logic documentation — formulas, decision rules, calculations, edge cases.</p>
                            <p className="text-xs text-gray-400">12 sections: Invoice Summary, Active/At Risk logic, Contract Estimation, Upsell Calculations, Churn Risk Scoring, Revenue Forecast, and more.</p>
                        </div>
                        <button
                            onClick={async () => {
                                setGeneratingDoc(true);
                                try { await generateLogicDocument(); } catch (e) { console.error(e); } finally { setGeneratingDoc(false); }
                            }}
                            disabled={generatingDoc}
                            className="self-start px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 whitespace-nowrap"
                        >
                            {generatingDoc ? (
                                <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Generating…</>
                            ) : (
                                <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>Download Logic Docs (.docx)</>
                            )}
                        </button>
                    </div>
                </div>

                {/* ── Report Preview ───────────────────────────────────────── */}
                {renderPreview()}

                {/* ── Scheduling Section ───────────────────────────────────── */}
                <div className="mt-8">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Report Scheduling</h2>
                            <p className="text-sm text-gray-400 mt-0.5">Automate report delivery on a recurring schedule</p>
                        </div>
                        <button
                            onClick={() => setShowScheduleForm(v => !v)}
                            className="px-4 py-2 bg-primary-blue text-white rounded-xl text-sm font-medium hover:bg-[#4338ca] hover:shadow-[0_4px_12px_rgba(79,70,229,0.3)] transition-all duration-200 flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            {showScheduleForm ? 'Cancel' : 'New Schedule'}
                        </button>
                    </div>

                    {/* Schedule creation form */}
                    {showScheduleForm && (
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card border border-gray-100/50 p-6 mb-6">
                            <h3 className="text-base font-semibold text-gray-900 mb-4">Configure Schedule</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {/* Report type */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Report Type</label>
                                    <select
                                        value={scheduleForm.reportType}
                                        onChange={e => setScheduleForm(f => ({ ...f, reportType: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-blue/20 focus:border-primary-blue transition-colors"
                                    >
                                        <option value="">Select report type…</option>
                                        {reportTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                </div>

                                {/* Frequency */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Frequency</label>
                                    <select
                                        value={scheduleForm.frequency}
                                        onChange={e => setScheduleForm(f => ({ ...f, frequency: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-blue/20 focus:border-primary-blue transition-colors"
                                    >
                                        <option value="Daily">Daily</option>
                                        <option value="Weekly">Weekly</option>
                                        <option value="Monthly">Monthly</option>
                                    </select>
                                </div>

                                {/* Time */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Time</label>
                                    <input
                                        type="time"
                                        value={scheduleForm.time}
                                        onChange={e => setScheduleForm(f => ({ ...f, time: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-blue/20 focus:border-primary-blue transition-colors"
                                    />
                                </div>

                                {/* Day of week (weekly only) */}
                                {scheduleForm.frequency === 'Weekly' && (
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1.5">Day of Week</label>
                                        <select
                                            value={scheduleForm.dayOfWeek}
                                            onChange={e => setScheduleForm(f => ({ ...f, dayOfWeek: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-blue/20 focus:border-primary-blue transition-colors"
                                        >
                                            {DAY_NAMES.map((d, i) => <option key={i} value={i}>{d}</option>)}
                                        </select>
                                    </div>
                                )}

                                {/* Day of month (monthly only) */}
                                {scheduleForm.frequency === 'Monthly' && (
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1.5">Day of Month</label>
                                        <select
                                            value={scheduleForm.dayOfMonth}
                                            onChange={e => setScheduleForm(f => ({ ...f, dayOfMonth: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-blue/20 focus:border-primary-blue transition-colors"
                                        >
                                            {Array.from({ length: 28 }, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}{d === 1 ? 'st' : d === 2 ? 'nd' : d === 3 ? 'rd' : 'th'}</option>)}
                                        </select>
                                    </div>
                                )}
                            </div>

                            {/* Example preview */}
                            {scheduleForm.reportType && (
                                <div className="mt-4 p-3 bg-indigo-50/60 rounded-xl">
                                    <p className="text-xs text-indigo-700 font-medium">
                                        {scheduleForm.reportType} Report ·{' '}
                                        {scheduleForm.frequency === 'Daily'   && `Every day at ${scheduleForm.time}`}
                                        {scheduleForm.frequency === 'Weekly'  && `Every ${DAY_NAMES[parseInt(scheduleForm.dayOfWeek)]} at ${scheduleForm.time}`}
                                        {scheduleForm.frequency === 'Monthly' && `${scheduleForm.frequency} on the ${scheduleForm.dayOfMonth}${['','st','nd','rd'][scheduleForm.dayOfMonth] || 'th'} at ${scheduleForm.time}`}
                                    </p>
                                    <p className="text-xs text-indigo-500 mt-0.5">
                                        Next run: {computeNextRun(scheduleForm.frequency, scheduleForm.dayOfWeek, scheduleForm.dayOfMonth)}
                                    </p>
                                </div>
                            )}

                            <div className="mt-5 flex gap-3">
                                <button
                                    onClick={handleAddSchedule}
                                    disabled={!scheduleForm.reportType}
                                    className="px-5 py-2 bg-primary-blue text-white rounded-xl text-sm font-medium hover:bg-[#4338ca] disabled:bg-gray-200 disabled:cursor-not-allowed transition-all duration-200"
                                >
                                    Save Schedule
                                </button>
                                <button
                                    onClick={() => setShowScheduleForm(false)}
                                    className="px-5 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Scheduled reports table */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card border border-gray-100/50 overflow-hidden">
                        {schedules.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <p className="text-sm font-medium text-gray-500">No scheduled reports yet</p>
                                <p className="text-xs text-gray-400 mt-1">Click "New Schedule" to set up automatic report delivery</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-100 bg-gray-50/60">
                                            {['Report Name', 'Frequency', 'Time', 'Next Run', 'Status', 'Actions'].map(h => (
                                                <th key={h} className={`px-5 py-3.5 text-xs font-medium text-gray-400 uppercase tracking-wider ${h === 'Actions' || h === 'Status' ? 'text-center' : 'text-left'}`}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {schedules.map(s => (
                                            <tr key={s.id} className="hover:bg-gray-50/60 transition-colors duration-150">
                                                <td className="px-5 py-4">
                                                    <p className="text-sm font-semibold text-gray-900">{s.reportType} Report</p>
                                                    <p className="text-xs text-gray-400 mt-0.5">
                                                        {s.frequency === 'Weekly'  && `Every ${DAY_NAMES[parseInt(s.dayOfWeek)]}`}
                                                        {s.frequency === 'Monthly' && `Monthly on ${s.dayOfMonth}${['','st','nd','rd'][s.dayOfMonth] || 'th'}`}
                                                        {s.frequency === 'Daily'   && 'Every day'}
                                                    </p>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                        s.frequency === 'Daily'   ? 'bg-blue-50 text-blue-700' :
                                                        s.frequency === 'Weekly'  ? 'bg-purple-50 text-purple-700' :
                                                        'bg-green-50 text-green-700'
                                                    }`}>{s.frequency}</span>
                                                </td>
                                                <td className="px-5 py-4 text-sm text-gray-600">{s.time}</td>
                                                <td className="px-5 py-4 text-sm text-gray-600">{s.nextRun}</td>
                                                <td className="px-5 py-4 text-center">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                        s.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                                    }`}>{s.status}</span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => handleToggleSchedule(s.id)}
                                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                                                s.status === 'Active'
                                                                    ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                                                                    : 'bg-green-50 text-green-700 hover:bg-green-100'
                                                            }`}
                                                        >
                                                            {s.status === 'Active' ? 'Pause' : 'Resume'}
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteSchedule(s.id)}
                                                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default ReportsPage;
