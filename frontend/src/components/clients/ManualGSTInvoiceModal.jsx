/**
 * ManualGSTInvoiceModal
 * Lets the user enter a GST invoice manually (when they don't have an IRN
 * or just want to record it quickly without fetching from the portal).
 */
import React, { useState, useMemo } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import invoiceService from '../../services/invoiceService';

const today = () => new Date().toISOString().split('T')[0];

const INITIAL = {
    invoice_number:  '',
    invoice_date:    today(),
    invoice_type:    'TAX INVOICE',
    irn:             '',
    ack_no:          '',
    buyer_name:      '',
    buyer_gstin:     '',
    buyer_address:   '',
    description:     '',
    taxable_amount:  '',
    cgst_rate:       '9',
    sgst_rate:       '9',
    igst_rate:       '0',
    payment_status:  'Unpaid',
};

const Field = ({ label, required, error, children }) => (
    <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
            {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {children}
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
);

const Input = ({ value, onChange, placeholder, type = 'text', ...rest }) => (
    <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                   focus:outline-none focus:ring-2 focus:ring-blue-500"
        {...rest}
    />
);

const ManualGSTInvoiceModal = ({ isOpen, onClose, client, onInvoiceSaved }) => {
    const [form,    setForm]    = useState({ ...INITIAL });
    const [errors,  setErrors]  = useState({});
    const [loading, setLoading] = useState(false);
    const [saved,   setSaved]   = useState(false);
    const [apiErr,  setApiErr]  = useState('');

    const set = (field) => (e) => {
        setForm(prev => ({ ...prev, [field]: e.target.value }));
        setErrors(prev => ({ ...prev, [field]: '' }));
        setApiErr('');
    };

    // Live-compute GST amounts from rates + taxable
    const taxable  = parseFloat(form.taxable_amount) || 0;
    const cgstAmt  = useMemo(() => +(taxable * (parseFloat(form.cgst_rate) || 0) / 100).toFixed(2), [taxable, form.cgst_rate]);
    const sgstAmt  = useMemo(() => +(taxable * (parseFloat(form.sgst_rate) || 0) / 100).toFixed(2), [taxable, form.sgst_rate]);
    const igstAmt  = useMemo(() => +(taxable * (parseFloat(form.igst_rate) || 0) / 100).toFixed(2), [taxable, form.igst_rate]);
    const totalAmt = useMemo(() => +(taxable + cgstAmt + sgstAmt + igstAmt).toFixed(2),              [taxable, cgstAmt, sgstAmt, igstAmt]);

    const fmt = (n) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

    const validate = () => {
        const errs = {};
        if (!form.invoice_number.trim()) errs.invoice_number = 'Invoice number is required';
        if (!form.invoice_date)          errs.invoice_date   = 'Invoice date is required';
        if (!form.taxable_amount || isNaN(parseFloat(form.taxable_amount)))
            errs.taxable_amount = 'Enter a valid taxable amount';
        if (!form.buyer_name.trim())     errs.buyer_name     = 'Buyer name is required';
        if (form.buyer_gstin && form.buyer_gstin.length !== 15)
            errs.buyer_gstin = 'GSTIN must be 15 characters';
        return errs;
    };

    const handleSubmit = async () => {
        const errs = validate();
        if (Object.keys(errs).length > 0) { setErrors(errs); return; }

        setLoading(true);
        setApiErr('');
        try {
            await invoiceService.saveGSTInvoice({
                clientId:       client.id,
                invoice_number: form.invoice_number.trim(),
                invoice_date:   form.invoice_date,
                invoice_type:   form.invoice_type,
                irn:            form.irn.trim() || null,
                ack_no:         form.ack_no.trim() || null,
                buyer_name:     form.buyer_name.trim(),
                buyer_gstin:    form.buyer_gstin.trim() || null,
                buyer_address:  form.buyer_address.trim() || null,
                description:    form.description.trim() || null,
                taxable_amount: taxable,
                cgst_rate:      parseFloat(form.cgst_rate) || 0,
                cgst_amount:    cgstAmt,
                sgst_rate:      parseFloat(form.sgst_rate) || 0,
                sgst_amount:    sgstAmt,
                igst_rate:      parseFloat(form.igst_rate) || 0,
                igst_amount:    igstAmt,
                total_amount:   totalAmt,
                payment_status: form.payment_status,
                source:         'Manual',
            });
            setSaved(true);
            if (onInvoiceSaved) onInvoiceSaved();
        } catch (err) {
            setApiErr(err.response?.data?.message || err.message || 'Failed to save invoice');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setForm({ ...INITIAL });
        setErrors({});
        setSaved(false);
        setApiErr('');
        onClose();
    };

    const handleAnother = () => {
        setForm({ ...INITIAL });
        setErrors({});
        setSaved(false);
        setApiErr('');
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Add GST Invoice Manually">

            {saved ? (
                <div className="text-center space-y-4 py-6">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto text-2xl">✓</div>
                    <p className="text-base font-semibold text-gray-900">Invoice Saved!</p>
                    <p className="text-sm text-gray-600">
                        Invoice <strong>{form.invoice_number}</strong> has been saved for{' '}
                        <strong>{client?.clientName || client?.client_name}</strong>.
                    </p>
                    <div className="flex gap-3">
                        <Button variant="secondary" onClick={handleAnother} className="flex-1">Add Another</Button>
                        <Button variant="primary"   onClick={handleClose}   className="flex-1">Done</Button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                    {/* Client badge */}
                    <div className="px-3 py-2 bg-blue-50 rounded-lg text-sm text-blue-800 font-medium">
                        Client: {client?.clientName || client?.client_name}
                    </div>

                    {/* ── Section: Invoice details ─────────────────────────── */}
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Invoice Details</p>

                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Invoice Number" required error={errors.invoice_number}>
                            <Input
                                value={form.invoice_number}
                                onChange={set('invoice_number')}
                                placeholder="e.g. GPPL/2026-27/27"
                            />
                        </Field>

                        <Field label="Invoice Date" required error={errors.invoice_date}>
                            <Input
                                type="date"
                                value={form.invoice_date}
                                onChange={set('invoice_date')}
                            />
                        </Field>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Invoice Type">
                            <select
                                value={form.invoice_type}
                                onChange={set('invoice_type')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                                           focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option>TAX INVOICE</option>
                                <option>CREDIT NOTE</option>
                                <option>DEBIT NOTE</option>
                                <option>BILL OF SUPPLY</option>
                            </select>
                        </Field>

                        <Field label="Payment Status">
                            <select
                                value={form.payment_status}
                                onChange={set('payment_status')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                                           focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option>Unpaid</option>
                                <option>Paid</option>
                                <option>Partial</option>
                            </select>
                        </Field>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Field label="IRN (optional)">
                            <Input
                                value={form.irn}
                                onChange={set('irn')}
                                placeholder="64-char IRN"
                                className="font-mono text-xs"
                            />
                        </Field>
                        <Field label="ACK No (optional)">
                            <Input value={form.ack_no} onChange={set('ack_no')} placeholder="Acknowledgement No" />
                        </Field>
                    </div>

                    {/* ── Section: Buyer ──────────────────────────────────── */}
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-2">Buyer Details</p>

                    <Field label="Buyer / Client Name" required error={errors.buyer_name}>
                        <Input value={form.buyer_name} onChange={set('buyer_name')} placeholder="e.g. UTKARSH SMALL FINANCE BANK LIMITED" />
                    </Field>

                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Buyer GSTIN" error={errors.buyer_gstin}>
                            <Input
                                value={form.buyer_gstin}
                                onChange={set('buyer_gstin')}
                                placeholder="15-char GSTIN"
                                maxLength={15}
                                className="uppercase"
                            />
                        </Field>
                        <Field label="Buyer Address">
                            <Input value={form.buyer_address} onChange={set('buyer_address')} placeholder="City, State" />
                        </Field>
                    </div>

                    {/* ── Section: Description ────────────────────────────── */}
                    <Field label="Service Description">
                        <textarea
                            value={form.description}
                            onChange={set('description')}
                            placeholder="e.g. management fees and marketing consultancy towards on ground coordination"
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                                       focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                    </Field>

                    {/* ── Section: Amounts ─────────────────────────────────── */}
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-2">Tax & Amounts</p>

                    <Field label="Taxable Amount (₹)" required error={errors.taxable_amount}>
                        <Input
                            type="number"
                            value={form.taxable_amount}
                            onChange={set('taxable_amount')}
                            placeholder="e.g. 350000"
                            min="0"
                        />
                    </Field>

                    <div className="grid grid-cols-3 gap-3">
                        <Field label="CGST Rate (%)">
                            <Input type="number" value={form.cgst_rate} onChange={set('cgst_rate')} placeholder="9" min="0" max="28" step="0.5" />
                        </Field>
                        <Field label="SGST Rate (%)">
                            <Input type="number" value={form.sgst_rate} onChange={set('sgst_rate')} placeholder="9" min="0" max="28" step="0.5" />
                        </Field>
                        <Field label="IGST Rate (%)">
                            <Input type="number" value={form.igst_rate} onChange={set('igst_rate')} placeholder="0" min="0" max="28" step="0.5" />
                        </Field>
                    </div>

                    {/* Live total preview */}
                    {taxable > 0 && (
                        <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-xs">
                            <div className="flex justify-between text-gray-600">
                                <span>Taxable Value</span><span>{fmt(taxable)}</span>
                            </div>
                            {cgstAmt > 0 && (
                                <div className="flex justify-between text-gray-600">
                                    <span>CGST @ {form.cgst_rate}%</span><span>{fmt(cgstAmt)}</span>
                                </div>
                            )}
                            {sgstAmt > 0 && (
                                <div className="flex justify-between text-gray-600">
                                    <span>SGST @ {form.sgst_rate}%</span><span>{fmt(sgstAmt)}</span>
                                </div>
                            )}
                            {igstAmt > 0 && (
                                <div className="flex justify-between text-gray-600">
                                    <span>IGST @ {form.igst_rate}%</span><span>{fmt(igstAmt)}</span>
                                </div>
                            )}
                            <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-1 mt-1">
                                <span>Total Invoice Value</span><span className="text-base">{fmt(totalAmt)}</span>
                            </div>
                        </div>
                    )}

                    {apiErr && (
                        <p className="text-xs text-red-600 bg-red-50 p-2 rounded">{apiErr}</p>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-2 sticky bottom-0 bg-white">
                        <Button variant="secondary" onClick={handleClose} className="flex-1">Cancel</Button>
                        <Button
                            variant="primary"
                            onClick={handleSubmit}
                            disabled={loading}
                            loading={loading}
                            className="flex-1"
                        >
                            {loading ? 'Saving…' : 'Save Invoice'}
                        </Button>
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default ManualGSTInvoiceModal;
