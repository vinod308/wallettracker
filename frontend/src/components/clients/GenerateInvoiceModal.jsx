import React, { useState, useMemo } from 'react';
import Modal from '../common/Modal';
import { generateInvoicePDF, downloadInvoicePDF, openInvoicePDFInTab } from '../../utils/generateInvoicePDF';
import api from '../../services/api';
import invoiceService from '../../services/invoiceService';
import QRCode from 'qrcode';

const getFY = () => {
    const now  = new Date();
    const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    return `${year}-${String(year + 1).slice(2)}`;
};

const getNextInvoiceNumber = () => {
    const invoices = JSON.parse(localStorage.getItem('gw_invoices') || '[]');
    const settings = JSON.parse(localStorage.getItem('gw_settings') || '{}');
    const prefix = (settings.invoicePrefix || 'GPPL').toUpperCase();
    const fy     = getFY();
    const count  = invoices.filter(inv => (inv.invoiceNumber || '').includes(fy)).length;
    return `${prefix}/${fy}/${String(count + 1).padStart(3, '0')}`;
};

const today = () => new Date().toISOString().split('T')[0];
const EMPTY_LINE = { description: '', hsn: '', qty: 1, rate: '' };

const fmt = (n) => `₹${Number(n.toFixed(2)).toLocaleString('en-IN')}`;

const GenerateInvoiceModal = ({ isOpen, onClose, client, onInvoiceSaved }) => {
    const invoiceNumber = useMemo(() => getNextInvoiceNumber(), [isOpen]);

    const [invoiceDate, setInvoiceDate] = useState(today());
    const [lines,       setLines]       = useState([{ ...EMPTY_LINE }]);
    const [taxType,     setTaxType]     = useState('split');
    const [notes,       setNotes]       = useState('');
    const [generating,   setGenerating]   = useState(false);
    const [done,         setDone]         = useState(false);
    const [savedInvoice, setSavedInvoice] = useState(null);
    const [emailStatus,  setEmailStatus]  = useState(null); // null | 'sending' | 'sent' | 'failed'
    const [emailError,   setEmailError]   = useState('');

    const updateLine = (i, field, value) =>
        setLines(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: value } : l));
    const addLine    = () => setLines(prev => [...prev, { ...EMPTY_LINE }]);
    const removeLine = (i) => setLines(prev => prev.filter((_, idx) => idx !== i));

    const subtotal = lines.reduce((s, l) => s + (parseFloat(l.rate) || 0) * (parseFloat(l.qty) || 0), 0);
    const cgst     = taxType === 'split' ? subtotal * 0.09 : taxType === 'split5' ? subtotal * 0.025 : 0;
    const sgst     = taxType === 'split' ? subtotal * 0.09 : taxType === 'split5' ? subtotal * 0.025 : 0;
    const igst     = taxType === 'igst'  ? subtotal * 0.18 : taxType === 'igst5'  ? subtotal * 0.05  : 0;
    const total    = subtotal + cgst + sgst + igst;

    const hasLines = lines.some(l => l.description.trim() && parseFloat(l.rate) > 0);

    const buildInvoiceObj = () => ({
        invoiceNumber,
        invoiceDate,
        clientId:     client.id,
        clientName:   client.clientName,
        clientGST:    client.gstNumber,
        clientAddress:client.address,
        contactEmail: client.contactEmail,
        lines,
        taxType,
        subtotal,
        cgst,
        sgst,
        igst,
        total,
        notes,
        status:       'Generated',
        createdAt:    new Date().toISOString(),
    });

    const saveToLocalStorage = (inv) => {
        const existing = JSON.parse(localStorage.getItem('gw_invoices') || '[]');
        existing.push(inv);
        localStorage.setItem('gw_invoices', JSON.stringify(existing));
    };

    const handleGenerate = async () => {
        if (!hasLines) return;
        setGenerating(true);
        try {
            const inv = buildInvoiceObj();

            // ── Try Masters India IRN generation ──────────────────────────
            try {
                const settings = JSON.parse(localStorage.getItem('gw_settings') || '{}');
                const firstLine = lines.find(l => l.description.trim() && parseFloat(l.rate) > 0);
                const buyerStateCode = (client.gstNumber || '').slice(0, 2);
                const gstRate = taxType === 'split5' || taxType === 'igst5' ? 5 : 18;

                if (settings.gstin && client.gstNumber && inv.invoiceNumber.length <= 16) {
                    const irnRes = await invoiceService.generateIRN({
                        clientId:        client.id,
                        invoiceNumber:   inv.invoiceNumber,
                        invoiceDate:     inv.invoiceDate,
                        invoiceType:     'INV',
                        supplyType:      'B2B',
                        sellerGstin:     settings.gstin,
                        sellerName:      settings.companyName || '',
                        sellerAddr1:     settings.address     || '',
                        sellerCity:      settings.state       || '',
                        sellerStateCode: settings.stateCode   || '',
                        sellerPin:       settings.pinCode     || '',
                        sellerEmail:     settings.companyEmail || '',
                        buyerGstin:      client.gstNumber,
                        buyerName:       client.clientName,
                        buyerAddr1:      client.address || client.clientName,
                        buyerCity:       client.city    || '',
                        buyerStateCode,
                        buyerPin:        client.pinCode || '',
                        description:     firstLine?.description || 'Professional Services',
                        hsnCode:         firstLine?.hsn         || '998361',
                        taxableAmount:   inv.subtotal,
                        gstRate,
                    });

                    const irnData = irnRes.data?.data;
                    if (irnData?.irn) {
                        inv.irn    = irnData.irn;
                        inv.ackNo  = irnData.ack_no  || '';
                        inv.ackDate = irnData.ack_date || '';

                        // Generate QR code image from signed_qr string
                        if (irnData.signed_qr) {
                            inv.qrDataUrl = await QRCode.toDataURL(irnData.signed_qr, {
                                width: 120, margin: 1, errorCorrectionLevel: 'M',
                            });
                        }
                    }
                }
            } catch (irnErr) {
                // IRN failure is non-blocking — PDF still generates without it
                console.warn('IRN generation skipped:', irnErr.response?.data?.message || irnErr.message);
            }

            saveToLocalStorage(inv);

            // Generate PDF with IRN/QR if available
            const doc = generateInvoicePDF(inv, client);
            doc.save(`${inv.invoiceNumber.replace(/\//g, '-')}.pdf`);
            const pdfBase64 = doc.output('datauristring').split(',')[1];

            setSavedInvoice(inv);
            onInvoiceSaved?.();
            setDone(true);

            // Send email non-blocking
            if (inv.contactEmail || client.contactEmail) {
                setEmailStatus('sending');
                setEmailError('');
                api.post('/invoices/send-email', { invoice: inv, client, pdfBase64 })
                    .then(() => setEmailStatus('sent'))
                    .catch((err) => {
                        const msg = err.response?.data?.message || err.message || 'Unknown error';
                        console.error('Invoice email failed:', msg, err.response?.data);
                        setEmailError(msg);
                        setEmailStatus('failed');
                    });
            }
        } catch (err) {
            console.error('PDF generation failed:', err);
            alert('PDF generation failed. Please try again.');
        } finally {
            setGenerating(false);
        }
    };

    const handlePreview = () => {
        if (!hasLines) return;
        const inv = buildInvoiceObj();
        openInvoicePDFInTab(inv, client);
    };

    const handleClose = () => {
        setLines([{ ...EMPTY_LINE }]);
        setNotes('');
        setDone(false);
        setGenerating(false);
        setSavedInvoice(null);
        setEmailStatus(null);
        setEmailError('');
        setInvoiceDate(today());
        onClose();
    };

    if (!client) return null;

    // ── Success screen ────────────────────────────────────────────────────
    if (done && savedInvoice) {
        return (
            <Modal isOpen={isOpen} onClose={handleClose} title="Invoice Generated" size="md">
                <div className="text-center py-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Invoice Created!</h3>
                    <p className="text-sm text-gray-500 mb-1">
                        <span className="font-semibold text-gray-800">{savedInvoice.invoiceNumber}</span> — PDF downloaded automatically.
                    </p>
                    <p className="text-xs text-gray-400 mb-4">
                        Total: <strong>{fmt(savedInvoice.total)}</strong>
                    </p>

                    {/* Email status badge */}
                    {(savedInvoice.contactEmail || client.contactEmail) && (
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium mb-5 ${
                            emailStatus === 'sent'    ? 'bg-green-50 text-green-700 border border-green-200' :
                            emailStatus === 'failed'  ? 'bg-red-50 text-red-600 border border-red-200' :
                            'bg-gray-50 text-gray-500 border border-gray-200'
                        }`}>
                            {emailStatus === 'sending' && (
                                <><svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Sending email to {savedInvoice.contactEmail || client.contactEmail}…</>
                            )}
                            {emailStatus === 'sent' && (
                                <>✓ Email sent to {savedInvoice.contactEmail || client.contactEmail}</>
                            )}
                            {emailStatus === 'failed' && (
                                <span title={emailError}>✗ Email failed{emailError ? ` — ${emailError}` : ''}</span>
                            )}
                        </div>
                    )}

                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={() => openInvoicePDFInTab(savedInvoice, client)}
                            className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View PDF
                        </button>
                        <button onClick={handleClose} className="px-5 py-2.5 bg-primary-blue text-white rounded-xl text-sm font-semibold hover:bg-[#4338ca] transition-colors">
                            Done
                        </button>
                    </div>
                </div>
            </Modal>
        );
    }

    // ── Main form ─────────────────────────────────────────────────────────
    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Generate Invoice" size="xl">
            <div className="space-y-5">

                {/* Invoice Meta */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Invoice Number</label>
                        <div className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-primary-blue">
                            {invoiceNumber}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Auto-generated · read-only</p>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Invoice Date</label>
                        <input
                            type="date"
                            value={invoiceDate}
                            onChange={e => setInvoiceDate(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
                        />
                    </div>
                </div>

                {/* Client Info (pre-filled, read-only) */}
                <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4">
                    <p className="text-xs font-bold text-primary-blue uppercase tracking-wider mb-3">Bill To — Pre-filled from Client Profile</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><span className="text-gray-400 text-xs">Company: </span><span className="font-semibold text-gray-800">{client.clientName}</span></div>
                        <div><span className="text-gray-400 text-xs">GST: </span><span className="font-semibold text-gray-800">{client.gstNumber}</span></div>
                        <div className="col-span-2"><span className="text-gray-400 text-xs">Address: </span><span className="font-semibold text-gray-800">{client.address}</span></div>
                        <div><span className="text-gray-400 text-xs">Contact: </span><span className="font-semibold text-gray-800">{client.contactPerson}</span></div>
                        <div><span className="text-gray-400 text-xs">Email: </span><span className="font-semibold text-gray-800">{client.contactEmail}</span></div>
                    </div>
                </div>

                {/* Tax Type */}
                <div className="flex items-center gap-4 flex-wrap">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tax Type:</span>
                    <div className="flex gap-4 flex-wrap">
                        {[
                            ['split',  'CGST + SGST (9% + 9%)'],
                            ['igst',   'IGST (18%)'],
                            ['split5', 'CGST + SGST (2.5% + 2.5%)'],
                            ['igst5',  'IGST (5%)'],
                        ].map(([val, label]) => (
                            <label key={val} className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="taxType" value={val} checked={taxType === val}
                                    onChange={() => setTaxType(val)} className="accent-primary-blue" />
                                <span className="text-sm text-gray-700">{label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Line Items */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Line Items / Services</label>
                        <button onClick={addLine} className="flex items-center gap-1 text-xs text-primary-blue hover:text-[#4338ca] font-semibold transition-colors">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add Row
                        </button>
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <div className="border-gray-200 overflow-hidden min-w-[480px]">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 w-8">#</th>
                                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Description</th>
                                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 w-20">HSN/SAC</th>
                                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 w-20">Qty</th>
                                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 w-28">Rate (₹)</th>
                                    <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 w-24">Amount</th>
                                    <th className="w-8"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {lines.map((line, i) => (
                                    <tr key={i} className="hover:bg-gray-50/50">
                                        <td className="px-3 py-2 text-xs text-gray-400">{i + 1}</td>
                                        <td className="px-2 py-2">
                                            <input value={line.description} onChange={e => updateLine(i, 'description', e.target.value)}
                                                placeholder="Service description"
                                                className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary-blue" />
                                        </td>
                                        <td className="px-2 py-2">
                                            <input value={line.hsn} onChange={e => updateLine(i, 'hsn', e.target.value)}
                                                placeholder="998361"
                                                className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary-blue" />
                                        </td>
                                        <td className="px-2 py-2">
                                            <input type="number" min="1" value={line.qty} onChange={e => updateLine(i, 'qty', e.target.value)}
                                                className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary-blue [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
                                        </td>
                                        <td className="px-2 py-2">
                                            <input type="number" value={line.rate} onChange={e => updateLine(i, 'rate', e.target.value)}
                                                placeholder="0"
                                                className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary-blue" />
                                        </td>
                                        <td className="px-3 py-2 text-right font-semibold text-gray-800 text-sm">
                                            {fmt((parseFloat(line.rate) || 0) * (parseFloat(line.qty) || 0))}
                                        </td>
                                        <td className="px-2 py-2">
                                            {lines.length > 1 && (
                                                <button onClick={() => removeLine(i)} className="text-gray-300 hover:text-red-500 transition-colors">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    </div>
                </div>

                {/* Totals */}
                <div className="ml-auto w-full sm:w-72 bg-gray-50 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between text-sm text-gray-600"><span>Subtotal</span><span className="font-semibold">{fmt(subtotal)}</span></div>
                    {(taxType === 'split' || taxType === 'split5') ? (
                        <>
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>CGST @ {taxType === 'split' ? '9%' : '2.5%'}</span><span>{fmt(cgst)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>SGST @ {taxType === 'split' ? '9%' : '2.5%'}</span><span>{fmt(sgst)}</span>
                            </div>
                        </>
                    ) : (
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>IGST @ {taxType === 'igst' ? '18%' : '5%'}</span><span>{fmt(igst)}</span>
                        </div>
                    )}
                    <div className="pt-2 border-t border-gray-200 flex justify-between font-bold text-gray-900">
                        <span>Grand Total</span>
                        <span className="text-primary-blue">{fmt(total)}</span>
                    </div>
                </div>

                {/* Notes */}
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Notes (Optional)</label>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                        placeholder="Payment terms, bank details for transfer, etc."
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue resize-none" />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100 flex-wrap gap-3">
                    <button onClick={handleClose} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                        Cancel
                    </button>
                    <div className="flex items-center gap-3 flex-wrap">
                        <button
                            onClick={handlePreview}
                            disabled={!hasLines}
                            className="flex items-center gap-2 px-4 py-2.5 border border-primary-blue text-primary-blue rounded-xl text-sm font-semibold hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Preview PDF
                        </button>
                        <button
                            onClick={handleGenerate}
                            disabled={!hasLines || generating}
                            className="flex items-center gap-2 px-5 py-2.5 bg-primary-blue text-white rounded-xl text-sm font-semibold hover:bg-[#4338ca] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                        >
                            {generating ? (
                                <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Generating…</>
                            ) : (
                                <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>Generate & Download PDF</>
                            )}
                        </button>
                    </div>
                </div>

            </div>
        </Modal>
    );
};

export default GenerateInvoiceModal;
