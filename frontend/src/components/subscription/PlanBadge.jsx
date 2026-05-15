/**
 * PlanBadge
 * Compact plan widget for the sidebar — shows plan name, usage bars, and upgrade button.
 */
import React, { useState } from 'react';
import { useSubscription } from '../../context/SubscriptionContext';
import UpgradeModal from './UpgradeModal';

const PLAN_STYLE = {
    free:       'bg-gray-100  text-gray-700',
    basic:      'bg-blue-100  text-blue-700',
    pro:        'bg-purple-100 text-purple-700',
    enterprise: 'bg-amber-100 text-amber-700',
};

const BAR_COLOR = {
    free:       'bg-gray-400',
    basic:      'bg-blue-500',
    pro:        'bg-purple-500',
    enterprise: 'bg-amber-500',
};

const limitLabel = (n) => n === -1 ? '∞' : n;

const UsageBar = ({ label, current, limit, planName }) => {
    if (limit === -1) return (
        <div className="flex justify-between text-xs text-gray-400">
            <span>{label}</span><span className="font-medium text-gray-600">{current} / ∞</span>
        </div>
    );
    const pct  = Math.min(100, Math.round((current / limit) * 100));
    const warn = pct >= 80;
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-xs">
                <span className="text-gray-400">{label}</span>
                <span className={`font-medium ${warn ? 'text-amber-600' : 'text-gray-600'}`}>
                    {current} / {limit}
                </span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all ${warn ? 'bg-amber-400' : BAR_COLOR[planName] || 'bg-blue-400'}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
};

const PlanBadge = () => {
    const { subscription, loading } = useSubscription();
    const [showUpgrade, setShowUpgrade] = useState(false);

    if (loading) return null;

    const plan   = subscription?.plan || 'free';
    const usage  = subscription?.usage || {};
    const label  = plan.charAt(0).toUpperCase() + plan.slice(1);

    return (
        <>
            <div className="mx-3 mb-3 p-3 bg-gray-800 rounded-xl border border-gray-700">
                {/* Plan name */}
                <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${PLAN_STYLE[plan] || PLAN_STYLE.free}`}>
                        {label} Plan
                    </span>
                    {plan !== 'enterprise' && (
                        <button
                            onClick={() => setShowUpgrade(true)}
                            className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
                        >
                            Upgrade →
                        </button>
                    )}
                </div>

                {/* Usage bars */}
                <div className="space-y-2">
                    {usage.clients && (
                        <UsageBar
                            label="Clients"
                            current={usage.clients.current}
                            limit={usage.clients.limit}
                            planName={plan}
                        />
                    )}
                    {usage.vendors && (
                        <UsageBar
                            label="Vendors"
                            current={usage.vendors.current}
                            limit={usage.vendors.limit}
                            planName={plan}
                        />
                    )}
                </div>
            </div>

            <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} />
        </>
    );
};

export default PlanBadge;
