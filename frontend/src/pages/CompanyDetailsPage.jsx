import React, { useState, useRef, useCallback, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { INDIA_STATES } from '../utils/indiaStates';
import settingsService from '../services/settingsService';

// ── Regexes ────────────────────────────────────────────────────────────────
const GST_RE   = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const PAN_RE   = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const IFSC_RE  = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PIN_RE   = /^\d{6}$/;
const ACC_RE   = /^\d{9,18}$/;

const STEPS = ['Company Info', 'Banking', 'Branding', 'Billing & Invoice', 'Documents'];

const EMPTY = {
    companyName: '', gstin: '', pan: '', companyEmail: '', address: '',
    state: '', stateCode: '', pinCode: '', cin: '', signatoryName: '',
    accountHolderName: '', bankName: '', accountNo: '', ifsc: '', branch: '', swiftCode: '',
    logoDataUrl: '', logoFileName: '',
    signatureDataUrl: '', signatureFileName: '',
    themeColor: '#4F46E5',
    stampDataUrl: '', stampFileName: '',
    invoicePrefix: 'GPPL', currency: 'INR', paymentTerms: '', gstPercentage: '18',
    gstCertDataUrl: '', gstCertFileName: '',
    panCardDataUrl: '', panCardFileName: '',
    cancelledChequeDataUrl: '', cancelledChequeFileName: '',
    incorporationCertDataUrl: '', incorporationCertFileName: '',
};

// ── File → base64 ─────────────────────────────────────────────────────────
const readFile = (file) =>
    new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve({ dataUrl: reader.result, fileName: file.name });
        reader.readAsDataURL(file);
    });

// ── FileUploadField ────────────────────────────────────────────────────────
const FileUploadField = ({ label, required, accept, dataUrl, fileName, onChange, onClear, previewType = 'image', error }) => {
    const [dragging, setDragging] = useState(false);
    const inputRef = useRef();

    const handle = async (file) => {
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) { alert('File must be under 2MB'); return; }
        const result = await readFile(file);
        onChange(result.dataUrl, result.fileName);
    };

    const onDrop = (e) => {
        e.preventDefault(); setDragging(false);
        handle(e.dataTransfer.files[0]);
    };

    return (
        <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                {label} {required && <span className="text-red-500">*</span>}
                {!required && <span className="text-gray-400 font-normal normal-case ml-1">(Optional)</span>}
            </label>
            {dataUrl ? (
                <div className="border border-gray-200 rounded-xl p-3 flex items-center gap-3">
                    {previewType === 'image' ? (
                        <img src={dataUrl} alt={label} className="h-12 w-auto max-w-[120px] object-contain rounded-lg border border-gray-100" />
                    ) : (
                        <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-primary-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 truncate">{fileName}</p>
                        <p className="text-xs text-green-600 mt-0.5">✓ Uploaded</p>
                    </div>
                    <button onClick={onClear} className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            ) : (
                <div
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={onDrop}
                    onClick={() => inputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-200 ${
                        dragging ? 'border-primary-blue bg-blue-50' : error ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-primary-blue hover:bg-blue-50/30'
                    }`}
                >
                    <svg className={`w-6 h-6 mx-auto mb-1.5 ${dragging ? 'text-primary-blue' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-xs text-gray-500">Drag & drop or <span className="text-primary-blue font-semibold">browse</span></p>
                    <p className="text-xs text-gray-400 mt-0.5">{accept?.replace(/,/g, ', ')} · Max 2MB</p>
                </div>
            )}
            <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={(e) => handle(e.target.files[0])} />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
};

// ── TextInput ──────────────────────────────────────────────────────────────
const inp = (err) =>
    `w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent transition-colors ${err ? 'border-red-400 bg-red-50' : 'border-gray-200'}`;

const Field = ({ label, required, error, hint, children }) => (
    <div>
        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
            {label} {required && <span className="text-red-500">*</span>}
            {!required && <span className="text-gray-400 font-normal normal-case ml-1">(Optional)</span>}
        </label>
        {children}
        {hint && !error && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
);

// ── Step Bar ───────────────────────────────────────────────────────────────
const StepBar = ({ step }) => (
    <div className="flex items-center mb-8">
        {STEPS.map((label, i) => (
            <React.Fragment key={i}>
                <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                        i < step ? 'bg-green-500 text-white' :
                        i === step ? 'bg-primary-blue text-white ring-4 ring-blue-100' :
                        'bg-gray-100 text-gray-400'
                    }`}>
                        {i < step ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg> : i + 1}
                    </div>
                    <span className={`text-[10px] mt-1 font-medium whitespace-nowrap hidden sm:block ${i === step ? 'text-primary-blue' : i < step ? 'text-green-600' : 'text-gray-400'}`}>{label}</span>
                </div>
                {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 mb-4 transition-colors ${i < step ? 'bg-green-400' : 'bg-gray-200'}`} />
                )}
            </React.Fragment>
        ))}
    </div>
);

// ── Info display for view mode ─────────────────────────────────────────────
const InfoItem = ({ label, value }) => (
    <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-gray-900" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{value || '—'}</p>
    </div>
);

const ViewCard = ({ title, icon, children, gridClass = 'grid-cols-2 sm:grid-cols-3' }) => (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card border border-gray-100/50 p-5 mb-4">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            <span className="text-primary-blue">{icon}</span>
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">{title}</h3>
        </div>
        <div className={`grid ${gridClass} gap-4`}>{children}</div>
    </div>
);

// ═══════════════════════════════════════════════════════════════════════════
// Main Page
// ═══════════════════════════════════════════════════════════════════════════
const CompanyDetailsPage = () => {
    const [saved,     setSaved]     = useState(() => JSON.parse(localStorage.getItem('gw_settings') || 'null'));
    const [editing,   setEditing]   = useState(false);
    const [step,      setStep]      = useState(0);
    const [form,      setForm]      = useState({ ...EMPTY });
    const [errors,    setErrors]    = useState({});
    const [saving,    setSaving]    = useState(false);

    // Load from server on mount; auto-migrate localStorage → server if server is empty
    useEffect(() => {
        settingsService.getCompanySettings().then(serverSettings => {
            if (serverSettings && serverSettings.companyName) {
                localStorage.setItem('gw_settings', JSON.stringify(serverSettings));
                setSaved(serverSettings);
            } else {
                const localSettings = JSON.parse(localStorage.getItem('gw_settings') || 'null');
                if (localSettings && localSettings.companyName && !localSettings.isDraft) {
                    settingsService.saveCompanySettings(localSettings, false)
                        .then(saved => {
                            localStorage.setItem('gw_settings', JSON.stringify(saved));
                            setSaved(saved);
                        })
                        .catch(() => {});
                }
            }
        }).catch(() => { /* use localStorage cache if server unreachable */ });
    }, []);

    // Pre-fill form when editing
    useEffect(() => {
        if (editing && saved) setForm({ ...EMPTY, ...saved });
        if (!editing) { setStep(0); setErrors({}); }
    }, [editing, saved]);

    const set = (field) => (e) => {
        const val = e.target ? e.target.value : e;
        setForm(f => ({ ...f, [field]: val }));
        setErrors(er => { const n = { ...er }; delete n[field]; return n; });
    };

    const setFile = (field, nameField) => (dataUrl, fileName) => {
        setForm(f => ({ ...f, [field]: dataUrl, [nameField]: fileName }));
        setErrors(er => { const n = { ...er }; delete n[field]; return n; });
    };

    const clearFile = (field, nameField) => () =>
        setForm(f => ({ ...f, [field]: '', [nameField]: '' }));

    // ── Validation per step ─────────────────────────────────────────────
    const validate = (s) => {
        const e = {};
        if (s === 0) {
            if (!form.companyName.trim() || form.companyName.trim().length < 2) e.companyName = 'Company name is required';
            if (!form.gstin.trim()) e.gstin = 'GSTIN is required';
            else if (!GST_RE.test(form.gstin.trim().toUpperCase())) e.gstin = 'Invalid GSTIN format (15 characters)';
            if (!form.pan.trim()) e.pan = 'PAN is required';
            else if (!PAN_RE.test(form.pan.trim().toUpperCase())) e.pan = 'Invalid PAN (e.g. AAGCG1126N)';
            if (!form.companyEmail.trim()) e.companyEmail = 'Company email is required';
            else if (!EMAIL_RE.test(form.companyEmail.trim())) e.companyEmail = 'Enter a valid email';
            if (!form.address.trim() || form.address.trim().length < 10) e.address = 'Full address required (min 10 chars)';
            if (!form.state.trim()) e.state = 'State is required';
            if (!form.stateCode.trim()) e.stateCode = 'State code is required';
            if (!form.pinCode.trim()) e.pinCode = 'PIN code is required';
            else if (!PIN_RE.test(form.pinCode.trim())) e.pinCode = 'PIN must be 6 digits';
        }
        if (s === 1) {
            if (!form.accountHolderName.trim()) e.accountHolderName = 'Account holder name is required';
            if (!form.bankName.trim()) e.bankName = 'Bank name is required';
            if (!form.accountNo.trim()) e.accountNo = 'Account number is required';
            else if (!ACC_RE.test(form.accountNo.trim())) e.accountNo = 'Enter 9–18 digit account number';
            if (!form.ifsc.trim()) e.ifsc = 'IFSC code is required';
            else if (!IFSC_RE.test(form.ifsc.trim().toUpperCase())) e.ifsc = 'Invalid IFSC (e.g. HDFC0001234)';
            if (!form.branch.trim()) e.branch = 'Branch name is required';
        }
        if (s === 2) {
            if (!form.logoDataUrl) e.logoDataUrl = 'Company logo is required';
        }
        if (s === 3) {
            if (!form.invoicePrefix.trim()) e.invoicePrefix = 'Invoice prefix is required';
            if (!form.currency) e.currency = 'Currency is required';
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const next = () => { if (validate(step)) setStep(s => s + 1); };
    const back = () => { setErrors({}); setStep(s => s - 1); };

    const saveDraft = async () => {
        const draft = { ...form, isDraft: true, updatedAt: new Date().toISOString() };
        localStorage.setItem('gw_settings', JSON.stringify(draft));
        try { await settingsService.saveCompanySettings(draft, true); } catch { /* localStorage already saved */ }
        alert('Draft saved!');
    };

    const handleSubmit = async () => {
        setSaving(true);
        const data = {
            ...form,
            gstin:  form.gstin.trim().toUpperCase(),
            pan:    form.pan.trim().toUpperCase(),
            ifsc:   form.ifsc.trim().toUpperCase(),
            name:      form.companyName,
            email:     form.companyEmail,
            accountNo: form.accountNo,
            signatory: form.signatoryName || form.accountHolderName,
            city:      `${form.state} — ${form.pinCode}`,
            submittedAt: new Date().toISOString(),
            isDraft: false,
        };
        localStorage.setItem('gw_settings', JSON.stringify(data));
        try { await settingsService.saveCompanySettings(data, false); } catch { /* localStorage already saved */ }
        setSaved(data);
        setEditing(false);
        setSaving(false);
    };

    // ═══════════════════════════════════════════════════════════════════
    // VIEW MODE
    // ═══════════════════════════════════════════════════════════════════
    if (saved && !saved.isDraft && !editing) {
        const s = saved;
        return (
            <MainLayout>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 flex-wrap mb-6">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Logo — fixed 48×48 container, never grows */}
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl border border-gray-100 shadow-sm bg-white p-1.5 overflow-hidden">
                            {s.logoDataUrl ? (
                                <img src={s.logoDataUrl} alt="Logo" className="w-full h-full object-contain" />
                            ) : (
                                <div className="w-full h-full rounded-lg bg-primary-blue/10 flex items-center justify-center">
                                    <span className="text-primary-blue font-bold text-xl">{(s.companyName || 'G').charAt(0)}</span>
                                </div>
                            )}
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-base sm:text-2xl font-bold text-gray-900 leading-snug" style={{ wordBreak: 'break-word' }}>
                                {s.companyName}
                            </h1>
                            <p className="text-xs sm:text-sm text-gray-500 mt-0.5" style={{ wordBreak: 'break-word' }}>
                                GSTIN: {s.gstin} · PAN: {s.pan}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setEditing(true)}
                        className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-primary-blue text-white rounded-xl text-sm font-semibold hover:bg-[#4338ca] transition-all duration-200 shadow-sm"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit Details
                    </button>
                </div>

                <ViewCard title="Company Information" gridClass="grid-cols-2 sm:grid-cols-3" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}>
                    <InfoItem label="Company Name"       value={s.companyName} />
                    <InfoItem label="GSTIN"              value={s.gstin} />
                    <InfoItem label="PAN"                value={s.pan} />
                    <InfoItem label="Email"              value={s.companyEmail} />
                    <InfoItem label="State / Code"       value={`${s.state} (${s.stateCode})`} />
                    <InfoItem label="PIN Code"           value={s.pinCode} />
                    <div className="col-span-2 sm:col-span-3"><InfoItem label="Address" value={s.address} /></div>
                    {s.cin && <InfoItem label="CIN" value={s.cin} />}
                    {s.signatoryName && <InfoItem label="Authorised Signatory" value={s.signatoryName} />}
                </ViewCard>

                <ViewCard title="Banking Details" gridClass="grid-cols-2 sm:grid-cols-3" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>}>
                    <InfoItem label="Account Holder" value={s.accountHolderName} />
                    <InfoItem label="Bank Name"      value={s.bankName} />
                    <InfoItem label="Account No."    value={s.accountNo} />
                    <InfoItem label="IFSC Code"      value={s.ifsc} />
                    <InfoItem label="Branch"         value={s.branch} />
                    {s.swiftCode && <InfoItem label="SWIFT Code" value={s.swiftCode} />}
                </ViewCard>

                <ViewCard title="Branding" gridClass="grid-cols-2 sm:grid-cols-4" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>}>
                    {[
                        ['Company Logo',  s.logoDataUrl,      'Logo'],
                        ['Signature',     s.signatureDataUrl, 'Signature'],
                        ['Stamp',         s.stampDataUrl,     'Stamp'],
                    ].map(([label, url, altText]) => (
                        <div key={label}>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{label}</p>
                            {url ? (
                                <div className="w-24 h-14 border border-gray-100 rounded-lg bg-gray-50 overflow-hidden flex items-center justify-center p-1.5">
                                    <img src={url} alt={altText} className="max-w-full max-h-full object-contain" />
                                </div>
                            ) : <p className="text-sm text-gray-400">—</p>}
                        </div>
                    ))}
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Theme Color</p>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg border border-gray-200 flex-shrink-0" style={{ backgroundColor: s.themeColor || '#4F46E5' }} />
                            <span className="text-sm font-semibold text-gray-700">{s.themeColor || '#4F46E5'}</span>
                        </div>
                    </div>
                </ViewCard>

                <ViewCard title="Billing & Invoice" gridClass="grid-cols-2 sm:grid-cols-4" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}>
                    <InfoItem label="Invoice Prefix"  value={s.invoicePrefix} />
                    <InfoItem label="Currency"        value={s.currency} />
                    <InfoItem label="GST Percentage"  value={s.gstPercentage ? `${s.gstPercentage}%` : '18%'} />
                    <InfoItem label="Payment Terms"   value={s.paymentTerms} />
                </ViewCard>

                <ViewCard title="Compliance Documents" gridClass="grid-cols-2 sm:grid-cols-4" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}>
                    {[
                        ['GST Certificate',      s.gstCertDataUrl,          s.gstCertFileName],
                        ['PAN Card',             s.panCardDataUrl,           s.panCardFileName],
                        ['Cancelled Cheque',     s.cancelledChequeDataUrl,   s.cancelledChequeFileName],
                        ['Incorporation Cert.',  s.incorporationCertDataUrl, s.incorporationCertFileName],
                    ].map(([name, url, fname]) => (
                        <div key={name}>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{name}</p>
                            {url ? (
                                <a href={url} download={fname}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 border border-green-100 rounded-lg text-xs font-medium hover:bg-green-100 transition-colors">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    {fname || 'Download'}
                                </a>
                            ) : <p className="text-sm text-gray-300">Not uploaded</p>}
                        </div>
                    ))}
                </ViewCard>
            </MainLayout>
        );
    }

    // ═══════════════════════════════════════════════════════════════════
    // FORM MODE (first-time setup OR editing)
    // ═══════════════════════════════════════════════════════════════════
    const isEdit = !!editing;

    return (
        <MainLayout>
            <div className="max-w-3xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Company Details' : 'Company Setup'}</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {isEdit ? 'Update your company information used across invoices and documents.' : 'Set up your company profile to enable invoice generation and document management.'}
                    </p>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card border border-gray-100/50 p-6 sm:p-8">
                    <StepBar step={step} />

                    {/* ── STEP 0: Company Info ────────────────────────────── */}
                    {step === 0 && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <Field label="Company Name" required error={errors.companyName}>
                                        <input value={form.companyName} onChange={set('companyName')} placeholder="Garage Productions Pvt. Ltd" className={inp(errors.companyName)} />
                                    </Field>
                                </div>
                                <Field label="GSTIN / UIN" required error={errors.gstin} hint="15-character GST number">
                                    <input value={form.gstin} onChange={set('gstin')} placeholder="09AAGCG1126N1ZG" className={inp(errors.gstin)} style={{ textTransform: 'uppercase' }} />
                                </Field>
                                <Field label="PAN" required error={errors.pan} hint="10-character PAN">
                                    <input value={form.pan} onChange={set('pan')} placeholder="AAGCG1126N" className={inp(errors.pan)} style={{ textTransform: 'uppercase' }} />
                                </Field>
                                <Field label="Company Email" required error={errors.companyEmail}>
                                    <input type="email" value={form.companyEmail} onChange={set('companyEmail')} placeholder="finance@garageproductions.in" className={inp(errors.companyEmail)} />
                                </Field>
                                <Field label="CIN" error={errors.cin}>
                                    <input value={form.cin} onChange={set('cin')} placeholder="U74999UP2020PTC..." className={inp(errors.cin)} />
                                </Field>
                                <div className="sm:col-span-2">
                                    <Field label="Registered Address" required error={errors.address}>
                                        <input value={form.address} onChange={set('address')} placeholder="Full address including street, area" className={inp(errors.address)} />
                                    </Field>
                                </div>
                                <Field label="State" required error={errors.state}>
                                    <select
                                        value={form.state}
                                        onChange={e => {
                                            const match = INDIA_STATES.find(s => s.name === e.target.value);
                                            set('state')(e);
                                            if (match) set('stateCode')(match.code);
                                        }}
                                        className={inp(errors.state) + ' bg-white'}
                                    >
                                        <option value="">Select state</option>
                                        {INDIA_STATES.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                                    </select>
                                </Field>
                                <Field label="State Code" required error={errors.stateCode} hint="2-digit GST state code">
                                    <input value={form.stateCode} onChange={set('stateCode')} placeholder="09" className={inp(errors.stateCode)} />
                                </Field>
                                <Field label="PIN Code" required error={errors.pinCode}>
                                    <input value={form.pinCode} onChange={set('pinCode')} placeholder="226001" maxLength={6} inputMode="numeric" className={inp(errors.pinCode)} />
                                </Field>
                                <Field label="Authorised Signatory Name" error={errors.signatoryName} hint="Name printed on invoices">
                                    <input value={form.signatoryName} onChange={set('signatoryName')} placeholder="Authorized Signatory" className={inp(errors.signatoryName)} />
                                </Field>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 1: Banking ─────────────────────────────────── */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3 mb-2">
                                <p className="text-xs text-blue-700 font-medium">These are <strong>Garage's bank details</strong> printed on invoices for clients to pay into.</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <Field label="Account Holder Name" required error={errors.accountHolderName}>
                                        <input value={form.accountHolderName} onChange={set('accountHolderName')} placeholder="Garage Productions Pvt. Ltd" className={inp(errors.accountHolderName)} />
                                    </Field>
                                </div>
                                <Field label="Bank Name" required error={errors.bankName}>
                                    <input value={form.bankName} onChange={set('bankName')} placeholder="ICICI Bank" className={inp(errors.bankName)} />
                                </Field>
                                <Field label="Branch Name" required error={errors.branch}>
                                    <input value={form.branch} onChange={set('branch')} placeholder="Hazratganj, Lucknow" className={inp(errors.branch)} />
                                </Field>
                                <Field label="Account Number" required error={errors.accountNo} hint="9–18 digits">
                                    <input type="text" inputMode="numeric" value={form.accountNo} onChange={set('accountNo')} placeholder="001201234567" className={inp(errors.accountNo)} />
                                </Field>
                                <Field label="IFSC Code" required error={errors.ifsc}>
                                    <input value={form.ifsc} onChange={set('ifsc')} placeholder="ICIC0000001" className={inp(errors.ifsc)} style={{ textTransform: 'uppercase' }} />
                                </Field>
                                <Field label="SWIFT Code" error={errors.swiftCode} hint="For international payments">
                                    <input value={form.swiftCode} onChange={set('swiftCode')} placeholder="ICICINBBCTS" className={inp(errors.swiftCode)} style={{ textTransform: 'uppercase' }} />
                                </Field>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 2: Branding ────────────────────────────────── */}
                    {step === 2 && (
                        <div className="space-y-5">
                            <FileUploadField
                                label="Company Logo" required
                                accept=".png,.jpg,.jpeg,.svg,.webp"
                                dataUrl={form.logoDataUrl} fileName={form.logoFileName}
                                onChange={setFile('logoDataUrl', 'logoFileName')}
                                onClear={clearFile('logoDataUrl', 'logoFileName')}
                                previewType="image" error={errors.logoDataUrl}
                            />
                            <FileUploadField
                                label="Invoice Signature"
                                accept=".png,.jpg,.jpeg"
                                dataUrl={form.signatureDataUrl} fileName={form.signatureFileName}
                                onChange={setFile('signatureDataUrl', 'signatureFileName')}
                                onClear={clearFile('signatureDataUrl', 'signatureFileName')}
                                previewType="image"
                            />
                            <FileUploadField
                                label="Company Stamp"
                                accept=".png,.jpg,.jpeg"
                                dataUrl={form.stampDataUrl} fileName={form.stampFileName}
                                onChange={setFile('stampDataUrl', 'stampFileName')}
                                onClear={clearFile('stampDataUrl', 'stampFileName')}
                                previewType="image"
                            />
                            <Field label="Theme Color">
                                <div className="flex items-center gap-3">
                                    <input type="color" value={form.themeColor} onChange={set('themeColor')}
                                        className="w-12 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
                                    <input value={form.themeColor} onChange={set('themeColor')} placeholder="#4F46E5"
                                        className={inp(false) + ' flex-1'} />
                                </div>
                            </Field>
                        </div>
                    )}

                    {/* ── STEP 3: Billing ─────────────────────────────────── */}
                    {step === 3 && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Field label="Invoice Prefix" required error={errors.invoicePrefix} hint="Used in invoice number (e.g. GPPL/2026-27/001)">
                                    <input value={form.invoicePrefix} onChange={set('invoicePrefix')} placeholder="GPPL" className={inp(errors.invoicePrefix)} style={{ textTransform: 'uppercase' }} />
                                </Field>
                                <Field label="Default Currency" required error={errors.currency}>
                                    <select value={form.currency} onChange={set('currency')} className={inp(errors.currency) + ' bg-white'}>
                                        <option value="INR">INR — Indian Rupee (₹)</option>
                                        <option value="USD">USD — US Dollar ($)</option>
                                        <option value="EUR">EUR — Euro (€)</option>
                                        <option value="GBP">GBP — British Pound (£)</option>
                                    </select>
                                </Field>
                                <Field label="GST Percentage" error={errors.gstPercentage} hint="Default GST rate for invoices">
                                    <select value={form.gstPercentage} onChange={set('gstPercentage')} className={inp(false) + ' bg-white'}>
                                        <option value="18">18% (Standard)</option>
                                        <option value="12">12%</option>
                                        <option value="5">5%</option>
                                        <option value="0">0% (Exempt)</option>
                                    </select>
                                </Field>
                                <Field label="Payment Terms" error={errors.paymentTerms} hint="e.g. Due within 30 days of invoice">
                                    <input value={form.paymentTerms} onChange={set('paymentTerms')} placeholder="Due within 30 days" className={inp(false)} />
                                </Field>
                            </div>
                            <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3">
                                <p className="text-xs text-blue-700">
                                    Invoice numbers will be formatted as: <strong>{(form.invoicePrefix || 'GPPL').toUpperCase()}/2026-27/001</strong>
                                </p>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 4: Documents ───────────────────────────────── */}
                    {step === 4 && (
                        <div className="space-y-5">
                            <p className="text-xs text-gray-500 -mt-2 mb-2">All fields in this step are optional. Files are stored securely in your browser.</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <FileUploadField
                                    label="GST Certificate"
                                    accept=".pdf,.png,.jpg,.jpeg"
                                    dataUrl={form.gstCertDataUrl} fileName={form.gstCertFileName}
                                    onChange={setFile('gstCertDataUrl', 'gstCertFileName')}
                                    onClear={clearFile('gstCertDataUrl', 'gstCertFileName')}
                                    previewType="doc"
                                />
                                <FileUploadField
                                    label="PAN Card"
                                    accept=".pdf,.png,.jpg,.jpeg"
                                    dataUrl={form.panCardDataUrl} fileName={form.panCardFileName}
                                    onChange={setFile('panCardDataUrl', 'panCardFileName')}
                                    onClear={clearFile('panCardDataUrl', 'panCardFileName')}
                                    previewType="doc"
                                />
                                <FileUploadField
                                    label="Cancelled Cheque"
                                    accept=".pdf,.png,.jpg,.jpeg"
                                    dataUrl={form.cancelledChequeDataUrl} fileName={form.cancelledChequeFileName}
                                    onChange={setFile('cancelledChequeDataUrl', 'cancelledChequeFileName')}
                                    onClear={clearFile('cancelledChequeDataUrl', 'cancelledChequeFileName')}
                                    previewType="doc"
                                />
                                <FileUploadField
                                    label="Incorporation Certificate"
                                    accept=".pdf,.png,.jpg,.jpeg"
                                    dataUrl={form.incorporationCertDataUrl} fileName={form.incorporationCertFileName}
                                    onChange={setFile('incorporationCertDataUrl', 'incorporationCertFileName')}
                                    onClear={clearFile('incorporationCertDataUrl', 'incorporationCertFileName')}
                                    previewType="doc"
                                />
                            </div>
                        </div>
                    )}

                    {/* ── Nav Row ──────────────────────────────────────────── */}
                    <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                            {step > 0 && (
                                <button onClick={back} className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                                    ← Back
                                </button>
                            )}
                            {isEdit && (
                                <button onClick={() => setEditing(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                                    Cancel
                                </button>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">Step {step + 1} of {STEPS.length}</span>
                            <button onClick={saveDraft} className="px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                                Save Draft
                            </button>
                            {step < STEPS.length - 1 ? (
                                <button onClick={next} className="px-5 py-2 bg-primary-blue text-white rounded-xl text-sm font-semibold hover:bg-[#4338ca] transition-colors">
                                    Next →
                                </button>
                            ) : (
                                <button onClick={handleSubmit} disabled={saving}
                                    className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors">
                                    {saving ? 'Saving…' : '✓ Save Company Details'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default CompanyDetailsPage;
