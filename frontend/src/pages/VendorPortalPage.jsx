import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import vendorService from '../services/vendorService';
import RaisePIModal from '../components/vendors/RaisePIModal';
import logo from '../assets/logo.png';

const STATUS_STYLES = {
    Pending:  'bg-yellow-50 text-yellow-700 border-yellow-200',
    Approved: 'bg-blue-50 text-blue-700 border-blue-200',
    Paid:     'bg-green-50 text-green-700 border-green-200',
    Rejected: 'bg-red-50 text-red-600 border-red-200',
};

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export default function VendorPortalPage() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [vendor, setVendor] = useState(null);
    const [invoices, setInvoices] = useState([]);
    const [tab, setTab] = useState('profile');
    const [showRaisePI, setShowRaisePI] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            const [v, inv] = await Promise.all([
                vendorService.getMyProfile(),
                vendorService.getMyInvoices(),
            ]);
            setVendor(v);
            setInvoices(inv);
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to load your profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const totalPending = invoices.filter(i => i.status === 'Pending').reduce((s, i) => s + parseFloat(i.total_amount || 0), 0);
    const totalPaid    = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + parseFloat(i.total_amount || 0), 0);

    return (
        <div className="min-h-screen bg-[#F7F8FC]">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src={logo} alt="Garage WalletTracker" className="h-8 w-auto object-contain" />
                        <div className="hidden sm:block w-px h-5 bg-gray-200" />
                        <span className="hidden sm:block text-sm font-semibold text-gray-500">Vendor Portal</span>
                    </div>
                    <div className="flex items-center gap-3">
                        {vendor && (
                            <div className="hidden sm:flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center">
                                    <span className="text-xs font-bold text-indigo-600">
                                        {vendor.vendor_name?.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <span className="text-sm font-medium text-gray-700">{vendor.vendor_name}</span>
                            </div>
                        )}
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 border-2 border-primary-blue border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : error ? (
                    <div className="bg-red-50 border border-red-100 text-red-600 px-5 py-4 rounded-xl text-sm">{error}</div>
                ) : (
                    <>
                        {/* Welcome banner */}
                        <div className="bg-gradient-to-r from-[#4f46e5] to-indigo-500 rounded-2xl p-5 sm:p-6 mb-6 text-white shadow-soft-lg">
                            <div className="flex items-start justify-between gap-4 flex-wrap">
                                <div>
                                    <p className="text-sm text-indigo-200">Welcome back</p>
                                    <h2 className="text-xl sm:text-2xl font-bold mt-0.5">{vendor?.vendor_name}</h2>
                                    <p className="text-xs text-indigo-200 mt-1">
                                        {vendor?.vendor_type}
                                        {vendor?.city ? ` · ${vendor.city}` : ''}
                                        {vendor?.state ? `, ${vendor.state}` : ''}
                                    </p>
                                </div>
                                <button
                                    onClick={() => { setTab('invoices'); setShowRaisePI(true); }}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-white text-[#4f46e5] rounded-xl text-sm font-bold hover:bg-indigo-50 transition-colors shadow-sm flex-shrink-0"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    Raise New PI
                                </button>
                            </div>

                            <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-indigo-400/30">
                                <div>
                                    <p className="text-xs text-indigo-200 mb-1">Total Invoices</p>
                                    <p className="text-2xl font-bold">{invoices.length}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-indigo-200 mb-1">Pending</p>
                                    <p className="text-xl font-bold">{fmt(totalPending)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-indigo-200 mb-1">Received</p>
                                    <p className="text-xl font-bold">{fmt(totalPaid)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-1 bg-white rounded-xl border border-gray-200 p-1 mb-6 w-fit shadow-sm">
                            {[
                                { key: 'profile',  label: 'My Profile' },
                                { key: 'invoices', label: `Invoices (${invoices.length})` },
                            ].map(t => (
                                <button key={t.key} onClick={() => setTab(t.key)}
                                    className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.key ? 'bg-[#4f46e5] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>
                                    {t.label}
                                </button>
                            ))}
                        </div>

                        {/* Profile Tab */}
                        {tab === 'profile' && vendor && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    {
                                        title: 'Business Information',
                                        icon: (
                                            <svg className="w-4 h-4 text-[#4f46e5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                        ),
                                        rows: [
                                            ['Vendor Name',  vendor.vendor_name],
                                            ['Type',         vendor.vendor_type],
                                            ['GST Number',   vendor.gst_number  || '—'],
                                            ['PAN Number',   vendor.pan_number  || '—'],
                                            ['Address',      [vendor.address, vendor.city, vendor.state, vendor.pincode, vendor.country].filter(Boolean).join(', ') || '—'],
                                        ],
                                    },
                                    {
                                        title: 'Contact Information',
                                        icon: (
                                            <svg className="w-4 h-4 text-[#4f46e5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                        ),
                                        rows: [
                                            ['Contact Person',    vendor.contact_person || '—'],
                                            ['Email',            vendor.email          || '—'],
                                            ['Mobile',           vendor.mobile         || '—'],
                                            ['Alternate Mobile', vendor.alt_mobile     || '—'],
                                            ['Website',          vendor.website        || '—'],
                                        ],
                                    },
                                    {
                                        title: 'Banking Details',
                                        icon: (
                                            <svg className="w-4 h-4 text-[#4f46e5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                            </svg>
                                        ),
                                        rows: [
                                            ['Account Holder', vendor.account_holder || '—'],
                                            ['Bank Name',      vendor.bank_name      || '—'],
                                            ['Account Number', vendor.account_number ? `••••${vendor.account_number.slice(-4)}` : '—'],
                                            ['IFSC Code',      vendor.ifsc_code      || '—'],
                                            ['UPI ID',         vendor.upi_id         || '—'],
                                        ],
                                    },
                                ].map(section => (
                                    <div key={section.title} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-card">
                                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-sm">
                                            <span className="w-7 h-7 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                                {section.icon}
                                            </span>
                                            {section.title}
                                        </h3>
                                        <div className="space-y-3">
                                            {section.rows.map(([label, value]) => (
                                                <div key={label} className="flex justify-between items-start gap-4">
                                                    <span className="text-xs text-gray-400 font-medium w-32 flex-shrink-0">{label}</span>
                                                    <span className="text-sm text-gray-800 font-medium text-right break-all">{value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Invoices Tab */}
                        {tab === 'invoices' && (
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold text-gray-900">My Purchase Invoices</h3>
                                    <button
                                        onClick={() => setShowRaisePI(true)}
                                        className="flex items-center gap-2 px-4 py-2.5 bg-[#4f46e5] text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                        Raise New PI
                                    </button>
                                </div>

                                {invoices.length === 0 ? (
                                    <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-card">
                                        <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <svg className="w-6 h-6 text-[#4f46e5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <p className="text-gray-700 font-semibold mb-1">No invoices yet</p>
                                        <p className="text-xs text-gray-400 mb-5">Raise your first purchase invoice to get started.</p>
                                        <button
                                            onClick={() => setShowRaisePI(true)}
                                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#4f46e5] text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                            Raise First PI
                                        </button>
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-card">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead className="bg-gray-50 border-b border-gray-100">
                                                    <tr>
                                                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Invoice #</th>
                                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Date</th>
                                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Description</th>
                                                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                                                        <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50">
                                                    {invoices.map(inv => (
                                                        <tr key={inv.id} className="hover:bg-gray-50/50">
                                                            <td className="px-5 py-3.5 font-semibold text-gray-900">{inv.invoice_number}</td>
                                                            <td className="px-4 py-3.5 text-gray-500 hidden sm:table-cell">{fmtDate(inv.invoice_date)}</td>
                                                            <td className="px-4 py-3.5 text-gray-600 max-w-xs truncate hidden md:table-cell">{inv.description || '—'}</td>
                                                            <td className="px-4 py-3.5 text-right font-bold text-gray-900">{fmt(inv.total_amount)}</td>
                                                            <td className="px-4 py-3.5 text-center">
                                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLES[inv.status] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                                                    {inv.status}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            <RaisePIModal isOpen={showRaisePI} onClose={() => setShowRaisePI(false)} onRaised={fetchData} />
        </div>
    );
}
