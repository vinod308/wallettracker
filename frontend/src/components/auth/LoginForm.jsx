import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../common/Input';
import Button from '../common/Button';
import { useAuth } from '../../hooks/useAuth';
import { validateEmail } from '../../utils/validators';
import { parseError } from '../../utils/helpers';
import { ERROR_MESSAGES } from '../../utils/constants';

const ADMIN_EMAIL    = 'vinod@moneygence.com';
const EMPLOYEE_EMAIL = 'anjanjyot@garagecollective.agency';

const PORTALS = [
    { type: 'admin',    label: 'Admin',    icon: '👑' },
    { type: 'employee', label: 'Employee', icon: '👤' },
    { type: 'vendor',   label: 'Vendor',   icon: '🏢' },
];

const LoginForm = () => {
    const navigate = useNavigate();
    const { login, logout, isAuthenticated, user } = useAuth();

    const [formData, setFormData] = useState({ email: '', password: '', rememberMe: false });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState('');
    const [loginType, setLoginType] = useState(null);
    const [readyToRedirect, setReadyToRedirect] = useState(false);

    useEffect(() => {
        if (readyToRedirect && isAuthenticated && user) {
            setReadyToRedirect(false);
            if (user.role === 'vendor') navigate('/vendor-portal');
            else if (user.role === 'vendor_manager') navigate('/vendors');
            else navigate('/dashboard');
        }
    }, [readyToRedirect, isAuthenticated, user, navigate]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
        if (errors[name]) setErrors(p => ({ ...p, [name]: null }));
        setApiError('');
    };

    const validateForm = () => {
        if (!loginType) { setApiError('Please select a login type above.'); return false; }
        const errs = {};
        const emailErr = validateEmail(formData.email);
        if (emailErr) errs.email = emailErr;
        if (!formData.password) errs.password = ERROR_MESSAGES.PASSWORD_REQUIRED;
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setApiError('');
        if (!validateForm()) return;
        setLoading(true);
        try {
            const response = await login({ email: formData.email, password: formData.password });
            const role = response?.data?.user?.role;

            if (loginType === 'admin' && formData.email !== ADMIN_EMAIL) {
                await logout();
                setApiError('Access denied. This portal is for Admins only.');
                return;
            }
            if (loginType === 'employee' && formData.email !== EMPLOYEE_EMAIL) {
                await logout();
                setApiError('Access denied. This portal is for Employees only.');
                return;
            }
            if (loginType === 'vendor' && role !== 'vendor') {
                await logout();
                setApiError('Access denied. This portal is for Vendors only. Use the sign-up link to register.');
                return;
            }

            setReadyToRedirect(true);
        } catch (err) {
            setApiError(parseError(err));
        } finally {
            setLoading(false);
        }
    };

    const selectPortal = (type) => {
        setLoginType(type);
        const preEmail = type === 'admin' ? ADMIN_EMAIL : type === 'employee' ? EMPLOYEE_EMAIL : '';
        setFormData(p => ({ ...p, email: preEmail }));
        setErrors({});
        setApiError('');
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Portal selector */}
            <div className="grid grid-cols-3 gap-2">
                {PORTALS.map(({ type, label, icon }) => (
                    <button key={type} type="button" onClick={() => selectPortal(type)}
                        className={`flex flex-col items-center justify-center py-3 px-1 rounded-xl border-2 transition-all text-xs font-medium
                            ${loginType === type
                                ? 'border-primary-blue bg-blue-50 text-primary-blue'
                                : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:bg-blue-50'}`}>
                        <span className="text-lg mb-0.5">{icon}</span>
                        <span>{label}</span>
                    </button>
                ))}
            </div>

            {/* Error */}
            {apiError && (
                <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm">
                    {apiError}
                </div>
            )}

            <Input label="Email" type="email" name="email" value={formData.email}
                onChange={handleChange} error={errors.email} placeholder="Enter your email"
                required autoComplete="email" />

            <Input label="Password" type="password" name="password" value={formData.password}
                onChange={handleChange} error={errors.password} placeholder="Enter your password"
                required autoComplete="current-password" showPasswordToggle showCapsLockWarning />

            {loginType === 'vendor' && (
                <div className="flex items-center justify-between text-sm">
                    <a href="/vendor-signup" className="text-primary-blue hover:underline font-medium">
                        New vendor? Sign up
                    </a>
                    <a href="/forgot-password" className="text-gray-500 hover:underline">
                        Forgot Password?
                    </a>
                </div>
            )}

            <div className="flex items-center">
                <label className="flex items-center cursor-pointer">
                    <input type="checkbox" name="rememberMe" checked={formData.rememberMe}
                        onChange={handleChange}
                        className="mr-2 h-4 w-4 text-primary-blue border-gray-300 rounded focus:ring-primary-blue" />
                    <span className="text-sm text-gray-700">Remember Me</span>
                </label>
            </div>

            <Button type="submit" variant="primary" fullWidth loading={loading} disabled={loading}>
                Login
            </Button>
        </form>
    );
};

export default LoginForm;
