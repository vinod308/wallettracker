import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import ClientOnboardingModal from '../components/clients/ClientOnboardingModal';
import GenerateInvoiceModal from '../components/clients/GenerateInvoiceModal';
import { generateInvoicePDF, downloadInvoicePDF, openInvoicePDFInTab } from '../utils/generateInvoicePDF';
import { downloadEWBPDF } from '../utils/generateEWBPDF';
import api from '../services/api';

// ── Small helpers ─────────────────────────────────────────────────────────
const InfoRow = ({ label, value }) => (
    <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-gray-900 break-all">{value || '—'}</p>
    </div>
);

const SectionCard = ({ title, icon, children }) => (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card border border-gray-100/50 p-5">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            <span className="text-primary-blue">{icon}</span>
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">{title}</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {children}
        </div>
    </div>
);

const statusColor = (s) => ({
    Generated: 'bg-blue-50 text-blue-700 border border-blue-100',
    Draft:     'bg-gray-50 text-gray-600 border border-gray-200',
    Paid:      'bg-green-50 text-green-700 border border-green-100',
    Overdue:   'bg-red-50 text-red-700 border border-red-100',
}[s] || 'bg-gray-50 text-gray-600 border border-gray-200');

const fmt = (n) => `Rs.${Number((n || 0).toFixed(0)).toLocaleString('en-IN')}`;

// Days since a date string
const daysSince = (dateStr) => {
    if (!dateStr) return 0;
    const d = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'));
    return Math.floor((Date.now() - d.getTime()) / 86400000);
};

const REMINDER_MILESTONES = [15, 30, 45];

const OnboardedClientPage = () => {
    const { clientId } = useParams();
    const navigate     = useNavigate();

    const [client,             setClient]             = useState(null);
    const [invoices,           setInvoices]           = useState([]);
    const [showEdit,           setShowEdit]           = useState(false);
    const [showDeleteConfirm,  setShowDeleteConfirm]  = useState(false);
    const [showInvoice,        setShowInvoice]        = useState(false);
    const [reminderLoading,    setReminderLoading]    = useState({}); // { `${invNum}-${days}`: true }
    const [reminderStatus,     setReminderStatus]     = useState({}); // { `${invNum}-${days}`: 'sent'|'failed' }
    const [paymentConfirm,     setPaymentConfirm]     = useState(null); // invoice to mark as paid

    const loadClient = useCallback(() => {
        const clients = JSON.parse(localStorage.getItem('gw_onboarded_clients') || '[]');
        setClient(clients.find(c => c.id === clientId) || null);
    }, [clientId]);

    const loadInvoices = useCallback(() => {
        const all = JSON.parse(localStorage.getItem('gw_invoices') || '[]');
        // Migrate legacy "Draft" invoices to "Generated"
        const migrated = all.map(inv => inv.status === 'Draft' ? { ...inv, status: 'Generated' } : inv);
        if (migrated.some((inv, i) => inv.status !== all[i].status)) {
            localStorage.setItem('gw_invoices', JSON.stringify(migrated));
        }
        setInvoices(migrated.filter(inv => inv.clientId === clientId).reverse());
    }, [clientId]);

    useEffect(() => { loadClient(); loadInvoices(); }, [loadClient, loadInvoices]);

    const handleDelete = () => {
        const clients = JSON.parse(localStorage.getItem('gw_onboarded_clients') || '[]');
        localStorage.setItem('gw_onboarded_clients', JSON.stringify(clients.filter(c => c.id !== clientId)));
        navigate('/clients');
    };

    const sendReminder = async (inv, days) => {
        const key = `${inv.invoiceNumber}-${days}`;
        setReminderLoading(prev => ({ ...prev, [key]: true }));
        try {
            const doc = generateInvoicePDF(inv, client);
            const pdfBase64 = doc.output('datauristring').split(',')[1];
            await api.post('/invoices/send-reminder', { invoice: inv, client, pdfBase64, daysPast: days });
            // Save reminder sent in localStorage
            const all = JSON.parse(localStorage.getItem('gw_invoices') || '[]');
            const updated = all.map(i => {
                if (i.invoiceNumber !== inv.invoiceNumber) return i;
                const sent = [...(i.remindersSent || [])];
                if (!sent.includes(days)) sent.push(days);
                return { ...i, remindersSent: sent };
            });
            localStorage.setItem('gw_invoices', JSON.stringify(updated));
            loadInvoices();
            setReminderStatus(prev => ({ ...prev, [key]: 'sent' }));
        } catch (err) {
            console.error('Reminder failed:', err.response?.data || err.message);
            setReminderStatus(prev => ({ ...prev, [key]: 'failed' }));
        } finally {
            setReminderLoading(prev => ({ ...prev, [key]: false }));
        }
    };

    const markAsPaid = (inv) => {
        const all = JSON.parse(localStorage.getItem('gw_invoices') || '[]');
        localStorage.setItem('gw_invoices', JSON.stringify(
            all.map(i => i.invoiceNumber === inv.invoiceNumber
                ? { ...i, status: 'Paid', paidAt: new Date().toISOString() }
                : i
            )
        ));
        setPaymentConfirm(null);
        loadInvoices();
    };

    const markAsUnpaid = (inv) => {
        const all = JSON.parse(localStorage.getItem('gw_invoices') || '[]');
        localStorage.setItem('gw_invoices', JSON.stringify(
            all.map(i => i.invoiceNumber === inv.invoiceNumber
                ? { ...i, status: 'Generated', paidAt: null }
                : i
            )
        ));
        loadInvoices();
    };

    if (!client) {
        return (
            <MainLayout>
                <div className="text-center py-24">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <p className="text-gray-500 font-medium">Client not found.</p>
                    <button onClick={() => navigate('/clients')} className="mt-4 text-primary-blue hover:underline text-sm font-medium">
                        ← Back to Client Management
                    </button>
                </div>
            </MainLayout>
        );
    }

    const onboardedDate = client.onboardedAt
        ? new Date(client.onboardedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : '—';

    return (
        <MainLayout>
            {/* ── Back ─────────────────────────────────────────────────── */}
            <button
                onClick={() => navigate('/clients')}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-blue transition-colors mb-5 font-medium"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Client Management
            </button>

            {/* ── Header ───────────────────────────────────────────────── */}
            <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary-blue/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-primary-blue font-bold text-xl">
                            {client.clientName.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">{client.clientName}</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                {client.clientType || 'Retainer'}
                            </span>
                            <span className="text-xs text-gray-400">Onboarded: {onboardedDate}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={() => setShowEdit(true)}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit Client
                    </button>
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="flex items-center gap-2 px-4 py-2 border border-red-200 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 hover:border-red-300 transition-all duration-200"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                    </button>
                </div>
            </div>

            {/* ── Detail Cards ─────────────────────────────────────────── */}
            <div className="space-y-4 mb-6">

                {/* Basic Info */}
                <SectionCard title="Basic Information" icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                }>
                    <InfoRow label="Company Name"       value={client.clientName} />
                    <InfoRow label="Client Type"        value={client.clientType} />
                    <InfoRow label="GST Number"         value={client.gstNumber} />
                    <InfoRow label="State / Code"       value={`${client.state || '—'} (${client.stateCode || '—'})`} />
                    <div className="col-span-2 sm:col-span-3 lg:col-span-4">
                        <InfoRow label="Registered Address" value={client.address} />
                    </div>
                </SectionCard>

                {/* Bank Details */}
                <SectionCard title="Bank Details" icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                }>
                    <InfoRow label="Bank Name"      value={client.bankName} />
                    <InfoRow label="Account Number" value={client.accountNumber} />
                    <InfoRow label="IFSC Code"      value={client.ifscCode} />
                </SectionCard>

                {/* Contact Info */}
                <SectionCard title="Contact Information" icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                }>
                    <InfoRow label="Contact Person"  value={client.contactPerson} />
                    <InfoRow label="Mobile Number"   value={client.mobileNumber} />
                    <InfoRow label="Contact Email"   value={client.contactEmail} />
                    <InfoRow label="Alternate Email" value={client.altContactEmail} />
                </SectionCard>
            </div>

            {/* ── Invoices Section ──────────────────────────────────────── */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card border border-gray-100/50 mb-6">
                <div className="flex items-center justify-between p-5 pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-primary-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Invoices</h3>
                        {invoices.length > 0 && (
                            <span className="px-2 py-0.5 bg-primary-blue text-white text-xs font-bold rounded-full">
                                {invoices.length}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={() => setShowInvoice(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-xl text-sm font-semibold hover:bg-[#4338ca] hover:shadow-[0_4px_12px_rgba(79,70,229,0.3)] transition-all duration-200"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Generate Invoice
                    </button>
                </div>

                {invoices.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <p className="text-sm text-gray-400 font-medium">No invoices yet</p>
                        <p className="text-xs text-gray-300 mt-1">Click "Generate Invoice" to create the first one</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50/80">
                                <tr>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Invoice No.</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Date</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Status</th>
                                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Reminders</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {invoices.map((inv, i) => {
                                    const age  = daysSince(inv.invoiceDate || inv.createdAt);
                                    const sent = inv.remindersSent || [];
                                    const isPaid = inv.status === 'Paid';
                                    const invDateStr = inv.invoiceDate
                                        ? new Date(inv.invoiceDate + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                                        : new Date(inv.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

                                    return (
                                        <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-4 py-3">
                                                <span className="font-bold text-primary-blue text-xs">{inv.invoiceNumber}</span>
                                                {age > 0 && !isPaid && (
                                                    <span className={`ml-1.5 text-xs font-medium ${age >= 45 ? 'text-red-500' : age >= 30 ? 'text-orange-500' : age >= 15 ? 'text-yellow-600' : 'text-gray-400'}`}>
                                                        {age}d
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 text-xs hidden sm:table-cell">{invDateStr}</td>
                                            <td className="px-4 py-3 text-right font-bold text-gray-900 text-sm">{fmt(inv.total)}</td>
                                            <td className="px-4 py-3 text-center hidden sm:table-cell">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor(inv.status)}`}>
                                                    {inv.status || 'Generated'}
                                                </span>
                                            </td>
                                            {/* Reminder buttons */}
                                            <td className="px-4 py-3 hidden md:table-cell">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    {isPaid ? (
                                                        <span className="text-xs text-gray-300">Paid</span>
                                                    ) : REMINDER_MILESTONES.map(days => {
                                                        const key       = `${inv.invoiceNumber}-${days}`;
                                                        const alreadySent = sent.includes(days);
                                                        const eligible  = age >= days;
                                                        const loading   = reminderLoading[key];
                                                        const status    = reminderStatus[key];

                                                        if (!eligible) {
                                                            return (
                                                                <span key={days} className="px-1.5 py-0.5 rounded text-xs text-gray-300 border border-gray-100">
                                                                    {days}d
                                                                </span>
                                                            );
                                                        }
                                                        if (alreadySent || status === 'sent') {
                                                            return (
                                                                <span key={days} title={`${days}-day reminder sent`}
                                                                    className="px-1.5 py-0.5 rounded text-xs font-medium text-green-700 bg-green-50 border border-green-200">
                                                                    ✓{days}d
                                                                </span>
                                                            );
                                                        }
                                                        return (
                                                            <button
                                                                key={days}
                                                                onClick={() => sendReminder(inv, days)}
                                                                disabled={loading}
                                                                title={`Send ${days}-day payment reminder`}
                                                                className={`px-1.5 py-0.5 rounded text-xs font-semibold border transition-colors ${
                                                                    status === 'failed'
                                                                        ? 'text-red-600 bg-red-50 border-red-200'
                                                                        : days >= 45
                                                                        ? 'text-red-600 bg-red-50 border-red-200 hover:bg-red-100'
                                                                        : days >= 30
                                                                        ? 'text-orange-600 bg-orange-50 border-orange-200 hover:bg-orange-100'
                                                                        : 'text-yellow-700 bg-yellow-50 border-yellow-200 hover:bg-yellow-100'
                                                                } disabled:opacity-50`}
                                                            >
                                                                {loading ? '...' : `${days}d`}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button onClick={() => openInvoicePDFInTab(inv, client)} title="View PDF"
                                                        className="p-1.5 text-gray-400 hover:text-primary-blue hover:bg-blue-50 rounded-lg transition-colors">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                    </button>
                                                    <button onClick={() => downloadInvoicePDF(inv, client)} title="Download Invoice PDF"
                                                        className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                        </svg>
                                                    </button>
                                                    {(inv.ewbNo || inv.ewb_no) && (
                                                        <button
                                                            onClick={() => downloadEWBPDF(inv, client)}
                                                            title="Download E-Way Bill PDF"
                                                            className="px-2 py-1 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                                                        >
                                                            EWB
                                                        </button>
                                                    )}
                                                    {isPaid ? (
                                                        <button onClick={() => markAsUnpaid(inv)} title="Mark as Unpaid"
                                                            className="p-1.5 text-green-600 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                        </button>
                                                    ) : (
                                                        <button onClick={() => setPaymentConfirm(inv)} title="Mark as Paid"
                                                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Modals ────────────────────────────────────────────────── */}
            <ClientOnboardingModal
                isOpen={showEdit}
                onClose={() => setShowEdit(false)}
                editClient={client}
                onClientAdded={() => { loadClient(); setShowEdit(false); }}
            />

            <GenerateInvoiceModal
                isOpen={showInvoice}
                onClose={() => setShowInvoice(false)}
                client={client}
                onInvoiceSaved={loadInvoices}
            />

            {/* Mark as Paid confirmation */}
            {paymentConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setPaymentConfirm(null)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-center text-lg font-bold text-gray-900 mb-1">Mark as Paid?</h3>
                        <p className="text-center text-sm text-gray-500 mb-1">
                            Invoice <strong>{paymentConfirm.invoiceNumber}</strong>
                        </p>
                        <p className="text-center text-xs text-gray-400 mb-6">
                            Amount: <strong>{fmt(paymentConfirm.total)}</strong> — This will remove all pending reminders.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setPaymentConfirm(null)}
                                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                                Cancel
                            </button>
                            <button onClick={() => markAsPaid(paymentConfirm)}
                                className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors">
                                Confirm Paid
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete confirmation */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h3 className="text-center text-lg font-bold text-gray-900 mb-2">Delete Client?</h3>
                        <p className="text-center text-sm text-gray-500 mb-6">
                            This will permanently remove <strong>{client.clientName}</strong> and all their data. This cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleDelete}
                                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors">
                                Yes, Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    );
};

export default OnboardedClientPage;
