/**
 * SubscriptionContext
 * Provides current plan + usage data to the whole app.
 * Fetched once on login, refreshed after any upgrade.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import subscriptionService from '../services/subscriptionService';

const SubscriptionContext = createContext(null);

const DEFAULT = {
    plan:  'free',
    usage: { clients: { current: 0, limit: 5 }, vendors: { current: 0, limit: 5 } },
    history: [],
    planExpiresAt: null,
};

export const SubscriptionProvider = ({ children }) => {
    const [subscription, setSubscription] = useState(DEFAULT);
    const [loading, setLoading]           = useState(true);

    const refresh = useCallback(async () => {
        try {
            const res = await subscriptionService.getCurrent();
            setSubscription(res.data.data);
        } catch {
            // silently keep default on error
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { refresh(); }, [refresh]);

    const isAtLimit = (type) => {
        const u = subscription.usage?.[type];
        if (!u) return false;
        if (u.limit === -1) return false;
        return u.current >= u.limit;
    };

    const usagePercent = (type) => {
        const u = subscription.usage?.[type];
        if (!u || u.limit === -1) return 0;
        return Math.min(100, Math.round((u.current / u.limit) * 100));
    };

    return (
        <SubscriptionContext.Provider value={{ subscription, loading, refresh, isAtLimit, usagePercent }}>
            {children}
        </SubscriptionContext.Provider>
    );
};

export const useSubscription = () => {
    const ctx = useContext(SubscriptionContext);
    if (!ctx) throw new Error('useSubscription must be used inside SubscriptionProvider');
    return ctx;
};
