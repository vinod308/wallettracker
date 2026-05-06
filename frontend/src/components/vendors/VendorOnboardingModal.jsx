import React, { useState, useEffect, useRef } from 'react';
import Modal from '../common/Modal';

const STEPS = ['Basic Info', 'Contact', 'Banking', 'Documents', 'Review'];

const VENDOR_TYPES = ['Freelancer', 'Agency', 'Consultant', 'Production House', 'Software Vendor', 'Influencer', 'Employee Contractor'];

const EMPTY = {
    vendorName: '', vendorType: 'Freelancer', gstNumber: '', panNumber: '',
    address: '', city: '', state: '', pincode: '', country: 'India',
    contactPerson: '', email: '', mobile: '', altMobile: '', website: '',
    accountHolder: '', bankName: '', accountNumber: '', confirmAccount: '',
    ifscCode: '', upiId: '', swiftCode: '',
    docPAN: null, docCheque: null, docGST: null, docAgreement: null,
};

const GST_RE  = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const PAN_RE  = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_RE = /^[6-9]\d{9}$/;

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

const inp = (extra = '') =>
    `w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent transition-colors ${extra}`;

const VendorOnboardingModal = ({ isOpen, onClose, onVendorAdded, editVendor }) => {
    const [step, setStep]       = useState(0);
    const [form, setForm]       = useState({ ...EMPTY });
    const [errors, setErrors]   = useState({});
    const [loading, setLoading] = useState(false);
    const [done, setDone]       = useState(false);
    const [drafts, setDrafts]   = useState({});

    useEffect(() => {
        if (isOpen) {
            setForm(editVendor ? { ...EMPTY, ...editVendor } : { ...EMPTY });
            setStep(0); setErrors({}); setDone(false);
        }
    }, [isOpen, editVendor]);

    const set = (field) => (e) => {
        const val = e.target.value;
        setForm(f => ({ ...f, [field]: val }));
        setErrors(er => { const n = { ...er }; delete n[field]; return n; });
    };

    const validateStep = (s) => {
        const e = {};
        if (s === 0) {
            if (!form.vendorName.trim() || form.vendorName.trim().length < 2)
                e.vendorName = 'Vendor name is required (min 2 characters)';
            if (form.gstNumber.trim() && !GST_RE.test(form.gstNumber.trim().toUpperCase()))
                e.gstNumber = 'Enter a valid 15-character GST number';
            if (!form.panNumber.trim())
                e.panNumber = 'PAN number is required';
            else if (!PAN_RE.test(form.panNumber.trim().toUpperCase()))
                e.panNumber = 'Enter a valid PAN (e.g. ABCDE1234F)';
            if (!form.address.trim() || form.address.trim().length < 5)
                e.address = 'Address is required';
            if (!form.city.trim()) e.city = 'City is required';
            if (!form.state.trim()) e.state = 'State is required';
            if (!form.pincode.trim() || !/^\d{6}$/.test(form.pincode.trim()))
                e.pincode = 'Enter a valid 6-digit pincode';
        }
        if (s === 1) {
            if (!form.contactPerson.trim() || form.contactPerson.trim().length < 2)
                e.contactPerson = 'Contact person name is required';
            if (!form.email.trim())
                e.email = 'Email is required';
            else if (!EMAIL_RE.test(form.email.trim()))
                e.email = 'Enter a valid email address';
            if (!form.mobile.trim())
                e.mobile = 'Mobile number is required';
            else if (!MOBILE_RE.test(form.mobile.trim()))
                e.mobile = 'Enter a valid 10-digit Indian mobile number';
            if (form.altMobile.trim() && !MOBILE_RE.test(form.altMobile.trim()))
                e.altMobile = 'Enter a valid 10-digit mobile number';
        }
        if (s === 2) {
            if (form.accountNumber.trim() && !/^\d{9,18}$/.test(form.accountNumber.trim()))
                e.accountNumber = 'Enter a valid account number (9–18 digits)';
            if (form.accountNumber.trim() && form.confirmAccount !== form.accountNumber)
                e.confirmAccount = 'Account numbers do not match';
            if (form.ifscCode.trim() && !IFSC_RE.test(form.ifscCode.trim().toUpperCase()))
                e.ifscCode = 'Enter a valid 11-character IFSC code';
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const next = () => { if (validateStep(step)) setStep(s => s + 1); };
    const back = () => { setErrors({}); setStep(s => s - 1); };

    const saveDraft = () => {
        const id = editVendor?.id || `draft_${Date.now()}`;
        const d = { ...drafts, [id]: { ...form, isDraft: true, updatedAt: new Date().toISOString() } };
        setDrafts(d);
        localStorage.setItem('gw_vendor_drafts', JSON.stringify(d));
        alert('Draft saved successfully!');
    };

    const handleFileUpload = (field) => (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { alert('File must be under 5MB'); return; }
        const reader = new FileReader();
        reader.onload = (ev) => setForm(f => ({ ...f, [field]: { name: file.name, size: file.size, type: file.type, data: ev.target.result } }));
        reader.readAsDataURL(file);
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const vendor = {
                ...form,
                id:          editVendor?.id || `vnd_${Date.now()}`,
                gstNumber:   form.gstNumber.trim().toUpperCase(),
                panNumber:   form.panNumber.trim().toUpperCase(),
                ifscCode:    form.ifscCode.trim().toUpperCase(),
                onboardedAt: editVendor?.onboardedAt || new Date().toISOString(),
                updatedAt:   new Date().toISOString(),
            };

            const existing = JSON.parse(localStorage.getItem('gw_vendors') || '[]');
            const updated  = editVendor
                ? existing.map(v => v.id === editVendor.id ? vendor : v)
                : [...existing, vendor];
            localStorage.setItem('gw_vendors', JSON.stringify(updated));
            onVendorAdded?.();
            setDone(true);
        } catch {
            setErrors({ submit: 'Failed to save vendor. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setStep(0); setForm({ ...EMPTY }); setErrors({}); setDone(false);
        onClose();
    };

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

    const NavRow = ({ onNext, nextLabel = 'Next →', nextColor = 'bg-primary-blue hover:bg-[#4338ca]', showDraft = true }) => (
        <div className="flex items-center justify-between pt-5 mt-5 border-t border-gray-100">
            <div className="flex items-center gap-2">
                {step > 0 ? (
                    <button onClick={back} className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                        ← Back
                    </button>
                ) : <div />}
                {showDraft && (
                    <button onClick={saveDraft} className="px-4 py-2 border border-dashed border-gray-300 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors">
                        Save Draft
                    </button>
                )}
            </div>
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

    if (done) {
        return (
            <Modal isOpen={isOpen} onClose={handleClose} title={editVendor ? 'Vendor Updated' : 'Vendor Onboarded'} size="md">
                <div className="text-center py-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                        {editVendor ? `${form.vendorName} updated!` : `${form.vendorName} onboarded!`}
                    </h3>
                    <p className="text-sm text-gray-500 mb-6">
                        {editVendor
                            ? 'Vendor details have been updated successfully.'
                            : 'Vendor has been onboarded successfully. You can now generate POs for this vendor.'}
                    </p>
                    <div className="flex gap-3 justify-center">
                        <button onClick={handleClose} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                            Close
                        </button>
                        <button onClick={() => { setStep(0); setForm({ ...EMPTY }); setErrors({}); setDone(false); }}
                            className="px-5 py-2.5 bg-primary-blue text-white rounded-xl text-sm font-semibold hover:bg-[#4338ca] transition-colors">
                            + Add Another Vendor
                        </button>
                    </div>
                </div>
            </Modal>
        );
    }

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={editVendor ? 'Edit Vendor' : 'Vendor Onboarding'} size="lg">
            <StepBar />

            {/* STEP 1 — Basic Info */}
            {step === 0 && (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Vendor Name" required error={errors.vendorName}>
                            <input value={form.vendorName} onChange={set('vendorName')}
                                placeholder="e.g. Ravi Media Productions"
                                className={inp(errors.vendorName ? 'border-red-400 bg-red-50' : 'border-gray-200')} />
                        </Field>
                        <Field label="Vendor Type" required>
                            <select value={form.vendorType} onChange={set('vendorType')} className={inp('border-gray-200 bg-white')}>
                                {VENDOR_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </Field>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="GST Number" error={errors.gstNumber} hint="Optional — 15-character GST">
                            <input value={form.gstNumber} onChange={set('gstNumber')}
                                placeholder="e.g. 09AABCU9355J1ZS"
                                className={inp(errors.gstNumber ? 'border-red-400 bg-red-50' : 'border-gray-200')}
                                style={{ textTransform: 'uppercase' }} />
                        </Field>
                        <Field label="PAN Number" required error={errors.panNumber} hint="10-character PAN">
                            <input value={form.panNumber} onChange={set('panNumber')}
                                placeholder="e.g. ABCDE1234F"
                                className={inp(errors.panNumber ? 'border-red-400 bg-red-50' : 'border-gray-200')}
                                style={{ textTransform: 'uppercase' }} />
                        </Field>
                    </div>
                    <Field label="Address" required error={errors.address}>
                        <input value={form.address} onChange={set('address')}
                            placeholder="Street address"
                            className={inp(errors.address ? 'border-red-400 bg-red-50' : 'border-gray-200')} />
                    </Field>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Field label="City" required error={errors.city}>
                            <input value={form.city} onChange={set('city')} placeholder="City"
                                className={inp(errors.city ? 'border-red-400 bg-red-50' : 'border-gray-200')} />
                        </Field>
                        <Field label="State" required error={errors.state}>
                            <input value={form.state} onChange={set('state')} placeholder="State"
                                className={inp(errors.state ? 'border-red-400 bg-red-50' : 'border-gray-200')} />
                        </Field>
                        <Field label="Pincode" required error={errors.pincode}>
                            <input value={form.pincode} onChange={set('pincode')} placeholder="6 digits" maxLength={6}
                                inputMode="numeric"
                                className={inp(errors.pincode ? 'border-red-400 bg-red-50' : 'border-gray-200')} />
                        </Field>
                        <Field label="Country" required>
                            <input value={form.country} onChange={set('country')} placeholder="Country"
                                className={inp('border-gray-200')} />
                        </Field>
                    </div>
                    <NavRow onNext={next} />
                </div>
            )}

            {/* STEP 2 — Contact Info */}
            {step === 1 && (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Contact Person Name" required error={errors.contactPerson}>
                            <input value={form.contactPerson} onChange={set('contactPerson')}
                                placeholder="Primary contact name"
                                className={inp(errors.contactPerson ? 'border-red-400 bg-red-50' : 'border-gray-200')} />
                        </Field>
                        <Field label="Email Address" required error={errors.email} hint="PO emails will be sent here">
                            <input type="email" value={form.email} onChange={set('email')}
                                placeholder="vendor@example.com"
                                className={inp(errors.email ? 'border-red-400 bg-red-50' : 'border-gray-200')} />
                        </Field>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Mobile Number" required error={errors.mobile} hint="10-digit Indian number">
                            <input type="tel" inputMode="numeric" value={form.mobile} onChange={set('mobile')}
                                placeholder="e.g. 9876543210" maxLength={10}
                                className={inp(errors.mobile ? 'border-red-400 bg-red-50' : 'border-gray-200')} />
                        </Field>
                        <Field label="Alternate Mobile" error={errors.altMobile} hint="Optional">
                            <input type="tel" inputMode="numeric" value={form.altMobile} onChange={set('altMobile')}
                                placeholder="e.g. 9876543210" maxLength={10}
                                className={inp(errors.altMobile ? 'border-red-400 bg-red-50' : 'border-gray-200')} />
                        </Field>
                    </div>
                    <Field label="Website" hint="Optional">
                        <input value={form.website} onChange={set('website')}
                            placeholder="https://vendor.com"
                            className={inp('border-gray-200')} />
                    </Field>
                    <NavRow onNext={next} />
                </div>
            )}

            {/* STEP 3 — Banking Info */}
            {step === 2 && (
                <div className="space-y-4">
                    <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3">
                        <p className="text-xs text-blue-700 font-medium">
                            Bank details are used for PO payment processing. All fields optional but recommended.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Account Holder Name">
                            <input value={form.accountHolder} onChange={set('accountHolder')}
                                placeholder="As per bank records"
                                className={inp('border-gray-200')} />
                        </Field>
                        <Field label="Bank Name">
                            <input value={form.bankName} onChange={set('bankName')}
                                placeholder="e.g. HDFC Bank Limited"
                                className={inp('border-gray-200')} />
                        </Field>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Account Number" error={errors.accountNumber} hint="9–18 digits">
                            <input type="text" inputMode="numeric" value={form.accountNumber} onChange={set('accountNumber')}
                                placeholder="e.g. 50200012345678"
                                className={inp(errors.accountNumber ? 'border-red-400 bg-red-50' : 'border-gray-200')} />
                        </Field>
                        <Field label="Confirm Account Number" error={errors.confirmAccount}>
                            <input type="text" inputMode="numeric" value={form.confirmAccount} onChange={set('confirmAccount')}
                                placeholder="Re-enter account number"
                                className={inp(errors.confirmAccount ? 'border-red-400 bg-red-50' : 'border-gray-200')} />
                        </Field>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="IFSC Code" error={errors.ifscCode} hint="11 characters — e.g. HDFC0001234">
                            <input value={form.ifscCode} onChange={set('ifscCode')}
                                placeholder="e.g. HDFC0001351"
                                className={inp(errors.ifscCode ? 'border-red-400 bg-red-50' : 'border-gray-200')}
                                style={{ textTransform: 'uppercase' }} />
                        </Field>
                        <Field label="UPI ID" hint="Optional">
                            <input value={form.upiId} onChange={set('upiId')}
                                placeholder="e.g. vendor@upi"
                                className={inp('border-gray-200')} />
                        </Field>
                    </div>
                    <Field label="SWIFT Code" hint="Optional — for international transfers">
                        <input value={form.swiftCode} onChange={set('swiftCode')}
                            placeholder="e.g. HDFCINBB"
                            className={inp('border-gray-200')}
                            style={{ textTransform: 'uppercase' }} />
                    </Field>
                    <NavRow onNext={next} />
                </div>
            )}

            {/* STEP 4 — Documents */}
            {step === 3 && (
                <div className="space-y-4">
                    <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-3">
                        <p className="text-xs text-amber-700 font-medium">
                            All documents are optional. Accepted: PDF, JPG, PNG (max 5MB each).
                        </p>
                    </div>
                    {[
                        { field: 'docPAN',       label: 'PAN Card',           icon: '🪪' },
                        { field: 'docCheque',    label: 'Cancelled Cheque',   icon: '🏦' },
                        { field: 'docGST',       label: 'GST Certificate',    icon: '📄' },
                        { field: 'docAgreement', label: 'Agreement / Contract', icon: '📝' },
                    ].map(({ field, label, icon }) => (
                        <DocUploadField key={field} field={field} label={label} icon={icon}
                            file={form[field]} onUpload={handleFileUpload(field)}
                            onRemove={() => setForm(f => ({ ...f, [field]: null }))} />
                    ))}
                    <NavRow onNext={next} />
                </div>
            )}

            {/* STEP 5 — Review & Submit */}
            {step === 4 && (
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
                                ['Vendor Name', form.vendorName],
                                ['Vendor Type', form.vendorType],
                                ['GST Number', form.gstNumber || '—'],
                                ['PAN Number', form.panNumber.toUpperCase()],
                                ['Address', `${form.address}, ${form.city}, ${form.state} - ${form.pincode}, ${form.country}`],
                            ],
                        },
                        {
                            title: 'Contact Information',
                            rows: [
                                ['Contact Person', form.contactPerson],
                                ['Email', form.email],
                                ['Mobile', form.mobile],
                                ['Alt. Mobile', form.altMobile || '—'],
                                ['Website', form.website || '—'],
                            ],
                        },
                        {
                            title: 'Banking Details',
                            rows: [
                                ['Account Holder', form.accountHolder || '—'],
                                ['Bank Name', form.bankName || '—'],
                                ['Account No.', form.accountNumber || '—'],
                                ['IFSC Code', form.ifscCode.toUpperCase() || '—'],
                                ['UPI ID', form.upiId || '—'],
                            ],
                        },
                        {
                            title: 'Documents',
                            rows: [
                                ['PAN Card', form.docPAN ? form.docPAN.name : '—'],
                                ['Cancelled Cheque', form.docCheque ? form.docCheque.name : '—'],
                                ['GST Certificate', form.docGST ? form.docGST.name : '—'],
                                ['Agreement', form.docAgreement ? form.docAgreement.name : '—'],
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
                        nextLabel={loading ? 'Saving…' : '✓ Submit Vendor'}
                        nextColor="bg-green-600 hover:bg-green-700"
                        showDraft={false}
                    />
                </div>
            )}
        </Modal>
    );
};

const DocUploadField = ({ field, label, icon, file, onUpload, onRemove }) => {
    const ref = useRef();
    return (
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 hover:border-primary-blue/40 transition-colors">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">{icon}</span>
                    <div>
                        <p className="text-sm font-semibold text-gray-700">{label}</p>
                        {file ? (
                            <p className="text-xs text-green-600 font-medium mt-0.5">
                                {file.name} ({(file.size / 1024).toFixed(0)} KB)
                            </p>
                        ) : (
                            <p className="text-xs text-gray-400 mt-0.5">PDF, JPG, PNG — max 5MB</p>
                        )}
                    </div>
                </div>
                {file ? (
                    <button onClick={onRemove}
                        className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
                        Remove
                    </button>
                ) : (
                    <button onClick={() => ref.current?.click()}
                        className="px-3 py-1.5 text-xs font-medium text-primary-blue border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
                        Upload
                    </button>
                )}
            </div>
            <input ref={ref} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={onUpload} />
        </div>
    );
};

export default VendorOnboardingModal;
