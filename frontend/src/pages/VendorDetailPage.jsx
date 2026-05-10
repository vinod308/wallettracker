import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import VendorOnboardingModal from '../components/vendors/VendorOnboardingModal';
import GeneratePOModal from '../components/vendors/GeneratePOModal';
import { downloadPOPDF, openPOPDFInTab } from '../utils/generatePOPDF';
import { downloadPIPDF, openPIPDFInTab } from '../utils/generatePIPDF';
import vendorService from '../services/vendorService';

const InfoRow = ({ label, value }) => (
    <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-gray-900 break-all">{value || '—'}</p>
    </div>
);

const SectionCard = ({ title, icon, children, cols = 4 }) => (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card border border-gray-100/50 p-5">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            <span className="text-primary-blue">{icon}</span>
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">{title}</h3>
        </div>
        <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-${cols} gap-4`}>
            {children}
        </div>
    </div>
);

const poStatusColor = (s) => ({
    Generated: 'bg-blue-50 text-blue-700 border border-blue-100',
    Draft:     'bg-gray-50 text-gray-600 border border-gray-200',
    Paid:      'bg-green-50 text-green-700 border border-green-100',
    Cancelled: 'bg-red-50 text-red-700 border border-red-100',
}[s] || 'bg-gray-50 text-gray-600 border border-gray-200');

const piStatusColor = (s) => ({
    Pending:  'bg-yellow-50 text-yellow-700 border border-yellow-200',
    Approved: 'bg-blue-50 text-blue-700 border border-blue-200',
    Paid:     'bg-green-50 text-green-700 border border-green-200',
    Rejected: 'bg-red-50 text-red-600 border border-red-200',
}[s] || 'bg-gray-50 text-gray-600 border border-gray-200');

const fmt     = (n) => `₹${Math.round(parseFloat(n) || 0).toLocaleString('en-IN')}`;
const fmtAmt  = (n) => `₹${Number(parseFloat(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// Normalize DB snake_case vendor to camelCase for unified rendering
const normalizeDBVendor = (v) => ({
    id:            v.id,
    vendorName:    v.vendor_name,
    vendorType:    v.vendor_type,
    gstNumber:     v.gst_number,
    panNumber:     v.pan_number,
    address:       v.address,
    city:          v.city,
    state:         v.state,
    pincode:       v.pincode,
    country:       v.country,
    contactPerson: v.contact_person,
    email:         v.email,
    mobile:        v.mobile,
    altMobile:     v.alt_mobile,
    website:       v.website,
    accountHolder: v.account_holder,
    bankName:      v.bank_name,
    accountNumber: v.account_number,
    ifscCode:      v.ifsc_code,
    upiId:         v.upi_id,
    swiftCode:     v.swift_code,
    invoiceCount:  v.invoice_count,
    pendingAmount: v.pending_amount,
    _dbRaw:        v,
});

const VendorDetailPage = () => {
    const { vendorId } = useParams();
    const navigate     = useNavigate();

    const [vendor,          setVendor]          = useState(null);
    const [isPortalVendor,  setIsPortalVendor]  = useState(false);
    const [loadingVendor,   setLoadingVendor]   = useState(true);

    // Onboarded-only state
    const [pos,             setPOs]             = useState([]);
    const [showEdit,        setShowEdit]        = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showPO,          setShowPO]          = useState(false);
    const [paymentConfirm,  setPaymentConfirm]  = useState(null);

    // Portal-only state
    const [invoices,        setInvoices]        = useState([]);
    const [loadingInvoices, setLoadingInvoices] = useState(false);
    const [updatingId,      setUpdatingId]      = useState(null);

    const loadPOs = useCallback(() => {
        try {
            const all = JSON.parse(localStorage.getItem('gw_purchase_orders') || '[]');
            setPOs(all.filter(p => p.vendorId === vendorId).reverse());
        } catch { setPOs([]); }
    }, [vendorId]);

    const loadInvoices = useCallback(async (id) => {
        setLoadingInvoices(true);
        try {
            const data = await vendorService.getVendorInvoices(id);
            setInvoices(data || []);
        } catch { setInvoices([]); }
        finally { setLoadingInvoices(false); }
    }, []);

    useEffect(() => {
        const load = async () => {
            setLoadingVendor(true);
            // Try localStorage first (onboarded vendors)
            try {
                const all  = JSON.parse(localStorage.getItem('gw_vendors') || '[]');
                const local = all.find(v => v.id === vendorId);
                if (local) {
                    setVendor(local);
                    setIsPortalVendor(false);
                    loadPOs();
                    setLoadingVendor(false);
                    return;
                }
            } catch {}

            // Fall back to DB (portal registered vendors)
            try {
                const v = await vendorService.getVendorById(vendorId);
                if (v) {
                    setVendor(normalizeDBVendor(v));
                    setIsPortalVendor(true);
                    setLoadingVendor(false);
                    loadInvoices(v.id);
                    return;
                }
            } catch {}

            setVendor(null);
            setLoadingVendor(false);
        };
        load();
    }, [vendorId, loadPOs, loadInvoices]);

    const handleDelete = () => {
        const all = JSON.parse(localStorage.getItem('gw_vendors') || '[]');
        localStorage.setItem('gw_vendors', JSON.stringify(all.filter(v => v.id !== vendorId)));
        navigate('/vendors');
    };

    const markAsPaid = (po) => {
        const all = JSON.parse(localStorage.getItem('gw_purchase_orders') || '[]');
        localStorage.setItem('gw_purchase_orders', JSON.stringify(
            all.map(p => p.poNumber === po.poNumber
                ? { ...p, status: 'Paid', paidAt: new Date().toISOString() }
                : p)
        ));
        setPaymentConfirm(null);
        loadPOs();
    };

    const markAsUnpaid = (po) => {
        const all = JSON.parse(localStorage.getItem('gw_purchase_orders') || '[]');
        localStorage.setItem('gw_purchase_orders', JSON.stringify(
            all.map(p => p.poNumber === po.poNumber
                ? { ...p, status: 'Generated', paidAt: null }
                : p)
        ));
        loadPOs();
    };

    const handlePIStatusChange = async (invoiceId, newStatus) => {
        setUpdatingId(invoiceId);
        try {
            await vendorService.updateInvoiceStatus(invoiceId, newStatus);
            await loadInvoices(vendor.id);
        } catch {}
        finally { setUpdatingId(null); }
    };

    // ── Loading / Not Found ───────────────────────────────────────────────────
    if (loadingVendor) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center py-24">
                    <div className="w-8 h-8 border-2 border-primary-blue border-t-transparent rounded-full animate-spin" />
                </div>
            </MainLayout>
        );
    }

    if (!vendor) {
        return (
            <MainLayout>
                <div className="text-center py-24">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <p className="text-gray-500 font-medium">Vendor not found.</p>
                    <button onClick={() => navigate('/vendors')} className="mt-4 text-primary-blue hover:underline text-sm font-medium">
                        ← Back to Vendor Management
                    </button>
                </div>
            </MainLayout>
        );
    }

    // ── Computed stats ────────────────────────────────────────────────────────
    const totalPOPaid    = pos.filter(p => p.status === 'Paid').reduce((s, p) => s + (parseFloat(p.total) || 0), 0);
    const totalPOPending = pos.filter(p => p.status !== 'Paid').reduce((s, p) => s + (parseFloat(p.total) || 0), 0);
    const totalPIPaid    = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + (parseFloat(i.total_amount) || 0), 0);
    const totalPIPending = invoices.filter(i => i.status === 'Pending' || i.status === 'Approved').reduce((s, i) => s + (parseFloat(i.total_amount) || 0), 0);
    const onboardedDate  = vendor.onboardedAt
        ? new Date(vendor.onboardedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : '—';

    return (
        <MainLayout>
            {/* Back */}
            <button
                onClick={() => navigate('/vendors')}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-blue transition-colors mb-5 font-medium"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Vendor Management
            </button>

            {/* Header */}
            <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary-blue/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-primary-blue font-bold text-xl">
                            {(vendor.vendorName || '?').charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">{vendor.vendorName}</h1>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                                {vendor.vendorType}
                            </span>
                            {isPortalVendor ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                                    Portal Registered
                                </span>
                            ) : (
                                <span className="text-xs text-gray-400">Onboarded: {onboardedDate}</span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {!isPortalVendor && (
                        <>
                            <button onClick={() => setShowEdit(true)}
                                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit
                            </button>
                            <button onClick={() => setShowDeleteConfirm(true)}
                                className="flex items-center gap-2 px-4 py-2 border border-red-200 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 hover:border-red-300 transition-all">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
                <div className="bg-white/80 rounded-2xl shadow-card border border-gray-100/50 p-3 sm:p-4 text-center">
                    <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">
                        {isPortalVendor ? 'Total PIs' : 'Total POs'}
                    </p>
                    <p className="text-xl sm:text-2xl font-bold text-primary-blue">
                        {isPortalVendor ? invoices.length : pos.length}
                    </p>
                </div>
                <div className="bg-white/80 rounded-2xl shadow-card border border-gray-100/50 p-3 sm:p-4 text-center">
                    <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">Total Paid</p>
                    <p className="text-sm sm:text-2xl font-bold text-green-600">
                        {fmt(isPortalVendor ? totalPIPaid : totalPOPaid)}
                    </p>
                </div>
                <div className="bg-white/80 rounded-2xl shadow-card border border-gray-100/50 p-3 sm:p-4 text-center">
                    <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">Pending</p>
                    <p className="text-sm sm:text-2xl font-bold text-orange-600">
                        {fmt(isPortalVendor ? totalPIPending : totalPOPending)}
                    </p>
                </div>
            </div>

            {/* Detail Sections */}
            <div className="space-y-4 mb-6">
                <SectionCard title="Basic Information" cols={4} icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                }>
                    <InfoRow label="Vendor Name" value={vendor.vendorName} />
                    <InfoRow label="Vendor Type" value={vendor.vendorType} />
                    <InfoRow label="GST Number"  value={vendor.gstNumber} />
                    <InfoRow label="PAN Number"  value={vendor.panNumber} />
                    <div className="col-span-2 sm:col-span-3 lg:col-span-4">
                        <InfoRow label="Address" value={[vendor.address, vendor.city, vendor.state, vendor.pincode, vendor.country].filter(Boolean).join(', ')} />
                    </div>
                </SectionCard>

                <SectionCard title="Contact Information" cols={4} icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                }>
                    <InfoRow label="Contact Person" value={vendor.contactPerson} />
                    <InfoRow label="Email"          value={vendor.email} />
                    <InfoRow label="Mobile"         value={vendor.mobile} />
                    <InfoRow label="Alt. Mobile"    value={vendor.altMobile} />
                    {vendor.website && <InfoRow label="Website" value={vendor.website} />}
                </SectionCard>

                <SectionCard title="Banking Details" cols={3} icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                }>
                    <InfoRow label="Account Holder" value={vendor.accountHolder} />
                    <InfoRow label="Bank Name"      value={vendor.bankName} />
                    <InfoRow label="Account Number" value={vendor.accountNumber} />
                    <InfoRow label="IFSC Code"      value={vendor.ifscCode} />
                    <InfoRow label="UPI ID"         value={vendor.upiId} />
                    <InfoRow label="SWIFT Code"     value={vendor.swiftCode} />
                </SectionCard>

                {/* Documents — only for onboarded vendors (localStorage) */}
                {!isPortalVendor && (vendor.docPAN || vendor.docCheque || vendor.docGST || vendor.docAgreement) && (
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card border border-gray-100/50 p-5">
                        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                            <svg className="w-4 h-4 text-primary-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Uploaded Documents</h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                                { key: 'docPAN', label: 'PAN Card', icon: '🪪' },
                                { key: 'docCheque', label: 'Cancelled Cheque', icon: '🏦' },
                                { key: 'docGST', label: 'GST Certificate', icon: '📄' },
                                { key: 'docAgreement', label: 'Agreement', icon: '📝' },
                            ].map(({ key, label, icon }) => vendor[key] && (
                                <a key={key} href={vendor[key].data} download={vendor[key].name}
                                    className="flex items-center gap-2 p-3 border border-gray-200 rounded-xl hover:border-primary-blue hover:bg-blue-50/50 transition-colors group">
                                    <span className="text-lg">{icon}</span>
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold text-gray-700 group-hover:text-primary-blue">{label}</p>
                                        <p className="text-xs text-gray-400 truncate">{vendor[key].name}</p>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ── PO History (Onboarded vendors) ─────────────────────────────────── */}
            {!isPortalVendor && (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card border border-gray-100/50 mb-6">
                    <div className="flex items-center justify-between p-5 pb-4 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-primary-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">PO History</h3>
                            {pos.length > 0 && (
                                <span className="px-2 py-0.5 bg-primary-blue text-white text-xs font-bold rounded-full">{pos.length}</span>
                            )}
                        </div>
                        <button onClick={() => setShowPO(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-xl text-sm font-semibold hover:bg-[#4338ca] transition-all">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Generate PO
                        </button>
                    </div>

                    {pos.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <p className="text-sm text-gray-400 font-medium">No POs yet</p>
                            <p className="text-xs text-gray-300 mt-1">Click "Generate PO" to create the first one</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50/80">
                                    <tr>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">PO No.</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Period</th>
                                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                                        <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {pos.map((po, i) => {
                                        const isPaid  = po.status === 'Paid';
                                        const dateStr = po.poDate
                                            ? new Date(po.poDate + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                                            : new Date(po.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                                        const period  = [po.startDate, po.endDate].filter(Boolean).join(' → ') || '—';

                                        return (
                                            <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-4 py-3">
                                                    <span className="font-bold text-primary-blue text-xs">{po.poNumber}</span>
                                                </td>
                                                <td className="px-4 py-3 text-gray-500 text-xs">{dateStr}</td>
                                                <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell">{period}</td>
                                                <td className="px-4 py-3 text-right font-bold text-gray-900 text-sm">{fmt(po.total)}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${poStatusColor(po.status)}`}>
                                                        {po.status || 'Generated'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button onClick={() => openPOPDFInTab(po, vendor)} title="View PDF"
                                                            className="p-1.5 text-gray-400 hover:text-primary-blue hover:bg-blue-50 rounded-lg transition-colors">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                        </button>
                                                        <button onClick={() => downloadPOPDF(po, vendor)} title="Download PDF"
                                                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                            </svg>
                                                        </button>
                                                        {isPaid ? (
                                                            <button onClick={() => markAsUnpaid(po)} title="Mark as Unpaid"
                                                                className="p-1.5 text-green-600 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors">
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                            </button>
                                                        ) : (
                                                            <button onClick={() => setPaymentConfirm(po)} title="Mark as Paid"
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
            )}

            {/* ── PI History (Portal registered vendors) ─────────────────────────── */}
            {isPortalVendor && (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card border border-gray-100/50 mb-6">
                    <div className="flex items-center justify-between p-5 pb-4 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-primary-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Purchase Invoices</h3>
                            {invoices.length > 0 && (
                                <span className="px-2 py-0.5 bg-primary-blue text-white text-xs font-bold rounded-full">{invoices.length}</span>
                            )}
                        </div>
                    </div>

                    {loadingInvoices ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="w-6 h-6 border-2 border-primary-blue border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : invoices.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <p className="text-sm text-gray-400 font-medium">No invoices submitted yet</p>
                            <p className="text-xs text-gray-300 mt-1">The vendor can raise PIs from their portal</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50/80">
                                    <tr>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Invoice #</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Date</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Due Date</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Description</th>
                                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                                        <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Update</th>
                                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">PDF</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {invoices.map(inv => (
                                        <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-4 py-3">
                                                <span className="font-bold text-primary-blue text-xs">{inv.invoice_number}</span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 text-xs hidden sm:table-cell">{fmtDate(inv.invoice_date)}</td>
                                            <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell">{fmtDate(inv.due_date)}</td>
                                            <td className="px-4 py-3 text-gray-600 text-xs max-w-xs truncate hidden lg:table-cell">{inv.description || '—'}</td>
                                            <td className="px-4 py-3 text-right font-bold text-gray-900">{fmtAmt(inv.total_amount)}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${piStatusColor(inv.status)}`}>
                                                    {inv.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <select
                                                    value={inv.status}
                                                    disabled={updatingId === inv.id}
                                                    onChange={e => handlePIStatusChange(inv.id, e.target.value)}
                                                    className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-primary-blue cursor-pointer disabled:opacity-50"
                                                >
                                                    <option value="Pending">Pending</option>
                                                    <option value="Approved">Approved</option>
                                                    <option value="Paid">Paid</option>
                                                    <option value="Rejected">Rejected</option>
                                                </select>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button onClick={() => openPIPDFInTab(inv, vendor)} title="View PI PDF"
                                                        className="p-1.5 text-gray-400 hover:text-primary-blue hover:bg-blue-50 rounded-lg transition-colors">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                    </button>
                                                    <button onClick={() => downloadPIPDF(inv, vendor)} title="Download PI PDF"
                                                        className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Modals — onboarded only */}
            {!isPortalVendor && (
                <>
                    <VendorOnboardingModal
                        isOpen={showEdit}
                        onClose={() => setShowEdit(false)}
                        editVendor={vendor}
                        onVendorAdded={() => { loadPOs(); setShowEdit(false); }}
                    />
                    <GeneratePOModal
                        isOpen={showPO}
                        onClose={() => setShowPO(false)}
                        vendor={vendor}
                        onPOSaved={loadPOs}
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
                                <p className="text-center text-sm text-gray-500 mb-1">PO <strong>{paymentConfirm.poNumber}</strong></p>
                                <p className="text-center text-xs text-gray-400 mb-6">Amount: <strong>{fmt(paymentConfirm.total)}</strong></p>
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
                                <h3 className="text-center text-lg font-bold text-gray-900 mb-2">Delete Vendor?</h3>
                                <p className="text-center text-sm text-gray-500 mb-6">
                                    This will permanently remove <strong>{vendor.vendorName}</strong> and all their data.
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
                </>
            )}
        </MainLayout>
    );
};

export default VendorDetailPage;
