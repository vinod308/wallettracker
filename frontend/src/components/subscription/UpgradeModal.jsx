import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const PLANS = [
    {
        name: 'basic',
        label: 'Basic',
        price: '₹2,990',
        sub: 'Up to 10 clients · + GST',
        extra: '₹200/mo per extra client (11th+)',
        gradient: 'from-blue-500 to-blue-600',
        btn: 'bg-blue-600 hover:bg-blue-700 text-white',
        btnLabel: 'Get Started',
        icon: '⚡',
        popular: false,
        features: [
            { ok: true,  text: 'Client & invoice management' },
            { ok: true,  text: 'GST-compliant invoices (PDF)' },
            { ok: true,  text: 'Vendor portal (up to 10)' },
            { ok: true,  text: 'Employee payroll tracking' },
            { ok: true,  text: 'Basic financial reports' },
            { ok: false, text: 'AI Finance Assistant' },
        ],
    },
    {
        name: 'pro',
        label: 'Pro',
        price: '₹5,990',
        sub: 'Up to 50 clients · + GST',
        extra: null,
        gradient: 'from-indigo-500 to-purple-600',
        btn: 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white',
        btnLabel: 'Start Free Trial',
        icon: '🚀',
        popular: true,
        features: [
            { ok: true, text: 'Everything in Basic' },
            { ok: true, text: 'Unlimited GST invoices' },
            { ok: true, text: 'Unlimited vendor portal' },
            { ok: true, text: 'AI Finance Assistant' },
            { ok: true, text: 'Advanced reports & analytics' },
            { ok: true, text: 'Priority support' },
        ],
    },
    {
        name: 'enterprise',
        label: 'Enterprise',
        price: '₹12,999',
        sub: 'Unlimited clients · + GST',
        extra: null,
        gradient: 'from-amber-500 to-orange-500',
        btn: 'border-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50',
        btnLabel: 'Contact Sales',
        icon: '🏢',
        popular: false,
        features: [
            { ok: true, text: 'Everything in Pro' },
            { ok: true, text: 'Custom integrations (API)' },
            { ok: true, text: 'Dedicated account manager' },
            { ok: true, text: 'SLA & uptime guarantee' },
            { ok: true, text: 'Multi-company support' },
            { ok: true, text: 'Custom onboarding' },
        ],
    },
];

const UpgradeModal = ({ isOpen, onClose, reason }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isAdmin  = user?.role === 'Admin';

    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleUpgrade = (planName) => {
        onClose();
        navigate(`/payment?plan=${planName}`);
    };

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between px-6 sm:px-8 pt-6 sm:pt-8 pb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Upgrade Your Plan</h2>
                        <p className="text-sm text-gray-500 mt-1">Simple, transparent pricing. No hidden fees.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600 flex-shrink-0"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Reason banner */}
                {reason && (
                    <div className="mx-6 sm:mx-8 mb-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
                        <strong>Limit reached:</strong> {reason}
                    </div>
                )}

                {/* Non-admin notice */}
                {!isAdmin && (
                    <div className="mx-6 sm:mx-8 mb-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">
                        Please ask your <strong>Admin</strong> to upgrade the plan.
                    </div>
                )}

                {/* Plan cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 px-6 sm:px-8 py-5 sm:py-6">
                    {PLANS.map((plan) => (
                        <div
                            key={plan.name}
                            className={`relative rounded-2xl border-2 flex flex-col overflow-visible transition-all
                                ${plan.popular
                                    ? 'border-indigo-500 shadow-lg shadow-indigo-100'
                                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                                }`}
                        >
                            {/* Popular badge */}
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                                    <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-sm whitespace-nowrap">
                                        MOST POPULAR
                                    </span>
                                </div>
                            )}

                            {/* Coloured top band */}
                            <div className={`bg-gradient-to-r ${plan.gradient} px-5 py-4 rounded-t-2xl`}>
                                <div className="flex items-center justify-between">
                                    <span className="text-white text-xl">{plan.icon}</span>
                                </div>
                                <div className="mt-2">
                                    <div className="text-white font-bold text-lg">{plan.label}</div>
                                </div>
                            </div>

                            {/* Body */}
                            <div className={`p-5 flex flex-col flex-1 ${plan.popular ? 'bg-gradient-to-b from-indigo-50/40 to-white' : 'bg-white'} rounded-b-2xl`}>
                                {/* Price */}
                                <div className="mb-1">
                                    <div className="text-3xl font-extrabold text-gray-900">
                                        {plan.price}
                                        <span className="text-sm font-normal text-gray-500">/mo</span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-0.5">{plan.sub}</p>
                                    {plan.extra && (
                                        <p className="text-xs text-indigo-600 font-semibold mt-0.5">{plan.extra}</p>
                                    )}
                                </div>

                                {/* Divider */}
                                <div className="border-t border-gray-100 my-4" />

                                {/* Features */}
                                <ul className="space-y-2 mb-6 flex-1">
                                    {plan.features.map((f, i) => (
                                        <li key={i} className="flex items-center gap-2 text-sm">
                                            {f.ok ? (
                                                <span className="text-green-500 font-bold text-base leading-none">✓</span>
                                            ) : (
                                                <span className="text-gray-300 font-bold text-base leading-none">✗</span>
                                            )}
                                            <span className={f.ok ? (plan.popular ? 'text-gray-800 font-medium' : 'text-gray-600') : 'text-gray-400'}>
                                                {f.text}
                                            </span>
                                        </li>
                                    ))}
                                </ul>

                                {/* CTA */}
                                {isAdmin ? (
                                    <button
                                        onClick={() => handleUpgrade(plan.name)}
                                        className={`w-full py-3 rounded-xl text-sm font-bold transition-all shadow-sm ${plan.btn}`}
                                    >
                                        {plan.btnLabel}
                                    </button>
                                ) : (
                                    <div className="w-full py-3 rounded-xl text-center text-sm font-semibold bg-gray-100 text-gray-400 cursor-not-allowed">
                                        Admin only
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="px-6 sm:px-8 pb-6 text-center">
                    <p className="text-xs text-gray-400">
                        All plans include Dashboard, Reports, Invoicing & GST integration. Cancel anytime.
                        Need help?{' '}
                        <a href="mailto:support@moneygence.com" className="text-indigo-600 hover:underline">
                            Contact support
                        </a>
                    </p>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default UpgradeModal;
