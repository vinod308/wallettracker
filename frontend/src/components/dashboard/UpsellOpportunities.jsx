/**
 * Upsell Opportunities Component
 * Shows top upsell opportunities with expansion potential
 * Data driven from CSV via props - View All opens UpsellModal
 */

import React, { useState } from 'react';
import { formatCurrency } from '../../utils/helpers';
import UpsellModal from './UpsellModal';

const UpsellOpportunities = ({ opportunities = [], loading = false }) => {
    const [showModal, setShowModal] = useState(false);

    const getPriorityBadge = (priority) => {
        const styles = {
            High: 'bg-red-100 text-red-800',
            Medium: 'bg-yellow-100 text-yellow-800',
            Low: 'bg-green-100 text-green-800',
        };
        return (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[priority] || 'bg-gray-100 text-gray-800'}`}>
                {priority}
            </span>
        );
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
        <>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card border border-gray-100/50 p-6 hover:shadow-lg transition-shadow duration-300">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-base font-semibold text-gray-900">
                        Upsell Opportunities
                    </h3>
                    {opportunities.length > 0 && (
                        <button
                            onClick={() => setShowModal(true)}
                            className="text-sm text-primary-blue hover:text-[#4338ca] font-medium transition-colors"
                        >
                            View All
                        </button>
                    )}
                </div>

                {opportunities.length === 0 ? (
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
                                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                            />
                        </svg>
                        <p className="text-sm font-medium text-gray-500">No upsell opportunities</p>
                        <p className="text-xs text-gray-400 mt-1">All clients are well-covered</p>
                    </div>
                ) : (
                    <div className="space-y-2.5">
                        {opportunities.slice(0, 5).map((opp, index) => (
                            <div
                                key={index}
                                className="flex justify-between items-start p-3 bg-gray-50/80 rounded-xl hover:bg-gray-100/80 transition-colors"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="text-sm font-medium text-gray-900">{opp.clientName}</p>
                                        {getPriorityBadge(opp.priority)}
                                    </div>
                                    <p className="text-xs text-gray-500 mb-1.5">{opp.projectName}</p>
                                    {opp.recommendedServices && opp.recommendedServices.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                            {opp.recommendedServices.slice(0, 3).map((service, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs rounded-md"
                                                >
                                                    {service}
                                                </span>
                                            ))}
                                            {opp.recommendedServices.length > 3 && (
                                                <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-md">
                                                    +{opp.recommendedServices.length - 3} more
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="text-right ml-4">
                                    <p className="text-xs text-gray-500">Potential Gain</p>
                                    <p className="text-sm font-bold text-green-600">
                                        {formatCurrency(opp.potentialGain)}
                                    </p>
                                    {opp.probability && (
                                        <p className="text-xs text-gray-500 mt-0.5">{opp.probability}% likely</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Full Upsell Modal */}
            <UpsellModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                opportunities={opportunities}
            />
        </>
    );
};

export default UpsellOpportunities;
