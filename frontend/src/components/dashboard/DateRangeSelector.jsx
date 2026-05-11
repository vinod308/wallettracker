/**
 * Date Range Selector Component
 * Allows filtering by This Month, Last Month, YTD, or Custom date range
 * Works with the useInvoiceData hook for instant client-side filtering
 */

import React, { useState } from 'react';

const DateRangeSelector = ({ selectedRange, onRangeChange, onCustomRangeChange, periodLabel }) => {
    const [showCustom, setShowCustom] = useState(false);
    const today = new Date();
    const defaultEnd   = today.toISOString().slice(0, 10);
    const defaultStart = new Date(today.getFullYear(), 0, 1).toISOString().slice(0, 10);
    const [customStart, setCustomStart] = useState(defaultStart);
    const [customEnd,   setCustomEnd]   = useState(defaultEnd);

    const periods = [
        { value: 'this_month', label: 'This Month' },
        { value: 'last_month', label: 'Last Month' },
        { value: 'ytd', label: 'Year to Date' },
        { value: 'custom', label: 'Custom Range' },
    ];

    const handlePeriodClick = (period) => {
        if (period === 'custom') {
            setShowCustom(true);
            return;
        }
        setShowCustom(false);
        onRangeChange(period);
    };

    const handleCustomApply = () => {
        if (customStart && customEnd) {
            onCustomRangeChange(customStart, customEnd);
            setShowCustom(false);
        }
    };

    return (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card border border-gray-100/50 p-4 mb-6">
            <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-gray-700">Date Range:</span>

                {/* Period Buttons */}
                {periods.map((period) => (
                    <button
                        key={period.value}
                        onClick={() => handlePeriodClick(period.value)}
                        className={`
                            px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                            ${
                                (selectedRange === period.value || (period.value === 'custom' && showCustom))
                                    ? 'bg-primary-blue text-white'
                                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                            }
                        `}
                    >
                        {period.label}
                    </button>
                ))}

                {/* Period Label */}
                {periodLabel && (
                    <span className="ml-2 px-3 py-1.5 bg-indigo-50 text-primary-blue text-xs font-semibold rounded-lg">
                        {periodLabel}
                    </span>
                )}

                {/* Custom Date Inputs */}
                {showCustom && (
                    <div className="flex items-center gap-2 ml-4">
                        <input
                            type="date"
                            value={customStart}
                            onChange={(e) => setCustomStart(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                        />
                        <span className="text-gray-500">to</span>
                        <input
                            type="date"
                            value={customEnd}
                            onChange={(e) => setCustomEnd(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                        />
                        <button
                            onClick={handleCustomApply}
                            disabled={!customStart || !customEnd}
                            className="px-4 py-2 bg-primary-green text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                            Apply
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DateRangeSelector;
