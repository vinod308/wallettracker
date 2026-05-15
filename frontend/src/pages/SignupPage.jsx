import React from 'react';
import { Link } from 'react-router-dom';
import SignupForm from '../components/auth/SignupForm';
import logo from '../assets/logo.jpeg';

const PERKS = [
    { icon: '📊', text: 'Real-time MRR & revenue tracking' },
    { icon: '🧠', text: 'AI-powered upsell recommendations' },
    { icon: '📋', text: 'Contract & renewal management' },
    { icon: '💼', text: 'Wallet share intelligence' },
    { icon: '✅', text: 'GST-compliant invoicing' },
    { icon: '🔒', text: 'Enterprise-grade security' },
];

const SignupPage = () => {
    return (
        <div className="min-h-screen bg-white flex">

            {/* ── Left Panel ── */}
            <div className="hidden lg:flex lg:w-[45%] bg-white border-r border-gray-100 flex-col justify-between p-12 relative overflow-hidden">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-24 -right-24 w-80 h-80 bg-indigo-50 rounded-full blur-3xl" />
                    <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-purple-50 rounded-full blur-3xl" />
                </div>

                <div className="relative z-10">
                    <Link to="/">
                        <img src={logo} alt="MoneyGence" className="h-9 object-contain" />
                    </Link>
                </div>

                <div className="relative z-10 flex flex-col gap-8">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 leading-tight mb-3">
                            Start tracking revenue.<br />
                            Start growing faster.
                        </h2>
                        <p className="text-gray-500 text-base leading-relaxed">
                            Join agencies that use MoneyGence to track ₹29L+ in monthly revenue and grow wallet share.
                        </p>
                    </div>

                    <div className="space-y-3">
                        {PERKS.map(({ icon, text }) => (
                            <div key={text} className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-base flex-shrink-0 border border-indigo-100">
                                    {icon}
                                </div>
                                <span className="text-sm text-gray-600 font-medium">{text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="relative z-10">
                    <p className="text-gray-400 text-xs">© 2026 MoneyGence · AI Finance OS for Agencies & Businesses.</p>
                </div>
            </div>

            {/* ── Right Panel (form) ── */}
            <div className="w-full lg:w-[55%] flex flex-col items-center justify-center min-h-screen py-8 sm:py-12 px-4 sm:px-8 lg:px-16 bg-gray-50/50">
                <div className="w-full max-w-md">

                    <div className="lg:hidden text-center mb-8">
                        <Link to="/">
                            <img src={logo} alt="MoneyGence" className="h-9 mx-auto object-contain" />
                        </Link>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900">Create your account</h2>
                        <p className="text-sm text-gray-500 mt-1">Start tracking revenue and opportunities today</p>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200 shadow-soft p-5 sm:p-8">
                        <SignupForm />
                    </div>

                    <p className="text-center text-sm text-gray-500 mt-6">
                        Already have an account?{' '}
                        <Link to="/login" className="text-indigo-600 font-semibold hover:underline">
                            Sign in →
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

export default SignupPage;
