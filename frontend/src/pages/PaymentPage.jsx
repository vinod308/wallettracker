import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../context/SubscriptionContext';
import subscriptionService from '../services/subscriptionService';
import logo from '../assets/logo.png';

const PLAN_META = {
    basic: {
        label: 'Basic',
        icon: '⚡',
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        gradient: 'from-blue-500 to-blue-600',
        features: ['Up to 10 clients', 'Up to 10 vendors', 'GST invoicing', 'Email reports', 'Standard support'],
    },
    pro: {
        label: 'Pro',
        icon: '🚀',
        color: 'text-purple-600',
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        gradient: 'from-indigo-500 to-purple-600',
        features: ['Up to 500 clients', 'Up to 500 vendors', 'GST + AI insights', 'Scheduled reports', 'Priority support'],
    },
    enterprise: {
        label: 'Enterprise',
        icon: '🏢',
        color: 'text-amber-600',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        gradient: 'from-amber-500 to-orange-500',
        features: ['Unlimited clients', 'Unlimited vendors', 'Custom integrations', 'Dedicated manager', 'SLA support'],
    },
};

const PRICES = {
    basic:      { monthly: 299,  yearly: 2990  },
    pro:        { monthly: 599,  yearly: 5990  },
    enterprise: { monthly: 1299, yearly: 12990 },
};

const fmt = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

const PaymentPage = () => {
    const [searchParams] = useSearchParams();
    const navigate       = useNavigate();
    const { user }       = useAuth();
    const { refresh }    = useSubscription();

    const plan = searchParams.get('plan') || 'basic';
    const meta = PLAN_META[plan];

    const [cycle,   setCycle]   = useState('monthly');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error,   setError]   = useState('');

    const [billing, setBilling] = useState({
        name:    user?.full_name || '',
        email:   user?.email     || '',
        company: '',
        gstin:   '',
        address: '',
    });

    useEffect(() => {
        if (!meta) navigate('/dashboard');
    }, [plan]);

    if (!meta) return null;

    const baseAmount  = PRICES[plan]?.[cycle] || 0;
    const gstAmount   = Math.round(baseAmount * 0.18);
    const totalAmount = baseAmount + gstAmount;

    const handleChange = (e) => {
        setBilling(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handlePay = async (e) => {
        e.preventDefault();
        if (!billing.name || !billing.email) {
            setError('Please fill in your name and email.');
            return;
        }
        setError('');
        setLoading(true);
        try {
            // Step 1: create order
            const orderRes = await fetch('/api/payment/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ plan, billing_cycle: cycle }),
            });
            const orderData = await orderRes.json();
            if (!orderData.success) throw new Error(orderData.message);

            // Step 2: verify (stub — real gateway callback replaces this)
            const verifyRes = await fetch('/api/payment/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    order_id:     orderData.data.order_id,
                    plan,
                    billing_cycle: cycle,
                }),
            });
            const verifyData = await verifyRes.json();
            if (!verifyData.success) throw new Error(verifyData.message);

            await refresh();
            setSuccess(true);
            setTimeout(() => navigate('/dashboard'), 3000);
        } catch (err) {
            setError(err.message || 'Payment failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
                    <p className="text-gray-500 mb-1">
                        Your workspace is now on the <strong>{meta.label}</strong> plan.
                    </p>
                    <p className="text-sm text-gray-400">Redirecting to dashboard…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top bar */}
            <div className="bg-white border-b border-gray-100 px-4 sm:px-6 py-4 flex items-center justify-between">
                <Link to="/dashboard">
                    <img src={logo} alt="GarageWallet" className="h-8 object-contain" />
                </Link>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Secure Checkout
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* ── Left: Order Summary ── */}
                <div className="space-y-5">
                    <div>
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-4"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Back to plans
                        </button>
                        <h1 className="text-2xl font-bold text-gray-900">Order Summary</h1>
                        <p className="text-sm text-gray-500 mt-1">Review your plan before paying</p>
                    </div>

                    {/* Plan card */}
                    <div className={`rounded-2xl border-2 overflow-hidden ${meta.border}`}>
                        <div className={`bg-gradient-to-r ${meta.gradient} p-5`}>
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{meta.icon}</span>
                                <div>
                                    <div className="text-white font-bold text-lg">{meta.label} Plan</div>
                                    <div className="text-white/80 text-xs">GarageWallet Subscription</div>
                                </div>
                            </div>
                        </div>
                        <div className="p-5 bg-white">
                            <ul className="space-y-2 mb-4">
                                {meta.features.map(f => (
                                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                                        <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                        </svg>
                                        {f}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Billing cycle toggle */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-5">
                        <p className="text-sm font-semibold text-gray-700 mb-3">Billing Cycle</p>
                        <div className="grid grid-cols-2 gap-3">
                            {['monthly', 'yearly'].map(c => (
                                <button
                                    key={c}
                                    onClick={() => setCycle(c)}
                                    className={`rounded-xl border-2 p-3 text-center transition-all ${
                                        cycle === c
                                            ? 'border-indigo-500 bg-indigo-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <div className={`font-bold text-sm ${cycle === c ? 'text-indigo-700' : 'text-gray-800'}`}>
                                        {c === 'monthly' ? 'Monthly' : 'Yearly'}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-0.5">
                                        {c === 'monthly'
                                            ? fmt(PRICES[plan].monthly) + '/mo'
                                            : fmt(PRICES[plan].yearly) + '/yr · save 17%'}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Price breakdown */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
                        <p className="text-sm font-semibold text-gray-700">Price Breakdown</p>
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>{meta.label} Plan ({cycle})</span>
                            <span>{fmt(baseAmount)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>GST (18%)</span>
                            <span>{fmt(gstAmount)}</span>
                        </div>
                        <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-gray-900">
                            <span>Total</span>
                            <span className="text-lg">{fmt(totalAmount)}</span>
                        </div>
                    </div>
                </div>

                {/* ── Right: Billing + Payment ── */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">Payment Details</h1>
                    <p className="text-sm text-gray-500 mb-6">Enter your billing information</p>

                    <form onSubmit={handlePay} className="space-y-5">

                        {/* Billing details */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
                            <p className="text-sm font-semibold text-gray-700">Billing Information</p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Full Name *</label>
                                    <input
                                        name="name"
                                        value={billing.name}
                                        onChange={handleChange}
                                        required
                                        placeholder="Your full name"
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
                                    <input
                                        name="email"
                                        type="email"
                                        value={billing.email}
                                        onChange={handleChange}
                                        required
                                        placeholder="billing@company.com"
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Company Name</label>
                                <input
                                    name="company"
                                    value={billing.company}
                                    onChange={handleChange}
                                    placeholder="Your company name"
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                    GST Number <span className="text-gray-400">(optional — for GST invoice)</span>
                                </label>
                                <input
                                    name="gstin"
                                    value={billing.gstin}
                                    onChange={handleChange}
                                    placeholder="22AAAAA0000A1Z5"
                                    maxLength={15}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 uppercase"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Billing Address</label>
                                <textarea
                                    name="address"
                                    value={billing.address}
                                    onChange={handleChange}
                                    rows={2}
                                    placeholder="Street, City, State, PIN"
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 resize-none"
                                />
                            </div>
                        </div>

                        {/* Payment method placeholder */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-6">
                            <p className="text-sm font-semibold text-gray-700 mb-3">Payment Method</p>
                            <div className="rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 p-4 text-center">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                    </svg>
                                    <span className="text-sm font-semibold text-indigo-700">Razorpay · UPI · Cards · Net Banking</span>
                                </div>
                                <p className="text-xs text-gray-500">Payment gateway integration in progress. Clicking Pay Now will activate your plan directly.</p>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                                {error}
                            </div>
                        )}

                        {/* Pay button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-base shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                    </svg>
                                    Processing…
                                </span>
                            ) : (
                                `Pay Now  ${fmt(totalAmount)}`
                            )}
                        </button>

                        <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                            <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            256-bit SSL encrypted · PCI-DSS compliant
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PaymentPage;
