import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import VendorOnboardingModal from '../components/vendors/VendorOnboardingModal';
import GeneratePOModal from '../components/vendors/GeneratePOModal';
import { downloadPOPDF, openPOPDFInTab } from '../utils/generatePOPDF';

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

const fmt = (n) => `Rs.${Number((n || 0).toFixed(0)).toLocaleString('en-IN')}`;

const VendorDetailPage = () => {
    const { vendorId } = useParams();
    const navigate     = useNavigate();

    const [vendor,          setVendor]          = useState(null);
    const [pos,             setPOs]             = useState([]);
    const [showEdit,        setShowEdit]        = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showPO,          setShowPO]          = useState(false);
    const [paymentConfirm,  setPaymentConfirm]  = useState(null);

    const loadVendor = useCallback(() => {
        const all = JSON.parse(localStorage.getItem('gw_vendors') || '[]');
        setVendor(all.find(v => v.id === vendorId) || null);
    }, [vendorId]);

    const loadPOs = useCallback(() => {
        const all = JSON.parse(localStorage.getItem('gw_purchase_orders') || '[]');
        setPOs(all.filter(p => p.vendorId === vendorId).reverse());
    }, [vendorId]);

    useEffect(() => { loadVendor(); loadPOs(); }, [loadVendor, loadPOs]);

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

    const onboardedDate = vendor.onboardedAt
        ? new Date(vendor.onboardedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : '—';

    const totalPaid    = pos.filter(p => p.status === 'Paid').reduce((s, p) => s + (p.total || 0), 0);
    const totalPending = pos.filter(p => p.status !== 'Paid').reduce((s, p) => s + (p.total || 0), 0);

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
                            {vendor.vendorName.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">{vendor.vendorName}</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                                {vendor.vendorType}
                            </span>
                            <span className="text-xs text-gray-400">Onboarded: {onboardedDate}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={() => setShowEdit(true)}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit Vendor
                    </button>
                    <button onClick={() => setShowDeleteConfirm(true)}
                        className="flex items-center gap-2 px-4 py-2 border border-red-200 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 hover:border-red-300 transition-all duration-200">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
                <div className="bg-white/80 rounded-2xl shadow-card border border-gray-100/50 p-3 sm:p-4 text-center">
                    <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">Total POs</p>
                    <p className="text-xl sm:text-2xl font-bold text-primary-blue">{pos.length}</p>
                </div>
                <div className="bg-white/80 rounded-2xl shadow-card border border-gray-100/50 p-3 sm:p-4 text-center">
                    <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">Total Paid</p>
                    <p className="text-sm sm:text-2xl font-bold text-green-600">{fmt(totalPaid)}</p>
                </div>
                <div className="bg-white/80 rounded-2xl shadow-card border border-gray-100/50 p-3 sm:p-4 text-center">
                    <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">Pending</p>
                    <p className="text-sm sm:text-2xl font-bold text-orange-600">{fmt(totalPending)}</p>
                </div>
            </div>

            {/* Detail Sections */}
            <div className="space-y-4 mb-6">
                <SectionCard title="Basic Information" cols={4} icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                }>
                    <InfoRow label="Vendor Name"  value={vendor.vendorName} />
                    <InfoRow label="Vendor Type"  value={vendor.vendorType} />
                    <InfoRow label="GST Number"   value={vendor.gstNumber} />
                    <InfoRow label="PAN Number"   value={vendor.panNumber} />
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

                {/* Documents */}
                {(vendor.docPAN || vendor.docCheque || vendor.docGST || vendor.docAgreement) && (
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card border border-gray-100/50 p-5">
                        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                            <svg className="w-4 h-4 text-primary-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Uploaded Documents</h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                                { key: 'docPAN',       label: 'PAN Card',           icon: '🪪' },
                                { key: 'docCheque',    label: 'Cancelled Cheque',   icon: '🏦' },
                                { key: 'docGST',       label: 'GST Certificate',    icon: '📄' },
                                { key: 'docAgreement', label: 'Agreement',          icon: '📝' },
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

            {/* PO History */}
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
                        className="flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-xl text-sm font-semibold hover:bg-[#4338ca] transition-all duration-200">
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
                                    const isPaid = po.status === 'Paid';
                                    const dateStr = po.poDate
                                        ? new Date(po.poDate + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                                        : new Date(po.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                                    const period = [po.startDate, po.endDate].filter(Boolean).join(' → ') || '—';

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

            {/* Modals */}
            <VendorOnboardingModal
                isOpen={showEdit}
                onClose={() => setShowEdit(false)}
                editVendor={vendor}
                onVendorAdded={() => { loadVendor(); setShowEdit(false); }}
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
                        <p className="text-center text-sm text-gray-500 mb-1">
                            PO <strong>{paymentConfirm.poNumber}</strong>
                        </p>
                        <p className="text-center text-xs text-gray-400 mb-6">
                            Amount: <strong>{fmt(paymentConfirm.total)}</strong>
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
                        <h3 className="text-center text-lg font-bold text-gray-900 mb-2">Delete Vendor?</h3>
                        <p className="text-center text-sm text-gray-500 mb-6">
                            This will permanently remove <strong>{vendor.vendorName}</strong> and all their data. This cannot be undone.
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

export default VendorDetailPage;
