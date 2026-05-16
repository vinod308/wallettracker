import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo-3.jpeg';

const FEATURES = [
    { icon: '📊', title: 'Revenue Intelligence', desc: 'Track MRR, YTD revenue, and per-client wallet share in real-time with animated KPI cards.' },
    { icon: '🧠', title: 'AI-Powered Insights', desc: 'Get AI-generated growth recommendations and smart upsell opportunities across all clients.' },
    { icon: '📋', title: 'Contract Management', desc: 'Never miss a renewal — monitor expiry dates, status changes, and negotiation pipelines.' },
    { icon: '💼', title: 'Wallet Share Analytics', desc: 'Understand what percentage of client spend you own, and where the growth headroom is.' },
    { icon: '⬆️', title: 'Upsell Engine', desc: "Identify services your clients don't have yet and surface high-probability expansion deals." },
    { icon: '👥', title: 'Multi-Team Access', desc: 'Role-based portals for admins, account managers, employees, and vendors — all secure.' },
];

const STATS = [
    { value: '10+', label: 'Active Clients' },
    { value: '₹29L+', label: 'Monthly Revenue' },
    { value: '9', label: 'Service Categories' },
    { value: '100%', label: 'Secure & GST Ready' },
];

const BADGES = [
    { icon: '✅', label: 'GST Ready' },
    { icon: '🔒', label: 'Enterprise Secure' },
    { icon: '🤖', label: 'AI Powered' },
    { icon: '👥', label: 'Multi-Team Access' },
];

const STEPS = [
    { step: '01', title: 'Onboard Clients', desc: 'Add clients and their monthly service details with our guided onboarding flow.' },
    { step: '02', title: 'Track Revenue', desc: 'Generate invoices, monitor MRR, and track payment status — all in one place.' },
    { step: '03', title: 'Grow Wallet Share', desc: 'Act on AI-powered upsell recommendations and grow revenue per client.' },
];

const PLANS = [
    {
        name: 'Basic',
        price: '₹2,990',
        period: '/month',
        limit: 'Up to 10 clients & vendors',
        description: 'Perfect for small agencies getting started.',
        features: [
            '10 Clients & Vendors',
            'GST Invoice Generation',
            'Dashboard & KPIs',
            'Vendor Management',
            'Email Reports',
            'Standard Support',
        ],
        cta: 'Get Started',
        popular: false,
        style: {
            card: 'border-gray-200',
            badge: '',
            btn: 'bg-gray-900 hover:bg-gray-800 text-white',
            header: 'bg-gray-50',
            price: 'text-gray-900',
        },
    },
    {
        name: 'Pro',
        price: '₹5,990',
        period: '/month',
        limit: 'Up to 500 clients & vendors',
        description: 'For growing agencies managing multiple clients.',
        features: [
            '500 Clients & Vendors',
            'GST + AI Finance Insights',
            'Wallet Share Intelligence',
            'Contracts & Renewals',
            'Scheduled Reports & Export',
            'Priority Support',
        ],
        cta: 'Start Free Trial',
        popular: true,
        style: {
            card: 'border-indigo-400 ring-2 ring-indigo-100',
            badge: 'Most Popular',
            btn: 'bg-indigo-600 hover:bg-indigo-700 text-white',
            header: 'bg-indigo-600',
            price: 'text-white',
        },
    },
    {
        name: 'Enterprise',
        price: '₹12,999',
        period: '/month',
        limit: 'Unlimited clients & vendors',
        description: 'For large teams with custom needs and SLA.',
        features: [
            'Unlimited Clients & Vendors',
            'Custom Integrations',
            'Dedicated Account Manager',
            'SLA & Uptime Guarantee',
            'Custom AI Models',
            'On-premise Option',
        ],
        cta: 'Book a Call',
        popular: false,
        style: {
            card: 'border-amber-300',
            badge: '',
            btn: 'bg-amber-500 hover:bg-amber-600 text-white',
            header: 'bg-amber-500',
            price: 'text-white',
        },
    },
];

const CHECK = () => (
    <svg className="w-4 h-4 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
);

const LandingPage = () => {
    return (
        <div className="min-h-screen bg-white font-sans">

            {/* ── Navbar ── */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <img src={logo} alt="MoneyGence" className="h-14 max-w-[200px] object-contain" />
                        <div className="flex items-center gap-3">
                            <Link
                                to="/login"
                                className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Sign In
                            </Link>
                            <Link
                                to="/signup"
                                className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-all shadow-sm hover:shadow-md hover:shadow-indigo-200"
                            >
                                Get Started Free
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* ── Hero ── */}
            <section className="pt-28 pb-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-700 text-sm font-medium mb-8">
                        <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                        Trusted by India's fastest-growing agencies
                    </div>

                    <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-[1.1] tracking-tight mb-6">
                        Track Revenue.<br />
                        <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            Grow Wallet Share.
                        </span>
                    </h1>

                    <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed mb-10">
                        The complete revenue intelligence platform for agencies. Monitor clients, track wallet share,
                        uncover upsell opportunities — all in one beautiful dashboard.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
                        <Link
                            to="/signup"
                            className="flex items-center gap-2 px-7 py-3.5 bg-indigo-600 text-white text-base font-semibold rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-200/60 transition-all hover:-translate-y-0.5 active:translate-y-0"
                        >
                            ⚡ Start Free Trial
                        </Link>
                        <Link
                            to="/signup"
                            className="flex items-center gap-2 px-7 py-3.5 bg-white border border-gray-200 text-gray-700 text-base font-semibold rounded-2xl hover:border-gray-300 hover:bg-gray-50 transition-all"
                        >
                            📺 Book Live Demo
                        </Link>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-3">
                        {BADGES.map(({ icon, label }) => (
                            <span
                                key={label}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-gray-200 text-gray-600 text-sm font-medium rounded-full shadow-sm hover:shadow-md hover:border-indigo-200 hover:text-indigo-700 transition-all cursor-default"
                            >
                                {icon} {label}
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Stats ── */}
            <section className="py-16 bg-gradient-to-b from-gray-50 to-white border-y border-gray-100">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
                        {STATS.map(({ value, label }) => (
                            <div key={label} className="group">
                                <div className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-1 group-hover:scale-105 transition-transform">
                                    {value}
                                </div>
                                <div className="text-sm text-gray-500 font-medium">{label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Features ── */}
            <section className="py-24 px-4 sm:px-6 lg:px-8">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-4">
                            Everything you need to grow revenue
                        </h2>
                        <p className="text-lg text-gray-500 max-w-xl mx-auto">
                            Purpose-built for agencies tracking multiple clients, services, and growth targets.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {FEATURES.map(({ icon, title, desc }) => (
                            <div
                                key={title}
                                className="group bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-xl hover:-translate-y-1 hover:border-indigo-100 transition-all duration-300"
                            >
                                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:bg-indigo-100 transition-colors">
                                    {icon}
                                </div>
                                <h3 className="text-base font-semibold text-gray-900 mb-2">{title}</h3>
                                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── How it works ── */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50/80">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-14">
                        <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-3">How It Works</h2>
                        <p className="text-gray-500">Get started in minutes. See results in days.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                        {STEPS.map(({ step, title, desc }, i) => (
                            <div key={step} className="relative text-center group">
                                {i < STEPS.length - 1 && (
                                    <div className="hidden sm:block absolute top-6 left-[60%] right-0 h-px bg-gradient-to-r from-indigo-200 to-transparent" />
                                )}
                                <div className="w-12 h-12 bg-indigo-600 text-white text-sm font-bold rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform">
                                    {step}
                                </div>
                                <h3 className="text-base font-semibold text-gray-900 mb-2">{title}</h3>
                                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Pricing ── */}
            <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-14">
                        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-4">
                            Simple, Transparent Pricing
                        </h2>
                        <p className="text-lg text-gray-500 max-w-xl mx-auto">
                            Start free. Upgrade as you grow. No hidden charges.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {PLANS.map((plan) => (
                            <div
                                key={plan.name}
                                className={`relative rounded-2xl border-2 overflow-hidden shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 ${plan.style.card}`}
                            >
                                {plan.popular && (
                                    <div className="absolute top-0 left-0 right-0 flex justify-center">
                                        <span className="bg-indigo-600 text-white text-xs font-bold px-4 py-1 rounded-b-xl tracking-widest uppercase">
                                            Most Popular
                                        </span>
                                    </div>
                                )}

                                {/* Header */}
                                <div className={`px-6 pt-${plan.popular ? '8' : '6'} pb-6 ${plan.popular ? 'bg-indigo-600' : plan.name === 'Enterprise' ? 'bg-amber-500' : 'bg-gray-800'}`}>
                                    <div className={`font-bold text-xl ${plan.popular || plan.name === 'Enterprise' ? 'text-white' : 'text-white'}`}>
                                        {plan.name}
                                    </div>
                                    <div className={`text-sm mt-1 ${plan.popular || plan.name === 'Enterprise' ? 'text-white/70' : 'text-white/60'}`}>
                                        {plan.description}
                                    </div>
                                    <div className="mt-4 flex items-end gap-1">
                                        <span className="text-3xl font-bold text-white">{plan.price}</span>
                                        <span className="text-white/60 text-sm mb-0.5">{plan.period}</span>
                                    </div>
                                    <div className={`text-xs mt-1 font-medium ${plan.popular || plan.name === 'Enterprise' ? 'text-white/60' : 'text-white/50'}`}>
                                        {plan.limit}
                                    </div>
                                </div>

                                {/* Features */}
                                <div className="px-6 py-6 flex flex-col flex-1">
                                    <ul className="space-y-3 mb-6">
                                        {plan.features.map(f => (
                                            <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                                                <CHECK />
                                                {f}
                                            </li>
                                        ))}
                                    </ul>

                                    <Link
                                        to="/signup"
                                        className={`block w-full text-center py-3 rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-md ${plan.style.btn}`}
                                    >
                                        {plan.cta}
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>

                    <p className="text-center text-sm text-gray-400 mt-8">
                        All plans include a 14-day free trial. No credit card required.
                        Questions? <a href="mailto:sales@moneygence.com" className="text-indigo-600 hover:underline">Contact us</a>
                    </p>
                </div>
            </section>

            {/* ── Testimonial / Trust ── */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50/80">
                <div className="max-w-3xl mx-auto text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-50 rounded-2xl text-3xl mb-6">
                        💬
                    </div>
                    <blockquote className="text-xl font-medium text-gray-800 italic leading-relaxed mb-6">
                        "MoneyGence gave us complete visibility into our wallet share. We identified ₹8L in upsell
                        opportunities in the first month."
                    </blockquote>
                    <div className="flex items-center justify-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                            G
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-semibold text-gray-900">Garage Media</p>
                            <p className="text-xs text-gray-500">Revenue Intelligence · ₹29L+ MRR Tracked</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── CTA Banner ── */}
            <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 relative overflow-hidden">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-32 -right-32 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
                    <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl" />
                </div>
                <div className="relative max-w-3xl mx-auto text-center">
                    <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">
                        Ready to grow your wallet share?
                    </h2>
                    <p className="text-lg text-indigo-200 mb-8 max-w-xl mx-auto">
                        Join agencies already tracking ₹29L+ in monthly revenue with MoneyGence.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            to="/signup"
                            className="flex items-center gap-2 px-8 py-4 bg-white text-indigo-600 text-base font-bold rounded-2xl hover:bg-indigo-50 shadow-xl transition-all hover:-translate-y-0.5"
                        >
                            ⚡ Start Free Trial
                        </Link>
                        <Link
                            to="/login"
                            className="flex items-center gap-2 px-8 py-4 border-2 border-white/30 text-white text-base font-semibold rounded-2xl hover:bg-white/10 transition-all"
                        >
                            Sign In →
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── Footer ── */}
            <footer className="py-10 px-4 border-t border-gray-100 bg-white">
                <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <img src={logo} alt="MoneyGence" className="h-12 max-w-[180px] object-contain" />
                    <p className="text-sm text-gray-400">© 2026 MoneyGence. AI Finance OS for Agencies & Businesses.</p>
                    <div className="flex items-center gap-5 text-sm text-gray-500">
                        <Link to="/login" className="hover:text-gray-700 transition-colors">Login</Link>
                        <Link to="/signup" className="hover:text-gray-700 transition-colors">Sign Up</Link>
                        <a href="mailto:sales@moneygence.com" className="hover:text-gray-700 transition-colors">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
