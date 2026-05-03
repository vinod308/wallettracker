/**
 * Client Revenue Table Component
 * Displays client invoice data with Active/Inactive counts
 * Columns: Client Name, Invoice No., Type, Service MRR, Addons MRR, Total MRR, Payment Status
 * Dynamically updates based on selected date range from useInvoiceData hook
 */

import React, { useState, useMemo } from 'react';
import { formatCurrency } from '../../utils/helpers';

const ClientRevenueTable = ({ clients = [], loading = false, periodLabel = '', onClientClick }) => {
    const [sortColumn, setSortColumn] = useState('totalMRR');
    const [sortOrder, setSortOrder] = useState('DESC');
    const [statusFilter, setStatusFilter] = useState('all');

    // Count active vs inactive
    const statusCounts = useMemo(() => {
        const active = clients.filter(c => c.status === 'Active').length;
        const inactive = clients.filter(c => c.status === 'Inactive').length;
        return { active, inactive, total: clients.length };
    }, [clients]);

    // Filter and sort clients
    const displayData = useMemo(() => {
        let filtered = clients;

        if (statusFilter !== 'all') {
            filtered = clients.filter(c => c.status === statusFilter);
        }

        return [...filtered].sort((a, b) => {
            const aVal = a[sortColumn] || 0;
            const bVal = b[sortColumn] || 0;
            return sortOrder === 'DESC' ? bVal - aVal : aVal - bVal;
        });
    }, [clients, statusFilter, sortColumn, sortOrder]);

    const handleSort = (column) => {
        const newOrder = sortColumn === column && sortOrder === 'DESC' ? 'ASC' : 'DESC';
        setSortColumn(column);
        setSortOrder(newOrder);
    };

    const getPaymentBadge = (status) => {
        const styles = {
            Paid: 'bg-green-50 text-green-700 border border-green-200',
            Unpaid: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
            Overdue: 'bg-red-50 text-red-700 border border-red-200',
            Partial: 'bg-blue-50 text-blue-700 border border-blue-200',
            'No Invoice': 'bg-gray-50 text-gray-500 border border-gray-200',
        };
        return (
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles[status] || styles['No Invoice']}`}>
                {status}
            </span>
        );
    };

    const getTypeBadge = (type) => {
        const styles = {
            Retainer: 'bg-indigo-50 text-indigo-700',
            Contractor: 'bg-orange-50 text-orange-700',
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[type] || 'bg-gray-50 text-gray-500'}`}>
                {type || '-'}
            </span>
        );
    };

    const getSortIcon = (column) => {
        if (sortColumn !== column) return '↕';
        return sortOrder === 'DESC' ? '↓' : '↑';
    };

    if (loading) {
        return (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card border border-gray-100/50 p-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="h-12 bg-gray-100 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card border border-gray-100/50 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-100">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">Client Invoice Overview</h2>
                        {periodLabel && (
                            <p className="text-xs text-gray-500 mt-1">{periodLabel}</p>
                        )}
                    </div>

                    {/* Status Filter with Counts */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setStatusFilter('all')}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200 ${
                                statusFilter === 'all'
                                    ? 'bg-primary-blue text-white'
                                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            All ({statusCounts.total})
                        </button>
                        <button
                            onClick={() => setStatusFilter('Active')}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200 ${
                                statusFilter === 'Active'
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            Active ({statusCounts.active})
                        </button>
                        <button
                            onClick={() => setStatusFilter('Inactive')}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200 ${
                                statusFilter === 'Inactive'
                                    ? 'bg-gray-600 text-white'
                                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            Inactive ({statusCounts.inactive})
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Client Name
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Invoice No.
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Type
                            </th>
                            <th
                                className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                onClick={() => handleSort('serviceMRR')}
                            >
                                Service MRR {getSortIcon('serviceMRR')}
                            </th>
                            <th
                                className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                onClick={() => handleSort('addonsMRR')}
                            >
                                Addons MRR {getSortIcon('addonsMRR')}
                            </th>
                            <th
                                className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                onClick={() => handleSort('totalMRR')}
                            >
                                Total MRR {getSortIcon('totalMRR')}
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Payment
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {displayData.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center">
                                    <div className="flex flex-col items-center justify-center text-gray-500">
                                        <svg
                                            className="w-16 h-16 mb-4 text-gray-300"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                            />
                                        </svg>
                                        <p className="text-lg font-medium">No clients found</p>
                                        <p className="text-sm">Try adjusting your filters</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            displayData.map((client, index) => (
                                <tr
                                    key={client.id || index}
                                    className="hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                                    onClick={() => onClientClick?.(client)}
                                >
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">{client.clientName}</div>
                                            <div className="text-xs text-gray-500">{client.industry}</div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <span className="text-sm text-gray-700 font-mono">
                                            {client.invoiceNumber || '-'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        {getTypeBadge(client.clientType)}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-right">
                                        <span className="text-sm font-medium text-gray-900">
                                            {client.serviceMRR > 0 ? formatCurrency(client.serviceMRR) : '-'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-right">
                                        <span className={`text-sm font-medium ${client.addonsMRR > 0 ? 'text-primary-blue' : 'text-gray-400'}`}>
                                            {client.addonsMRR > 0 ? formatCurrency(client.addonsMRR) : '-'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-right">
                                        <span className="text-sm font-bold text-gray-900">
                                            {client.totalMRR > 0 ? formatCurrency(client.totalMRR) : '-'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-center">
                                        {getPaymentBadge(client.paymentStatus)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ClientRevenueTable;
