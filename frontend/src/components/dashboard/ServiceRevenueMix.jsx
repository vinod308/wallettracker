/**
 * Service Revenue Mix Component
 * Displays revenue breakdown by service with animated progress bars
 */

import React, { useEffect, useState } from 'react';
import { formatCurrency } from '../../utils/helpers';

const ServiceRevenueMix = ({ services = [], loading = false }) => {
    const [animatedServices, setAnimatedServices] = useState([]);

    useEffect(() => {
        if (loading || services.length === 0) return;

        // Animate progress bars
        const timer = setTimeout(() => {
            setAnimatedServices(services);
        }, 100);

        return () => clearTimeout(timer);
    }, [services, loading]);

    const getColorForService = (index) => {
        const colors = [
            'bg-primary-blue',
            'bg-primary-green',
            'bg-primary-purple',
            'bg-primary-orange',
            'bg-primary-yellow',
            'bg-pink-500',
            'bg-indigo-500',
            'bg-teal-500',
            'bg-red-500',
        ];
        return colors[index % colors.length];
    };

    if (loading) {
        return (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card border border-gray-100/50 p-6">
                <div className="animate-pulse">
                    <div className="h-5 bg-gray-200 rounded w-1/3 mb-6"></div>
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i}>
                                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                                <div className="h-6 bg-gray-100 rounded"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (services.length === 0) {
        return (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card border border-gray-100/50 p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-6">Service Revenue Mix</h3>
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
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
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                    </svg>
                    <p className="text-lg font-medium">No service revenue data</p>
                    <p className="text-sm">Data will appear once clients have services</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Service Revenue Mix</h2>

            <div className="space-y-4">
                {animatedServices.map((service, index) => (
                    <div key={service.name || service.serviceName}>
                        {/* Service Name and Stats */}
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2 min-w-0">
                                <span className="text-sm font-medium text-gray-900 truncate max-w-[130px] sm:max-w-none">{service.name || service.serviceName}</span>
                                <span className="text-xs text-gray-500 flex-shrink-0">({service.clientCount} clients)</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-semibold text-gray-900">
                                    {formatCurrency(service.revenue)}
                                </span>
                                <span className="text-xs font-medium text-gray-600 min-w-[40px] text-right">
                                    {service.percentage}%
                                </span>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div
                                className={`h-full ${getColorForService(index)} transition-all duration-1000 ease-out rounded-full`}
                                style={{ width: `${service.percentage}%` }}
                            ></div>
                        </div>

                        {/* Category Tag (if available) */}
                        {service.category && (
                            <div className="mt-1">
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                    {service.category}
                                </span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Total */}
            <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-900">Total Revenue</span>
                    <span className="text-lg font-bold text-primary-blue">
                        {formatCurrency(services.reduce((sum, s) => sum + s.revenue, 0))}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ServiceRevenueMix;
