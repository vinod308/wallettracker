/**
 * KPI Card Component
 * Displays a single KPI with value, growth, and trend indicator.
 * Supports an optional hover tooltip (used by "At Risk Revenue" to list at-risk clients).
 */

import React, { useEffect, useState, useRef } from 'react';
import { formatCurrency } from '../../utils/helpers';

const KPICard = ({
    label,
    value,
    growth,
    trend,
    isCurrency = true,
    loading = false,
    // Optional: array of { clientName, revenue } shown on hover (At Risk card)
    tooltipClients = null,
}) => {
    const [animatedValue, setAnimatedValue] = useState(0);
    const [showTooltip, setShowTooltip]     = useState(false);
    const tooltipRef = useRef(null);

    // Animate number on mount / value change
    useEffect(() => {
        if (loading || value === 0) { setAnimatedValue(0); return; }

        const duration = 1000;
        const steps    = 60;
        const increment = value / steps;
        let currentStep = 0;

        const timer = setInterval(() => {
            currentStep++;
            if (currentStep >= steps) {
                setAnimatedValue(value);
                clearInterval(timer);
            } else {
                setAnimatedValue(Math.floor(increment * currentStep));
            }
        }, duration / steps);

        return () => clearInterval(timer);
    }, [value, loading]);

    const getTrendIcon  = () => trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';
    const getTrendColor = () => {
        if (trend === 'up')      return 'text-status-growing';
        if (trend === 'down')    return 'text-status-at-risk';
        if (trend === 'warning') return 'text-primary-orange';
        return 'text-gray-500';
    };
    const getGrowthDisplay = () => {
        if (growth === undefined || growth === null) return null;
        return `${growth >= 0 ? '+' : ''}${growth}%`;
    };

    const hasTooltip = tooltipClients && tooltipClients.length > 0;

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6 animate-pulse">
                <div className="h-4 bg-gray-100 rounded-lg w-3/4 mb-4"></div>
                <div className="h-8 bg-gray-100 rounded-lg w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-100 rounded-lg w-1/4"></div>
            </div>
        );
    }

    return (
        <div
            className={`relative bg-white rounded-xl shadow-card border border-gray-100 p-4 sm:p-6 transition-shadow duration-250 ${hasTooltip ? 'hover:shadow-card-hover cursor-default' : ''}`}
            onMouseEnter={() => hasTooltip && setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            ref={tooltipRef}
        >
            {/* Label */}
            <p className="text-sm font-medium text-gray-600 mb-2">{label}</p>

            {/* Value */}
            <h3 className="text-xl sm:text-3xl font-medium text-gray-900 mb-1">
                {isCurrency ? formatCurrency(animatedValue) : animatedValue.toLocaleString()}
            </h3>

            {/* Growth & Trend */}
            <div className="flex items-center gap-2">
                {growth !== undefined && growth !== null && (
                    <>
                        <span className={`text-sm font-medium ${getTrendColor()}`}>
                            {getTrendIcon()} {getGrowthDisplay()}
                        </span>
                        <span className="text-xs text-gray-500">vs last period</span>
                    </>
                )}
                {trend === 'warning' && (
                    <span className="text-xs text-primary-orange font-medium">
                        ⚠️ Requires attention
                    </span>
                )}
            </div>

            {/* Hover tooltip — At Risk clients breakdown */}
            {hasTooltip && showTooltip && (
                <div className="absolute left-0 top-full mt-2 z-50 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 pointer-events-none">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                        At Risk Clients
                    </p>
                    <div className="space-y-2">
                        {tooltipClients.map((c, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
                                    <span className="text-sm text-gray-700 truncate">{c.clientName}</span>
                                </div>
                                <span className="text-sm font-semibold text-red-600 ml-2 flex-shrink-0">
                                    {formatCurrency(c.revenue)}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-3 pt-2 border-t border-gray-100 flex justify-between">
                        <span className="text-xs text-gray-500">Total at risk</span>
                        <span className="text-xs font-bold text-red-600">
                            {formatCurrency(tooltipClients.reduce((s, c) => s + c.revenue, 0))}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default KPICard;
