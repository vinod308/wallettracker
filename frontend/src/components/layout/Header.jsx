/**
 * Header Component
 * Top navigation bar with logo, notifications, and profile dropdown.
 * Notification bell shows the latest data-change event from NotificationContext.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../context/NotificationContext';
import logo from '../../assets/logo.png';

// Icon map for notification types
const notifIcon = (type) => {
    switch (type) {
        case 'revenue_update': return '💰';
        case 'status_change':  return '⚠️';
        case 'new_client':     return '🆕';
        case 'manual_add':     return '✏️';
        default:               return '🔔';
    }
};

const Header = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { notification, clearNotification } = useNotifications();

    const [showProfileMenu, setShowProfileMenu]       = useState(false);
    const [showNotifications, setShowNotifications]   = useState(false);

    // Close dropdowns when clicking outside
    const notifRef   = useRef(null);
    const profileRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setShowNotifications(false);
            }
            if (profileRef.current && !profileRef.current.contains(e.target)) {
                setShowProfileMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const hasNotification = notification !== null;

    return (
        <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
            <div className="px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex items-center">
                        <img src={logo} alt="Garage WalletTracker" className="h-9 w-auto object-contain" />
                    </div>

                    {/* Right Side: Notifications + Profile */}
                    <div className="flex items-center gap-4">

                        {/* Notification Bell */}
                        <div className="relative" ref={notifRef}>
                            <button
                                onClick={() => setShowNotifications(prev => !prev)}
                                className="relative p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-colors duration-200"
                                aria-label="Notifications"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                                    />
                                </svg>
                                {/* Red dot badge — only shown when there's a notification */}
                                {hasNotification && (
                                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                                )}
                            </button>

                            {/* Notifications Dropdown */}
                            {showNotifications && (
                                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-dropdown border border-gray-100 py-2 z-50">
                                    <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
                                        <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                                        {hasNotification && (
                                            <button
                                                onClick={clearNotification}
                                                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                                            >
                                                Dismiss
                                            </button>
                                        )}
                                    </div>

                                    {!hasNotification ? (
                                        <div className="px-4 py-8 text-center">
                                            <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                                </svg>
                                            </div>
                                            <p className="text-sm text-gray-500">No notifications</p>
                                            <p className="text-xs text-gray-400 mt-1">Changes will appear here</p>
                                        </div>
                                    ) : (
                                        <div className="px-4 py-3">
                                            <div className="flex items-start gap-3 p-3 bg-blue-50/60 rounded-xl border border-blue-100/80">
                                                <span className="text-lg leading-none mt-0.5">{notifIcon(notification.type)}</span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 leading-snug">
                                                        {notification.title}
                                                    </p>
                                                    {notification.description && (
                                                        <p className="text-xs text-gray-500 mt-0.5">
                                                            {notification.description}
                                                        </p>
                                                    )}
                                                    <p className="text-xs text-blue-500 mt-1 font-medium">
                                                        {notification.time}
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-400 text-center mt-2">
                                                Only the latest change is shown
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Profile Dropdown */}
                        <div className="relative" ref={profileRef}>
                            <button
                                onClick={() => setShowProfileMenu(prev => !prev)}
                                className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl transition-colors duration-200"
                            >
                                <div className="w-8 h-8 bg-primary-purple rounded-full flex items-center justify-center">
                                    <span className="text-white font-medium text-sm">
                                        {user?.full_name?.charAt(0) || 'U'}
                                    </span>
                                </div>
                                <div className="text-left hidden md:block">
                                    <p className="text-sm font-medium text-gray-900">{user?.full_name || 'User'}</p>
                                    <p className="text-xs text-gray-500 capitalize">{user?.role || 'Account Manager'}</p>
                                </div>
                                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {/* Profile Dropdown Menu */}
                            {showProfileMenu && (
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-dropdown border border-gray-100 py-1.5 z-50">
                                    <button
                                        onClick={() => { navigate('/settings'); setShowProfileMenu(false); }}
                                        className="w-full text-left px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 flex items-center gap-3 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        Profile Settings
                                    </button>
                                    <hr className="my-2 border-gray-100" />
                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 hover:text-red-600 flex items-center gap-3 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
