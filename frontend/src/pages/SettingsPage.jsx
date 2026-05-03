/**
 * Settings Page
 * User profile, security, notifications, and admin settings — premium UI
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import MainLayout from '../components/layout/MainLayout';
import settingsService from '../services/settingsService';

// ─── SVG Icons ───────────────────────────────────────────────────────────────
const ProfileIcon = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

const SecurityIcon = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
);

const BellIcon = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
);

const UsersIcon = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
);

const CheckIcon = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
);

const XIcon = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getInitials = (name) => {
    if (!name) return '?';
    return name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
};

// ─── Reusable Components ──────────────────────────────────────────────────────
const FormInput = ({ label, hint, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
        <input
            {...props}
            className={`w-full px-4 py-2.5 border rounded-xl text-sm transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-primary-blue/20 focus:border-primary-blue
                ${props.disabled
                    ? 'border-gray-200 bg-gray-50 cursor-not-allowed text-gray-400'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                } ${props.className || ''}`}
        />
        {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
);

const FormSelect = ({ label, children, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
        <select
            {...props}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white
                transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-blue/20
                focus:border-primary-blue hover:border-gray-300 cursor-pointer"
        >
            {children}
        </select>
    </div>
);

const SectionCard = ({ title, description, children }) => (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100/80 shadow-sm p-6">
        {(title || description) && (
            <div className="mb-5 pb-4 border-b border-gray-100">
                {title && <h3 className="text-base font-semibold text-gray-900">{title}</h3>}
                {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
            </div>
        )}
        {children}
    </div>
);

const ToggleRow = ({ label, description, checked, onChange }) => (
    <div className="flex items-center justify-between py-3 group">
        <div>
            <p className="text-sm font-medium text-gray-800 group-hover:text-gray-900 transition-colors">{label}</p>
            {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
        </div>
        <label className="relative inline-flex items-center cursor-pointer ml-4 flex-shrink-0">
            <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 rounded-full peer transition-all duration-200
                peer-checked:bg-primary-blue
                after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:duration-200
                peer-checked:after:translate-x-full peer-focus:ring-2 peer-focus:ring-primary-blue/20">
            </div>
        </label>
    </div>
);

const InlineAlert = ({ type, message, onDismiss }) => {
    if (!message) return null;
    const styles = {
        success: 'bg-green-50 border-green-200 text-green-800',
        error: 'bg-red-50 border-red-200 text-red-800',
    };
    const Icon = type === 'success' ? CheckIcon : XIcon;
    return (
        <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm mb-4 ${styles[type]}`}>
            <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span className="flex-1">{message}</span>
            {onDismiss && (
                <button onClick={onDismiss} className="opacity-60 hover:opacity-100 transition-opacity">
                    <XIcon className="w-4 h-4" />
                </button>
            )}
        </div>
    );
};

const PrimaryButton = ({ loading, loadingText, children, ...props }) => (
    <button
        {...props}
        className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium text-white
            bg-gradient-to-r from-primary-blue to-indigo-600
            hover:from-indigo-600 hover:to-primary-blue
            hover:shadow-md hover:-translate-y-0.5
            active:translate-y-0 active:shadow-sm
            transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none
            ${props.className || ''}`}
    >
        {loading ? (
            <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                {loadingText || 'Saving...'}
            </>
        ) : children}
    </button>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
const SettingsPage = () => {
    const { user } = useAuth();

    const [activeTab, setActiveTab] = useState('profile');

    // Profile
    const [profile, setProfile] = useState({
        full_name: '',
        phone_number: '',
        department: '',
        time_zone: 'Asia/Kolkata',
    });
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileAlert, setProfileAlert] = useState(null); // { type, message }

    // Password
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordAlert, setPasswordAlert] = useState(null);
    const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });

    // Password strength
    const getPasswordStrength = (pwd) => {
        if (!pwd) return null;
        const checks = [pwd.length >= 8, /[A-Z]/.test(pwd), /[0-9]/.test(pwd), /[!@#$%^&*]/.test(pwd)];
        const score = checks.filter(Boolean).length;
        if (score <= 1) return { label: 'Weak', color: 'bg-red-500', width: '25%' };
        if (score === 2) return { label: 'Fair', color: 'bg-orange-400', width: '50%' };
        if (score === 3) return { label: 'Good', color: 'bg-yellow-400', width: '75%' };
        return { label: 'Strong', color: 'bg-green-500', width: '100%' };
    };
    const pwdStrength = getPasswordStrength(passwordData.newPassword);

    // Notifications
    const [notificationPrefs, setNotificationPrefs] = useState({
        email_contract_expiring: true,
        email_at_risk_client: true,
        email_upsell_opportunity: true,
        email_frequency: 'Real-time',
        in_app_enabled: true,
        desktop_notifications: false,
        notification_sound: true,
    });
    const [notifLoading, setNotifLoading] = useState(false);
    const [notifAlert, setNotifAlert] = useState(null);

    // Users (Admin only)
    const [users, setUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(false);

    const TABS = [
        { id: 'profile',       label: 'Profile',         Icon: ProfileIcon  },
        { id: 'security',      label: 'Security',        Icon: SecurityIcon },
        { id: 'notifications', label: 'Notifications',   Icon: BellIcon     },
        ...(user?.role === 'Admin' ? [{ id: 'users', label: 'User Management', Icon: UsersIcon }] : []),
    ];

    useEffect(() => {
        fetchProfileData();
        fetchNotificationPreferences();
        if (user?.role === 'Admin') fetchUsers();
    }, [user]);

    const fetchProfileData = async () => {
        try {
            const response = await settingsService.getUserProfile();
            const p = response.data.profile;
            setProfile({
                full_name:    p.full_name    || '',
                phone_number: p.phone_number || '',
                department:   p.department   || '',
                time_zone:    p.time_zone    || 'Asia/Kolkata',
            });
        } catch (err) {
            console.error('Error fetching profile:', err);
        }
    };

    const fetchNotificationPreferences = async () => {
        try {
            const response = await settingsService.getNotificationPreferences();
            setNotificationPrefs(response.data.preferences);
        } catch (err) {
            console.error('Error fetching notification preferences:', err);
        }
    };

    const fetchUsers = async () => {
        try {
            setUsersLoading(true);
            const response = await settingsService.getAllUsers();
            setUsers(response.data.users || []);
        } catch (err) {
            console.error('Error fetching users:', err);
        } finally {
            setUsersLoading(false);
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setProfileAlert(null);
        try {
            setProfileLoading(true);
            await settingsService.updateUserProfile(profile);
            setProfileAlert({ type: 'success', message: 'Profile updated successfully' });
        } catch (err) {
            setProfileAlert({ type: 'error', message: err.response?.data?.error?.message || 'Failed to update profile' });
        } finally {
            setProfileLoading(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setPasswordAlert(null);

        if (passwordData.newPassword.length < 8)
            return setPasswordAlert({ type: 'error', message: 'Password must be at least 8 characters' });
        if (passwordData.newPassword !== passwordData.confirmPassword)
            return setPasswordAlert({ type: 'error', message: 'Passwords do not match' });
        if (!/[A-Z]/.test(passwordData.newPassword))
            return setPasswordAlert({ type: 'error', message: 'Password must contain at least one uppercase letter' });
        if (!/[0-9]/.test(passwordData.newPassword))
            return setPasswordAlert({ type: 'error', message: 'Password must contain at least one number' });
        if (!/[!@#$%^&*]/.test(passwordData.newPassword))
            return setPasswordAlert({ type: 'error', message: 'Password must contain at least one special character (!@#$%^&*)' });

        try {
            setPasswordLoading(true);
            await settingsService.changePassword(passwordData.currentPassword, passwordData.newPassword);
            setPasswordAlert({ type: 'success', message: 'Password changed successfully. Please log in again if prompted.' });
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            setPasswordAlert({ type: 'error', message: err.response?.data?.error?.message || 'Failed to change password' });
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleNotificationUpdate = async () => {
        setNotifAlert(null);
        try {
            setNotifLoading(true);
            await settingsService.updateNotificationPreferences(notificationPrefs);
            setNotifAlert({ type: 'success', message: 'Notification preferences saved successfully' });
        } catch (err) {
            setNotifAlert({ type: 'error', message: err.response?.data?.error?.message || 'Failed to update preferences' });
        } finally {
            setNotifLoading(false);
        }
    };

    const handleRoleUpdate = async (userId, newRole) => {
        if (!window.confirm(`Change this user's role to ${newRole}?`)) return;
        try {
            await settingsService.updateUserRole(userId, newRole);
            fetchUsers();
        } catch (err) {
            console.error('Role update failed:', err);
        }
    };

    const toggleShowPassword = (field) =>
        setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <MainLayout>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30">
                {/* Page Header */}
                <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-16 z-10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Settings & Profile</h1>
                        <p className="text-sm text-gray-500 mt-0.5">Manage your account, security, and preferences</p>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex flex-col lg:flex-row gap-6 items-start">

                        {/* ── Sidebar ──────────────────────────────────────── */}
                        <div className="w-full lg:w-64 flex-shrink-0 space-y-4">
                            {/* Profile Card */}
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100/80 shadow-sm p-5 text-center">
                                {/* Avatar */}
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-blue to-indigo-600
                                    flex items-center justify-center mx-auto shadow-lg shadow-indigo-200/50">
                                    <span className="text-2xl font-bold text-white">
                                        {getInitials(user?.full_name || profile.full_name)}
                                    </span>
                                </div>
                                <div className="mt-3">
                                    <p className="font-semibold text-gray-900 text-sm leading-tight">
                                        {user?.full_name || profile.full_name || 'Your Name'}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5 truncate">{user?.email}</p>
                                    <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium
                                        bg-indigo-50 text-indigo-700 border border-indigo-100">
                                        {user?.role || 'Account Manager'}
                                    </span>
                                </div>
                            </div>

                            {/* Navigation Tabs */}
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100/80 shadow-sm p-3">
                                <nav className="flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
                                    {TABS.map(({ id, label, Icon }) => {
                                        const isActive = activeTab === id;
                                        return (
                                            <button
                                                key={id}
                                                onClick={() => setActiveTab(id)}
                                                className={`flex-shrink-0 lg:w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left
                                                    transition-all duration-200 group
                                                    ${isActive
                                                        ? 'bg-gradient-to-r from-primary-blue to-indigo-600 text-white shadow-md shadow-indigo-200/50'
                                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                                    }`}
                                            >
                                                <Icon className={`w-5 h-5 flex-shrink-0 transition-colors duration-200
                                                    ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`}
                                                />
                                                <span className="text-sm font-medium">{label}</span>
                                            </button>
                                        );
                                    })}
                                </nav>
                            </div>
                        </div>

                        {/* ── Content Area ──────────────────────────────────── */}
                        <div className="flex-1 min-w-0 space-y-5">

                            {/* ── Profile Tab ─────────────────────────────── */}
                            {activeTab === 'profile' && (
                                <>
                                    <SectionCard
                                        title="Personal Information"
                                        description="Update your name, phone number, and other details"
                                    >
                                        <InlineAlert
                                            type={profileAlert?.type}
                                            message={profileAlert?.message}
                                            onDismiss={() => setProfileAlert(null)}
                                        />
                                        <form onSubmit={handleProfileUpdate} className="space-y-5">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                <FormInput
                                                    label="Full Name"
                                                    type="text"
                                                    value={profile.full_name}
                                                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                                                    required
                                                    placeholder="Enter your full name"
                                                />
                                                <FormInput
                                                    label="Email Address"
                                                    type="email"
                                                    value={user?.email || ''}
                                                    disabled
                                                    hint="Email address cannot be changed"
                                                />
                                                <FormInput
                                                    label="Phone Number"
                                                    type="tel"
                                                    value={profile.phone_number}
                                                    onChange={(e) => setProfile({ ...profile, phone_number: e.target.value })}
                                                    placeholder="+91 98765 43210"
                                                />
                                                <FormInput
                                                    label="Department"
                                                    type="text"
                                                    value={profile.department}
                                                    onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                                                    placeholder="e.g. Account Management"
                                                />
                                                <FormSelect
                                                    label="Time Zone"
                                                    value={profile.time_zone}
                                                    onChange={(e) => setProfile({ ...profile, time_zone: e.target.value })}
                                                >
                                                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                                                    <option value="America/New_York">America/New_York (EST)</option>
                                                    <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                                                    <option value="Europe/London">Europe/London (GMT)</option>
                                                    <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                                                </FormSelect>
                                                <FormInput
                                                    label="Role"
                                                    type="text"
                                                    value={user?.role || ''}
                                                    disabled
                                                    hint="Role is managed by your admin"
                                                />
                                            </div>
                                            <div className="pt-1">
                                                <PrimaryButton
                                                    type="submit"
                                                    disabled={profileLoading}
                                                    loading={profileLoading}
                                                    loadingText="Saving..."
                                                >
                                                    Save Changes
                                                </PrimaryButton>
                                            </div>
                                        </form>
                                    </SectionCard>
                                </>
                            )}

                            {/* ── Security Tab ────────────────────────────── */}
                            {activeTab === 'security' && (
                                <>
                                    <SectionCard
                                        title="Change Password"
                                        description="Keep your account secure with a strong password"
                                    >
                                        <InlineAlert
                                            type={passwordAlert?.type}
                                            message={passwordAlert?.message}
                                            onDismiss={() => setPasswordAlert(null)}
                                        />
                                        <form onSubmit={handlePasswordChange} className="space-y-5">
                                            {/* Current Password */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                                    Current Password
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type={showPasswords.current ? 'text' : 'password'}
                                                        value={passwordData.currentPassword}
                                                        onChange={(e) =>
                                                            setPasswordData({ ...passwordData, currentPassword: e.target.value })
                                                        }
                                                        className="w-full px-4 py-2.5 pr-12 border border-gray-200 rounded-xl text-sm
                                                            transition-all duration-200 focus:outline-none focus:ring-2
                                                            focus:ring-primary-blue/20 focus:border-primary-blue
                                                            hover:border-gray-300"
                                                        required
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleShowPassword('current')}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                    >
                                                        {showPasswords.current ? (
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                                            </svg>
                                                        ) : (
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* New Password */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                                    New Password
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type={showPasswords.new ? 'text' : 'password'}
                                                        value={passwordData.newPassword}
                                                        onChange={(e) =>
                                                            setPasswordData({ ...passwordData, newPassword: e.target.value })
                                                        }
                                                        className="w-full px-4 py-2.5 pr-12 border border-gray-200 rounded-xl text-sm
                                                            transition-all duration-200 focus:outline-none focus:ring-2
                                                            focus:ring-primary-blue/20 focus:border-primary-blue
                                                            hover:border-gray-300"
                                                        required
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleShowPassword('new')}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                    >
                                                        {showPasswords.new ? (
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                                            </svg>
                                                        ) : (
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                </div>

                                                {/* Password Strength Bar */}
                                                {passwordData.newPassword && (
                                                    <div className="mt-2">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-xs text-gray-400">Password strength</span>
                                                            <span className={`text-xs font-medium ${
                                                                pwdStrength?.label === 'Strong' ? 'text-green-600' :
                                                                pwdStrength?.label === 'Good' ? 'text-yellow-600' :
                                                                pwdStrength?.label === 'Fair' ? 'text-orange-500' : 'text-red-500'
                                                            }`}>{pwdStrength?.label}</span>
                                                        </div>
                                                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                                                            <div
                                                                className={`h-1.5 rounded-full transition-all duration-300 ${pwdStrength?.color}`}
                                                                style={{ width: pwdStrength?.width }}
                                                            />
                                                        </div>
                                                        <p className="text-xs text-gray-400 mt-1.5">
                                                            Must include: 8+ chars · uppercase · number · special char
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Confirm Password */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                                    Confirm New Password
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type={showPasswords.confirm ? 'text' : 'password'}
                                                        value={passwordData.confirmPassword}
                                                        onChange={(e) =>
                                                            setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                                                        }
                                                        className={`w-full px-4 py-2.5 pr-12 border rounded-xl text-sm
                                                            transition-all duration-200 focus:outline-none focus:ring-2
                                                            focus:ring-primary-blue/20 focus:border-primary-blue
                                                            hover:border-gray-300
                                                            ${passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword
                                                                ? 'border-red-300 bg-red-50/30'
                                                                : passwordData.confirmPassword && passwordData.newPassword === passwordData.confirmPassword
                                                                    ? 'border-green-300 bg-green-50/30'
                                                                    : 'border-gray-200'
                                                            }`}
                                                        required
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleShowPassword('confirm')}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                    >
                                                        {showPasswords.confirm ? (
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                                            </svg>
                                                        ) : (
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                </div>
                                                {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                                                    <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                                                )}
                                            </div>

                                            <div className="pt-1">
                                                <PrimaryButton
                                                    type="submit"
                                                    disabled={passwordLoading}
                                                    loading={passwordLoading}
                                                    loadingText="Changing..."
                                                >
                                                    Change Password
                                                </PrimaryButton>
                                            </div>
                                        </form>
                                    </SectionCard>

                                    {/* Security Info Card */}
                                    <SectionCard title="Security Tips">
                                        <ul className="space-y-2 text-sm text-gray-600">
                                            {[
                                                'Use a unique password not used on other sites',
                                                'Include a mix of letters, numbers, and symbols',
                                                'Avoid using personal information in your password',
                                                'Change your password periodically for best security',
                                            ].map((tip, i) => (
                                                <li key={i} className="flex items-start gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 flex-shrink-0" />
                                                    {tip}
                                                </li>
                                            ))}
                                        </ul>
                                    </SectionCard>
                                </>
                            )}

                            {/* ── Notifications Tab ───────────────────────── */}
                            {activeTab === 'notifications' && (
                                <>
                                    <SectionCard
                                        title="Email Notifications"
                                        description="Choose which events trigger email alerts"
                                    >
                                        <InlineAlert
                                            type={notifAlert?.type}
                                            message={notifAlert?.message}
                                            onDismiss={() => setNotifAlert(null)}
                                        />
                                        <div className="divide-y divide-gray-50">
                                            <ToggleRow
                                                label="Contract Expiring Soon"
                                                description="Get notified when client contracts are nearing expiry"
                                                checked={notificationPrefs.email_contract_expiring}
                                                onChange={(e) =>
                                                    setNotificationPrefs({
                                                        ...notificationPrefs,
                                                        email_contract_expiring: e.target.checked,
                                                    })
                                                }
                                            />
                                            <ToggleRow
                                                label="At-Risk Client Alert"
                                                description="Be notified when a client is flagged as at-risk"
                                                checked={notificationPrefs.email_at_risk_client}
                                                onChange={(e) =>
                                                    setNotificationPrefs({
                                                        ...notificationPrefs,
                                                        email_at_risk_client: e.target.checked,
                                                    })
                                                }
                                            />
                                            <ToggleRow
                                                label="Upsell Opportunities"
                                                description="Receive alerts when new upsell opportunities arise"
                                                checked={notificationPrefs.email_upsell_opportunity}
                                                onChange={(e) =>
                                                    setNotificationPrefs({
                                                        ...notificationPrefs,
                                                        email_upsell_opportunity: e.target.checked,
                                                    })
                                                }
                                            />
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-gray-50">
                                            <FormSelect
                                                label="Email Frequency"
                                                value={notificationPrefs.email_frequency}
                                                onChange={(e) =>
                                                    setNotificationPrefs({
                                                        ...notificationPrefs,
                                                        email_frequency: e.target.value,
                                                    })
                                                }
                                            >
                                                <option value="Real-time">Real-time</option>
                                                <option value="Daily Digest">Daily Digest</option>
                                                <option value="Weekly Summary">Weekly Summary</option>
                                            </FormSelect>
                                        </div>
                                    </SectionCard>

                                    <SectionCard
                                        title="In-App &amp; Desktop Notifications"
                                        description="Control how notifications appear inside the app"
                                    >
                                        <div className="divide-y divide-gray-50">
                                            <ToggleRow
                                                label="In-App Notifications"
                                                description="Show notification badge and dropdown in the header"
                                                checked={notificationPrefs.in_app_enabled}
                                                onChange={(e) =>
                                                    setNotificationPrefs({
                                                        ...notificationPrefs,
                                                        in_app_enabled: e.target.checked,
                                                    })
                                                }
                                            />
                                            <ToggleRow
                                                label="Desktop Push Notifications"
                                                description="Show browser push notifications when the app is in background"
                                                checked={notificationPrefs.desktop_notifications}
                                                onChange={(e) =>
                                                    setNotificationPrefs({
                                                        ...notificationPrefs,
                                                        desktop_notifications: e.target.checked,
                                                    })
                                                }
                                            />
                                            <ToggleRow
                                                label="Notification Sound"
                                                description="Play a sound when new notifications arrive"
                                                checked={notificationPrefs.notification_sound}
                                                onChange={(e) =>
                                                    setNotificationPrefs({
                                                        ...notificationPrefs,
                                                        notification_sound: e.target.checked,
                                                    })
                                                }
                                            />
                                        </div>
                                        <div className="mt-4 pt-2">
                                            <PrimaryButton
                                                onClick={handleNotificationUpdate}
                                                disabled={notifLoading}
                                                loading={notifLoading}
                                                loadingText="Saving..."
                                            >
                                                Save Preferences
                                            </PrimaryButton>
                                        </div>
                                    </SectionCard>
                                </>
                            )}

                            {/* ── User Management Tab (Admin) ─────────────── */}
                            {activeTab === 'users' && user?.role === 'Admin' && (
                                <SectionCard
                                    title="User Management"
                                    description="View and manage all users in your organisation"
                                >
                                    {usersLoading ? (
                                        <div className="flex items-center justify-center py-12">
                                            <svg className="w-6 h-6 animate-spin text-primary-blue" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                            </svg>
                                        </div>
                                    ) : users.length === 0 ? (
                                        <p className="text-gray-400 text-sm text-center py-8">No users found</p>
                                    ) : (
                                        <div className="overflow-x-auto -mx-1">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b border-gray-100">
                                                        {['Name', 'Email', 'Role', 'Status', 'Last Login'].map((h) => (
                                                            <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">
                                                                {h}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50">
                                                    {users.map((u) => (
                                                        <tr key={u.id} className="hover:bg-gray-50/60 transition-colors duration-150">
                                                            <td className="px-3 py-3 font-medium text-gray-800">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-slate-200 to-slate-300
                                                                        flex items-center justify-center text-xs font-bold text-gray-600">
                                                                        {getInitials(u.full_name)}
                                                                    </div>
                                                                    {u.full_name}
                                                                </div>
                                                            </td>
                                                            <td className="px-3 py-3 text-gray-500">{u.email}</td>
                                                            <td className="px-3 py-3">
                                                                <select
                                                                    value={u.role}
                                                                    onChange={(e) => handleRoleUpdate(u.id, e.target.value)}
                                                                    disabled={u.id === user.id}
                                                                    className={`px-2.5 py-1 border rounded-lg text-xs font-medium
                                                                        transition-all duration-150
                                                                        focus:outline-none focus:ring-2 focus:ring-primary-blue/20
                                                                        ${u.id === user.id
                                                                            ? 'border-gray-200 bg-gray-100 cursor-not-allowed text-gray-400'
                                                                            : 'border-gray-200 hover:border-primary-blue cursor-pointer bg-white'
                                                                        }`}
                                                                >
                                                                    <option value="Admin">Admin</option>
                                                                    <option value="Account Manager">Account Manager</option>
                                                                    <option value="Finance">Finance</option>
                                                                </select>
                                                            </td>
                                                            <td className="px-3 py-3">
                                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                                                                    ${u.status === 'Active'
                                                                        ? 'bg-green-50 text-green-700 border border-green-100'
                                                                        : 'bg-gray-100 text-gray-500'
                                                                    }`}>
                                                                    {u.status === 'Active' && (
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5" />
                                                                    )}
                                                                    {u.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-3 py-3 text-gray-400 text-xs">
                                                                {u.last_login_at
                                                                    ? new Date(u.last_login_at).toLocaleDateString('en-IN', {
                                                                        day: 'numeric', month: 'short', year: 'numeric'
                                                                    })
                                                                    : 'Never'}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </SectionCard>
                            )}

                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default SettingsPage;
