/**
 * Upsell Modal Component
 * Full-screen modal showing all upsell opportunities with smart suggestions
 * Data driven from CSV via props
 */

import React, { useState, useMemo } from 'react';
import { formatCurrency } from '../../utils/helpers';

// Smart upsell suggestion engine based on client services and business type
const generateSmartSuggestions = (opportunities) => {
    const suggestions = [];

    opportunities.forEach(opp => {
        const clientName = opp.clientName;
        const currentServices = opp.currentServices || [];
        const businessType = (opp.projectName || '').toLowerCase();

        // Digital Marketing clients: suggest premium packages
        if (businessType.includes('digital') || currentServices.some(s => ['Digital Marketing', 'Social Media'].includes(s))) {
            if (!currentServices.includes('Analytics')) {
                suggestions.push({
                    clientName,
                    currentService: 'Digital Marketing',
                    suggestedUpsell: 'Advanced Analytics Dashboard',
                    estimatedValue: Math.round(opp.potentialGain * 0.6),
                    reason: 'Clients with low analytics spend benefit from data-driven insights',
                });
            }
            if (!currentServices.includes('Content Marketing')) {
                suggestions.push({
                    clientName,
                    currentService: 'Digital Marketing',
                    suggestedUpsell: 'Content Marketing Automation',
                    estimatedValue: Math.round(opp.potentialGain * 0.5),
                    reason: 'Content automation increases engagement by 40%',
                });
            }
        }

        // SEO-only clients: suggest Ads / Funnel / Automation
        if (currentServices.includes('SEO') && !currentServices.includes('Paid Ads')) {
            suggestions.push({
                clientName,
                currentService: 'SEO',
                suggestedUpsell: 'Paid Ads + Funnel Setup',
                estimatedValue: Math.round(opp.potentialGain * 0.8),
                reason: 'Clients with only SEO see 3x ROI with paid ads integration',
            });
        }

        // eLearning clients: suggest LMS upgrade, content bundles
        if (businessType.includes('elearning') || currentServices.some(s => ['E-Learning', 'Course Creation'].includes(s))) {
            suggestions.push({
                clientName,
                currentService: 'eLearning Content',
                suggestedUpsell: 'LMS Platform Upgrade + Analytics Add-on',
                estimatedValue: Math.round(opp.potentialGain * 0.7),
                reason: 'eLearning clients benefit from LMS upgrade with engagement tracking',
            });
        }

        // Video / Content creators: suggest production packages
        if (currentServices.includes('Video Production')) {
            suggestions.push({
                clientName,
                currentService: 'Video Production',
                suggestedUpsell: 'Premium Video Package + Distribution',
                estimatedValue: Math.round(opp.potentialGain * 0.65),
                reason: 'Video clients with distribution see 2x reach improvement',
            });
        }

        // Low spend clients: suggest premium package
        if (opp.potentialGain < 150000 && opp.potentialGain > 0) {
            suggestions.push({
                clientName,
                currentService: currentServices[0] || 'Basic Package',
                suggestedUpsell: 'Premium Growth Package',
                estimatedValue: 200000,
                reason: 'Low-spend clients converted to premium show 2.5x retention',
            });
        }
    });

    // Deduplicate by client + suggestion
    const seen = new Set();
    return suggestions.filter(s => {
        const key = `${s.clientName}_${s.suggestedUpsell}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
};

const UpsellModal = ({ isOpen, onClose, opportunities = [] }) => {
    const [activeTab, setActiveTab] = useState('opportunities');

    const smartSuggestions = useMemo(() => generateSmartSuggestions(opportunities), [opportunities]);

    const totalEstimatedValue = useMemo(() =>
        opportunities.reduce((sum, o) => sum + (o.potentialGain || 0), 0),
        [opportunities]
    );

    const getPriorityBadge = (priority) => {
        const styles = {
            High: 'bg-red-100 text-red-800',
            Medium: 'bg-yellow-100 text-yellow-800',
            Low: 'bg-green-100 text-green-800',
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[priority] || 'bg-gray-100 text-gray-800'}`}>
                {priority}
            </span>
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
                {/* Backdrop */}
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose} />

                {/* Modal */}
                <div className="relative bg-white rounded-2xl shadow-xl max-w-5xl w-full max-h-[85vh] overflow-hidden z-10">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Upsell Opportunities</h2>
                            <p className="text-sm text-gray-500 mt-1">
                                {opportunities.length} opportunities | Est. Total: {formatCurrency(totalEstimatedValue)}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 px-6 py-3 border-b border-gray-100 bg-gray-50">
                        <button
                            onClick={() => setActiveTab('opportunities')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                activeTab === 'opportunities'
                                    ? 'bg-primary-blue text-white'
                                    : 'text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            Current Opportunities ({opportunities.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('suggestions')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                activeTab === 'suggestions'
                                    ? 'bg-primary-blue text-white'
                                    : 'text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            Smart Suggestions ({smartSuggestions.length})
                        </button>
                    </div>

                    {/* Content */}
                    <div className="overflow-y-auto max-h-[60vh] p-6">
                        {activeTab === 'opportunities' ? (
                            <div className="space-y-3">
                                {opportunities.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500">
                                        <p className="text-sm">No upsell opportunities detected from CSV data</p>
                                    </div>
                                ) : (
                                    opportunities.map((opp, index) => (
                                        <div
                                            key={index}
                                            className="flex justify-between items-start p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="text-sm font-semibold text-gray-900">{opp.clientName}</p>
                                                    {getPriorityBadge(opp.priority)}
                                                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                                                        {opp.status || 'Identified'}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-600 mb-2">{opp.projectName}</p>

                                                {/* Current Services */}
                                                {opp.currentServices?.length > 0 && (
                                                    <div className="mb-1.5">
                                                        <span className="text-xs text-gray-500">Current: </span>
                                                        {opp.currentServices.slice(0, 4).map((s, idx) => (
                                                            <span key={idx} className="inline-block px-1.5 py-0.5 bg-green-50 text-green-700 text-xs rounded mr-1 mb-0.5">
                                                                {s}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Recommended Services */}
                                                {opp.recommendedServices?.length > 0 && (
                                                    <div>
                                                        <span className="text-xs text-gray-500">Missing: </span>
                                                        {opp.recommendedServices.map((service, idx) => (
                                                            <span
                                                                key={idx}
                                                                className="inline-block px-1.5 py-0.5 bg-indigo-50 text-indigo-600 text-xs rounded mr-1 mb-0.5"
                                                            >
                                                                {service}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-right ml-4">
                                                <p className="text-xs text-gray-500">Potential Gain</p>
                                                <p className="text-base font-bold text-green-600">{formatCurrency(opp.potentialGain)}</p>
                                                {opp.probability && (
                                                    <p className="text-xs text-gray-500 mt-1">{opp.probability}% likely</p>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        ) : (
                            /* Smart Suggestions Tab */
                            <div className="space-y-3">
                                <div className="bg-indigo-50 rounded-xl p-4 mb-4">
                                    <p className="text-sm text-indigo-800">
                                        <span className="font-semibold">AI-Generated Suggestions</span> based on client service patterns,
                                        business type (Digital Marketing + eLearning), and spend analysis from CSV data.
                                    </p>
                                </div>
                                {smartSuggestions.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <p className="text-sm">No smart suggestions available yet</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Service</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Suggested Upsell</th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Est. Value</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {smartSuggestions.map((suggestion, index) => (
                                                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-4 py-3">
                                                            <span className="text-sm font-medium text-gray-900">{suggestion.clientName}</span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className="text-sm text-gray-600">{suggestion.currentService}</span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div>
                                                                <span className="text-sm font-medium text-primary-blue">{suggestion.suggestedUpsell}</span>
                                                                <p className="text-xs text-gray-500 mt-0.5">{suggestion.reason}</p>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <span className="text-sm font-bold text-green-600">{formatCurrency(suggestion.estimatedValue)}</span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UpsellModal;
