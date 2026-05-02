/**
 * ClientComparisonCharts Component
 * Two charts side by side:
 * 1. Monthly Revenue Trend (Line chart)
 * 2. Add-on Revenue Impact (Stacked Bar chart)
 */

import React, { useMemo } from 'react';
import {
    LineChart, Line, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '../../utils/helpers';

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    return (
        <div className="bg-white rounded-lg shadow-lg border border-gray-100 p-3 text-sm">
            <p className="font-semibold text-gray-900 mb-1.5">{label}</p>
            {payload.map((entry, idx) => (
                <div key={idx} className="flex items-center gap-2 py-0.5">
                    <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: entry.color }}
                    ></div>
                    <span className="text-gray-600">{entry.name}:</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(entry.value)}</span>
                </div>
            ))}
        </div>
    );
};

const formatYAxis = (val) => {
    if (val >= 100000) return `${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
    return val;
};

const ClientComparisonCharts = ({ months = [] }) => {
    const chartData = useMemo(() => {
        // Reverse so oldest month is first (left to right: April → July)
        return [...months].reverse().map(m => ({
            month: m.month.replace(' 2025', ''),
            totalMRR: Math.round(m.totalMRR),
            serviceMRR: Math.round(m.totalServiceMRR),
            addonsMRR: Math.round(m.totalAddonsMRR),
        }));
    }, [months]);

    if (chartData.length === 0) {
        return (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card border border-gray-100/50 p-8 text-center">
                <p className="text-gray-400">No chart data available</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend Line Chart */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card border border-gray-100/50 p-5">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Monthly Revenue Trend</h3>
                <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                            dataKey="month"
                            tick={{ fontSize: 12, fill: '#6B7280' }}
                            axisLine={{ stroke: '#E5E7EB' }}
                        />
                        <YAxis
                            tickFormatter={formatYAxis}
                            tick={{ fontSize: 12, fill: '#6B7280' }}
                            axisLine={{ stroke: '#E5E7EB' }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="totalMRR"
                            name="Total MRR"
                            stroke="#4F46E5"
                            strokeWidth={2.5}
                            dot={{ fill: '#4F46E5', r: 4, strokeWidth: 2, stroke: '#fff' }}
                            activeDot={{ r: 6, stroke: '#4F46E5', strokeWidth: 2 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="serviceMRR"
                            name="Service MRR"
                            stroke="#10B981"
                            strokeWidth={2}
                            dot={{ fill: '#10B981', r: 3.5, strokeWidth: 2, stroke: '#fff' }}
                            strokeDasharray="5 5"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Add-on Revenue Impact Stacked Bar Chart */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card border border-gray-100/50 p-5">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Add-on Revenue Impact</h3>
                <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                            dataKey="month"
                            tick={{ fontSize: 12, fill: '#6B7280' }}
                            axisLine={{ stroke: '#E5E7EB' }}
                        />
                        <YAxis
                            tickFormatter={formatYAxis}
                            tick={{ fontSize: 12, fill: '#6B7280' }}
                            axisLine={{ stroke: '#E5E7EB' }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                        />
                        <Bar
                            dataKey="serviceMRR"
                            name="Base Revenue"
                            stackId="revenue"
                            fill="#4F46E5"
                            radius={[0, 0, 0, 0]}
                        />
                        <Bar
                            dataKey="addonsMRR"
                            name="Add-on Revenue"
                            stackId="revenue"
                            fill="#F59E0B"
                            radius={[4, 4, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ClientComparisonCharts;
