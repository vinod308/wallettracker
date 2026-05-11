/**
 * MonthlyTable Component
 * Displays per-month service breakdown for a client
 * Columns: Service, Package, Revenue, Status, Add-ons Purchased, Notes
 */

import React from 'react';
import { formatCurrency } from '../../utils/helpers';

const MonthlyTable = ({ month, services = [], totalServiceMRR = 0, totalAddonsMRR = 0, totalMRR = 0, invoice = null }) => {
    const baseServices = services.filter(s => !s.isAddon);
    const addonServices = services.filter(s => s.isAddon);

    const getStatusBadge = (recordType) => {
        const type = recordType || 'Recurring';
        const styles = {
            Recurring: 'bg-green-50 text-green-700 border border-green-200',
            'One-Time': 'bg-blue-50 text-blue-700 border border-blue-200',
        };
        return (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[type] || styles.Recurring}`}>
                {type}
            </span>
        );
    };

    return (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card border border-gray-100/50 overflow-hidden">
            {/* Month Header */}
            <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-8 bg-primary-blue rounded-full"></div>
                        <h3 className="text-lg font-semibold text-gray-900">{month}</h3>
                    </div>
                    <div className="flex flex-wrap gap-3 sm:gap-5 text-sm">
                        <div>
                            <span className="text-gray-500">Services: </span>
                            <span className="font-semibold text-gray-900">{formatCurrency(totalServiceMRR)}</span>
                        </div>
                        {totalAddonsMRR > 0 && (
                            <div>
                                <span className="text-gray-500">Add-ons: </span>
                                <span className="font-semibold text-primary-blue">{formatCurrency(totalAddonsMRR)}</span>
                            </div>
                        )}
                        <div>
                            <span className="text-gray-500">Total: </span>
                            <span className="font-bold text-primary-green">{formatCurrency(totalMRR)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                            <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Package</th>
                            <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                            <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Add-ons Purchased</th>
                            <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {baseServices.length === 0 && addonServices.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-5 py-8 text-center text-sm text-gray-400">
                                    No revenue records for this month
                                </td>
                            </tr>
                        ) : (
                            <>
                                {baseServices.map((svc, idx) => {
                                    // Find addons related to this service's category
                                    const relatedAddons = addonServices.filter(
                                        a => a.category === svc.category
                                    );
                                    const addonNames = relatedAddons.length > 0
                                        ? relatedAddons.map(a => a.serviceName).join(', ')
                                        : '-';

                                    return (
                                        <tr key={`base-${idx}`} className="hover:bg-gray-50 transition-colors duration-150">
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                                    <span className="text-sm font-medium text-gray-900">{svc.serviceName}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className="text-sm text-gray-600">{svc.category || 'Standard'}</span>
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <span className="text-sm font-semibold text-gray-900">{formatCurrency(svc.amount)}</span>
                                            </td>
                                            <td className="px-5 py-3.5 text-center">
                                                {getStatusBadge(svc.recordType)}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                {relatedAddons.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {relatedAddons.map((a, i) => (
                                                            <span key={i} className="px-2 py-0.5 bg-indigo-50 text-primary-blue text-xs rounded font-medium">
                                                                {a.serviceName}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-gray-400">-</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className="text-xs text-gray-500">
                                                    {svc.recordType === 'One-Time' ? 'One-time charge' : 'Monthly retainer'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}

                                {/* Show standalone addons not tied to any base service category */}
                                {addonServices
                                    .filter(a => !baseServices.some(b => b.category === a.category))
                                    .map((addon, idx) => (
                                        <tr key={`addon-standalone-${idx}`} className="hover:bg-gray-50 transition-colors duration-150 bg-indigo-50/30">
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-orange-400"></div>
                                                    <span className="text-sm font-medium text-gray-900">{addon.serviceName}</span>
                                                    <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-[10px] rounded font-semibold uppercase">Add-on</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className="text-sm text-gray-600">{addon.category || 'Add-on'}</span>
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <span className="text-sm font-semibold text-primary-blue">{formatCurrency(addon.amount)}</span>
                                            </td>
                                            <td className="px-5 py-3.5 text-center">
                                                {getStatusBadge(addon.recordType)}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className="text-sm text-gray-400">-</span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className="text-xs text-gray-500">Add-on service</span>
                                            </td>
                                        </tr>
                                    ))}
                            </>
                        )}
                    </tbody>

                    {/* Footer totals */}
                    {(baseServices.length > 0 || addonServices.length > 0) && (
                        <tfoot className="bg-gray-50 border-t border-gray-200">
                            <tr>
                                <td colSpan={2} className="px-5 py-3">
                                    <span className="text-sm font-semibold text-gray-700">
                                        {baseServices.length} service{baseServices.length !== 1 ? 's' : ''}
                                        {addonServices.length > 0 && ` + ${addonServices.length} add-on${addonServices.length !== 1 ? 's' : ''}`}
                                    </span>
                                </td>
                                <td className="px-5 py-3 text-right">
                                    <span className="text-sm font-bold text-gray-900">{formatCurrency(totalMRR)}</span>
                                </td>
                                <td colSpan={3} className="px-5 py-3">
                                    {invoice && (
                                        <span className="text-xs text-gray-500">
                                            Invoice: {invoice.invoice_number} ({invoice.payment_status})
                                        </span>
                                    )}
                                </td>
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>
        </div>
    );
};

export default MonthlyTable;
