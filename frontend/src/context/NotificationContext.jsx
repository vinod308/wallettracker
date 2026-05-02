/**
 * Notification Context
 * Tracks dashboard data-change events and surfaces them as a single
 * "latest notification" in the header bell icon.
 *
 * Rules:
 *  - Only ONE notification is kept at a time (latest replaces previous)
 *  - A notification is created whenever: revenue updates, status changes,
 *    new client data loads, or a manual record is added
 */

import React, { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
    // Single latest notification — new events replace the old one
    const [notification, setNotification] = useState(null);

    /**
     * Add (or replace) the current notification.
     * @param {string} title   - Primary message, e.g. "Revenue updated for Client X – July"
     * @param {string} [description] - Optional secondary detail line
     * @param {string} [type]  - 'revenue_update' | 'status_change' | 'new_client' | 'data_loaded' | 'manual_add'
     */
    const addNotification = useCallback((title, description = '', type = 'data_loaded') => {
        const now = new Date();
        const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        setNotification({
            id: Date.now(),
            title,
            description,
            type,
            time,
            timestamp: now.getTime(),
        });
    }, []);

    const clearNotification = useCallback(() => {
        setNotification(null);
    }, []);

    return (
        <NotificationContext.Provider value={{ notification, addNotification, clearNotification }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const ctx = useContext(NotificationContext);
    if (!ctx) throw new Error('useNotifications must be used within a NotificationProvider');
    return ctx;
};
