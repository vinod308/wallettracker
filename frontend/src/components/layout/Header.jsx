import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../context/NotificationContext';
import { useSubscription } from '../../context/SubscriptionContext';
import settingsService from '../../services/settingsService';
import GlobalSearch from './GlobalSearch';
import UpgradeModal from '../subscription/UpgradeModal';
import logo from '../../assets/logo-3.jpeg';

const notifIcon = (type) => {
    switch (type) {
        case 'revenue_update': return '💰';
        case 'status_change':  return '⚠️';
        case 'new_client':     return '🆕';
        case 'manual_add':     return '✏️';
        default:               return '🔔';
    }
};

const PLAN_LABELS = { free: 'Free', basic: 'Basic', pro: 'Pro', enterprise: 'Enterprise' };
const PLAN_COLORS = {
    free:       'bg-gray-100 text-gray-600',
    basic:      'bg-blue-100 text-blue-700',
    pro:        'bg-indigo-100 text-indigo-700',
    enterprise: 'bg-amber-100 text-amber-700',
};

const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
};

const Header = ({ onMenuClick, isCollapsed }) => {
    const { user, logout }  = useAuth();
    const navigate          = useNavigate();
    const { notification, clearNotification } = useNotifications();
    const { subscription }  = useSubscription();

    const [showProfile,       setShowProfile]       = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showUpgrade,       setShowUpgrade]       = useState(false);
    const [showOrgDropdown,   setShowOrgDropdown]   = useState(false);

    // Profile data loaded from /settings/profile (has correct full_name)
    const [fullName, setFullName] = useState('');
    const [photo,    setPhoto]    = useState(() => localStorage.getItem('gw_profile_photo') || '');

    const notifRef   = useRef(null);
    const profileRef = useRef(null);
    const orgRef     = useRef(null);
    const fileRef    = useRef(null);

    // Load real full_name from settings API (response shape: { data: { profile: { full_name } } })
    useEffect(() => {
        settingsService.getUserProfile()
            .then(res => { setFullName(res.data?.profile?.full_name || res.profile?.full_name || user?.full_name || ''); })
            .catch(() => { setFullName(user?.full_name || ''); });
    }, [user]);

    // Sync photo if updated from SettingsPage in same tab
    useEffect(() => {
        const handler = () => setPhoto(localStorage.getItem('gw_profile_photo') || '');
        window.addEventListener('gw_profile_photo_updated', handler);
        return () => window.removeEventListener('gw_profile_photo_updated', handler);
    }, []);

    useEffect(() => {
        const handler = (e) => {
            if (notifRef.current   && !notifRef.current.contains(e.target))   setShowNotifications(false);
            if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
            if (orgRef.current     && !orgRef.current.contains(e.target))     setShowOrgDropdown(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleLogout = () => { logout(); navigate('/login'); };

    const handlePhotoUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const dataUrl = ev.target.result;
            localStorage.setItem('gw_profile_photo', dataUrl);
            setPhoto(dataUrl);
        };
        reader.readAsDataURL(file);
    };

    const settings    = (() => { try { return JSON.parse(localStorage.getItem('gw_settings') || '{}'); } catch { return {}; } })();
    const companyName = settings.companyName || 'My Organisation';
    const currentPlan = subscription?.plan || 'free';
    const isFree      = currentPlan === 'free';
    const planLabel   = PLAN_LABELS[currentPlan] || currentPlan;
    const planColor   = PLAN_COLORS[currentPlan] || PLAN_COLORS.free;
    const hasNotif    = notification !== null;

    const displayName = fullName || user?.full_name || 'User';
    const initials    = getInitials(displayName);

    const AvatarCircle = ({ size = 'sm' }) => {
        const cls = size === 'lg'
            ? 'w-14 h-14 rounded-2xl text-xl font-bold'
            : 'w-9 h-9 rounded-full text-sm font-semibold';
        return photo ? (
            <img src={photo} alt={displayName} className={`${cls} object-cover flex-shrink-0`} />
        ) : (
            <div className={`${cls} bg-indigo-600 flex items-center justify-center flex-shrink-0`}>
                <span className="text-white">{initials}</span>
            </div>
        );
    };

    return (
        <>
        <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
            <div className="flex items-center h-16">

                {/* ── LEFT: sidebar column ── */}
                <div className={`flex items-center flex-shrink-0 transition-all duration-300 ${isCollapsed ? 'lg:w-16 px-2 justify-center' : 'lg:w-64 px-4'}`}>
                    <button onClick={onMenuClick}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-colors lg:hidden"
                        aria-label="Toggle navigation">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    <div className="hidden lg:flex items-center">
                        {isCollapsed
                            ? <img src="/fav-icon.jpeg" alt="MG" className="w-10 h-10 rounded-xl object-cover" />
                            : <img src={logo} alt="MoneyGence" className="h-14 max-w-[200px] object-contain" />
                        }
                    </div>
                </div>

                {/* ── CENTRE: search ── */}
                <div className="flex-1 flex items-center px-4 sm:px-6">
                    <GlobalSearch />
                </div>

                {/* ── Plan + Org info (Zoho-style, desktop only) ── */}
                <div className="hidden lg:flex items-center gap-3 px-4 border-l border-gray-100">
                    {isFree ? (
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 whitespace-nowrap">Free plan</span>
                            <button
                                onClick={() => setShowUpgrade(true)}
                                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap"
                            >
                                Upgrade
                            </button>
                        </div>
                    ) : (
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${planColor}`}>{planLabel}</span>
                    )}
                    <div className="w-px h-5 bg-gray-200" />

                    {/* Clickable org name → Zoho-style dropdown */}
                    <div className="relative" ref={orgRef}>
                        <button
                            onClick={() => setShowOrgDropdown(p => !p)}
                            className="flex items-center gap-1.5 max-w-[180px] hover:bg-gray-50 px-2 py-1 rounded-lg transition-colors"
                        >
                            <div className="w-5 h-5 rounded bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                <svg className="w-3 h-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
                                </svg>
                            </div>
                            <span className="text-xs font-medium text-gray-700 truncate">{companyName}</span>
                            <svg className={`w-3 h-3 text-gray-400 flex-shrink-0 transition-transform ${showOrgDropdown ? 'rotate-180' : ''}`}
                                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {/* Org dropdown panel */}
                        {showOrgDropdown && (
                            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                                {/* Header */}
                                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                                    <span className="text-sm font-bold text-gray-800">Organizations</span>
                                    <button onClick={() => setShowOrgDropdown(false)}
                                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                                {/* My Organizations */}
                                <div className="px-4 py-3">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">My Organizations</p>
                                    <div className="flex items-center gap-3 p-3 bg-indigo-50/60 rounded-xl border border-indigo-100/60">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 truncate">{companyName}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                Organization ID: {user?.id ? String(user.id).padStart(9, '0') : '—'}
                                            </p>
                                            <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${planColor}`}>
                                                {planLabel}
                                            </span>
                                        </div>
                                        <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                                            <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                                <div className="px-4 pb-3">
                                    <button
                                        onClick={() => { setShowOrgDropdown(false); navigate('/company-details'); }}
                                        className="w-full py-2 rounded-xl text-xs font-semibold text-indigo-600 border border-indigo-200 hover:bg-indigo-50 transition-colors"
                                    >
                                        Manage Organisation
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── RIGHT: bell + avatar ── */}
                <div className="flex items-center gap-1 sm:gap-2 px-4">

                    {/* Notification Bell */}
                    <div className="relative" ref={notifRef}>
                        <button onClick={() => setShowNotifications(p => !p)}
                            className="relative p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                            aria-label="Notifications">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            {hasNotif && (
                                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                            )}
                        </button>

                        {showNotifications && (
                            <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-1rem)] bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                                <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                                    {hasNotif && <button onClick={clearNotification} className="text-xs text-gray-400 hover:text-gray-600">Dismiss</button>}
                                </div>
                                {!hasNotif ? (
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
                                                <p className="text-sm font-medium text-gray-900 leading-snug">{notification.title}</p>
                                                {notification.description && <p className="text-xs text-gray-500 mt-0.5">{notification.description}</p>}
                                                <p className="text-xs text-blue-500 mt-1 font-medium">{notification.time}</p>
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-400 text-center mt-2">Only the latest change is shown</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Avatar button */}
                    <div className="relative" ref={profileRef}>
                        <button onClick={() => setShowProfile(p => !p)}
                            className="hover:ring-2 hover:ring-indigo-300 rounded-full transition-all">
                            <AvatarCircle size="sm" />
                        </button>

                        {/* ── Profile Panel ── */}
                        {showProfile && (
                            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">

                                {/* Avatar + name + upload */}
                                <div className="relative px-5 pt-5 pb-4">
                                    <button
                                        onClick={() => setShowProfile(false)}
                                        className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>

                                    <div className="flex items-center gap-4">
                                        {/* Clickable avatar for photo upload */}
                                        <div className="relative flex-shrink-0 group">
                                            <AvatarCircle size="lg" />
                                            <button
                                                onClick={() => fileRef.current?.click()}
                                                className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="Upload photo"
                                            >
                                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                            </button>
                                            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                                        </div>

                                        <div className="min-w-0 pr-6">
                                            <p className="text-base font-bold text-gray-900 truncate">{displayName}</p>
                                            <p className="text-sm text-gray-500 truncate">{user?.email || ''}</p>
                                            {user?.id && <p className="text-xs text-gray-400 mt-0.5">User ID: {user.id}</p>}
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-2 text-center">Hover avatar to change photo</p>
                                </div>

                                <div className="border-t border-gray-100" />

                                {/* My Account + Sign Out */}
                                <div className="flex items-center justify-between px-5 py-3">
                                    <button
                                        onClick={() => { navigate('/settings'); setShowProfile(false); }}
                                        className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        My Account
                                    </button>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-2 text-sm font-medium text-red-500 hover:text-red-700 transition-colors">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                        Sign Out
                                    </button>
                                </div>

                                <div className="border-t border-gray-100" />

                                {/* Plan */}
                                <div className="px-5 py-3">
                                    <div className="flex items-center gap-2 mb-2">
                                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                        <span className="text-sm text-gray-600">
                                            You are on the{' '}
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${planColor}`}>
                                                {planLabel}
                                            </span>
                                            {' '}plan
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => { setShowProfile(false); setShowUpgrade(true); }}
                                        className={`w-full py-2 rounded-xl text-sm font-semibold transition-all
                                            ${isFree
                                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700'
                                                : 'border border-indigo-200 text-indigo-600 hover:bg-indigo-50'
                                            }`}
                                    >
                                        {isFree ? 'Upgrade Plan' : 'View all plans →'}
                                    </button>
                                </div>

                                <div className="pb-1" />

                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>

        <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} reason="" />
        </>
    );
};

export default Header;
