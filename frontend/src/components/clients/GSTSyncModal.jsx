/**
 * GSTSyncModal
 * Lets the user paste an IRN, fetch invoice details from the NIC e-Invoice portal,
 * review the parsed data, then save it linked to a client.
 */
import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import invoiceService from '../../services/invoiceService';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

const STEPS = { INPUT: 'input', PREVIEW: 'preview', SAVED: 'saved' };

const GSTSyncModal = ({ isOpen, onClose, client, onInvoiceSaved }) => {
    const [step,      setStep]      = useState(STEPS.INPUT);
    const [irn,       setIrn]       = useState('');
    const [fetched,   setFetched]   = useState(null);
    const [loading,   setLoading]   = useState(false);
    const [error,     setError]     = useState('');
    const [saveError, setSaveError] = useState('');

    const reset = () => {
        setStep(STEPS.INPUT);
        setIrn('');
        setFetched(null);
        setLoading(false);
        setError('');
        setSaveError('');
    };

    const handleClose = () => { reset(); onClose(); };

    // ── Step 1: fetch from portal ──────────────────────────────────────────────
    const handleFetch = async () => {
        if (!irn.trim()) { setError('Please enter the IRN'); return; }
        if (irn.trim().length !== 64) { setError('IRN must be exactly 64 characters'); return; }

        setLoading(true);
        setError('');
        try {
            const res = await invoiceService.fetchByIRN(irn.trim());
            setFetched(res.data.data);
            setStep(STEPS.PREVIEW);
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Failed to fetch from GST portal';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    // ── Step 2: save confirmed invoice ────────────────────────────────────────
    const handleSave = async () => {
        setSaveError('');
        setLoading(true);
        try {
            await invoiceService.saveGSTInvoice({ clientId: client.id, ...fetched });
            setStep(STEPS.SAVED);
            if (onInvoiceSaved) onInvoiceSaved();
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Failed to save invoice';
            setSaveError(msg);
        } finally {
            setLoading(false);
        }
    };

    // ── Render helpers ─────────────────────────────────────────────────────────
    const Row = ({ label, value }) => (
        <div className="flex justify-between py-1.5 border-b border-gray-100 last:border-0">
            <span className="text-xs text-gray-500 w-40 shrink-0">{label}</span>
            <span className="text-xs text-gray-900 font-medium text-right">{value || '—'}</span>
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Fetch Invoice from GST Portal">
            {/* Client badge */}
            <div className="mb-4 px-3 py-2 bg-blue-50 rounded-lg text-sm text-blue-800 font-medium">
                Client: {client?.clientName || client?.client_name}
            </div>

            {/* ── STEP 1: IRN input ──────────────────────────────────────────── */}
            {step === STEPS.INPUT && (
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        Copy the IRN from your TallyPrime e-Invoice screen (64-character code) and paste it below.
                        We'll fetch all invoice details automatically from the NIC e-Invoice portal.
                    </p>

                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                            Invoice Reference Number (IRN)
                        </label>
                        <textarea
                            rows={3}
                            value={irn}
                            onChange={e => { setIrn(e.target.value); setError(''); }}
                            placeholder="Paste 64-character IRN here…"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono
                                       focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
                        <p className="mt-1 text-xs text-gray-400">
                            Characters: {irn.trim().length} / 64
                        </p>
                    </div>

                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                        <strong>Where to find the IRN:</strong> In TallyPrime, open the invoice →
                        the IRN appears on the e-Invoice print / Tally audit report.
                        It's the 64-character alphanumeric string that starts after "IRN:".
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button variant="secondary" onClick={handleClose} className="flex-1">
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleFetch}
                            disabled={loading}
                            loading={loading}
                            className="flex-1"
                        >
                            {loading ? 'Fetching…' : 'Fetch from Portal'}
                        </Button>
                    </div>
                </div>
            )}

            {/* ── STEP 2: preview fetched data ──────────────────────────────── */}
            {step === STEPS.PREVIEW && fetched && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-green-700 font-medium">
                        <span className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center text-xs">✓</span>
                        Invoice fetched successfully — review before saving
                    </div>

                    {/* Invoice details */}
                    <div className="bg-gray-50 rounded-lg p-3 space-y-0">
                        <Row label="Invoice No"    value={fetched.invoice_number} />
                        <Row label="Date"          value={fetched.invoice_date} />
                        <Row label="Type"          value={fetched.invoice_type} />
                        <Row label="IRN"           value={fetched.irn?.slice(0, 20) + '…'} />
                        <Row label="ACK No"        value={fetched.ack_no} />
                    </div>

                    {/* Buyer */}
                    <div className="bg-gray-50 rounded-lg p-3 space-y-0">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Buyer</p>
                        <Row label="Name"    value={fetched.buyer_name} />
                        <Row label="GSTIN"   value={fetched.buyer_gstin} />
                        <Row label="Address" value={fetched.buyer_address} />
                    </div>

                    {/* Description */}
                    {fetched.description && (
                        <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Description</p>
                            <p className="text-xs text-gray-800">{fetched.description}</p>
                        </div>
                    )}

                    {/* Amounts */}
                    <div className="bg-gray-50 rounded-lg p-3 space-y-0">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Amounts</p>
                        <Row label="Taxable Value"   value={fmt(fetched.taxable_amount)} />
                        {fetched.cgst_amount > 0 && <Row label={`CGST @ ${fetched.cgst_rate}%`} value={fmt(fetched.cgst_amount)} />}
                        {fetched.sgst_amount > 0 && <Row label={`SGST @ ${fetched.sgst_rate}%`} value={fmt(fetched.sgst_amount)} />}
                        {fetched.igst_amount > 0 && <Row label={`IGST @ ${fetched.igst_rate}%`} value={fmt(fetched.igst_amount)} />}
                        <div className="flex justify-between py-1.5 border-t border-gray-300 mt-1">
                            <span className="text-xs font-bold text-gray-700">Total</span>
                            <span className="text-sm font-bold text-gray-900">{fmt(fetched.total_amount)}</span>
                        </div>
                    </div>

                    {saveError && (
                        <p className="text-xs text-red-600 bg-red-50 p-2 rounded">{saveError}</p>
                    )}

                    <div className="flex gap-3 pt-2">
                        <Button variant="secondary" onClick={() => setStep(STEPS.INPUT)} className="flex-1">
                            Back
                        </Button>
                        <Button
                            variant="success"
                            onClick={handleSave}
                            disabled={loading}
                            loading={loading}
                            className="flex-1"
                        >
                            {loading ? 'Saving…' : 'Save Invoice'}
                        </Button>
                    </div>
                </div>
            )}

            {/* ── STEP 3: saved confirmation ────────────────────────────────── */}
            {step === STEPS.SAVED && (
                <div className="text-center space-y-4 py-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto text-2xl">
                        ✓
                    </div>
                    <p className="text-base font-semibold text-gray-900">Invoice Saved!</p>
                    <p className="text-sm text-gray-600">
                        Invoice <strong>{fetched?.invoice_number}</strong> from the GST portal has been saved
                        and linked to <strong>{client?.clientName || client?.client_name}</strong>.
                    </p>
                    <div className="flex gap-3">
                        <Button variant="secondary" onClick={() => { reset(); }} className="flex-1">
                            Fetch Another
                        </Button>
                        <Button variant="primary" onClick={handleClose} className="flex-1">
                            Done
                        </Button>
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default GSTSyncModal;
