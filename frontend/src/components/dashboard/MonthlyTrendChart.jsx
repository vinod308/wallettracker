/**
 * Monthly Trend Chart
 * Premium line chart showing revenue trend across April-July 2025
 * Gradient fill, smooth animation, detailed tooltips
 */

import React from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '../../utils/helpers';

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    return (
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-100 p-4 text-sm min-w-[200px]">
            <p className="font-semibold text-gray-900 mb-2">{label} 2025</p>
            {payload.map((entry, idx) => (
                <div key={idx} className="flex items-center justify-between gap-4 py-0.5">
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }}></div>
                        <span className="text-gray-600">{entry.name}</span>
                    </div>
                    <span className="font-semibold text-gray-900">{formatCurrency(entry.value)}</span>
                </div>
            ))}
            {payload[0]?.payload?.clientCount && (
                <div className="pt-1 mt-1 border-t border-gray-100 text-xs text-gray-500">
                    {payload[0].payload.clientCount} active clients
                </div>
            )}
        </div>
    );
};

const formatYAxis = (val) => {
    if (val >= 100000) return `${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
    return val;
};

const MonthlyTrendChart = ({ data = [], loading = false }) => {
    if (loading) {
        return (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card border border-gray-100/50 p-6">
                <div className="animate-pulse">
                    <div className="h-5 bg-gray-200 rounded w-48 mb-6"></div>
                    <div className="h-[300px] bg-gray-100 rounded-xl"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card border border-gray-100/50 p-6 hover:shadow-lg transition-shadow duration-300">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Monthly Revenue Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <defs>
                        <linearGradient id="totalFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="#4F46E5" stopOpacity={0.02} />
                        </linearGradient>
                        <linearGradient id="serviceFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10B981" stopOpacity={0.2} />
                            <stop offset="100%" stopColor="#10B981" stopOpacity={0.02} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={{ stroke: '#E5E7EB' }} />
                    <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={{ stroke: '#E5E7EB' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                    <Area
                        type="monotone"
                        dataKey="totalMRR"
                        name="Total Revenue"
                        stroke="#4F46E5"
                        strokeWidth={2.5}
                        fill="url(#totalFill)"
                        dot={{ fill: '#4F46E5', r: 4, strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6, stroke: '#4F46E5', strokeWidth: 2 }}
                        animationDuration={1500}
                    />
                    <Area
                        type="monotone"
                        dataKey="serviceMRR"
                        name="Service Revenue"
                        stroke="#10B981"
                        strokeWidth={2}
                        fill="url(#serviceFill)"
                        dot={{ fill: '#10B981', r: 3, strokeWidth: 2, stroke: '#fff' }}
                        animationDuration={1500}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default MonthlyTrendChart;
