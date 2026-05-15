import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import subscriptionService from '../../services/subscriptionService';
import { useSubscription } from '../../context/SubscriptionContext';
import { useAuth } from '../../hooks/useAuth';

const PLANS_CONFIG = {
    basic: {
        gradient: 'from-blue-500 to-blue-600',
        ring: 'ring-blue-200',
        btn: 'bg-blue-600 hover:bg-blue-700',
        badge: 'bg-blue-100 text-blue-700',
        icon: '⚡',
    },
    pro: {
        gradient: 'from-indigo-500 to-purple-600',
        ring: 'ring-purple-200',
        btn: 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700',
        badge: 'bg-purple-100 text-purple-700',
        icon: '🚀',
    },
    enterprise: {
        gradient: 'from-amber-500 to-orange-500',
        ring: 'ring-amber-200',
        btn: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600',
        badge: 'bg-amber-100 text-amber-700',
        icon: '🏢',
    },
};

const fmt = (n) => n === 0 ? 'Free' : `₹${Number(n).toLocaleString('en-IN')}`;
const limitLabel = (n) => n === -1 ? 'Unlimited' : n;

const FEATURES = {
    basic:      ['Up to 10 clients',  'Up to 10 vendors',  'GST invoicing',     'Email reports',      'Standard support'],
    pro:        ['Up to 500 clients', 'Up to 500 vendors', 'GST + AI insights', 'Scheduled reports',  'Priority support'],
    enterprise: ['Unlimited clients', 'Unlimited vendors', 'Custom integrations','Dedicated manager', 'SLA support'],
};

const UpgradeModal = ({ isOpen, onClose, reason }) => {
    const { subscription, refresh } = useSubscription();
    const { user }  = useAuth();
    const navigate  = useNavigate();
    const isAdmin   = user?.role === 'Admin';

    const [plans,     setPlans]     = useState([]);
    const [error,     setError]     = useState('');

    useEffect(() => {
        if (isOpen) {
            subscriptionService.getPlans()
                .then(r => setPlans(r.data.data || []))
                .catch(() => {});
            setError('');
        }
    }, [isOpen]);

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
        if (!isAdmin) return;
        onClose();
        navigate(`/payment?plan=${planName}`);
    };

    const currentPlan = subscription?.plan || 'free';
    const planOrder   = ['free', 'basic', 'pro', 'enterprise'];
    const currentIdx  = planOrder.indexOf(currentPlan);

    // Show only the 3 paid upgrade plans
    const upgradePlans = plans.filter(p => ['basic', 'pro', 'enterprise'].includes(p.name));

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal container */}
            <div
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 sm:px-8 pt-5 sm:pt-8 pb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Choose Your Plan</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {currentPlan !== 'free'
                                ? `You're on the ${currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} plan`
                                : 'You\'re on the Free plan — upgrade to unlock more'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Alerts */}
                <div className="px-4 sm:px-8 space-y-3">
                    {reason && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
                            <strong>Limit reached:</strong> {reason}
                        </div>
                    )}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}
                    {!isAdmin && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">
                            Please ask your <strong>Admin</strong> to upgrade the plan.
                        </div>
                    )}
                </div>

                {/* 3-column plan cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-4 sm:px-8 py-4 sm:py-6">
                    {upgradePlans.map((plan) => {
                        const cfg      = PLANS_CONFIG[plan.name] || PLANS_CONFIG.basic;
                        const isCurrent  = plan.name === currentPlan;
                        const isUpgrade  = planOrder.indexOf(plan.name) > currentIdx;
                        const isPopular  = plan.name === 'pro';
                        const features   = FEATURES[plan.name] || [];

                        return (
                            <div
                                key={plan.name}
                                className={`relative rounded-2xl border-2 flex flex-col overflow-hidden transition-all
                                    ${isCurrent
                                        ? `border-indigo-400 ring-4 ${cfg.ring} shadow-lg`
                                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                                    }`}
                            >
                                {/* Coloured top band */}
                                <div className={`bg-gradient-to-r ${cfg.gradient} px-5 py-4`}>
                                    <div className="flex items-center justify-between">
                                        <span className="text-white text-xl">{cfg.icon}</span>
                                        {isPopular && !isCurrent && (
                                            <span className="text-xs font-bold bg-white/20 text-white px-2.5 py-0.5 rounded-full">
                                                Popular
                                            </span>
                                        )}
                                        {isCurrent && (
                                            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${cfg.badge}`}>
                                                Current
                                            </span>
                                        )}
                                    </div>
                                    <div className="mt-2">
                                        <div className="text-white font-bold text-lg">{plan.label}</div>
                                        <div className="text-white/80 text-xs mt-0.5">{plan.description}</div>
                                    </div>
                                </div>

                                {/* Body */}
                                <div className="p-5 flex flex-col flex-1">
                                    {/* Price */}
                                    <div className="mb-4">
                                        <div className="text-2xl font-bold text-gray-900">
                                            {fmt(plan.price_monthly)}
                                            <span className="text-sm font-normal text-gray-500">/mo</span>
                                        </div>
                                        {plan.price_yearly > 0 && (
                                            <div className="text-xs text-gray-400 mt-0.5">
                                                ₹{Number(plan.price_yearly).toLocaleString('en-IN')}/yr · save 17%
                                            </div>
                                        )}
                                    </div>

                                    {/* Limits */}
                                    <div className="flex gap-3 mb-4">
                                        <div className="flex-1 bg-gray-50 rounded-xl p-2.5 text-center">
                                            <div className="text-lg font-bold text-gray-900">
                                                {limitLabel(plan.max_clients)}
                                            </div>
                                            <div className="text-[11px] text-gray-500">Clients</div>
                                        </div>
                                        <div className="flex-1 bg-gray-50 rounded-xl p-2.5 text-center">
                                            <div className="text-lg font-bold text-gray-900">
                                                {limitLabel(plan.max_vendors)}
                                            </div>
                                            <div className="text-[11px] text-gray-500">Vendors</div>
                                        </div>
                                    </div>

                                    {/* Features */}
                                    <ul className="space-y-1.5 mb-5 flex-1">
                                        {features.map(f => (
                                            <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                                                <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                                </svg>
                                                {f}
                                            </li>
                                        ))}
                                    </ul>

                                    {/* CTA */}
                                    {isCurrent ? (
                                        <div className="w-full py-2.5 rounded-xl text-center text-sm font-semibold bg-gray-100 text-gray-400">
                                            Current Plan
                                        </div>
                                    ) : isAdmin && isUpgrade ? (
                                        <button
                                            onClick={() => handleUpgrade(plan.name)}
                                            className={`w-full py-2.5 rounded-xl text-white text-sm font-semibold
                                                        transition-all shadow-sm ${cfg.btn}`}
                                        >
                                            Upgrade to {plan.label}
                                        </button>
                                    ) : (
                                        <div className="w-full py-2.5 rounded-xl text-center text-sm font-semibold bg-gray-50 text-gray-400 border border-gray-200">
                                            {planOrder.indexOf(plan.name) < currentIdx ? 'Downgrade' : 'Unavailable'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="px-4 sm:px-8 pb-5 sm:pb-6 text-center">
                    <p className="text-xs text-gray-400">
                        All plans include Dashboard, Reports, Invoicing & GST integration.
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
