import React, { useState } from 'react';
import { computeSalaryBreakdown } from '../../utils/generateSalarySlipPDF';
import { INDIA_STATES } from '../../utils/indiaStates';
import employeeService from '../../services/employeeService';

const STEPS = ['Personal Info', 'Contact & Identity', 'Banking', 'Review'];
const DEPT_OPTIONS = ['Marketing', 'Operations', 'Finance', 'Tech', 'Design', 'HR', 'Sales', 'Content', 'Media', 'Management'];
const EMP_TYPES    = ['Full-time', 'Part-time', 'Intern', 'Contractor'];
const STATUS_OPTS  = ['Active', 'Inactive', 'On Leave', 'Resigned'];

const getNextEmployeeId = () => {
    const emps = JSON.parse(localStorage.getItem('gw_employees') || '[]');
    return `EMP-${String(emps.length + 1).padStart(3, '0')}`;
};

const INIT = {
    fullName: '', designation: '', department: 'Marketing', employmentType: 'Full-time',
    joiningDate: '', salary: '', status: 'Active',
    email: '', mobile: '', altMobile: '',
    address: '', city: '', state: '', pincode: '',
    panNumber: '', aadhaarNumber: '',
    bankName: '', accountNumber: '', ifscCode: '', accountHolder: '', upiId: '',
    emergencyContact: '', emergencyPhone: '',
};

const Field = ({ label, required, error, children }) => (
    <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">
            {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {children}
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
);

const Input = (props) => (
    <input {...props} className={`w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent ${props.disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}`} />
);

const Select = ({ value, onChange, children }) => (
    <select value={value} onChange={onChange}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-blue bg-white">
        {children}
    </select>
);

const EmployeeOnboardingModal = ({ isOpen, onClose, onEmployeeAdded }) => {
    const [step, setStep]   = useState(0);
    const [form, setForm]   = useState(INIT);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    if (!isOpen) return null;

    const set = (field, value) => {
        setForm(f => ({ ...f, [field]: value }));
        setErrors(e => ({ ...e, [field]: '' }));
    };

    const validate = () => {
        const e = {};
        if (step === 0) {
            if (!form.fullName.trim())  e.fullName    = 'Required';
            if (!form.designation.trim()) e.designation = 'Required';
            if (!form.salary || isNaN(form.salary) || Number(form.salary) <= 0) e.salary = 'Enter a valid salary';
        }
        if (step === 1) {
            if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email))  e.email  = 'Enter a valid email';
            if (!form.mobile.trim() || !/^\d{10}$/.test(form.mobile.replace(/\s/g, ''))) e.mobile = '10-digit number required';
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const next = () => { if (validate()) setStep(s => s + 1); };
    const back = () => setStep(s => s - 1);

    const handleSubmit = async () => {
        setSaving(true);
        try {
            const emp = {
                id: Date.now().toString(),
                employeeId: getNextEmployeeId(),
                ...form,
                salary: parseFloat(form.salary),
                onboardedAt: new Date().toISOString(),
            };

            // Save to localStorage first (immediate UI update)
            const all = JSON.parse(localStorage.getItem('gw_employees') || '[]');
            all.push(emp);
            localStorage.setItem('gw_employees', JSON.stringify(all));

            // Persist to DB (non-blocking for UX, page will re-fetch from DB on next load)
            try {
                await employeeService.create(emp);
            } catch { /* DB save failed; localStorage already has the record */ }

            onEmployeeAdded(emp);
            setForm(INIT);
            setStep(0);
        } finally {
            setSaving(false);
        }
    };

    const bd    = computeSalaryBreakdown(form.salary);
    const fmtI  = n => Math.round(n || 0).toLocaleString('en-IN');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Add New Employee</h2>
                        <p className="text-xs text-gray-500 mt-0.5">Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Step indicator */}
                <div className="flex items-center px-6 pt-4 flex-shrink-0">
                    {STEPS.map((s, i) => (
                        <React.Fragment key={s}>
                            <div className={`flex items-center gap-1.5 ${i < step ? 'text-green-600' : i === step ? 'text-primary-blue' : 'text-gray-300'}`}>
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors flex-shrink-0 ${i < step ? 'bg-green-100 text-green-600' : i === step ? 'bg-primary-blue text-white' : 'bg-gray-100 text-gray-400'}`}>
                                    {i < step ? '✓' : i + 1}
                                </div>
                                <span className="text-xs font-medium hidden sm:block">{s}</span>
                            </div>
                            {i < STEPS.length - 1 && (
                                <div className={`flex-1 h-0.5 mx-2 ${i < step ? 'bg-green-200' : 'bg-gray-100'}`} />
                            )}
                        </React.Fragment>
                    ))}
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5">
                    {step === 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="Full Name" required error={errors.fullName}>
                                <Input placeholder="e.g. Rahul Sharma" value={form.fullName} onChange={e => set('fullName', e.target.value)} />
                            </Field>
                            <Field label="Employee ID">
                                <Input value={getNextEmployeeId()} disabled />
                            </Field>
                            <Field label="Designation" required error={errors.designation}>
                                <Input placeholder="e.g. Social Media Manager" value={form.designation} onChange={e => set('designation', e.target.value)} />
                            </Field>
                            <Field label="Department">
                                <Select value={form.department} onChange={e => set('department', e.target.value)}>
                                    {DEPT_OPTIONS.map(d => <option key={d}>{d}</option>)}
                                </Select>
                            </Field>
                            <Field label="Employment Type">
                                <Select value={form.employmentType} onChange={e => set('employmentType', e.target.value)}>
                                    {EMP_TYPES.map(t => <option key={t}>{t}</option>)}
                                </Select>
                            </Field>
                            <Field label="Joining Date">
                                <Input type="date" value={form.joiningDate} onChange={e => set('joiningDate', e.target.value)} />
                            </Field>
                            <Field label="Gross Monthly Salary (₹)" required error={errors.salary}>
                                <Input type="number" placeholder="e.g. 35000" value={form.salary} onChange={e => set('salary', e.target.value)} />
                            </Field>
                            <Field label="Status">
                                <Select value={form.status} onChange={e => set('status', e.target.value)}>
                                    {STATUS_OPTS.map(s => <option key={s}>{s}</option>)}
                                </Select>
                            </Field>
                            {parseFloat(form.salary) > 0 && (
                                <div className="sm:col-span-2 bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                                    <p className="text-xs font-semibold text-indigo-700 mb-3">Salary Breakdown Preview</p>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 text-xs">
                                        {[
                                            ['Basic', `₹${fmtI(bd.basic)}`],
                                            ['HRA', `₹${fmtI(bd.hra)}`],
                                            ['Transport', `₹${fmtI(bd.transport)}`],
                                            ['Special', `₹${fmtI(bd.special)}`],
                                            ['PF (12%)', `−₹${fmtI(bd.pfEmp)}`],
                                            ['Prof. Tax', '−₹200'],
                                            ['Net Pay', `₹${fmtI(bd.netPay)}`],
                                        ].map(([k, v]) => (
                                            <div key={k} className="bg-white rounded-lg p-2 text-center border border-indigo-50">
                                                <p className="text-gray-400 mb-0.5 truncate">{k}</p>
                                                <p className="font-bold text-gray-800 text-xs">{v}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 1 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="Email" required error={errors.email}>
                                <Input type="email" placeholder="rahul@example.com" value={form.email} onChange={e => set('email', e.target.value)} />
                            </Field>
                            <Field label="Mobile" required error={errors.mobile}>
                                <Input type="tel" placeholder="10-digit number" value={form.mobile} onChange={e => set('mobile', e.target.value)} />
                            </Field>
                            <Field label="Alternate Mobile">
                                <Input type="tel" placeholder="Optional" value={form.altMobile} onChange={e => set('altMobile', e.target.value)} />
                            </Field>
                            <Field label="Address">
                                <Input placeholder="Street / Area" value={form.address} onChange={e => set('address', e.target.value)} />
                            </Field>
                            <Field label="City">
                                <Input placeholder="e.g. Lucknow" value={form.city} onChange={e => set('city', e.target.value)} />
                            </Field>
                            <Field label="State">
                                <select value={form.state} onChange={e => set('state', e.target.value)} className="input bg-white">
                                    <option value="">Select state</option>
                                    {INDIA_STATES.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                                </select>
                            </Field>
                            <Field label="Pincode">
                                <Input type="text" maxLength={6} placeholder="6-digit PIN" value={form.pincode} onChange={e => set('pincode', e.target.value)} />
                            </Field>
                            <Field label="PAN Number">
                                <Input placeholder="ABCDE1234F" value={form.panNumber} onChange={e => set('panNumber', e.target.value.toUpperCase())} />
                            </Field>
                            <Field label="Aadhaar Number">
                                <Input placeholder="12-digit number" value={form.aadhaarNumber} onChange={e => set('aadhaarNumber', e.target.value)} />
                            </Field>
                            <Field label="Emergency Contact Name">
                                <Input placeholder="Name" value={form.emergencyContact} onChange={e => set('emergencyContact', e.target.value)} />
                            </Field>
                            <Field label="Emergency Contact Phone">
                                <Input type="tel" placeholder="Phone number" value={form.emergencyPhone} onChange={e => set('emergencyPhone', e.target.value)} />
                            </Field>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="Bank Name">
                                <Input placeholder="e.g. State Bank of India" value={form.bankName} onChange={e => set('bankName', e.target.value)} />
                            </Field>
                            <Field label="Account Number">
                                <Input placeholder="Account number" value={form.accountNumber} onChange={e => set('accountNumber', e.target.value)} />
                            </Field>
                            <Field label="IFSC Code">
                                <Input placeholder="e.g. SBIN0001234" value={form.ifscCode} onChange={e => set('ifscCode', e.target.value.toUpperCase())} />
                            </Field>
                            <Field label="Account Holder Name">
                                <Input placeholder="As per bank records" value={form.accountHolder} onChange={e => set('accountHolder', e.target.value)} />
                            </Field>
                            <Field label="UPI ID">
                                <Input placeholder="e.g. rahul@upi" value={form.upiId} onChange={e => set('upiId', e.target.value)} />
                            </Field>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4">
                            <div className="bg-gray-50 rounded-xl p-4">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Personal Information</p>
                                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                                    {[
                                        ['Name',        form.fullName],
                                        ['Designation', form.designation],
                                        ['Department',  form.department],
                                        ['Type',        form.employmentType],
                                        ['Joining',     form.joiningDate || '—'],
                                        ['Gross',       `₹${fmtI(form.salary)}/mo`],
                                        ['Net Pay',     `₹${fmtI(bd.netPay)}/mo`],
                                        ['Status',      form.status],
                                    ].map(([k, v]) => (
                                        <div key={k}><span className="text-gray-400">{k}: </span><span className="font-medium text-gray-800">{v}</span></div>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-4">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Contact & Identity</p>
                                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                                    {[
                                        ['Email',   form.email],
                                        ['Mobile',  form.mobile],
                                        ['City',    form.city || '—'],
                                        ['PAN',     form.panNumber || '—'],
                                        ['Aadhaar', form.aadhaarNumber ? '••••••••' + form.aadhaarNumber.slice(-4) : '—'],
                                    ].map(([k, v]) => (
                                        <div key={k}><span className="text-gray-400">{k}: </span><span className="font-medium text-gray-800">{v}</span></div>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-4">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Banking</p>
                                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                                    {[
                                        ['Bank',    form.bankName    || '—'],
                                        ['Account', form.accountNumber || '—'],
                                        ['IFSC',    form.ifscCode    || '—'],
                                        ['UPI',     form.upiId       || '—'],
                                    ].map(([k, v]) => (
                                        <div key={k}><span className="text-gray-400">{k}: </span><span className="font-medium text-gray-800">{v}</span></div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex-shrink-0">
                    <button
                        onClick={step === 0 ? onClose : back}
                        className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                        {step === 0 ? 'Cancel' : 'Back'}
                    </button>
                    {step < STEPS.length - 1 ? (
                        <button onClick={next}
                            className="px-5 py-2.5 text-sm font-semibold text-white bg-primary-blue rounded-xl hover:bg-[#4338ca] transition-colors">
                            Next: {STEPS[step + 1]}
                        </button>
                    ) : (
                        <button onClick={handleSubmit} disabled={saving}
                            className="px-5 py-2.5 text-sm font-semibold text-white bg-green-600 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50">
                            {saving ? 'Saving…' : 'Add Employee'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EmployeeOnboardingModal;
