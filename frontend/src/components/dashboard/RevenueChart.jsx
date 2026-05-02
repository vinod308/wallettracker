/**
 * Revenue Chart Component
 * Premium glass-card style bar chart showing revenue per client
 * With gradient bars, smooth animation, and detailed tooltips
 */

import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell,
} from 'recharts';
import { formatCurrency } from '../../utils/helpers';

const COLORS = ['#4F46E5', '#7C3AED', '#2563EB', '#0891B2', '#059669', '#D97706', '#DC2626', '#EC4899', '#8B5CF6', '#14B8A6'];

const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0].payload;
    return (
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-100 p-4 text-sm min-w-[200px]">
            <p className="font-semibold text-gray-900 mb-2">{data.fullName}</p>
            <div className="space-y-1">
                <div className="flex justify-between">
                    <span className="text-gray-500">Service MRR</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(data.serviceMRR)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500">Addons MRR</span>
                    <span className="font-semibold text-indigo-600">{formatCurrency(data.addonsMRR)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-gray-100">
                    <span className="text-gray-700 font-medium">Total MRR</span>
                    <span className="font-bold text-gray-900">{formatCurrency(data.totalMRR)}</span>
                </div>
            </div>
        </div>
    );
};

const formatYAxis = (val) => {
    if (val >= 100000) return `${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
    return val;
};

const RevenueChart = ({ data = [], loading = false, title = 'Revenue per Client' }) => {
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
            <h3 className="text-base font-semibold text-gray-900 mb-4">{title}</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 40 }}>
                    <defs>
                        {COLORS.map((color, i) => (
                            <linearGradient key={i} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={color} stopOpacity={0.9} />
                                <stop offset="100%" stopColor={color} stopOpacity={0.5} />
                            </linearGradient>
                        ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                        dataKey="clientName"
                        tick={{ fontSize: 10, fill: '#6B7280' }}
                        angle={-35}
                        textAnchor="end"
                        height={60}
                        axisLine={{ stroke: '#E5E7EB' }}
                    />
                    <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={{ stroke: '#E5E7EB' }} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(79, 70, 229, 0.05)' }} />
                    <Bar dataKey="totalMRR" radius={[6, 6, 0, 0]} animationDuration={1200}>
                        {data.map((_, idx) => (
                            <Cell key={idx} fill={`url(#grad-${idx % COLORS.length})`} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default RevenueChart;
