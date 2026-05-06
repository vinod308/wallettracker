import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';

const STEPS = ['Basic Info', 'Bank Details', 'Contact Info', 'Review & Submit'];

const EMPTY = {
    clientName: '', gstNumber: '', address: '', state: '', stateCode: '', clientType: 'Retainer',
    bankName: '', accountNumber: '', ifscCode: '',
    contactPerson: '', contactEmail: '', mobileNumber: '', altContactEmail: '',
};

const GST_RE   = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const IFSC_RE  = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Field = ({ label, required, error, hint, children }) => (
    <div>
        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        {children}
        {hint  && !error && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
);

const inp = (extra = '') =>
    `w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent transition-colors ${extra}`;

const ClientOnboardingModal = ({ isOpen, onClose, onClientAdded, editClient }) => {
    const [step, setStep]       = useState(0);
    const [form, setForm]       = useState({ ...EMPTY });
    const [errors, setErrors]   = useState({});
    const [loading, setLoading] = useState(false);
    const [done, setDone]       = useState(false);

    useEffect(() => {
        if (isOpen) {
            setForm(editClient ? { ...EMPTY, ...editClient } : { ...EMPTY });
            setStep(0);
            setErrors({});
            setDone(false);
        }
    }, [isOpen, editClient]);

    const set = (field) => (e) => {
        setForm(f => ({ ...f, [field]: e.target.value }));
        setErrors(er => { const n = { ...er }; delete n[field]; return n; });
    };

    // ── Validation per step ───────────────────────────────────────────────────
    const validateStep = (s) => {
        const e = {};
        if (s === 0) {
            if (!form.clientName.trim() || form.clientName.trim().length < 3)
                e.clientName = 'Client name is required (min 3 characters)';
            if (!form.gstNumber.trim())
                e.gstNumber = 'GST number is required';
            else if (!GST_RE.test(form.gstNumber.trim().toUpperCase()))
                e.gstNumber = 'Enter a valid 15-character GST number';
            if (!form.address.trim() || form.address.trim().length < 10)
                e.address = 'Address is required (min 10 characters)';
            if (!form.state.trim())
                e.state = 'State is required';
            if (!form.stateCode.trim())
                e.stateCode = 'State code is required';
        }
        if (s === 1) {
            if (!form.bankName.trim())
                e.bankName = 'Bank name is required';
            if (!form.accountNumber.trim())
                e.accountNumber = 'Account number is required';
            else if (!/^\d{9,18}$/.test(form.accountNumber.trim()))
                e.accountNumber = 'Enter a valid account number (9–18 digits)';
            if (!form.ifscCode.trim())
                e.ifscCode = 'IFSC code is required';
            else if (!IFSC_RE.test(form.ifscCode.trim().toUpperCase()))
                e.ifscCode = 'Enter a valid 11-character IFSC code (e.g. HDFC0001234)';
        }
        if (s === 2) {
            if (!form.contactPerson.trim() || form.contactPerson.trim().length < 2)
                e.contactPerson = 'Contact person name is required';
            if (!form.contactEmail.trim())
                e.contactEmail = 'Contact email is required';
            else if (!EMAIL_RE.test(form.contactEmail.trim()))
                e.contactEmail = 'Enter a valid email address';
            if (!form.mobileNumber.trim())
                e.mobileNumber = 'Mobile number is required';
            else if (!/^[6-9]\d{9}$/.test(form.mobileNumber.trim()))
                e.mobileNumber = 'Enter a valid 10-digit mobile number (starts with 6–9)';
            if (form.altContactEmail.trim() && !EMAIL_RE.test(form.altContactEmail.trim()))
                e.altContactEmail = 'Enter a valid email address';
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const next = () => { if (validateStep(step)) setStep(s => s + 1); };
    const back = () => { setErrors({}); setStep(s => s - 1); };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const client = {
                ...form,
                gstNumber:   form.gstNumber.trim().toUpperCase(),
                ifscCode:    form.ifscCode.trim().toUpperCase(),
                id:          editClient?.id || `oc_${Date.now()}`,
                onboardedAt: editClient?.onboardedAt || new Date().toISOString(),
                updatedAt:   new Date().toISOString(),
            };

            const existing = JSON.parse(localStorage.getItem('gw_onboarded_clients') || '[]');
            const updated = editClient
                ? existing.map(c => c.id === editClient.id ? client : c)
                : [...existing, client];
            localStorage.setItem('gw_onboarded_clients', JSON.stringify(updated));

            // Attempt backend save (non-blocking)
            try {
                const api = (await import('../../services/api')).default;
                await api.post('/clients/onboard', client);
            } catch { /* backend not ready yet */ }

            onClientAdded?.();
            setDone(true);
        } catch {
            setErrors({ submit: 'Failed to save client. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setStep(0); setForm({ ...EMPTY }); setErrors({}); setDone(false);
        onClose();
    };

    // ── Step Indicator ────────────────────────────────────────────────────────
    const StepBar = () => (
        <div className="flex items-center mb-6">
            {STEPS.map((label, i) => (
                <React.Fragment key={i}>
                    <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                            i < step  ? 'bg-green-500 text-white' :
                            i === step ? 'bg-primary-blue text-white ring-4 ring-blue-100' :
                            'bg-gray-100 text-gray-400'
                        }`}>
                            {i < step ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            ) : i + 1}
                        </div>
                        <span className={`text-[10px] mt-1 font-medium whitespace-nowrap ${
                            i === step ? 'text-primary-blue' : i < step ? 'text-green-600' : 'text-gray-400'
                        }`}>{label}</span>
                    </div>
                    {i < STEPS.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-2 mb-4 transition-colors ${i < step ? 'bg-green-400' : 'bg-gray-200'}`} />
                    )}
                </React.Fragment>
            ))}
        </div>
    );

    // ── Nav buttons ───────────────────────────────────────────────────────────
    const NavRow = ({ onNext, nextLabel = 'Next →', nextColor = 'bg-primary-blue hover:bg-[#4338ca]' }) => (
        <div className="flex items-center justify-between pt-5 mt-5 border-t border-gray-100">
            {step > 0 ? (
                <button onClick={back} className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                    ← Back
                </button>
            ) : <div />}
            <span className="text-xs text-gray-400">Step {step + 1} of {STEPS.length}</span>
            <button
                onClick={onNext}
                disabled={loading}
                className={`px-5 py-2.5 ${nextColor} text-white rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50 flex items-center gap-2`}
            >
                {loading && <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
                {nextLabel}
            </button>
        </div>
    );

    // ── Success Screen ────────────────────────────────────────────────────────
    if (done) {
        return (
            <Modal isOpen={isOpen} onClose={handleClose} title={editClient ? 'Client Updated' : 'Client Onboarded'} size="md">
                <div className="text-center py-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                        {editClient ? `${form.clientName} updated!` : `${form.clientName} added!`}
                    </h3>
                    <p className="text-sm text-gray-500 mb-6">
                        {editClient
                            ? 'Client details have been updated successfully.'
                            : 'Client has been onboarded successfully. You can now generate invoices for this client.'}
                    </p>
                    <div className="flex gap-3 justify-center">
                        <button onClick={handleClose} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                            Close
                        </button>
                        <button onClick={() => { setStep(0); setForm({ ...EMPTY }); setErrors({}); setDone(false); }} className="px-5 py-2.5 bg-primary-blue text-white rounded-xl text-sm font-semibold hover:bg-[#4338ca] transition-colors">
                            + Add Another Client
                        </button>
                    </div>
                </div>
            </Modal>
        );
    }

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={editClient ? 'Edit Client' : 'Client Onboarding'} size="lg">
            <StepBar />

            {/* ── STEP 1: Basic Info ──────────────────────────────────────── */}
            {step === 0 && (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Client / Company Name" required error={errors.clientName}>
                            <input
                                value={form.clientName} onChange={set('clientName')}
                                placeholder="e.g. Utkarsh Small Finance Bank Ltd"
                                className={inp(errors.clientName ? 'border-red-400 bg-red-50' : 'border-gray-200')}
                            />
                        </Field>
                        <Field label="Client Type" required>
                            <select value={form.clientType} onChange={set('clientType')} className={inp('border-gray-200 bg-white')}>
                                <option value="Retainer">Retainer</option>
                                <option value="Contractor">Contractor</option>
                                <option value="Project">Project</option>
                            </select>
                        </Field>
                    </div>
                    <Field label="GST Number" required error={errors.gstNumber} hint="15-character GST — e.g. 09AABCU9355J1ZS">
                        <input
                            value={form.gstNumber} onChange={set('gstNumber')}
                            placeholder="e.g. 09AABCU9355J1ZS"
                            className={inp(errors.gstNumber ? 'border-red-400 bg-red-50' : 'border-gray-200')}
                            style={{ textTransform: 'uppercase' }}
                        />
                    </Field>
                    <Field label="Registered Address" required error={errors.address}>
                        <input
                            value={form.address} onChange={set('address')}
                            placeholder="Full registered address"
                            className={inp(errors.address ? 'border-red-400 bg-red-50' : 'border-gray-200')}
                        />
                    </Field>
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="State" required error={errors.state}>
                            <input
                                value={form.state} onChange={set('state')}
                                placeholder="e.g. Uttar Pradesh"
                                className={inp(errors.state ? 'border-red-400 bg-red-50' : 'border-gray-200')}
                            />
                        </Field>
                        <Field label="State Code" required error={errors.stateCode} hint="2-digit GST state code">
                            <input
                                value={form.stateCode} onChange={set('stateCode')}
                                placeholder="e.g. 09"
                                className={inp(errors.stateCode ? 'border-red-400 bg-red-50' : 'border-gray-200')}
                            />
                        </Field>
                    </div>
                    <NavRow onNext={next} />
                </div>
            )}

            {/* ── STEP 2: Bank Details ────────────────────────────────────── */}
            {step === 1 && (
                <div className="space-y-4">
                    <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3 mb-2">
                        <p className="text-xs text-blue-700 font-medium">
                            These are the <strong>client's bank details</strong> used for reference on invoices and POs.
                        </p>
                    </div>
                    <Field label="Bank Name" required error={errors.bankName}>
                        <input
                            value={form.bankName} onChange={set('bankName')}
                            placeholder="e.g. HDFC Bank Limited"
                            className={inp(errors.bankName ? 'border-red-400 bg-red-50' : 'border-gray-200')}
                        />
                    </Field>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Account Number" required error={errors.accountNumber} hint="9–18 digits, numeric only">
                            <input
                                type="text"
                                inputMode="numeric"
                                value={form.accountNumber} onChange={set('accountNumber')}
                                placeholder="e.g. 50200012345678"
                                className={inp(errors.accountNumber ? 'border-red-400 bg-red-50' : 'border-gray-200')}
                            />
                        </Field>
                        <Field label="IFSC Code" required error={errors.ifscCode} hint="11 characters — e.g. HDFC0001234">
                            <input
                                value={form.ifscCode} onChange={set('ifscCode')}
                                placeholder="e.g. HDFC0001351"
                                className={inp(errors.ifscCode ? 'border-red-400 bg-red-50' : 'border-gray-200')}
                                style={{ textTransform: 'uppercase' }}
                            />
                        </Field>
                    </div>
                    <NavRow onNext={next} />
                </div>
            )}

            {/* ── STEP 3: Contact Info ────────────────────────────────────── */}
            {step === 2 && (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Contact Person" required error={errors.contactPerson}>
                            <input
                                value={form.contactPerson} onChange={set('contactPerson')}
                                placeholder="Primary contact name"
                                className={inp(errors.contactPerson ? 'border-red-400 bg-red-50' : 'border-gray-200')}
                            />
                        </Field>
                        <Field label="Contact Email" required error={errors.contactEmail} hint="Invoice emails will be sent here">
                            <input
                                type="email"
                                value={form.contactEmail} onChange={set('contactEmail')}
                                placeholder="contact@company.com"
                                className={inp(errors.contactEmail ? 'border-red-400 bg-red-50' : 'border-gray-200')}
                            />
                        </Field>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Mobile Number" required error={errors.mobileNumber} hint="10-digit Indian mobile number">
                            <input
                                type="tel"
                                inputMode="numeric"
                                value={form.mobileNumber} onChange={set('mobileNumber')}
                                placeholder="e.g. 9876543210"
                                maxLength={10}
                                className={inp(errors.mobileNumber ? 'border-red-400 bg-red-50' : 'border-gray-200')}
                            />
                        </Field>
                        <Field label="Alternate Contact Email" error={errors.altContactEmail} hint="Optional">
                            <input
                                type="email"
                                value={form.altContactEmail} onChange={set('altContactEmail')}
                                placeholder="alternate@company.com"
                                className={inp(errors.altContactEmail ? 'border-red-400 bg-red-50' : 'border-gray-200')}
                            />
                        </Field>
                    </div>
                    <NavRow onNext={next} />
                </div>
            )}

            {/* ── STEP 4: Review & Submit ─────────────────────────────────── */}
            {step === 3 && (
                <div className="space-y-4">
                    {errors.submit && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                            <p className="text-sm text-red-700">{errors.submit}</p>
                        </div>
                    )}

                    {[
                        {
                            title: 'Basic Information',
                            rows: [
                                ['Client Name', form.clientName],
                                ['Client Type', form.clientType],
                                ['GST Number', form.gstNumber.toUpperCase()],
                                ['Address', form.address],
                                ['State', `${form.state} — Code: ${form.stateCode}`],
                            ],
                        },
                        {
                            title: 'Bank Details',
                            rows: [
                                ['Bank Name', form.bankName],
                                ['Account Number', form.accountNumber],
                                ['IFSC Code', form.ifscCode.toUpperCase()],
                            ],
                        },
                        {
                            title: 'Contact Information',
                            rows: [
                                ['Contact Person', form.contactPerson],
                                ['Contact Email', form.contactEmail],
                                ['Mobile Number', form.mobileNumber],
                                ['Alt. Contact Email', form.altContactEmail || '—'],
                            ],
                        },
                    ].map(section => (
                        <div key={section.title} className="bg-gray-50 rounded-xl p-4">
                            <p className="text-xs font-bold text-primary-blue uppercase tracking-wider mb-3 pb-2 border-b border-blue-100">
                                {section.title}
                            </p>
                            <div className="space-y-2">
                                {section.rows.map(([label, value]) => (
                                    <div key={label} className="flex justify-between items-start gap-4">
                                        <span className="text-xs text-gray-500 font-medium w-36 flex-shrink-0">{label}</span>
                                        <span className="text-sm font-semibold text-gray-900 text-right break-all">{value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    <NavRow
                        onNext={handleSubmit}
                        nextLabel={loading ? 'Saving…' : '✓ Submit & Add Client'}
                        nextColor="bg-green-600 hover:bg-green-700"
                    />
                </div>
            )}
        </Modal>
    );
};

export default ClientOnboardingModal;
