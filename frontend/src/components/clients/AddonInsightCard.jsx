/**
 * AddonInsightCard Component
 * Shows add-on insight highlight below each month table
 * Colored accent border, icon, and recommendation message
 */

import React from 'react';
import { formatCurrency } from '../../utils/helpers';

const AddonInsightCard = ({ month, services = [], totalAddonsMRR = 0, totalMRR = 0 }) => {
    const addonServices = services.filter(s => s.isAddon);
    const baseServices = services.filter(s => !s.isAddon);
    const addonPercentage = totalMRR > 0 ? ((totalAddonsMRR / totalMRR) * 100).toFixed(1) : 0;

    // Generate insight based on addon data
    const getInsight = () => {
        if (addonServices.length === 0 && baseServices.length > 0) {
            return {
                type: 'opportunity',
                borderColor: 'border-l-amber-500',
                bgColor: 'bg-amber-50',
                iconBg: 'bg-amber-100',
                iconColor: 'text-amber-600',
                icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                ),
                title: 'Upsell Opportunity',
                message: `No add-on services in ${month}. Consider recommending complementary services like Analytics or Content Marketing to boost revenue.`,
            };
        }

        if (parseFloat(addonPercentage) >= 30) {
            return {
                type: 'strong',
                borderColor: 'border-l-green-500',
                bgColor: 'bg-green-50',
                iconBg: 'bg-green-100',
                iconColor: 'text-green-600',
                icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                ),
                title: 'Strong Add-on Revenue',
                message: `Add-ons contribute ${addonPercentage}% (${formatCurrency(totalAddonsMRR)}) of total revenue this month. ${addonServices.map(a => a.serviceName).join(', ')} driving strong growth.`,
            };
        }

        if (addonServices.length > 0 && parseFloat(addonPercentage) < 30) {
            return {
                type: 'growing',
                borderColor: 'border-l-blue-500',
                bgColor: 'bg-blue-50',
                iconBg: 'bg-blue-100',
                iconColor: 'text-blue-600',
                icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                ),
                title: 'Add-on Growth Potential',
                message: `Currently at ${addonPercentage}% add-on share (${formatCurrency(totalAddonsMRR)}). Explore expanding ${addonServices[0]?.serviceName || 'current add-ons'} or introducing new complementary services.`,
            };
        }

        return null;
    };

    const insight = getInsight();
    if (!insight) return null;

    return (
        <div className={`rounded-xl border-l-4 ${insight.borderColor} ${insight.bgColor} p-4 transition-all duration-200 hover:shadow-sm`}>
            <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${insight.iconBg} ${insight.iconColor} shrink-0`}>
                    {insight.icon}
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900">{insight.title}</h4>
                    <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">{insight.message}</p>
                </div>
                {totalAddonsMRR > 0 && (
                    <div className="text-right shrink-0">
                        <p className="text-xs text-gray-500">Add-on MRR</p>
                        <p className="text-sm font-bold text-gray-900">{formatCurrency(totalAddonsMRR)}</p>
                        <p className="text-xs text-gray-500">{addonPercentage}% of total</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AddonInsightCard;
