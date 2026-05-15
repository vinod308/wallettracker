/**
 * PricingPage
 * Public-facing plan comparison page. Accessible at /pricing.
 * Shows all 4 plans with features, limits, and pricing.
 */
import React, { useState, useEffect } from 'react';
import subscriptionService from '../services/subscriptionService';
import { useSubscription } from '../context/SubscriptionContext';
import { useAuth } from '../hooks/useAuth';
import UpgradeModal from '../components/subscription/UpgradeModal';

const CHECK  = () => <span className="text-green-500 font-bold">✓</span>;
const CROSS  = () => <span className="text-gray-300">—</span>;
const fmt    = (n) => n === 0 ? 'Free' : `₹${n.toLocaleString('en-IN')}`;
const fmtYr  = (n) => n === 0 ? '' : `₹${n.toLocaleString('en-IN')}/yr`;
const lim    = (n) => n === -1 ? 'Unlimited' : `Up to ${n}`;

const FEATURES = [
    { label: 'Clients',                    free: '5',         basic: '10',        pro: '500',       enterprise: 'Unlimited' },
    { label: 'Vendors',                    free: '5',         basic: '10',        pro: '500',       enterprise: 'Unlimited' },
    { label: 'Dashboard & KPIs',           free: true,        basic: true,        pro: true,        enterprise: true        },
    { label: 'Invoice Generation (PDF)',   free: true,        basic: true,        pro: true,        enterprise: true        },
    { label: 'GST e-Invoice Sync (IRN)',   free: true,        basic: true,        pro: true,        enterprise: true        },
    { label: 'GST Auto-Sync (via GSP)',    free: false,       basic: true,        pro: true,        enterprise: true        },
    { label: 'Vendor Management',          free: true,        basic: true,        pro: true,        enterprise: true        },
    { label: 'Employee Management',        free: false,       basic: true,        pro: true,        enterprise: true        },
    { label: 'Contracts & Renewals',       free: false,       basic: true,        pro: true,        enterprise: true        },
    { label: 'Reports & Export',           free: false,       basic: true,        pro: true,        enterprise: true        },
    { label: 'Wallet Intelligence',        free: false,       basic: false,       pro: true,        enterprise: true        },
    { label: 'AI Overview',               free: false,       basic: false,       pro: true,        enterprise: true        },
    { label: 'Priority Support',          free: false,       basic: false,       pro: true,        enterprise: true        },
    { label: 'Dedicated Account Manager', free: false,       basic: false,       pro: false,       enterprise: true        },
    { label: 'Custom Integrations',       free: false,       basic: false,       pro: false,       enterprise: true        },
    { label: 'SLA & Uptime Guarantee',    free: false,       basic: false,       pro: false,       enterprise: true        },
];

const PLAN_STYLE = {
    free:       { header: 'bg-gray-50',    btn: 'bg-gray-700 hover:bg-gray-800',     border: 'border-gray-200',  tag: 'bg-gray-100 text-gray-600'   },
    basic:      { header: 'bg-blue-600',   btn: 'bg-blue-600 hover:bg-blue-700',     border: 'border-blue-300',  tag: 'bg-blue-100 text-blue-700'   },
    pro:        { header: 'bg-purple-700', btn: 'bg-purple-700 hover:bg-purple-800', border: 'border-purple-400', tag: 'bg-purple-100 text-purple-700' },
    enterprise: { header: 'bg-amber-600',  btn: 'bg-amber-600 hover:bg-amber-700',   border: 'border-amber-300', tag: 'bg-amber-100 text-amber-700'  },
};

const renderCell = (value) => {
    if (value === true)  return <CHECK />;
    if (value === false) return <CROSS />;
    return <span className="text-sm font-medium text-gray-700">{value}</span>;
};

const PricingPage = () => {
    const [plans,       setPlans]       = useState([]);
    const [loading,     setLoading]     = useState(true);
    const [yearly,      setYearly]      = useState(false);
    const [showUpgrade, setShowUpgrade] = useState(false);
    const { subscription }              = useSubscription();
    const { user }                      = useAuth();

    useEffect(() => {
        subscriptionService.getPlans()
            .then(r => setPlans(r.data.data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const currentPlan = subscription?.plan || 'free';

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-6xl mx-auto">

                {/* Header */}
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Simple, Transparent Pricing</h1>
                    <p className="text-gray-500 text-base mb-6">
                        Start free. Upgrade as you grow. No hidden charges.
                    </p>

                    {/* Billing toggle */}
                    <div className="inline-flex items-center gap-3 bg-white border border-gray-200 rounded-full px-4 py-2">
                        <span className={`text-sm font-medium ${!yearly ? 'text-gray-900' : 'text-gray-400'}`}>Monthly</span>
                        <button
                            onClick={() => setYearly(!yearly)}
                            className={`relative w-10 h-5 rounded-full transition-colors ${yearly ? 'bg-purple-600' : 'bg-gray-300'}`}
                        >
                            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${yearly ? 'translate-x-5' : ''}`} />
                        </button>
                        <span className={`text-sm font-medium ${yearly ? 'text-gray-900' : 'text-gray-400'}`}>
                            Yearly <span className="text-green-600 font-semibold text-xs ml-1">Save 17%</span>
                        </span>
                    </div>
                </div>

                {/* Plan cards */}
                {loading ? (
                    <div className="text-center py-12 text-gray-400">Loading plans…</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
                        {plans.map((plan) => {
                            const style    = PLAN_STYLE[plan.name] || PLAN_STYLE.free;
                            const isCurrent = plan.name === currentPlan;
                            const isPro     = plan.name === 'pro';
                            const isEnterprise = plan.name === 'enterprise';
                            const price    = yearly ? plan.price_yearly : plan.price_monthly;
                            const period   = yearly ? '/yr' : '/mo';

                            return (
                                <div
                                    key={plan.name}
                                    className={`bg-white rounded-2xl border-2 overflow-hidden shadow-sm transition-shadow hover:shadow-md ${
                                        isPro ? 'border-purple-400 ring-2 ring-purple-200' : style.border
                                    }`}
                                >
                                    {/* Card header */}
                                    <div className={`px-5 py-5 ${isPro ? 'bg-purple-700' : plan.name === 'free' ? 'bg-gray-800' : style.header}`}>
                                        {isPro && (
                                            <div className="text-xs font-bold text-purple-200 uppercase tracking-widest mb-1">
                                                Most Popular
                                            </div>
                                        )}
                                        <div className="text-white font-bold text-lg">{plan.label}</div>
                                        <div className="text-white/70 text-xs mt-1">{plan.description}</div>

                                        <div className="mt-4">
                                            {isEnterprise ? (
                                                <div className="text-2xl font-bold text-white">Custom</div>
                                            ) : (
                                                <>
                                                    <span className="text-2xl font-bold text-white">
                                                        {price === 0 ? 'Free' : `₹${price.toLocaleString('en-IN')}`}
                                                    </span>
                                                    {price > 0 && (
                                                        <span className="text-white/60 text-sm ml-1">{period}</span>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Limits */}
                                    <div className="px-5 py-4 border-b border-gray-100">
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-500">Clients</span>
                                            <span className="font-semibold text-gray-900">{lim(plan.max_clients)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Vendors</span>
                                            <span className="font-semibold text-gray-900">{lim(plan.max_vendors)}</span>
                                        </div>
                                    </div>

                                    {/* CTA */}
                                    <div className="px-5 py-4">
                                        {isCurrent ? (
                                            <div className={`w-full text-center py-2 rounded-lg text-sm font-semibold ${style.tag}`}>
                                                Current Plan
                                            </div>
                                        ) : isEnterprise ? (
                                            <a
                                                href="mailto:sales@garagecollective.com?subject=Enterprise Plan Inquiry"
                                                className={`block w-full text-center py-2 rounded-lg text-sm font-semibold text-white ${style.btn} transition-colors`}
                                            >
                                                Contact Sales
                                            </a>
                                        ) : (
                                            <button
                                                onClick={() => setShowUpgrade(true)}
                                                className={`w-full py-2 rounded-lg text-sm font-semibold text-white ${style.btn} transition-colors`}
                                            >
                                                {currentPlan === 'free' ? 'Get Started' : 'Upgrade'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Feature comparison table */}
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
                        <h2 className="text-lg font-bold text-gray-900">Full Feature Comparison</h2>
                        <span className="text-xs text-gray-400 sm:hidden">← scroll →</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50">
                                    <th className="text-left px-6 py-3 text-gray-500 font-medium w-1/2">Feature</th>
                                    {['Free', 'Basic', 'Pro', 'Enterprise'].map(p => (
                                        <th key={p} className="text-center px-4 py-3 text-gray-700 font-semibold">{p}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {FEATURES.map((row, i) => (
                                    <tr key={i} className={`border-b border-gray-50 ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                                        <td className="px-6 py-3 text-gray-700">{row.label}</td>
                                        <td className="px-4 py-3 text-center">{renderCell(row.free)}</td>
                                        <td className="px-4 py-3 text-center">{renderCell(row.basic)}</td>
                                        <td className="px-4 py-3 text-center">{renderCell(row.pro)}</td>
                                        <td className="px-4 py-3 text-center">{renderCell(row.enterprise)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* FAQ */}
                <div className="mt-12 text-center">
                    <p className="text-gray-500 text-sm">
                        Questions? Email us at{' '}
                        <a href="mailto:sales@garagecollective.com" className="text-blue-600 hover:underline">
                            sales@garagecollective.com
                        </a>
                    </p>
                </div>
            </div>

            <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} />
        </div>
    );
};

export default PricingPage;
