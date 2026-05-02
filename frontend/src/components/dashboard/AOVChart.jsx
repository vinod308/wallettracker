/**
 * AOV Chart — Service Category Average Order Value
 * Shows average revenue per client for each service type.
 * This is genuinely different from the Revenue per Client chart:
 *   - X-axis: service categories (SEO, Social Media, etc.)
 *   - Y-axis: avg revenue each service generates per client
 *   - Tooltip: avg value, client count, total revenue from service
 */

import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell,
} from 'recharts';
import { formatCurrency } from '../../utils/helpers';

const COLORS = [
    '#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981',
    '#3B82F6', '#EF4444', '#14B8A6', '#F97316', '#84CC16',
];

const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    const d = payload[0].payload;
    return (
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-100 p-4 text-sm min-w-[200px]">
            <p className="font-semibold text-gray-900 mb-2">{d.fullName}</p>
            <div className="space-y-1.5">
                <div className="flex justify-between gap-4">
                    <span className="text-gray-500">Avg Value / Client</span>
                    <span className="font-semibold text-indigo-600">{formatCurrency(d.aov)}</span>
                </div>
                <div className="flex justify-between gap-4">
                    <span className="text-gray-500">Clients Using</span>
                    <span className="font-semibold text-gray-900">{d.clientCount}</span>
                </div>
                <div className="flex justify-between gap-4 pt-1 border-t border-gray-100">
                    <span className="text-gray-500">Total Revenue</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(d.totalRevenue)}</span>
                </div>
            </div>
        </div>
    );
};

const formatYAxis = (val) => {
    if (val >= 100000) return `${(val / 100000).toFixed(1)}L`;
    if (val >= 1000)   return `${(val / 1000).toFixed(0)}K`;
    return val;
};

const AOVChart = ({ data = [], loading = false, title = 'Service Category AOV' }) => {
    if (loading) {
        return (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card border border-gray-100/50 p-6">
                <div className="animate-pulse">
                    <div className="h-5 bg-gray-200 rounded w-56 mb-6"></div>
                    <div className="h-[300px] bg-gray-100 rounded-xl"></div>
                </div>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card border border-gray-100/50 p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4">{title}</h3>
                <div className="h-[300px] flex items-center justify-center text-gray-400 text-sm">
                    No data available
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card border border-gray-100/50 p-6 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="text-base font-semibold text-gray-900">{title}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Avg revenue per client, by service type</p>
                </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 50 }}>
                    <defs>
                        {data.map((_, idx) => (
                            <linearGradient key={idx} id={`svcGrad${idx}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%"   stopColor={COLORS[idx % COLORS.length]} stopOpacity={0.9} />
                                <stop offset="100%" stopColor={COLORS[idx % COLORS.length]} stopOpacity={0.5} />
                            </linearGradient>
                        ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis
                        dataKey="service"
                        tick={{ fontSize: 10, fill: '#6B7280' }}
                        angle={-35}
                        textAnchor="end"
                        height={65}
                        axisLine={{ stroke: '#E5E7EB' }}
                        tickLine={false}
                    />
                    <YAxis
                        tickFormatter={formatYAxis}
                        tick={{ fontSize: 11, fill: '#6B7280' }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.05)' }} />
                    <Bar dataKey="aov" radius={[6, 6, 0, 0]} animationDuration={1200} maxBarSize={52}>
                        {data.map((_, idx) => (
                            <Cell key={idx} fill={`url(#svcGrad${idx})`} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default AOVChart;
