import React, { useState, useMemo, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import invoiceService from '../../services/invoiceService';

const today = () => new Date().toISOString().split('T')[0];

const GST_RATES = [5, 12, 18, 28];

const INVOICE_TYPES = [
    { value: 'INV', label: 'Tax Invoice' },
    { value: 'CRN', label: 'Credit Note' },
    { value: 'DBN', label: 'Debit Note' },
];

const Field = ({ label, required, error, hint, children }) => (
    <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
            {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {children}
        {hint && <p className="mt-0.5 text-xs text-gray-400">{hint}</p>}
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
);

const Inp = ({ value, onChange, placeholder, type = 'text', className = '', ...rest }) => (
    <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                   focus:outline-none focus:ring-2 focus:ring-green-500 ${className}`}
        {...rest}
    />
);

const Sel = ({ value, onChange, children }) => (
    <select
        value={value}
        onChange={onChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                   focus:outline-none focus:ring-2 focus:ring-green-500"
    >
        {children}
    </select>
);

const getSellerFromSettings = () => {
    try {
        const s = JSON.parse(localStorage.getItem('gw_settings') || 'null');
        if (!s) return {};
        return {
            sellerName:      s.companyName  || '',
            sellerGstin:     s.gstin        || '',
            sellerAddr1:     s.address      || '',
            sellerCity:      s.state        || '',
            sellerStateCode: s.stateCode    || '',
            sellerPin:       s.pinCode      || '',
            sellerEmail:     s.companyEmail || '',
        };
    } catch {
        return {};
    }
};

const buildInitial = (client) => {
    const s = getSellerFromSettings();
    return {
        invoiceNumber:   '',
        invoiceDate:     today(),
        invoiceType:     'INV',
        supplyType:      'B2B',
        description:     'Digital Marketing Services',
        hsnCode:         '998361',
        taxableAmount:   '',
        gstRate:         '18',
        sellerName:      s.sellerName      || '',
        sellerGstin:     s.sellerGstin     || '',
        sellerAddr1:     s.sellerAddr1     || '',
        sellerCity:      s.sellerCity      || '',
        sellerStateCode: s.sellerStateCode || '',
        sellerPin:       s.sellerPin       || '',
        sellerEmail:     s.sellerEmail     || '',
        buyerName:       client?.clientName || client?.client_name || '',
        buyerGstin:      client?.gst_number || client?.gstin       || '',
        buyerAddr1:      client?.address    || '',
        buyerCity:       client?.city       || '',
        buyerStateCode:  client?.state_code || '',
        buyerPin:        client?.pin_code   || '',
    };
};

const fmt = (n) => `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

const GenerateGSTInvoiceModal = ({ isOpen, onClose, client, onInvoiceSaved }) => {
    const [form,    setForm]    = useState(() => buildInitial(client));
    const [errors,  setErrors]  = useState({});
    const [loading, setLoading] = useState(false);
    const [result,  setResult]  = useState(null);
    const [apiErr,  setApiErr]  = useState('');

    // Re-seed form when modal opens (handles client switching)
    useEffect(() => {
        if (isOpen) {
            setForm(buildInitial(client));
            setErrors({});
            setApiErr('');
            setResult(null);
        }
    }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

    const set = (field) => (e) => {
        setForm(prev => ({ ...prev, [field]: e.target.value }));
        setErrors(prev => ({ ...prev, [field]: '' }));
        setApiErr('');
    };

    // ── Tax computation ────────────────────────────────────────────────────────
    const taxable   = parseFloat(form.taxableAmount) || 0;
    const gstRate   = parseFloat(form.gstRate) || 18;
    const sameState = !!(form.sellerStateCode && form.buyerStateCode &&
                         form.sellerStateCode === form.buyerStateCode);
    const halfRate  = gstRate / 2;

    const cgstAmt = useMemo(
        () => sameState ? +(taxable * halfRate / 100).toFixed(2) : 0,
        [taxable, halfRate, sameState]
    );
    const sgstAmt = useMemo(
        () => sameState ? +(taxable * halfRate / 100).toFixed(2) : 0,
        [taxable, halfRate, sameState]
    );
    const igstAmt = useMemo(
        () => sameState ? 0 : +(taxable * gstRate / 100).toFixed(2),
        [taxable, gstRate, sameState]
    );
    const totalAmt = useMemo(
        () => +(taxable + cgstAmt + sgstAmt + igstAmt).toFixed(2),
        [taxable, cgstAmt, sgstAmt, igstAmt]
    );

    // ── Validation ─────────────────────────────────────────────────────────────
    const validate = () => {
        const errs = {};
        const num = form.invoiceNumber.trim();
        if (!num)          errs.invoiceNumber = 'Required';
        else if (num.length > 16) errs.invoiceNumber = 'Max 16 characters';
        if (!form.invoiceDate)         errs.invoiceDate     = 'Required';
        if (!form.taxableAmount || taxable <= 0) errs.taxableAmount = 'Enter a valid amount > 0';
        if (!form.sellerGstin.trim())  errs.sellerGstin     = 'Seller GSTIN required';
        if (!form.buyerGstin.trim())   errs.buyerGstin      = 'Buyer GSTIN required';
        if (!form.sellerStateCode.trim()) errs.sellerStateCode = 'Required (e.g. 09)';
        if (!form.buyerStateCode.trim())  errs.buyerStateCode  = 'Required (e.g. 09)';
        return errs;
    };

    // ── Submit ─────────────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        const errs = validate();
        if (Object.keys(errs).length > 0) { setErrors(errs); return; }

        setLoading(true);
        setApiErr('');
        try {
            const res = await invoiceService.generateIRN({
                clientId:        client.id,
                invoiceNumber:   form.invoiceNumber.trim(),
                invoiceDate:     form.invoiceDate,
                invoiceType:     form.invoiceType,
                supplyType:      form.supplyType,
                sellerGstin:     form.sellerGstin.trim().toUpperCase(),
                sellerName:      form.sellerName.trim(),
                sellerAddr1:     form.sellerAddr1.trim(),
                sellerCity:      form.sellerCity.trim(),
                sellerStateCode: form.sellerStateCode.trim(),
                sellerPin:       form.sellerPin.trim(),
                sellerEmail:     form.sellerEmail.trim(),
                buyerGstin:      form.buyerGstin.trim().toUpperCase(),
                buyerName:       form.buyerName.trim(),
                buyerAddr1:      form.buyerAddr1.trim() || form.buyerName.trim(),
                buyerCity:       form.buyerCity.trim(),
                buyerStateCode:  form.buyerStateCode.trim(),
                buyerPin:        form.buyerPin.trim(),
                description:     form.description.trim(),
                hsnCode:         form.hsnCode.trim(),
                taxableAmount:   taxable,
                gstRate:         gstRate,
            });
            setResult(res.data.data);
            if (onInvoiceSaved) onInvoiceSaved();
        } catch (err) {
            setApiErr(err.response?.data?.message || err.message || 'IRN generation failed');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setResult(null);
        setApiErr('');
        setErrors({});
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Generate GST Invoice (IRN)">

            {result ? (
                // ── Success screen ─────────────────────────────────────────────
                <div className="space-y-4">
                    <div className="text-center py-4">
                        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 text-3xl">
                            ✓
                        </div>
                        <p className="text-base font-semibold text-gray-900">IRN Generated Successfully!</p>
                        <p className="text-xs text-gray-500 mt-1">Invoice is now registered on the GST portal.</p>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                        <div>
                            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">IRN</p>
                            <p className="font-mono text-xs text-gray-900 break-all bg-white border border-gray-200 rounded-lg p-2 select-all">
                                {result.irn}
                            </p>
                        </div>

                        {(result.ack_no || result.ack_date) && (
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                {result.ack_no && (
                                    <div>
                                        <p className="text-xs text-gray-500 mb-0.5">Acknowledgement No</p>
                                        <p className="font-semibold text-gray-900">{result.ack_no}</p>
                                    </div>
                                )}
                                {result.ack_date && (
                                    <div>
                                        <p className="text-xs text-gray-500 mb-0.5">ACK Date</p>
                                        <p className="font-semibold text-gray-900">{result.ack_date}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <p className="text-xs text-gray-500 mb-0.5">Invoice Number</p>
                                <p className="font-semibold text-gray-900">{result.invoice_number}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-0.5">Total Amount</p>
                                <p className="font-semibold text-green-700">{fmt(result.total_amount || 0)}</p>
                            </div>
                        </div>

                        {(result.pdf_url || result.qr_url) && (
                            <div className="flex gap-2 pt-1">
                                {result.pdf_url && (
                                    <a
                                        href={result.pdf_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex-1 text-center py-2 bg-red-50 text-red-700 rounded-lg
                                                   text-xs font-medium hover:bg-red-100 transition-colors"
                                    >
                                        📄 Download PDF
                                    </a>
                                )}
                                {result.qr_url && (
                                    <a
                                        href={result.qr_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex-1 text-center py-2 bg-blue-50 text-blue-700 rounded-lg
                                                   text-xs font-medium hover:bg-blue-100 transition-colors"
                                    >
                                        📱 View QR Code
                                    </a>
                                )}
                            </div>
                        )}
                    </div>

                    <Button variant="success" onClick={handleClose} className="w-full">
                        Done
                    </Button>
                </div>
            ) : (
                // ── Form ───────────────────────────────────────────────────────
                <div className="space-y-4 max-h-[72vh] overflow-y-auto pr-1">
                    {/* Client badge */}
                    <div className="px-3 py-2 bg-green-50 rounded-lg text-sm text-green-800 font-medium">
                        🧾 Generating IRN for: {client?.clientName || client?.client_name}
                    </div>

                    {/* ── Invoice Details ──────────────────────────────────── */}
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Invoice Details</p>

                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Invoice Number" required error={errors.invoiceNumber} hint="Max 16 characters">
                            <Inp
                                value={form.invoiceNumber}
                                onChange={set('invoiceNumber')}
                                placeholder="e.g. GP/2026-27/001"
                                maxLength={16}
                            />
                        </Field>
                        <Field label="Invoice Date" required error={errors.invoiceDate}>
                            <Inp type="date" value={form.invoiceDate} onChange={set('invoiceDate')} />
                        </Field>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Invoice Type">
                            <Sel value={form.invoiceType} onChange={set('invoiceType')}>
                                {INVOICE_TYPES.map(t => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </Sel>
                        </Field>
                        <Field label="Supply Type">
                            <Sel value={form.supplyType} onChange={set('supplyType')}>
                                <option value="B2B">B2B</option>
                                <option value="SEZWP">SEZ with Payment</option>
                                <option value="SEZWOP">SEZ without Payment</option>
                                <option value="EXPWP">Export with Payment</option>
                                <option value="EXPWOP">Export without Payment</option>
                            </Sel>
                        </Field>
                    </div>

                    {/* ── Seller Details ───────────────────────────────────── */}
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-2">
                        Seller Details
                        <span className="ml-1 font-normal normal-case text-gray-400">(from Company Settings)</span>
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Seller Name">
                            <Inp value={form.sellerName} onChange={set('sellerName')} placeholder="Your company name" />
                        </Field>
                        <Field label="Seller GSTIN" required error={errors.sellerGstin}>
                            <Inp
                                value={form.sellerGstin}
                                onChange={set('sellerGstin')}
                                placeholder="15-char GSTIN"
                                maxLength={15}
                                className="uppercase"
                            />
                        </Field>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <Field label="State Code" required error={errors.sellerStateCode} hint="e.g. 09 for UP">
                            <Inp value={form.sellerStateCode} onChange={set('sellerStateCode')} placeholder="09" maxLength={2} />
                        </Field>
                        <Field label="City / State">
                            <Inp value={form.sellerCity} onChange={set('sellerCity')} placeholder="Delhi" />
                        </Field>
                        <Field label="PIN Code">
                            <Inp value={form.sellerPin} onChange={set('sellerPin')} placeholder="110001" maxLength={6} />
                        </Field>
                    </div>

                    {/* ── Buyer Details ────────────────────────────────────── */}
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-2">
                        Buyer Details
                        <span className="ml-1 font-normal normal-case text-gray-400">(auto-filled from client)</span>
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Buyer Name">
                            <Inp value={form.buyerName} onChange={set('buyerName')} placeholder="Client company name" />
                        </Field>
                        <Field label="Buyer GSTIN" required error={errors.buyerGstin}>
                            <Inp
                                value={form.buyerGstin}
                                onChange={set('buyerGstin')}
                                placeholder="15-char GSTIN"
                                maxLength={15}
                                className="uppercase"
                            />
                        </Field>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <Field label="State Code" required error={errors.buyerStateCode} hint="e.g. 09 for UP">
                            <Inp value={form.buyerStateCode} onChange={set('buyerStateCode')} placeholder="09" maxLength={2} />
                        </Field>
                        <Field label="City">
                            <Inp value={form.buyerCity} onChange={set('buyerCity')} placeholder="Mumbai" />
                        </Field>
                        <Field label="PIN Code">
                            <Inp value={form.buyerPin} onChange={set('buyerPin')} placeholder="400001" maxLength={6} />
                        </Field>
                    </div>

                    {/* ── Service & Tax ────────────────────────────────────── */}
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-2">Service & Tax</p>

                    <Field label="Service Description">
                        <Inp value={form.description} onChange={set('description')} placeholder="Digital Marketing Services" />
                    </Field>

                    <div className="grid grid-cols-2 gap-3">
                        <Field label="HSN / SAC Code">
                            <Inp value={form.hsnCode} onChange={set('hsnCode')} placeholder="998361" maxLength={8} />
                        </Field>
                        <Field label="GST Rate (%)">
                            <Sel value={form.gstRate} onChange={set('gstRate')}>
                                {GST_RATES.map(r => (
                                    <option key={r} value={r}>{r}%</option>
                                ))}
                            </Sel>
                        </Field>
                    </div>

                    <Field label="Taxable Amount (₹)" required error={errors.taxableAmount}>
                        <Inp
                            type="number"
                            value={form.taxableAmount}
                            onChange={set('taxableAmount')}
                            placeholder="e.g. 350000"
                            min="1"
                        />
                    </Field>

                    {/* Tax preview */}
                    {taxable > 0 && (
                        <div className="bg-gray-50 rounded-lg p-3 space-y-1.5 text-xs">
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                    sameState
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-purple-100 text-purple-700'
                                }`}>
                                    {sameState
                                        ? `Same State → CGST + SGST`
                                        : form.sellerStateCode && form.buyerStateCode
                                            ? `Inter-State → IGST`
                                            : 'Enter state codes to compute tax'
                                    }
                                </span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>Taxable Value</span><span>{fmt(taxable)}</span>
                            </div>
                            {cgstAmt > 0 && (
                                <div className="flex justify-between text-gray-600">
                                    <span>CGST @ {halfRate}%</span><span>{fmt(cgstAmt)}</span>
                                </div>
                            )}
                            {sgstAmt > 0 && (
                                <div className="flex justify-between text-gray-600">
                                    <span>SGST @ {halfRate}%</span><span>{fmt(sgstAmt)}</span>
                                </div>
                            )}
                            {igstAmt > 0 && (
                                <div className="flex justify-between text-gray-600">
                                    <span>IGST @ {gstRate}%</span><span>{fmt(igstAmt)}</span>
                                </div>
                            )}
                            <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-1.5 mt-0.5">
                                <span>Total Invoice Value</span>
                                <span className="text-sm">{fmt(totalAmt)}</span>
                            </div>
                        </div>
                    )}

                    {apiErr && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-xs font-semibold text-red-700">Generation Failed</p>
                            <p className="text-xs text-red-600 mt-0.5">{apiErr}</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-2 sticky bottom-0 bg-white pb-1">
                        <Button variant="secondary" onClick={handleClose} className="flex-1">Cancel</Button>
                        <Button
                            variant="success"
                            onClick={handleSubmit}
                            disabled={loading}
                            loading={loading}
                            className="flex-1"
                        >
                            {loading ? 'Generating IRN…' : '⚡ Generate IRN'}
                        </Button>
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default GenerateGSTInvoiceModal;
