/**
 * Contracts & Renewals Page
 * CSV-driven contract management with auto-generated contracts,
 * renewal status tracking, and revenue at risk analysis
 */

import React, { useState, useMemo } from 'react';
import useClientData from '../hooks/useClientData';
import MainLayout from '../components/layout/MainLayout';
import { formatCurrency } from '../utils/helpers';

const ContractsPage = () => {
    const { loading, error, contracts, allClients } = useClientData();
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [renewalStatuses, setRenewalStatuses] = useState({});

    // Stats computed from contracts
    const stats = useMemo(() => {
        if (!contracts.length) return null;
        const active = contracts.filter(c => c.status === 'Active').length;
        const expiring = contracts.filter(c => c.status === 'Expiring' || c.monthsRemaining <= 1).length;
        const totalMRR = contracts.reduce((sum, c) => sum + c.mrr, 0);
        const atRiskMRR = contracts.filter(c => c.isExpiringSoon).reduce((sum, c) => sum + c.mrr, 0);
        return { active, expiring, totalMRR, atRiskMRR, total: contracts.length };
    }, [contracts]);

    // Filter contracts
    const filteredContracts = useMemo(() => {
        let list = [...contracts];
        if (selectedFilter === 'expiring') {
            list = list.filter(c => c.isExpiringSoon || c.status === 'Expiring');
        } else if (selectedFilter === 'active') {
            list = list.filter(c => c.status === 'Active' && !c.isExpiringSoon);
        } else if (selectedFilter === 'needs_renewal') {
            list = list.filter(c => c.renewalStatus === 'Needs Renewal');
        }
        return list.sort((a, b) => a.monthsRemaining - b.monthsRemaining);
    }, [contracts, selectedFilter]);

    const handleStatusChange = (clientId, newStatus) => {
        setRenewalStatuses(prev => ({ ...prev, [clientId]: newStatus }));
    };

    const getRenewalStatus = (contract) => {
        return renewalStatuses[contract.clientId] || contract.renewalStatus;
    };

    const getUrgencyColor = (contract) => {
        if (contract.monthsRemaining <= 0) return 'border-l-red-500 bg-red-50/50';
        if (contract.monthsRemaining <= 1) return 'border-l-orange-500 bg-orange-50/50';
        if (contract.monthsRemaining <= 2) return 'border-l-yellow-500 bg-yellow-50/50';
        return 'border-l-green-500 bg-white/80';
    };

    const getStatusBadge = (status) => {
        const styles = {
            'Not Started': 'bg-gray-100 text-gray-700',
            'Client Contacted': 'bg-indigo-100 text-indigo-700',
            'Proposal Sent': 'bg-purple-100 text-purple-700',
            'Negotiating': 'bg-yellow-100 text-yellow-700',
            'Awaiting Signature': 'bg-orange-100 text-orange-700',
            'Renewed': 'bg-green-100 text-green-700',
            'Lost': 'bg-red-100 text-red-700',
            'Needs Renewal': 'bg-red-100 text-red-700',
            'On Track': 'bg-green-100 text-green-700',
        };
        return (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
                {status}
            </span>
        );
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
                    <div className="h-4 bg-gray-100 rounded w-96 mb-8"></div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
                        {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-gray-100 rounded-2xl"></div>)}
                    </div>
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
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Contracts & Renewals</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Tracked from invoice history — {contracts.length} contracts
                    </p>
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 border border-red-100 rounded-xl p-4">
                        <p className="text-sm font-medium text-red-800">{error}</p>
                    </div>
                )}

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5 mb-8">
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card border border-gray-100/50 p-5">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Total Contracts</p>
                            <h3 className="text-xl sm:text-2xl font-medium text-gray-900">{stats.total}</h3>
                            <p className="text-xs text-gray-500 mt-1">{stats.active} active</p>
                        </div>
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card border border-gray-100/50 p-5">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Expiring Soon</p>
                            <h3 className="text-xl sm:text-2xl font-medium text-orange-600">{stats.expiring}</h3>
                            <p className="text-xs text-gray-500 mt-1">Need attention</p>
                        </div>
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card border border-gray-100/50 p-5">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Total MRR</p>
                            <h3 className="text-xl sm:text-2xl font-medium text-green-600">{formatCurrency(Math.round(stats.totalMRR))}</h3>
                            <p className="text-xs text-gray-500 mt-1">Monthly recurring</p>
                        </div>
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card border border-gray-100/50 p-5">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Revenue at Risk</p>
                            <h3 className="text-xl sm:text-2xl font-medium text-red-600">{formatCurrency(Math.round(stats.atRiskMRR))}</h3>
                            <p className="text-xs text-gray-500 mt-1">Expiring contracts</p>
                        </div>
                    </div>
                )}

                {/* Filter Tabs */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card border border-gray-100/50 p-4 mb-6">
                    <div className="flex flex-wrap gap-2">
                        {[
                            { value: 'all', label: 'All Contracts' },
                            { value: 'expiring', label: 'Expiring Soon' },
                            { value: 'active', label: 'Active' },
                            { value: 'needs_renewal', label: 'Needs Renewal' },
                        ].map(filter => (
                            <button
                                key={filter.value}
                                onClick={() => setSelectedFilter(filter.value)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                                    selectedFilter === filter.value
                                        ? 'bg-primary-blue text-white shadow-sm'
                                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                }`}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Contracts List */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card border border-gray-100/50 overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-base font-semibold text-gray-900">
                            {selectedFilter === 'all' ? 'All Contracts' :
                             selectedFilter === 'expiring' ? 'Expiring Contracts' :
                             selectedFilter === 'active' ? 'Active Contracts' :
                             'Contracts Needing Renewal'}
                            <span className="ml-2 text-sm font-normal text-gray-500">({filteredContracts.length})</span>
                        </h2>
                    </div>

                    {filteredContracts.length === 0 ? (
                        <div className="p-12 text-center">
                            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm font-medium text-gray-500">No contracts match this filter</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {filteredContracts.map((contract) => (
                                <div
                                    key={contract.clientId}
                                    className={`p-5 border-l-4 ${getUrgencyColor(contract)} transition-colors hover:bg-gray-50/50`}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-900">{contract.clientName}</h3>
                                            <p className="text-xs text-gray-500">{contract.clientType || 'Retainer'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-base font-bold text-gray-900">{formatCurrency(Math.round(contract.mrr))}/mo</p>
                                            <p className="text-xs text-gray-500">MRR</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-3">
                                        <div>
                                            <p className="text-xs text-gray-500">Start Date</p>
                                            <p className="text-sm font-medium text-gray-900">{contract.startDate}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">End Date</p>
                                            <p className="text-sm font-medium text-gray-900">{contract.endDate}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Months Remaining</p>
                                            <p className={`text-sm font-bold ${
                                                contract.monthsRemaining <= 0 ? 'text-red-600' :
                                                contract.monthsRemaining <= 1 ? 'text-orange-600' : 'text-gray-900'
                                            }`}>
                                                {contract.monthsRemaining <= 0 ? 'Expired' : `${contract.monthsRemaining} months`}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Months Active</p>
                                            <p className="text-sm font-medium text-gray-900">{contract.monthsActive}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Total Revenue</p>
                                            <p className="text-sm font-semibold text-green-600">{formatCurrency(Math.round(contract.totalRevenue))}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-gray-500">Renewal Status:</span>
                                            <select
                                                value={getRenewalStatus(contract)}
                                                onChange={(e) => handleStatusChange(contract.clientId, e.target.value)}
                                                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                                            >
                                                <option value="Not Started">Not Started</option>
                                                <option value="Client Contacted">Client Contacted</option>
                                                <option value="Proposal Sent">Proposal Sent</option>
                                                <option value="Negotiating">Negotiating</option>
                                                <option value="Awaiting Signature">Awaiting Signature</option>
                                                <option value="Renewed">Renewed</option>
                                                <option value="Lost">Lost</option>
                                            </select>
                                            {getStatusBadge(contract.status)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
};

export default ContractsPage;
