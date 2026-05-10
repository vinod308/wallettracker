import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import vendorService from '../../services/vendorService';

const GST_RATES = [0, 5, 12, 18, 28];
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

const today = () => new Date().toISOString().split('T')[0];
const genInvNum = () => `PI-${Date.now().toString().slice(-8)}`;

export default function RaisePIModal({ isOpen, onClose, onRaised }) {
    const [form, setForm] = useState({
        invoiceNumber: genInvNum(),
        invoiceDate: today(),
        dueDate: '',
        description: '',
        subAmount: '',
        gstRate: 18,
        notes: '',
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setForm({ invoiceNumber: genInvNum(), invoiceDate: today(), dueDate: '', description: '', subAmount: '', gstRate: 18, notes: '' });
            setErrors({});
            setApiError('');
        }
    }, [isOpen]);

    const set = (f) => (e) => {
        setForm(p => ({ ...p, [f]: e.target.value }));
        setErrors(p => { const n = { ...p }; delete n[f]; return n; });
    };

    const subAmt    = parseFloat(form.subAmount) || 0;
    const gstAmt    = +(subAmt * form.gstRate / 100).toFixed(2);
    const totalAmt  = +(subAmt + gstAmt).toFixed(2);
    const fmt = (n) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

    const validate = () => {
        const e = {};
        if (!form.invoiceNumber.trim()) e.invoiceNumber = 'Invoice number required';
        if (!form.invoiceDate) e.invoiceDate = 'Invoice date required';
        if (!form.description.trim()) e.description = 'Description required';
        if (!form.subAmount || isNaN(parseFloat(form.subAmount)) || parseFloat(form.subAmount) <= 0)
            e.subAmount = 'Valid amount required';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setLoading(true);
        setApiError('');
        try {
            await vendorService.raiseInvoice({
                invoiceNumber: form.invoiceNumber.trim(),
                invoiceDate: form.invoiceDate,
                dueDate: form.dueDate || null,
                description: form.description.trim(),
                subAmount: subAmt,
                gstRate: parseFloat(form.gstRate),
                gstAmount: gstAmt,
                totalAmount: totalAmt,
                notes: form.notes.trim() || null,
            });
            onRaised?.();
            onClose();
        } catch (err) {
            setApiError(err?.response?.data?.message || err.message || 'Failed to raise invoice');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Raise Purchase Invoice" size="lg">
            <div className="space-y-4">
                {apiError && (
                    <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm">{apiError}</div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Invoice Number" required error={errors.invoiceNumber}>
                        <input value={form.invoiceNumber} onChange={set('invoiceNumber')} placeholder="PI-20250001" className={inp(!!errors.invoiceNumber)} />
                    </Field>
                    <Field label="Invoice Date" required error={errors.invoiceDate}>
                        <input type="date" value={form.invoiceDate} onChange={set('invoiceDate')} className={inp(!!errors.invoiceDate)} />
                    </Field>
                </div>

                <Field label="Due Date" hint="Optional">
                    <input type="date" value={form.dueDate} onChange={set('dueDate')} className={inp()} />
                </Field>

                <Field label="Description / Services" required error={errors.description} hint="Describe the services or work being invoiced">
                    <textarea value={form.description} onChange={set('description')} rows={3}
                        placeholder="e.g. Social media management for May 2025, content creation, 10 posts"
                        className={inp(!!errors.description)} />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Amount (before tax)" required error={errors.subAmount}>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                            <input type="number" inputMode="decimal" min="0" step="0.01"
                                value={form.subAmount} onChange={set('subAmount')}
                                placeholder="0.00" className={`${inp(!!errors.subAmount)} pl-7`} />
                        </div>
                    </Field>
                    <Field label="GST Rate">
                        <select value={form.gstRate} onChange={set('gstRate')} className={inp()}>
                            {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                        </select>
                    </Field>
                </div>

                {/* Tax Summary */}
                {subAmt > 0 && (
                    <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                        <div className="flex justify-between text-gray-600">
                            <span>Subtotal</span><span className="font-medium">{fmt(subAmt)}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                            <span>GST ({form.gstRate}%)</span><span className="font-medium">{fmt(gstAmt)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-200 text-base">
                            <span>Total</span><span className="text-primary-blue">{fmt(totalAmt)}</span>
                        </div>
                    </div>
                )}

                <Field label="Notes" hint="Optional — payment instructions, reference number, etc.">
                    <textarea value={form.notes} onChange={set('notes')} rows={2}
                        placeholder="e.g. Please transfer to HDFC account..."
                        className={inp()} />
                </Field>

                <div className="flex gap-3 pt-4 border-t border-gray-100">
                    <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                        Cancel
                    </button>
                    <button onClick={handleSubmit} disabled={loading}
                        className="flex-1 px-4 py-2.5 bg-primary-blue text-white rounded-xl text-sm font-semibold hover:bg-[#4338ca] disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                        {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                        Submit Invoice
                    </button>
                </div>
            </div>
        </Modal>
    );
}
