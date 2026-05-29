import React from 'react';
import { Link } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';
import logo from '../assets/logo-3.jpeg';

const AppMockup = () => (
    <div className="rounded-2xl overflow-hidden border border-gray-200/80 shadow-2xl bg-white">
        {/* Browser chrome */}
        <div className="bg-gray-800 px-3 py-2 flex items-center gap-2">
            <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
            </div>
            <div className="flex-1 flex justify-center">
                <div className="bg-gray-700 rounded-md px-6 py-0.5 text-[9px] text-gray-400">
                    app.moneygence.com/dashboard
                </div>
            </div>
        </div>

        {/* App UI */}
        <div className="flex h-[220px]">
            {/* Sidebar */}
            <div className="w-14 bg-white border-r border-gray-100 flex flex-col gap-2 pt-3 px-2 flex-shrink-0">
                <div className="h-1.5 w-8 bg-indigo-500 rounded-full mb-1" />
                {[80, 65, 75, 55, 70, 60].map((w, i) => (
                    <div
                        key={i}
                        className={`h-1.5 rounded-full transition-colors ${i === 0 ? 'bg-indigo-100' : 'bg-gray-100'}`}
                        style={{ width: `${w}%` }}
                    />
                ))}
            </div>

            {/* Main Content */}
            <div className="flex-1 bg-gray-50 p-2.5 overflow-hidden">
                {/* Top bar */}
                <div className="flex justify-between items-center mb-2">
                    <div className="h-2 w-20 bg-gray-800 rounded" />
                    <div className="h-5 w-16 bg-indigo-50 border border-indigo-100 rounded-lg" />
                </div>

                {/* KPI cards */}
                <div className="grid grid-cols-3 gap-1.5 mb-2">
                    {[
                        { val: '₹29.4L', sub: 'Total MRR', color: 'text-indigo-700' },
                        { val: '10', sub: 'Clients', color: 'text-green-700' },
                        { val: '94%', sub: 'Retention', color: 'text-violet-700' },
                    ].map(({ val, sub, color }) => (
                        <div key={sub} className="bg-white rounded-lg p-1.5 border border-gray-100 shadow-sm">
                            <div className={`text-[10px] font-bold ${color}`}>{val}</div>
                            <div className="text-[7px] text-gray-400 mt-0.5">{sub}</div>
                        </div>
                    ))}
                </div>

                {/* Bar chart */}
                <div className="bg-white rounded-lg p-2 border border-gray-100 mb-1.5">
                    <div className="flex justify-between items-center mb-1.5">
                        <div className="h-1.5 w-20 bg-gray-200 rounded" />
                        <div className="flex gap-1">
                            <div className="h-1.5 w-5 bg-indigo-100 rounded" />
                            <div className="h-1.5 w-5 bg-gray-100 rounded" />
                        </div>
                    </div>
                    <div className="flex items-end gap-1 h-12">
                        {[50, 75, 45, 90, 60, 80, 55, 85, 65, 70].map((h, i) => (
                            <div
                                key={i}
                                className="flex-1 rounded-t"
                                style={{
                                    height: `${h}%`,
                                    background: `hsl(${238 - i * 6}, 65%, ${52 + (i % 3) * 6}%)`,
                                }}
                            />
                        ))}
                    </div>
                </div>

                {/* Client table */}
                <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
                    {[
                        { name: 'Acme Corp', mrr: '3.1L', status: 'Active', risk: false },
                        { name: 'TechFlow Inc', mrr: '1.8L', status: 'Risk', risk: true },
                        { name: 'BrandX Media', mrr: '2.4L', status: 'Active', risk: false },
                    ].map(({ name, mrr, status, risk }, i) => (
                        <div key={name} className={`flex items-center gap-1.5 px-2 py-1 ${i < 2 ? 'border-b border-gray-50' : ''}`}>
                            <div className="w-3 h-3 rounded-full bg-indigo-100 flex-shrink-0" />
                            <div className="text-[8px] text-gray-700 flex-1 font-medium truncate">{name}</div>
                            <div className="text-[8px] font-bold text-gray-600">₹{mrr}</div>
                            <div className={`text-[6px] px-1 py-0.5 rounded font-semibold ${risk ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`}>
                                {status}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

const LoginPage = () => {
    return (
        <div className="min-h-screen bg-white flex">

            {/* ── Left Panel ── */}
            <div className="hidden lg:flex lg:w-[45%] bg-white border-r border-gray-100 flex-col justify-between p-12 relative overflow-hidden">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-24 -right-24 w-80 h-80 bg-indigo-50 rounded-full blur-3xl" />
                    <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-purple-50 rounded-full blur-3xl" />
                </div>

                {/* Logo */}
                <div className="relative z-10">
                    <Link to="/">
                        <img src={logo} alt="MoneyGence" className="h-14 max-w-[220px] object-contain" />
                    </Link>
                </div>

                {/* Middle content */}
                <div className="relative z-10 flex flex-col gap-6">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 leading-tight mb-3">
                            Revenue intelligence<br />for agencies & service businesses.
                        </h2>
                        <p className="text-gray-500 text-base leading-relaxed">
                            Track wallet share, identify upsells, and manage client revenue — all in one place.
                        </p>
                    </div>

                    <AppMockup />
                </div>

                {/* Footer */}
                <div className="relative z-10">
                    <p className="text-gray-400 text-xs">© 2026 MoneyGence · AI Finance OS for Agencies & Businesses.</p>
                </div>
            </div>

            {/* ── Right Panel (form) ── */}
            <div className="w-full lg:w-[55%] flex flex-col items-center justify-center min-h-screen py-8 sm:py-12 px-4 sm:px-8 lg:px-16 bg-gray-50/50">
                <div className="w-full max-w-md">

                    {/* Mobile logo */}
                    <div className="lg:hidden text-center mb-8">
                        <Link to="/">
                            <img src={logo} alt="MoneyGence" className="h-14 max-w-[220px] mx-auto object-contain" />
                        </Link>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
                        <p className="text-sm text-gray-500 mt-1">Sign in to your account to continue</p>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200 shadow-soft p-5 sm:p-8">
                        <LoginForm />
                    </div>

                    <p className="text-center text-sm text-gray-500 mt-6">
                        Don't have an account?{' '}
                        <Link to="/signup" className="text-indigo-600 font-semibold hover:underline">
                            Sign up free →
                        </Link>
                    </p>

                    <p className="text-center text-xs text-gray-400 mt-4">
                        <Link to="/" className="hover:text-gray-600 transition-colors">← Back to home</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
