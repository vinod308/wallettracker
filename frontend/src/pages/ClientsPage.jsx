/**
 * Clients Page
 * Google-Sheets-driven client management with search, filter, sort, and detail navigation.
 * Data sourced from all monthly sheets (April – July 2025) via useCSVData hook.
 */

import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useCSVData from '../hooks/useCSVData';
import MainLayout from '../components/layout/MainLayout';
import ClientTable from '../components/clients/ClientTable';
import EditClientModal from '../components/clients/EditClientModal';
import { formatCurrency } from '../utils/helpers';

const ClientsPage = () => {
    const navigate = useNavigate();
    const { loading, allClients, upsellOpportunities, addRecord } = useCSVData();
    const [editingClient, setEditingClient]           = useState(null);
    const [showAtRiskTooltip, setShowAtRiskTooltip]   = useState(false);
    const [tooltipPos, setTooltipPos]                 = useState({ top: 0, right: 0 });
    const atRiskCardRef = useRef(null);

    const [searchQuery, setSearchQuery]   = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy]             = useState('revenue');
    const [sortOrder, setSortOrder]       = useState('desc');

    // ── Stats ───────────────────────────────────────────────────────────────
    const stats = useMemo(() => {
        const totalRevenue = allClients.reduce((sum, c) => sum + c.totalRevenue, 0);
        const activeCount  = allClients.filter(c => c.status === 'Active').length;
        const atRiskList   = allClients.filter(c => c.status === 'At Risk');
        const avgRevenue   = allClients.length > 0 ? totalRevenue / allClients.length : 0;

        // For tooltip: show latest-month MRR per at-risk client
        const atRiskClients = atRiskList.map(c => {
            const sortedMonths = Object.values(c.months).sort((a, b) => b.monthOrder - a.monthOrder);
            const latestMRR = sortedMonths.length > 0 ? sortedMonths[0].totalMRR : c.totalRevenue;
            return { clientName: c.clientName, revenue: Math.round(latestMRR) };
        });

        return {
            totalRevenue,
            activeCount,
            atRiskCount: atRiskList.length,
            atRiskClients,
            avgRevenue,
            total: allClients.length,
        };
    }, [allClients]);

    // ── Filter + Sort ───────────────────────────────────────────────────────
    const filteredClients = useMemo(() => {
        let list = [...allClients];

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(c =>
                c.clientName.toLowerCase().includes(q) ||
                (c.clientType || '').toLowerCase().includes(q) ||
                c.detectedServices.some(s => s.toLowerCase().includes(q))
            );
        }

        if (statusFilter !== 'all') {
            list = list.filter(c => c.status === statusFilter);
        }

        list.sort((a, b) => {
            let valA, valB;
            switch (sortBy) {
                case 'name':
                    valA = a.clientName.toLowerCase();
                    valB = b.clientName.toLowerCase();
                    return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
                case 'services':
                    valA = a.detectedServices.length;
                    valB = b.detectedServices.length;
                    break;
                case 'months':
                    valA = a.monthCount;
                    valB = b.monthCount;
                    break;
                default: // revenue
                    valA = a.totalRevenue;
                    valB = b.totalRevenue;
            }
            return sortOrder === 'asc' ? valA - valB : valB - valA;
        });

        return list;
    }, [allClients, searchQuery, statusFilter, sortBy, sortOrder]);

    const handleViewDetails = (client) => navigate(`/client/${client.id}`);

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('desc');
        }
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
                    <div className="h-4 bg-gray-100 rounded w-96 mb-8"></div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
                        {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl"></div>)}
                    </div>
                    <div className="h-12 bg-gray-100 rounded-2xl mb-4"></div>
                    <div className="h-96 bg-gray-100 rounded-2xl"></div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div>
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Client Management</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        {allClients.length} clients tracked from Google Sheets (April – July 2025)
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5 mb-6">
                    {/* Total Clients */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card border border-gray-100/50 p-5">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Total Clients</p>
                        <h3 className="text-xl sm:text-2xl font-medium text-gray-900">{stats.total}</h3>
                        <p className="text-xs text-gray-500 mt-1">{stats.activeCount} active</p>
                    </div>

                    {/* Total Revenue */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card border border-gray-100/50 p-5">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Total Revenue</p>
                        <h3 className="text-xl sm:text-2xl font-medium text-green-600">{formatCurrency(Math.round(stats.totalRevenue))}</h3>
                        <p className="text-xs text-gray-500 mt-1">Apr – Jul 2025</p>
                    </div>

                    {/* Avg Revenue per Client */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card border border-gray-100/50 p-5">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Avg Revenue/Client</p>
                        <h3 className="text-xl sm:text-2xl font-medium text-primary-blue">{formatCurrency(Math.round(stats.avgRevenue))}</h3>
                        <p className="text-xs text-gray-500 mt-1">Per client total</p>
                    </div>

                    {/* At Risk — with hover tooltip */}
                    <div
                        ref={atRiskCardRef}
                        className="relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-card border border-gray-100/50 p-5 cursor-default"
                        onMouseEnter={() => {
                            if (stats.atRiskCount > 0 && atRiskCardRef.current) {
                                const rect = atRiskCardRef.current.getBoundingClientRect();
                                setTooltipPos({
                                    top: rect.bottom + 10,
                                    right: window.innerWidth - rect.right,
                                });
                                setShowAtRiskTooltip(true);
                            }
                        }}
                        onMouseLeave={() => setShowAtRiskTooltip(false)}
                    >
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">At Risk Clients</p>
                        <h3 className="text-xl sm:text-2xl font-medium text-red-600">{stats.atRiskCount}</h3>
                        <p className="text-xs text-gray-500 mt-1">
                            {stats.atRiskCount > 0 ? 'Hover to view details' : 'No at-risk clients'}
                        </p>

                    </div>
                </div>

                {/* Filters Bar */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card border border-gray-100/50 p-4 mb-6">
                    <div className="flex flex-wrap items-center gap-4">
                        {/* Search */}
                        <div className="flex-1 min-w-[200px] relative">
                            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search clients, services..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="flex gap-2">
                            {['all', 'Active', 'At Risk'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                                        statusFilter === status
                                            ? 'bg-primary-blue text-white shadow-sm'
                                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                    {status === 'all' ? 'All' : status}
                                </button>
                            ))}
                        </div>

                        {/* Sort Dropdown */}
                        <select
                            value={sortBy}
                            onChange={(e) => handleSort(e.target.value)}
                            className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-blue"
                        >
                            <option value="revenue">Sort by Revenue</option>
                            <option value="name">Sort by Name</option>
                            <option value="services">Sort by Services</option>
                            <option value="months">Sort by Activity</option>
                        </select>
                        <button
                            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                            className="p-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                            title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                        >
                            <svg
                                className={`w-4 h-4 text-gray-600 transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Client Table */}
                <ClientTable
                    clients={filteredClients}
                    loading={loading}
                    onViewDetails={handleViewDetails}
                    onEdit={(client) => setEditingClient(client)}
                    upsellMap={upsellOpportunities}
                />
            </div>

            {/* Edit Client Modal */}
            <EditClientModal
                isOpen={!!editingClient}
                onClose={() => setEditingClient(null)}
                client={editingClient}
                onClientUpdated={(record) => {
                    addRecord(record);
                    setEditingClient(null);
                }}
            />

            {/* At Risk tooltip — fixed so it escapes all stacking contexts */}
            {showAtRiskTooltip && stats.atRiskClients.length > 0 && (
                <div
                    className="fixed z-[9999] w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 pointer-events-none"
                    style={{ top: tooltipPos.top, right: tooltipPos.right }}
                >
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                        At Risk Clients
                    </p>
                    <div className="space-y-2.5">
                        {stats.atRiskClients.map((c, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
                                    <span className="text-sm text-gray-700 truncate">{c.clientName}</span>
                                </div>
                                <span className="text-sm font-semibold text-red-600 ml-3 flex-shrink-0">
                                    {formatCurrency(c.revenue)}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-gray-100 flex justify-between items-center">
                        <span className="text-xs text-gray-400">Latest month MRR</span>
                        <span className="text-xs font-bold text-red-600">
                            {formatCurrency(stats.atRiskClients.reduce((s, c) => s + c.revenue, 0))}
                        </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1.5 text-center">
                        Revenue dropped ≥15% vs previous month
                    </p>
                </div>
            )}
        </MainLayout>
    );
};

export default ClientsPage;
