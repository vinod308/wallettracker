import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import vendorService from '../services/vendorService';
import { useAuth } from '../hooks/useAuth';

const STEPS = ['Account', 'Basic Info', 'Contact', 'Banking', 'Review'];

const GST_RE   = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const PAN_RE   = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const IFSC_RE  = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOB_RE   = /^[6-9]\d{9}$/;

const VENDOR_TYPES = ['Freelancer', 'Agency', 'Consultant', 'Production House', 'Software Vendor', 'Influencer', 'Employee Contractor'];

const inp = (err = false) =>
    `w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent transition-colors ${err ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'}`;

const Field = ({ label, required, error, hint, children }) => (
    <div>
        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        {children}
        {hint && !error && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
);

const EMPTY = {
    fullName: '', email: '', password: '', confirmPassword: '',
    vendorName: '', vendorType: 'Freelancer', gstNumber: '', panNumber: '',
    address: '', city: '', state: '', pincode: '', country: 'India',
    contactPerson: '', mobile: '', altMobile: '', website: '',
    accountHolder: '', bankName: '', accountNumber: '', confirmAccount: '', ifscCode: '', upiId: '',
};

export default function VendorSignupPage() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [step, setStep] = useState(0);
    const [form, setForm] = useState({ ...EMPTY });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState('');

    const set = (f) => (e) => {
        setForm(p => ({ ...p, [f]: e.target.value }));
        setErrors(p => { const n = { ...p }; delete n[f]; return n; });
    };

    const validate = (s) => {
        const e = {};
        if (s === 0) {
            if (!form.fullName.trim() || form.fullName.trim().length < 2) e.fullName = 'Full name required (min 2 chars)';
            if (!form.email.trim() || !EMAIL_RE.test(form.email.trim())) e.email = 'Valid email required';
            if (!form.password || form.password.length < 8) e.password = 'Password must be at least 8 characters';
            if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
        }
        if (s === 1) {
            if (!form.vendorName.trim() || form.vendorName.trim().length < 2) e.vendorName = 'Vendor name required (min 2 chars)';
            if (form.gstNumber.trim() && !GST_RE.test(form.gstNumber.trim().toUpperCase())) e.gstNumber = 'Invalid GST number';
            if (!form.panNumber.trim() || !PAN_RE.test(form.panNumber.trim().toUpperCase())) e.panNumber = 'Valid PAN required (e.g. ABCDE1234F)';
            if (!form.address.trim() || form.address.trim().length < 5) e.address = 'Address required';
            if (!form.city.trim()) e.city = 'City required';
            if (!form.state.trim()) e.state = 'State required';
            if (!form.pincode.trim() || !/^\d{6}$/.test(form.pincode.trim())) e.pincode = 'Valid 6-digit pincode required';
        }
        if (s === 2) {
            if (!form.contactPerson.trim() || form.contactPerson.trim().length < 2) e.contactPerson = 'Contact person required';
            if (!form.mobile.trim() || !MOB_RE.test(form.mobile.trim())) e.mobile = 'Valid 10-digit mobile required';
            if (form.altMobile.trim() && !MOB_RE.test(form.altMobile.trim())) e.altMobile = 'Invalid mobile number';
        }
        if (s === 3) {
            if (form.accountNumber.trim() && !/^\d{9,18}$/.test(form.accountNumber.trim())) e.accountNumber = 'Account number must be 9–18 digits';
            if (form.accountNumber.trim() && form.confirmAccount !== form.accountNumber) e.confirmAccount = 'Account numbers do not match';
            if (form.ifscCode.trim() && !IFSC_RE.test(form.ifscCode.trim().toUpperCase())) e.ifscCode = 'Invalid IFSC code';
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const next = () => { if (validate(step)) setStep(s => s + 1); };
    const back = () => { setErrors({}); setStep(s => s - 1); };

    const handleSubmit = async () => {
        setLoading(true);
        setApiError('');
        try {
            const vendorData = {
                vendorName: form.vendorName.trim(),
                vendorType: form.vendorType,
                gstNumber:  form.gstNumber.trim().toUpperCase(),
                panNumber:  form.panNumber.trim().toUpperCase(),
                address: form.address.trim(), city: form.city.trim(),
                state: form.state.trim(), pincode: form.pincode.trim(), country: form.country,
                contactPerson: form.contactPerson.trim(),
                mobile: form.mobile.trim(), altMobile: form.altMobile.trim(),
                website: form.website.trim(),
                accountHolder: form.accountHolder.trim(), bankName: form.bankName.trim(),
                accountNumber: form.accountNumber.trim(),
                ifscCode: form.ifscCode.trim().toUpperCase(), upiId: form.upiId.trim(),
            };
            const result = await vendorService.signup({
                fullName: form.fullName.trim(),
                email: form.email.trim().toLowerCase(),
                password: form.password,
                vendorData,
            });
            // Auto-login via auth context using the token already stored in localStorage
            navigate('/vendor-portal');
        } catch (err) {
            setApiError(err?.response?.data?.message || err.message || 'Signup failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const StepBar = () => (
        <div className="flex items-center mb-6">
            {STEPS.map((label, i) => (
                <React.Fragment key={i}>
                    <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                            i < step ? 'bg-green-500 text-white' :
                            i === step ? 'bg-primary-blue text-white ring-4 ring-blue-100' :
                            'bg-gray-100 text-gray-400'}`}>
                            {i < step ? '✓' : i + 1}
                        </div>
                        <span className={`text-[10px] mt-1 font-medium whitespace-nowrap ${
                            i === step ? 'text-primary-blue' : i < step ? 'text-green-600' : 'text-gray-400'}`}>
                            {label}
                        </span>
                    </div>
                    {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-2 mb-4 ${i < step ? 'bg-green-400' : 'bg-gray-200'}`} />}
                </React.Fragment>
            ))}
        </div>
    );

    const NavRow = ({ onNext, nextLabel = 'Next →', isSubmit = false }) => (
        <div className="flex items-center justify-between pt-5 mt-5 border-t border-gray-100">
            <button type="button" onClick={back} disabled={step === 0}
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition-colors">
                ← Back
            </button>
            <span className="text-xs text-gray-400">Step {step + 1} of {STEPS.length}</span>
            <button type="button" onClick={onNext} disabled={loading}
                className={`px-5 py-2.5 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors flex items-center gap-2 ${isSubmit ? 'bg-green-600 hover:bg-green-700' : 'bg-primary-blue hover:bg-[#4338ca]'}`}>
                {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {nextLabel}
            </button>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F7F8FC] flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                {/* Header */}
                <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-primary-blue rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                        <span className="text-white font-bold text-lg">G</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Vendor Registration</h1>
                    <p className="text-sm text-gray-500 mt-1">Create your vendor account to submit invoices</p>
                </div>

                <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6 sm:p-8">
                    {apiError && (
                        <div className="mb-4 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm">{apiError}</div>
                    )}

                    <StepBar />

                    {/* Step 0: Account */}
                    {step === 0 && (
                        <div className="space-y-4">
                            <Field label="Full Name" required error={errors.fullName}>
                                <input value={form.fullName} onChange={set('fullName')} placeholder="Your full name" className={inp(!!errors.fullName)} />
                            </Field>
                            <Field label="Email Address" required error={errors.email} hint="This will be your login email">
                                <input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" className={inp(!!errors.email)} />
                            </Field>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Field label="Password" required error={errors.password} hint="Min 8 characters">
                                    <input type="password" value={form.password} onChange={set('password')} placeholder="Create password" className={inp(!!errors.password)} />
                                </Field>
                                <Field label="Confirm Password" required error={errors.confirmPassword}>
                                    <input type="password" value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="Re-enter password" className={inp(!!errors.confirmPassword)} />
                                </Field>
                            </div>
                            <NavRow onNext={next} />
                        </div>
                    )}

                    {/* Step 1: Basic Info */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Field label="Vendor / Business Name" required error={errors.vendorName}>
                                    <input value={form.vendorName} onChange={set('vendorName')} placeholder="e.g. Ravi Media Productions" className={inp(!!errors.vendorName)} />
                                </Field>
                                <Field label="Vendor Type" required>
                                    <select value={form.vendorType} onChange={set('vendorType')} className={inp()}>
                                        {VENDOR_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </Field>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Field label="GST Number" error={errors.gstNumber} hint="Optional — 15 characters">
                                    <input value={form.gstNumber} onChange={set('gstNumber')} placeholder="e.g. 09AABCU9355J1ZS" className={inp(!!errors.gstNumber)} style={{ textTransform: 'uppercase' }} />
                                </Field>
                                <Field label="PAN Number" required error={errors.panNumber} hint="10 characters">
                                    <input value={form.panNumber} onChange={set('panNumber')} placeholder="e.g. ABCDE1234F" className={inp(!!errors.panNumber)} style={{ textTransform: 'uppercase' }} />
                                </Field>
                            </div>
                            <Field label="Address" required error={errors.address}>
                                <input value={form.address} onChange={set('address')} placeholder="Street address" className={inp(!!errors.address)} />
                            </Field>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <Field label="City" required error={errors.city}>
                                    <input value={form.city} onChange={set('city')} placeholder="City" className={inp(!!errors.city)} />
                                </Field>
                                <Field label="State" required error={errors.state}>
                                    <input value={form.state} onChange={set('state')} placeholder="State" className={inp(!!errors.state)} />
                                </Field>
                                <Field label="Pincode" required error={errors.pincode}>
                                    <input value={form.pincode} onChange={set('pincode')} placeholder="6 digits" maxLength={6} inputMode="numeric" className={inp(!!errors.pincode)} />
                                </Field>
                                <Field label="Country">
                                    <input value={form.country} onChange={set('country')} className={inp()} />
                                </Field>
                            </div>
                            <NavRow onNext={next} />
                        </div>
                    )}

                    {/* Step 2: Contact */}
                    {step === 2 && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Field label="Contact Person Name" required error={errors.contactPerson}>
                                    <input value={form.contactPerson} onChange={set('contactPerson')} placeholder="Primary contact" className={inp(!!errors.contactPerson)} />
                                </Field>
                                <Field label="Mobile Number" required error={errors.mobile} hint="10-digit Indian number">
                                    <input type="tel" inputMode="numeric" maxLength={10} value={form.mobile} onChange={set('mobile')} placeholder="9876543210" className={inp(!!errors.mobile)} />
                                </Field>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Field label="Alternate Mobile" error={errors.altMobile} hint="Optional">
                                    <input type="tel" inputMode="numeric" maxLength={10} value={form.altMobile} onChange={set('altMobile')} placeholder="9876543210" className={inp(!!errors.altMobile)} />
                                </Field>
                                <Field label="Website" hint="Optional">
                                    <input value={form.website} onChange={set('website')} placeholder="https://yoursite.com" className={inp()} />
                                </Field>
                            </div>
                            <NavRow onNext={next} />
                        </div>
                    )}

                    {/* Step 3: Banking */}
                    {step === 3 && (
                        <div className="space-y-4">
                            <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3">
                                <p className="text-xs text-blue-700 font-medium">Bank details are optional but recommended for faster invoice processing.</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Field label="Account Holder Name">
                                    <input value={form.accountHolder} onChange={set('accountHolder')} placeholder="As per bank records" className={inp()} />
                                </Field>
                                <Field label="Bank Name">
                                    <input value={form.bankName} onChange={set('bankName')} placeholder="e.g. HDFC Bank" className={inp()} />
                                </Field>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Field label="Account Number" error={errors.accountNumber} hint="9–18 digits">
                                    <input inputMode="numeric" value={form.accountNumber} onChange={set('accountNumber')} placeholder="50200012345678" className={inp(!!errors.accountNumber)} />
                                </Field>
                                <Field label="Confirm Account Number" error={errors.confirmAccount}>
                                    <input inputMode="numeric" value={form.confirmAccount} onChange={set('confirmAccount')} placeholder="Re-enter account number" className={inp(!!errors.confirmAccount)} />
                                </Field>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Field label="IFSC Code" error={errors.ifscCode} hint="11 characters">
                                    <input value={form.ifscCode} onChange={set('ifscCode')} placeholder="HDFC0001234" className={inp(!!errors.ifscCode)} style={{ textTransform: 'uppercase' }} />
                                </Field>
                                <Field label="UPI ID" hint="Optional">
                                    <input value={form.upiId} onChange={set('upiId')} placeholder="vendor@upi" className={inp()} />
                                </Field>
                            </div>
                            <NavRow onNext={next} />
                        </div>
                    )}

                    {/* Step 4: Review */}
                    {step === 4 && (
                        <div className="space-y-4">
                            {[
                                { title: 'Account', rows: [['Name', form.fullName], ['Email', form.email]] },
                                { title: 'Business', rows: [['Vendor Name', form.vendorName], ['Type', form.vendorType], ['PAN', form.panNumber.toUpperCase()], ['GST', form.gstNumber.toUpperCase() || '—'], ['Location', `${form.city}, ${form.state} - ${form.pincode}`]] },
                                { title: 'Contact', rows: [['Contact Person', form.contactPerson], ['Mobile', form.mobile], ['Website', form.website || '—']] },
                                { title: 'Banking', rows: [['Bank', form.bankName || '—'], ['Account No.', form.accountNumber || '—'], ['IFSC', form.ifscCode.toUpperCase() || '—'], ['UPI', form.upiId || '—']] },
                            ].map(s => (
                                <div key={s.title} className="bg-gray-50 rounded-xl p-4">
                                    <p className="text-xs font-bold text-primary-blue uppercase tracking-wider mb-3 pb-2 border-b border-blue-100">{s.title}</p>
                                    <div className="space-y-2">
                                        {s.rows.map(([l, v]) => (
                                            <div key={l} className="flex justify-between gap-4">
                                                <span className="text-xs text-gray-500 font-medium w-32 flex-shrink-0">{l}</span>
                                                <span className="text-sm font-semibold text-gray-900 text-right break-all">{v}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            <NavRow onNext={handleSubmit} nextLabel={loading ? 'Creating account…' : '✓ Create Account'} isSubmit />
                        </div>
                    )}

                    <p className="text-center text-sm text-gray-500 mt-4">
                        Already have an account?{' '}
                        <Link to="/login" className="text-primary-blue font-medium hover:underline">Login here</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
