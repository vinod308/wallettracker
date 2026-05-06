/**
 * Client Table Component
 * CSV-driven client list with clickable rows for detail navigation
 */

import React from 'react';
import { formatCurrency } from '../../utils/helpers';

const ClientTable = ({ clients, loading, onViewDetails, onEdit, upsellMap = [] }) => {
    const getStatusBadge = (status) => {
        const styles = {
            Active: 'bg-green-100 text-green-800',
            'At Risk': 'bg-red-100 text-red-800',
            Inactive: 'bg-gray-100 text-gray-800',
        };
        return (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
                {status}
            </span>
        );
    };

    const getClientTypeBadge = (type) => {
        const color = type === 'Retainer' ? 'bg-indigo-100 text-indigo-700' : 'bg-purple-100 text-purple-700';
        return (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
                {type || 'Retainer'}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card border border-gray-100/50 p-6">
                <div className="animate-pulse space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-16 bg-gray-100 rounded-xl"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (clients.length === 0) {
        return (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card border border-gray-100/50 p-12 text-center">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No clients found</h3>
                <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
            </div>
        );
    }

    return (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card border border-gray-100/50 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
                <h2 className="text-base font-semibold text-gray-900">
                    Clients {/* <span className="text-sm font-normal text-gray-500 ml-1">({clients.length})</span> */}
                </h2>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50/80 border-b border-gray-100">
                        <tr>
                            <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                            <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Revenue</th>
                            <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">MRR</th>
                            <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Services</th>
                            <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Months</th>
                            <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {clients.map((client) => {
                            const avgMRR = client.monthCount > 0 ? client.totalRevenue / client.monthCount : 0;
                            const upsell = upsellMap.find(u => u.clientId === client.id);

                            return (
                                <tr
                                    key={client.id}
                                    className="hover:bg-gray-50/50 transition-colors duration-150 cursor-pointer"
                                    onClick={() => onViewDetails && onViewDetails(client)}
                                >
                                    <td className="px-5 py-3.5">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">{client.clientName}</div>
                                            <div className="text-xs text-gray-500 mt-0.5">
                                                {client.detectedServices.slice(0, 3).join(', ')}
                                                {client.detectedServices.length > 3 && ` +${client.detectedServices.length - 3}`}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5 whitespace-nowrap">
                                        {getClientTypeBadge(client.clientType)}
                                    </td>
                                    <td className="px-5 py-3.5 whitespace-nowrap text-right">
                                        <span className="text-sm font-semibold text-gray-900">
                                            {formatCurrency(Math.round(client.totalRevenue))}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5 whitespace-nowrap text-right">
                                        <span className="text-sm text-gray-700">
                                            {formatCurrency(Math.round(avgMRR))}/mo
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5 whitespace-nowrap text-center">
                                        <span className="text-sm text-gray-900">{client.detectedServices.length}</span>
                                    </td>
                                    <td className="px-5 py-3.5 whitespace-nowrap text-center">
                                        <span className="text-sm text-gray-900">{client.monthCount}</span>
                                    </td>
                                    <td className="px-5 py-3.5 whitespace-nowrap">
                                        <div className="flex items-center gap-1.5">
                                            {getStatusBadge(client.status)}
                                            {upsell && upsell.missingServices.length > 0 && (
                                                <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 text-[10px] rounded font-medium" title="Upsell opportunity available">
                                                    Upsell
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5 whitespace-nowrap text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onEdit && onEdit(client);
                                                }}
                                                className="text-sm text-gray-500 hover:text-gray-800 font-medium transition-colors"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onViewDetails && onViewDetails(client);
                                                }}
                                                className="text-sm text-primary-blue hover:text-[#4338ca] font-medium transition-colors"
                                            >
                                                View Details
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ClientTable;
