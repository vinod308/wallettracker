/**
 * Contracts Expiring Component
 * Shows contracts expiring within selected timeframe (30/60/90 days)
 * Data driven from CSV via props
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../utils/helpers';

const ContractsExpiring = ({ contracts = [], loading = false }) => {
    const [selectedDays, setSelectedDays] = useState(30);
    const navigate = useNavigate();

    const filteredContracts = useMemo(() => {
        return contracts
            .filter(c => c.daysUntilExpiry <= selectedDays)
            .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
    }, [contracts, selectedDays]);

    const getUrgencyColor = (daysUntilExpiry) => {
        if (daysUntilExpiry <= 0) return 'text-red-700 bg-red-100';
        if (daysUntilExpiry <= 30) return 'text-red-600 bg-red-50';
        if (daysUntilExpiry <= 60) return 'text-orange-600 bg-orange-50';
        return 'text-yellow-600 bg-yellow-50';
    };

    const getStatusBadge = (contract) => {
        if (contract.renewalStatus === 'Needs Renewal') {
            return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Needs Renewal</span>;
        }
        if (contract.status === 'Expiring') {
            return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">Expiring</span>;
        }
        return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Active</span>;
    };

    if (loading) {
        return (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card border border-gray-100/50 p-6">
                <div className="animate-pulse">
                    <div className="h-5 bg-gray-200 rounded w-48 mb-4"></div>
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-16 bg-gray-100 rounded-xl"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card border border-gray-100/50 p-6 hover:shadow-lg transition-shadow duration-300">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4">
                <h3 className="text-base font-semibold text-gray-900">
                    Contracts Expiring Soon
                </h3>
                <div className="flex gap-1.5">
                    {[30, 60, 90].map((days) => (
                        <button
                            key={days}
                            onClick={() => setSelectedDays(days)}
                            className={`px-3 py-1 text-xs font-medium rounded-lg transition-all duration-200 ${
                                selectedDays === days
                                    ? 'bg-primary-blue text-white shadow-sm'
                                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            {days}d
                        </button>
                    ))}
                </div>
            </div>

            {filteredContracts.length === 0 ? (
                <div className="text-center py-8">
                    <svg
                        className="w-12 h-12 mx-auto mb-2 text-gray-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    <p className="text-sm font-medium text-gray-500">All contracts on track</p>
                    <p className="text-xs text-gray-400 mt-1">No contracts expiring in {selectedDays} days</p>
                </div>
            ) : (
                <div className="space-y-2.5">
                    {filteredContracts.slice(0, 5).map((contract) => (
                        <div
                            key={contract.id}
                            className="flex justify-between items-center p-3 bg-gray-50/80 rounded-xl hover:bg-gray-100/80 transition-colors cursor-pointer"
                            onClick={() => navigate('/contracts')}
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <p className="text-sm font-medium text-gray-900">{contract.clientName}</p>
                                    {getStatusBadge(contract)}
                                </div>
                                <p className="text-xs text-gray-500">{contract.projectName}</p>
                            </div>
                            <div className="text-right ml-4">
                                <p className="text-sm font-semibold text-gray-900">
                                    {formatCurrency(contract.mrr)}/mo
                                </p>
                                <p
                                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${getUrgencyColor(
                                        contract.daysUntilExpiry
                                    )}`}
                                >
                                    {contract.daysUntilExpiry <= 0
                                        ? 'Expired'
                                        : `${contract.daysUntilExpiry} days left`}
                                </p>
                            </div>
                        </div>
                    ))}
                    {filteredContracts.length > 5 && (
                        <button
                            onClick={() => navigate('/contracts')}
                            className="w-full text-center text-sm text-primary-blue hover:text-[#4338ca] font-medium py-2 transition-colors"
                        >
                            View all {filteredContracts.length} contracts
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default ContractsExpiring;
