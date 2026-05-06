import React, { useState, useMemo } from 'react';
import Modal from '../common/Modal';
import { generatePOPDF, downloadPOPDF, openPOPDFInTab } from '../../utils/generatePOPDF';
import api from '../../services/api';

const getFY = () => {
    const now = new Date();
    const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    return `${year}-${String(year + 1).slice(2)}`;
};

const getNextPONumber = () => {
    const pos      = JSON.parse(localStorage.getItem('gw_purchase_orders') || '[]');
    const settings = JSON.parse(localStorage.getItem('gw_settings') || '{}');
    const prefix   = (settings.invoicePrefix || 'GPPL').toUpperCase();
    const fy       = getFY();
    const count    = pos.filter(p => (p.poNumber || '').includes(fy)).length;
    return `${prefix}/PO/${fy}/${String(count + 1).padStart(3, '0')}`;
};

const today    = () => new Date().toISOString().split('T')[0];
const EMPTY_LINE = { description: '', deliverables: '', qty: 1, rate: '' };

const fmt = (n) => `₹${Number(n.toFixed(2)).toLocaleString('en-IN')}`;

const GeneratePOModal = ({ isOpen, onClose, vendor, onPOSaved }) => {
    const poNumber = useMemo(() => getNextPONumber(), [isOpen]);

    const [poDate,      setPoDate]      = useState(today());
    const [startDate,   setStartDate]   = useState('');
    const [endDate,     setEndDate]     = useState('');
    const [payTerms,    setPayTerms]    = useState('Net 30');
    const [lines,       setLines]       = useState([{ ...EMPTY_LINE }]);
    const [taxType,     setTaxType]     = useState('split');
    const [notes,       setNotes]       = useState('');
    const [generating,  setGenerating]  = useState(false);
    const [done,        setDone]        = useState(false);
    const [savedPO,     setSavedPO]     = useState(null);
    const [emailStatus, setEmailStatus] = useState(null);
    const [emailError,  setEmailError]  = useState('');

    const updateLine = (i, field, value) =>
        setLines(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: value } : l));
    const addLine    = () => setLines(prev => [...prev, { ...EMPTY_LINE }]);
    const removeLine = (i) => setLines(prev => prev.filter((_, idx) => idx !== i));

    const subtotal = lines.reduce((s, l) => s + (parseFloat(l.rate) || 0) * (parseFloat(l.qty) || 0), 0);
    const cgst     = taxType === 'split' ? subtotal * 0.09 : 0;
    const sgst     = taxType === 'split' ? subtotal * 0.09 : 0;
    const igst     = taxType === 'igst'  ? subtotal * 0.18 : 0;
    const total    = subtotal + cgst + sgst + igst;

    const hasLines = lines.some(l => l.description.trim() && parseFloat(l.rate) > 0);

    const buildPOObj = () => ({
        poNumber,
        poDate,
        startDate,
        endDate,
        paymentTerms: payTerms,
        vendorId:     vendor.id,
        vendorName:   vendor.vendorName,
        vendorGST:    vendor.gstNumber,
        vendorPAN:    vendor.panNumber,
        vendorAddress: [vendor.address, vendor.city, vendor.state].filter(Boolean).join(', '),
        contactEmail: vendor.email,
        lines,
        taxType,
        subtotal,
        cgst, sgst, igst,
        total,
        notes,
        status:       'Generated',
        createdAt:    new Date().toISOString(),
    });

    const handleGenerate = async () => {
        if (!hasLines) return;
        setGenerating(true);
        try {
            const po = buildPOObj();
            const existing = JSON.parse(localStorage.getItem('gw_purchase_orders') || '[]');
            existing.push(po);
            localStorage.setItem('gw_purchase_orders', JSON.stringify(existing));

            const doc = generatePOPDF(po, vendor);
            doc.save(`${po.poNumber.replace(/\//g, '-')}.pdf`);
            const pdfBase64 = doc.output('datauristring').split(',')[1];

            setSavedPO(po);
            onPOSaved?.();
            setDone(true);

            if (vendor.email) {
                setEmailStatus('sending');
                setEmailError('');
                api.post('/invoices/send-email', {
                    invoice: { ...po, invoiceNumber: po.poNumber, invoiceDate: po.poDate },
                    client:  { clientName: vendor.vendorName, contactEmail: vendor.email, gstNumber: vendor.gstNumber, address: vendor.vendorAddress },
                    pdfBase64,
                    isPO: true,
                })
                    .then(() => setEmailStatus('sent'))
                    .catch((err) => {
                        setEmailStatus('failed');
                        setEmailError(err?.response?.data?.message || err.message || 'Email failed');
                    });
            }
        } catch (err) {
            console.error('PO generation failed:', err);
        } finally {
            setGenerating(false);
        }
    };

    const handleClose = () => {
        setPoDate(today()); setStartDate(''); setEndDate(''); setPayTerms('Net 30');
        setLines([{ ...EMPTY_LINE }]); setTaxType('split'); setNotes('');
        setGenerating(false); setDone(false); setSavedPO(null);
        setEmailStatus(null); setEmailError('');
        onClose();
    };

    if (done && savedPO) {
        return (
            <Modal isOpen={isOpen} onClose={handleClose} title="Purchase Order Generated" size="md">
                <div className="text-center py-4">
                    <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{savedPO.poNumber}</h3>
                    <p className="text-2xl font-bold text-green-600 mb-1">{fmt(savedPO.total)}</p>
                    <p className="text-sm text-gray-500 mb-4">Generated for {vendor.vendorName}</p>

                    {emailStatus && (
                        <div className={`mx-auto max-w-xs mb-4 px-4 py-2.5 rounded-xl text-xs font-medium ${
                            emailStatus === 'sending' ? 'bg-blue-50 text-blue-700' :
                            emailStatus === 'sent'    ? 'bg-green-50 text-green-700' :
                            'bg-red-50 text-red-700'
                        }`}>
                            {emailStatus === 'sending' && '📧 Sending PO email to vendor...'}
                            {emailStatus === 'sent'    && `✓ PO emailed to ${vendor.email}`}
                            {emailStatus === 'failed'  && `Email failed: ${emailError}`}
                        </div>
                    )}

                    <div className="flex gap-2 justify-center flex-wrap">
                        <button onClick={() => openPOPDFInTab(savedPO, vendor)}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View PDF
                        </button>
                        <button onClick={() => downloadPOPDF(savedPO, vendor)}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download
                        </button>
                        <button onClick={handleClose}
                            className="px-4 py-2 bg-primary-blue text-white rounded-xl text-sm font-semibold hover:bg-[#4338ca] transition-colors">
                            Done
                        </button>
                    </div>
                </div>
            </Modal>
        );
    }

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Generate Purchase Order" size="xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
                <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">PO Number</p>
                    <p className="text-lg font-bold text-primary-blue">{poNumber}</p>
                </div>
                <div className="text-right">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Vendor</p>
                    <p className="text-sm font-bold text-gray-900">{vendor?.vendorName}</p>
                </div>
            </div>

            {/* Dates & Payment Terms */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                {[
                    { label: 'PO Date', value: poDate, set: setPoDate, type: 'date', required: true },
                    { label: 'Start Date', value: startDate, set: setStartDate, type: 'date' },
                    { label: 'End Date', value: endDate, set: setEndDate, type: 'date' },
                ].map(({ label, value, set, type, required }) => (
                    <div key={label}>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                            {label} {required && <span className="text-red-400">*</span>}
                        </label>
                        <input type={type} value={value} onChange={e => set(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue" />
                    </div>
                ))}
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Payment Terms</label>
                    <select value={payTerms} onChange={e => setPayTerms(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-blue">
                        {['Immediate', 'Net 15', 'Net 30', 'Net 45', 'Net 60', '50% Advance'].map(t => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Line Items */}
            <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Work Items</p>
                    <div className="flex items-center gap-3">
                        <label className="text-xs text-gray-500 font-medium">Tax:</label>
                        <div className="flex gap-1">
                            {[{ v: 'split', l: 'CGST+SGST' }, { v: 'igst', l: 'IGST' }].map(({ v, l }) => (
                                <button key={v} onClick={() => setTaxType(v)}
                                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${taxType === v ? 'bg-primary-blue text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                                    {l}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-gray-200">
                <div className="bg-gray-50 overflow-hidden min-w-[480px]">
                    {/* Table header */}
                    <div className="grid grid-cols-[1fr_1fr_6rem_7rem_2rem] gap-0 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-100 px-3 py-2">
                        <span>Work Description</span>
                        <span>Deliverables</span>
                        <span className="text-center">Qty</span>
                        <span className="text-right">Rate (₹)</span>
                        <span />
                    </div>
                    {lines.map((line, i) => (
                        <div key={i} className="grid grid-cols-[1fr_1fr_6rem_7rem_2rem] gap-0 border-t border-gray-200 items-center px-3 py-1.5">
                            <input value={line.description} onChange={e => updateLine(i, 'description', e.target.value)}
                                placeholder="Work description"
                                className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary-blue mr-2" />
                            <input value={line.deliverables} onChange={e => updateLine(i, 'deliverables', e.target.value)}
                                placeholder="Deliverables"
                                className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary-blue mx-2" />
                            <input type="number" value={line.qty} onChange={e => updateLine(i, 'qty', e.target.value)}
                                min="1" step="1"
                                className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-1 focus:ring-primary-blue mx-2 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
                            <input type="number" value={line.rate} onChange={e => updateLine(i, 'rate', e.target.value)}
                                placeholder="0.00" min="0" step="0.01"
                                className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-right focus:outline-none focus:ring-1 focus:ring-primary-blue mx-2 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
                            <button onClick={() => removeLine(i)} disabled={lines.length === 1}
                                className="p-1 text-gray-300 hover:text-red-500 disabled:opacity-30 transition-colors rounded">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>
                </div>

                <button onClick={addLine}
                    className="mt-2 flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-primary-blue border border-dashed border-blue-300 rounded-xl hover:bg-blue-50 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Line Item
                </button>
            </div>

            {/* Totals */}
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between text-gray-600"><span>Subtotal</span><span className="font-medium">{fmt(subtotal)}</span></div>
                    {taxType === 'split' ? (
                        <>
                            <div className="flex justify-between text-gray-500 text-xs"><span>CGST (9%)</span><span>{fmt(cgst)}</span></div>
                            <div className="flex justify-between text-gray-500 text-xs"><span>SGST (9%)</span><span>{fmt(sgst)}</span></div>
                        </>
                    ) : (
                        <div className="flex justify-between text-gray-500 text-xs"><span>IGST (18%)</span><span>{fmt(igst)}</span></div>
                    )}
                    <div className="flex justify-between font-bold text-base border-t border-gray-200 pt-2 mt-2 text-gray-900">
                        <span>Total</span><span className="text-green-600">{fmt(total)}</span>
                    </div>
                </div>
            </div>

            {/* Notes */}
            <div className="mb-5">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Notes / Terms</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                    placeholder="Payment terms, special conditions, deliverable timelines..."
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue resize-none" />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 flex-wrap gap-3">
                <button onClick={handleClose}
                    className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                    Cancel
                </button>
                <button onClick={handleGenerate}
                    disabled={!hasLines || generating}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary-blue text-white rounded-xl text-sm font-semibold hover:bg-[#4338ca] hover:shadow-[0_4px_12px_rgba(79,70,229,0.3)] disabled:opacity-50 transition-all duration-200">
                    {generating && <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
                    {generating ? 'Generating…' : 'Generate PO & Download'}
                </button>
            </div>
        </Modal>
    );
};

export default GeneratePOModal;
