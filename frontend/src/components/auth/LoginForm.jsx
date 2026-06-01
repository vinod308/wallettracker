import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Input from '../common/Input';
import Button from '../common/Button';
import { useAuth } from '../../hooks/useAuth';
import { validateEmail } from '../../utils/validators';
import { parseError } from '../../utils/helpers';
import { ERROR_MESSAGES } from '../../utils/constants';

const LoginForm = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { login, verifyOtp, isAuthenticated, user } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState('');
    const [otpStep, setOtpStep] = useState(false);
    const [readyToRedirect, setReadyToRedirect] = useState(false);
    const otpRef = useRef(null);

    const verified = searchParams.get('verified') === 'true';

    useEffect(() => {
        if (readyToRedirect && isAuthenticated && user) {
            setReadyToRedirect(false);
            if (user.role === 'vendor') navigate('/vendor-portal');
            else if (user.role === 'vendor_manager') navigate('/vendors');
            else navigate('/dashboard');
        }
    }, [readyToRedirect, isAuthenticated, user, navigate]);

    useEffect(() => {
        if (otpStep && otpRef.current) otpRef.current.focus();
    }, [otpStep]);

    const handleCredentialsSubmit = async (e) => {
        e.preventDefault();
        setApiError('');
        const errs = {};
        const emailErr = validateEmail(email);
        if (emailErr) errs.email = emailErr;
        if (!password) errs.password = ERROR_MESSAGES.PASSWORD_REQUIRED;
        setErrors(errs);
        if (Object.keys(errs).length > 0) return;

        setLoading(true);
        try {
            const response = await login({ email: email.toLowerCase().trim(), password });
            // Direct login fallback (OTP email service unavailable)
            if (response.data?.otpRequired === false) {
                setReadyToRedirect(true);
            } else {
                setOtpStep(true);
            }
        } catch (err) {
            setApiError(parseError(err));
        } finally {
            setLoading(false);
        }
    };

    const handleOtpSubmit = async (e) => {
        e.preventDefault();
        setApiError('');
        if (!otp || otp.length !== 6) {
            setErrors({ otp: 'Please enter the 6-digit code from your email' });
            return;
        }
        setErrors({});
        setLoading(true);
        try {
            await verifyOtp(email.toLowerCase().trim(), otp);
            setReadyToRedirect(true);
        } catch (err) {
            setApiError(parseError(err));
        } finally {
            setLoading(false);
        }
    };

    if (otpStep) {
        return (
            <form onSubmit={handleOtpSubmit} className="space-y-5">
                <div className="text-center pb-2">
                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <p className="text-sm text-gray-600">We sent a 6-digit code to</p>
                    <p className="text-sm font-semibold text-indigo-700 mt-0.5">{email}</p>
                </div>

                {apiError && (
                    <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm">
                        {apiError}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Enter OTP</label>
                    <input
                        ref={otpRef}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                            setOtp(val);
                            if (errors.otp) setErrors({});
                            setApiError('');
                        }}
                        placeholder="000000"
                        className={`w-full text-center text-3xl font-bold tracking-widest border-2 rounded-xl px-4 py-4 outline-none transition-colors ${
                            errors.otp ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-indigo-500'
                        }`}
                    />
                    {errors.otp && <p className="mt-1 text-xs text-red-600">{errors.otp}</p>}
                    <p className="text-xs text-gray-400 mt-2 text-center">Code expires in 10 minutes</p>
                </div>

                <Button type="submit" variant="primary" fullWidth loading={loading} disabled={loading || otp.length !== 6}>
                    Verify & Sign In
                </Button>

                <button
                    type="button"
                    className="w-full text-sm text-gray-500 hover:text-indigo-600 transition-colors"
                    onClick={() => { setOtpStep(false); setOtp(''); setApiError(''); }}
                >
                    ← Use a different account
                </button>
            </form>
        );
    }

    return (
        <form onSubmit={handleCredentialsSubmit} className="space-y-4">
            {verified && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Email verified! You can now sign in.
                </div>
            )}

            {apiError && (
                <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm">
                    {apiError}
                </div>
            )}

            <Input
                label="Email"
                type="email"
                name="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors(p => ({ ...p, email: null })); setApiError(''); }}
                error={errors.email}
                placeholder="Enter your email"
                required
                autoComplete="email"
            />

            <Input
                label="Password"
                type="password"
                name="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors(p => ({ ...p, password: null })); setApiError(''); }}
                error={errors.password}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                showPasswordToggle
                showCapsLockWarning
            />

            <div className="flex items-center justify-end">
                <a href="/forgot-password" className="text-sm text-indigo-600 hover:underline">
                    Forgot Password?
                </a>
            </div>

            <Button type="submit" variant="primary" fullWidth loading={loading} disabled={loading}>
                Continue
            </Button>

        </form>
    );
};

export default LoginForm;
