/**
 * GSTInvoiceList
 * Shows all GST invoices for a client with status badges and action buttons.
 * Includes buttons to open GSTSyncModal (fetch from portal) and ManualGSTInvoiceModal.
 */
import React, { useEffect, useState, useCallback } from 'react';
import invoiceService from '../../services/invoiceService';
import GSTSyncModal              from './GSTSyncModal';
import ManualGSTInvoiceModal     from './ManualGSTInvoiceModal';
import GenerateGSTInvoiceModal   from './GenerateGSTInvoiceModal';

const fmt = (n) =>
    `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

const StatusBadge = ({ status }) => {
    const map = {
        Paid:    'bg-green-100 text-green-800',
        Unpaid:  'bg-yellow-100 text-yellow-800',
        Partial: 'bg-blue-100  text-blue-800',
    };
    return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status] || 'bg-gray-100 text-gray-600'}`}>
            {status}
        </span>
    );
};

const SourceBadge = ({ source }) => {
    const map = {
        'GST Portal':    'bg-purple-100 text-purple-800',
        'Masters India': 'bg-emerald-100 text-emerald-800',
        'Cancelled':     'bg-red-100 text-red-700',
    };
    return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[source] || 'bg-gray-100 text-gray-600'}`}>
            {source}
        </span>
    );
};

const GSTInvoiceList = ({ client }) => {
    const [invoices,     setInvoices]     = useState([]);
    const [loading,      setLoading]      = useState(true);
    const [error,        setError]        = useState('');
    const [showSync,      setShowSync]      = useState(false);
    const [showManual,    setShowManual]    = useState(false);
    const [showGenerate,  setShowGenerate]  = useState(false);
    const [updatingId,   setUpdatingId]   = useState(null);
    const [deletingId,   setDeletingId]   = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await invoiceService.getClientGSTInvoices(client.id);
            setInvoices(res.data.data || []);
        } catch (err) {
            setError('Failed to load invoices');
        } finally {
            setLoading(false);
        }
    }, [client.id]);

    useEffect(() => { load(); }, [load]);

    const handlePaymentChange = async (id, newStatus) => {
        setUpdatingId(id);
        try {
            await invoiceService.updatePaymentStatus(id, newStatus);
            setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, payment_status: newStatus } : inv));
        } catch {
            // silently fail — user can retry
        } finally {
            setUpdatingId(null);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this invoice?')) return;
        setDeletingId(id);
        try {
            await invoiceService.deleteGSTInvoice(id);
            setInvoices(prev => prev.filter(inv => inv.id !== id));
        } catch {
            // silently fail
        } finally {
            setDeletingId(null);
        }
    };

    const onSaved = () => {
        setShowSync(false);
        setShowManual(false);
        setShowGenerate(false);
        load();
    };

    // ── totals for the summary strip ──────────────────────────────────────────
    const totals = invoices.reduce(
        (acc, inv) => ({
            total:  acc.total  + (inv.total_amount  || 0),
            unpaid: acc.unpaid + (inv.payment_status === 'Unpaid' ? inv.total_amount || 0 : 0),
            paid:   acc.paid   + (inv.payment_status === 'Paid'   ? inv.total_amount || 0 : 0),
        }),
        { total: 0, unpaid: 0, paid: 0 }
    );

    return (
        <div className="space-y-4">
            {/* Header row */}
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-800">
                    GST Invoices
                    {invoices.length > 0 && (
                        <span className="ml-2 text-xs text-gray-400 font-normal">({invoices.length})</span>
                    )}
                </h3>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowGenerate(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs
                                   font-medium rounded-lg hover:bg-green-700 transition-colors"
                    >
                        ⚡ Generate IRN
                    </button>
                    <button
                        onClick={() => setShowSync(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white text-xs
                                   font-medium rounded-lg hover:bg-purple-700 transition-colors"
                    >
                        <span>⟳</span> Fetch from Portal
                    </button>
                    <button
                        onClick={() => setShowManual(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs
                                   font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        + Add Manually
                    </button>
                </div>
            </div>

            {/* Summary strip */}
            {invoices.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: 'Total Billed', value: totals.total,  color: 'text-gray-900' },
                        { label: 'Paid',         value: totals.paid,   color: 'text-green-700' },
                        { label: 'Outstanding',  value: totals.unpaid, color: 'text-amber-700' },
                    ].map(({ label, value, color }) => (
                        <div key={label} className="bg-gray-50 rounded-lg p-3 text-center">
                            <p className="text-xs text-gray-500">{label}</p>
                            <p className={`text-sm font-bold mt-0.5 ${color}`}>{fmt(value)}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Invoice table */}
            {loading ? (
                <div className="text-center py-6 text-sm text-gray-400">Loading invoices…</div>
            ) : error ? (
                <div className="text-center py-4 text-sm text-red-500">{error}</div>
            ) : invoices.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                    <p className="text-sm text-gray-500 font-medium">No GST invoices yet</p>
                    <p className="text-xs text-gray-400 mt-1">
                        Fetch from the GST portal using an IRN, or add one manually.
                    </p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                {['Invoice No', 'Date', 'Buyer', 'Taxable', 'CGST', 'SGST', 'Total', 'Status', 'Source', 'IRN', ''].map(h => (
                                    <th key={h} className="px-3 py-2 text-left text-gray-500 font-medium whitespace-nowrap">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.map(inv => (
                                <tr key={inv.id} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="px-3 py-2 font-mono text-gray-900 whitespace-nowrap">
                                        {inv.invoice_number}
                                    </td>
                                    <td className="px-3 py-2 text-gray-600 whitespace-nowrap">
                                        {inv.invoice_date?.split('T')[0]}
                                    </td>
                                    <td className="px-3 py-2 text-gray-700 max-w-[160px] truncate" title={inv.buyer_name}>
                                        {inv.buyer_name || '—'}
                                    </td>
                                    <td className="px-3 py-2 text-right text-gray-700 whitespace-nowrap">
                                        {fmt(inv.taxable_amount)}
                                    </td>
                                    <td className="px-3 py-2 text-right text-gray-600 whitespace-nowrap">
                                        {inv.cgst_amount > 0 ? fmt(inv.cgst_amount) : '—'}
                                    </td>
                                    <td className="px-3 py-2 text-right text-gray-600 whitespace-nowrap">
                                        {inv.sgst_amount > 0 ? fmt(inv.sgst_amount) : '—'}
                                    </td>
                                    <td className="px-3 py-2 text-right font-semibold text-gray-900 whitespace-nowrap">
                                        {fmt(inv.total_amount)}
                                    </td>
                                    <td className="px-3 py-2">
                                        <select
                                            value={inv.payment_status}
                                            disabled={updatingId === inv.id}
                                            onChange={e => handlePaymentChange(inv.id, e.target.value)}
                                            className="text-xs border-0 bg-transparent cursor-pointer focus:outline-none"
                                        >
                                            <option>Unpaid</option>
                                            <option>Paid</option>
                                            <option>Partial</option>
                                        </select>
                                    </td>
                                    <td className="px-3 py-2">
                                        <SourceBadge source={inv.source} />
                                    </td>
                                    <td className="px-3 py-2">
                                        {inv.irn ? (
                                            <span
                                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                                                title={inv.irn}
                                            >
                                                ✓ IRN
                                            </span>
                                        ) : (
                                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                                                ⚠ No IRN
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-3 py-2">
                                        <button
                                            onClick={() => handleDelete(inv.id)}
                                            disabled={deletingId === inv.id}
                                            className="text-red-400 hover:text-red-600 transition-colors disabled:opacity-40"
                                            title="Delete invoice"
                                        >
                                            ✕
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modals */}
            <GenerateGSTInvoiceModal
                isOpen={showGenerate}
                onClose={() => setShowGenerate(false)}
                client={client}
                onInvoiceSaved={onSaved}
            />
            <GSTSyncModal
                isOpen={showSync}
                onClose={() => setShowSync(false)}
                client={client}
                onInvoiceSaved={onSaved}
            />
            <ManualGSTInvoiceModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                client={client}
                onInvoiceSaved={onSaved}
            />
        </div>
    );
};

export default GSTInvoiceList;
