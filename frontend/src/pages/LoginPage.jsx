import React from 'react';
import { Link } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';
import logo from '../assets/logo.png';

const LEFT_STATS = [
    { value: '10+', label: 'Active Clients' },
    { value: '₹29L+', label: 'MRR Tracked' },
    { value: '9', label: 'Services Tracked' },
    { value: '100%', label: 'GST Compliant' },
];

const LoginPage = () => {
    return (
        <div className="min-h-screen bg-white flex">

            {/* ── Left Panel (brand + stats) ── */}
            <div className="hidden lg:flex lg:w-[45%] bg-white border-r border-gray-100 flex-col justify-between p-12 relative overflow-hidden">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-24 -right-24 w-80 h-80 bg-indigo-50 rounded-full blur-3xl" />
                    <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-purple-50 rounded-full blur-3xl" />
                </div>

                {/* Logo */}
                <div className="relative z-10">
                    <Link to="/">
                        <img src={logo} alt="GarageWallet" className="h-9 object-contain" />
                    </Link>
                </div>

                {/* Middle content */}
                <div className="relative z-10 flex flex-col gap-8">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 leading-tight mb-3">
                            Revenue intelligence<br />for agencies that grow.
                        </h2>
                        <p className="text-gray-500 text-base leading-relaxed">
                            Track wallet share, identify upsells, and manage client revenue — all in one place.
                        </p>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-2 gap-3">
                        {LEFT_STATS.map(({ value, label }) => (
                            <div key={label} className="bg-gray-50 rounded-2xl p-4 border border-gray-100 hover:bg-indigo-50 hover:border-indigo-100 transition-colors">
                                <div className="text-2xl font-bold text-indigo-700">{value}</div>
                                <div className="text-xs text-gray-500 mt-0.5 font-medium">{label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Feature pills */}
                    <div className="flex flex-wrap gap-2">
                        {['GST Ready', 'AI Powered', 'Enterprise Secure', 'Multi-Team'].map(f => (
                            <span key={f} className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
                                {f}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="relative z-10">
                    <p className="text-gray-400 text-xs">© 2026 GarageWallet · Built for agencies that grow.</p>
                </div>
            </div>

            {/* ── Right Panel (form) ── */}
            <div className="w-full lg:w-[55%] flex flex-col items-center justify-center min-h-screen py-8 sm:py-12 px-4 sm:px-8 lg:px-16 bg-gray-50/50">
                <div className="w-full max-w-md">

                    {/* Mobile logo */}
                    <div className="lg:hidden text-center mb-8">
                        <Link to="/">
                            <img src={logo} alt="GarageWallet" className="h-9 mx-auto object-contain" />
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
