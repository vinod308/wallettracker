import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import VendorOnboardingModal from '../components/vendors/VendorOnboardingModal';
import vendorService from '../services/vendorService';

const VENDOR_TYPE_COLORS = {
    'Freelancer':          'bg-purple-50 text-purple-700 border-purple-100',
    'Agency':              'bg-blue-50 text-blue-700 border-blue-100',
    'Consultant':          'bg-teal-50 text-teal-700 border-teal-100',
    'Production House':    'bg-orange-50 text-orange-700 border-orange-100',
    'Software Vendor':     'bg-indigo-50 text-indigo-700 border-indigo-100',
    'Influencer':          'bg-pink-50 text-pink-700 border-pink-100',
    'Employee Contractor': 'bg-amber-50 text-amber-700 border-amber-100',
};

const STATUS_STYLES = {
    Pending:  'bg-yellow-50 text-yellow-700 border-yellow-200',
    Approved: 'bg-blue-50 text-blue-700 border-blue-200',
    Paid:     'bg-green-50 text-green-700 border-green-200',
    Rejected: 'bg-red-50 text-red-600 border-red-200',
};

const fmt     = (n) => `₹${Math.round(parseFloat(n) || 0).toLocaleString('en-IN')}`;
const fmtAmt  = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const VendorManagementPage = () => {
    const navigate = useNavigate();

    // Onboarded (localStorage) state
    const [vendors,        setVendors]        = useState([]);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [searchQuery,    setSearchQuery]    = useState('');
    const [typeFilter,     setTypeFilter]     = useState('all');

    // Tab
    const [activeTab, setActiveTab] = useState('registered');

    // Registered (DB) state
    const [regVendors,      setRegVendors]      = useState([]);
    const [regSearch,       setRegSearch]       = useState('');
    const [loadingReg,      setLoadingReg]      = useState(false);
    const [regError,        setRegError]        = useState('');
    const [expandedVendor,  setExpandedVendor]  = useState(null); // vendorId whose PIs are open
    const [piMap,           setPiMap]           = useState({});   // { vendorId: invoices[] }
    const [piLoading,       setPiLoading]       = useState({});   // { vendorId: bool }

    // ─── Onboarded tab ────────────────────────────────────────────────────────
    const loadVendors = () => {
        try {
            const raw = JSON.parse(localStorage.getItem('gw_vendors') || '[]') || [];
            setVendors(raw);
        } catch { setVendors([]); }
    };

    useEffect(() => { loadVendors(); }, []);

    let pos = [];
    try { pos = JSON.parse(localStorage.getItem('gw_purchase_orders') || '[]') || []; } catch {}
    const totalPayable = pos.filter(p => p.status !== 'Paid').reduce((s, p) => s + (p.total || 0), 0);
    const paidThisMonth = pos.filter(p => {
        if (p.status !== 'Paid' || !p.paidAt) return false;
        const d = new Date(p.paidAt), now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).reduce((s, p) => s + (p.total || 0), 0);

    const vendorPOMap = {};
    pos.forEach(p => {
        if (!vendorPOMap[p.vendorId]) vendorPOMap[p.vendorId] = { count: 0, pending: 0 };
        vendorPOMap[p.vendorId].count++;
        if (p.status !== 'Paid') vendorPOMap[p.vendorId].pending += p.total || 0;
    });

    const filtered = vendors.filter(v => {
        const q = searchQuery.toLowerCase();
        const matchSearch = !q
            || (v.vendorName  || '').toLowerCase().includes(q)
            || (v.contactPerson || '').toLowerCase().includes(q)
            || (v.vendorType  || '').toLowerCase().includes(q)
            || (v.city        || '').toLowerCase().includes(q);
        return matchSearch && (typeFilter === 'all' || v.vendorType === typeFilter);
    });

    // ─── Registered tab ───────────────────────────────────────────────────────
    const loadRegisteredVendors = useCallback(async () => {
        setLoadingReg(true);
        setRegError('');
        try {
            const data = await vendorService.getAllVendors();
            setRegVendors(data || []);
        } catch (err) {
            setRegError(err?.response?.data?.message || 'Failed to load registered vendors.');
            setRegVendors([]);
        } finally {
            setLoadingReg(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'registered') loadRegisteredVendors();
    }, [activeTab, loadRegisteredVendors]);

    const toggleVendorPIs = async (vendorId) => {
        // Collapse if already open
        if (expandedVendor === vendorId) {
            setExpandedVendor(null);
            return;
        }
        setExpandedVendor(vendorId);
        // Load if not already cached
        if (piMap[vendorId]) return;
        setPiLoading(p => ({ ...p, [vendorId]: true }));
        try {
            const data = await vendorService.getVendorInvoices(vendorId);
            setPiMap(p => ({ ...p, [vendorId]: data || [] }));
        } catch {
            setPiMap(p => ({ ...p, [vendorId]: [] }));
        } finally {
            setPiLoading(p => ({ ...p, [vendorId]: false }));
        }
    };

    const handleStatusChange = async (vendorId, invoiceId, newStatus) => {
        try {
            await vendorService.updateInvoiceStatus(invoiceId, newStatus);
            // Refresh this vendor's PIs
            const data = await vendorService.getVendorInvoices(vendorId);
            setPiMap(p => ({ ...p, [vendorId]: data || [] }));
            // Refresh vendor list so pending_amount updates
            loadRegisteredVendors();
        } catch { /* ignore */ }
    };

    const filteredReg = regVendors.filter(v => {
        const q = regSearch.toLowerCase();
        return !q
            || (v.vendor_name || '').toLowerCase().includes(q)
            || (v.email       || '').toLowerCase().includes(q)
            || (v.city        || '').toLowerCase().includes(q)
            || (v.vendor_type || '').toLowerCase().includes(q);
    });

    return (
        <MainLayout>
            <div>
                {/* Page header */}
                <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Vendor Management</h1>
                        <p className="mt-1 text-sm text-gray-600">Manage vendors, freelancers, agencies, and payment workflows</p>
                    </div>
                    <button
                        onClick={() => setShowOnboarding(true)}
                        className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-primary-blue text-white rounded-xl text-sm font-semibold hover:bg-[#4338ca] transition-all shadow-sm"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Vendor Onboarding
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-white rounded-xl border border-gray-200 p-1 mb-6 w-fit shadow-sm">
                    <button
                        onClick={() => setActiveTab('onboarded')}
                        className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'onboarded' ? 'bg-primary-blue text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        Onboarded ({vendors.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('registered')}
                        className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'registered' ? 'bg-primary-blue text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        Portal Registered ({regVendors.length})
                    </button>
                </div>

                {/* ── ONBOARDED TAB ── */}
                {activeTab === 'onboarded' && (
                    <>
                        {/* Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5 mb-6">
                            {[
                                { label: 'Total Vendors',    value: vendors.length,         sub: 'Onboarded',           color: 'text-gray-900' },
                                { label: 'Total Payable',    value: fmt(totalPayable),       sub: 'Pending POs',         color: 'text-orange-600' },
                                { label: 'Total POs',        value: pos.length,              sub: 'All time',            color: 'text-primary-blue' },
                                { label: 'Paid This Month',  value: fmt(paidThisMonth),      sub: 'Completed payments',  color: 'text-green-600' },
                            ].map(s => (
                                <div key={s.label} className="bg-white rounded-2xl shadow-card border border-gray-100/50 p-5">
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{s.label}</p>
                                    <h3 className={`text-xl sm:text-2xl font-medium ${s.color}`}>{s.value}</h3>
                                    <p className="text-xs text-gray-500 mt-1">{s.sub}</p>
                                </div>
                            ))}
                        </div>

                        {/* Filters */}
                        <div className="bg-white rounded-2xl shadow-card border border-gray-100/50 p-4 mb-6">
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="flex-1 min-w-[200px] relative">
                                    <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <input type="text" placeholder="Search vendors, type, city..."
                                        value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent" />
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                    {['all', 'Freelancer', 'Agency', 'Consultant', 'Production House'].map(t => (
                                        <button key={t} onClick={() => setTypeFilter(t)}
                                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${typeFilter === t ? 'bg-primary-blue text-white shadow-sm' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}>
                                            {t === 'all' ? 'All' : t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Vendor table */}
                        <div className="bg-white rounded-2xl shadow-card border border-gray-100/50 overflow-hidden">
                            {filtered.length === 0 ? (
                                <div className="text-center py-20">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                    </div>
                                    <p className="text-gray-500 font-medium">
                                        {vendors.length === 0 ? 'No vendors onboarded yet' : 'No vendors match your search'}
                                    </p>
                                    {vendors.length === 0 && (
                                        <button onClick={() => setShowOnboarding(true)}
                                            className="mt-4 px-5 py-2.5 bg-primary-blue text-white rounded-xl text-sm font-semibold hover:bg-[#4338ca] transition-colors">
                                            + Onboard First Vendor
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50/80">
                                            <tr>
                                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Vendor</th>
                                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">GST / PAN</th>
                                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Contact</th>
                                                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">POs</th>
                                                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending</th>
                                                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {filtered.map(v => {
                                                const poInfo = vendorPOMap[v.id] || { count: 0, pending: 0 };
                                                return (
                                                    <tr key={v.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                                                        onClick={() => navigate(`/vendors/${v.id}`)}>
                                                        <td className="px-5 py-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-9 h-9 rounded-xl bg-primary-blue/10 flex items-center justify-center flex-shrink-0">
                                                                    <span className="text-primary-blue font-bold text-sm">{(v.vendorName || '?').charAt(0).toUpperCase()}</span>
                                                                </div>
                                                                <div>
                                                                    <p className="font-semibold text-gray-900 text-sm">{v.vendorName}</p>
                                                                    <p className="text-xs text-gray-400">{v.city}{v.state ? `, ${v.state}` : ''}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${VENDOR_TYPE_COLORS[v.vendorType] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                                                {v.vendorType}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 hidden md:table-cell">
                                                            <p className="text-xs text-gray-600 font-mono">{v.gstNumber || '—'}</p>
                                                            <p className="text-xs text-gray-400 font-mono">{v.panNumber}</p>
                                                        </td>
                                                        <td className="px-4 py-3 hidden lg:table-cell">
                                                            <p className="text-xs text-gray-700 font-medium">{v.contactPerson}</p>
                                                            <p className="text-xs text-gray-400">{v.mobile}</p>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className={`text-sm font-bold ${poInfo.count > 0 ? 'text-primary-blue' : 'text-gray-300'}`}>{poInfo.count}</span>
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <span className={`text-sm font-bold ${poInfo.pending > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                                                                {poInfo.pending > 0 ? fmt(poInfo.pending) : '—'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <button
                                                                onClick={e => { e.stopPropagation(); navigate(`/vendors/${v.id}`); }}
                                                                className="px-3 py-1.5 text-xs font-medium text-primary-blue border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
                                                                View
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* ── PORTAL REGISTERED TAB ── */}
                {activeTab === 'registered' && (
                    <div>
                        {/* Search bar */}
                        <div className="bg-white rounded-2xl shadow-card border border-gray-100/50 p-4 mb-5">
                            <div className="relative max-w-sm">
                                <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input type="text" placeholder="Search by name, email, city..."
                                    value={regSearch} onChange={e => setRegSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent" />
                            </div>
                        </div>

                        {/* Error state */}
                        {regError && (
                            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm mb-4 flex items-center gap-2">
                                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {regError}
                                <button onClick={loadRegisteredVendors} className="ml-auto text-xs underline">Retry</button>
                            </div>
                        )}

                        {loadingReg ? (
                            <div className="flex items-center justify-center py-16">
                                <div className="w-8 h-8 border-2 border-primary-blue border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : filteredReg.length === 0 ? (
                            <div className="bg-white rounded-2xl shadow-card border border-gray-100/50 p-16 text-center">
                                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                                <p className="text-gray-500 font-medium">
                                    {regVendors.length === 0 ? 'No vendors have registered through the portal yet.' : 'No vendors match your search.'}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredReg.map(v => {
                                    const isExpanded  = expandedVendor === v.id;
                                    const invoices    = piMap[v.id] || [];
                                    const isLoadingPI = piLoading[v.id];

                                    return (
                                        <div key={v.id} className="bg-white rounded-2xl shadow-card border border-gray-100/50 overflow-hidden">
                                            {/* Vendor header row */}
                                            <div className="p-5">
                                                <div className="flex items-start justify-between gap-4 flex-wrap">
                                                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/vendors/${v.id}`)}>
                                                        <div className="w-10 h-10 rounded-xl bg-primary-blue/10 flex items-center justify-center flex-shrink-0">
                                                            <span className="text-primary-blue font-bold text-sm">
                                                                {(v.vendor_name || '?').charAt(0).toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-900 hover:text-primary-blue transition-colors">{v.vendor_name}</p>
                                                            <p className="text-xs text-gray-400">{v.vendor_type}{v.city ? ` · ${v.city}` : ''}{v.state ? `, ${v.state}` : ''}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full font-medium">
                                                            Portal Registered
                                                        </span>
                                                        {v.pending_amount > 0 && (
                                                            <span className="text-xs bg-orange-50 text-orange-700 border border-orange-200 px-2.5 py-1 rounded-full font-medium">
                                                                Pending {fmt(v.pending_amount)}
                                                            </span>
                                                        )}
                                                        <button
                                                            onClick={() => toggleVendorPIs(v.id)}
                                                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${isExpanded ? 'bg-primary-blue text-white border-primary-blue' : 'text-primary-blue border-blue-200 hover:bg-blue-50'}`}
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                            </svg>
                                                            {isExpanded ? 'Hide PIs' : `View PIs (${v.invoice_count || 0})`}
                                                        </button>
                                                        <button
                                                            onClick={() => navigate(`/vendors/${v.id}`)}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                            Full Details
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Info row */}
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-50 text-xs">
                                                    <div>
                                                        <p className="text-gray-400 mb-0.5">Email</p>
                                                        <p className="font-medium text-gray-700 truncate">{v.email || '—'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-400 mb-0.5">Mobile</p>
                                                        <p className="font-medium text-gray-700">{v.mobile || '—'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-400 mb-0.5">PAN</p>
                                                        <p className="font-mono font-medium text-gray-700">{v.pan_number || '—'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-400 mb-0.5">Total PIs</p>
                                                        <p className="font-bold text-primary-blue">{v.invoice_count || 0}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Purchase Invoices panel */}
                                            {isExpanded && (
                                                <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-4">
                                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Purchase Invoices</p>

                                                    {isLoadingPI ? (
                                                        <div className="flex items-center justify-center py-6">
                                                            <div className="w-6 h-6 border-2 border-primary-blue border-t-transparent rounded-full animate-spin" />
                                                        </div>
                                                    ) : invoices.length === 0 ? (
                                                        <p className="text-sm text-gray-400 py-2">No invoices submitted yet.</p>
                                                    ) : (
                                                        <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white">
                                                            <table className="w-full text-sm">
                                                                <thead className="bg-gray-50 border-b border-gray-100">
                                                                    <tr>
                                                                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Invoice #</th>
                                                                        <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Date</th>
                                                                        <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Description</th>
                                                                        <th className="text-right px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                                                                        <th className="text-center px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                                                        <th className="text-center px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Update</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-gray-50">
                                                                    {invoices.map(inv => (
                                                                        <tr key={inv.id} className="hover:bg-gray-50/50">
                                                                            <td className="px-4 py-3 font-semibold text-gray-900">{inv.invoice_number}</td>
                                                                            <td className="px-3 py-3 text-gray-500 hidden sm:table-cell">{fmtDate(inv.invoice_date)}</td>
                                                                            <td className="px-3 py-3 text-gray-600 max-w-xs truncate hidden md:table-cell">{inv.description || '—'}</td>
                                                                            <td className="px-3 py-3 text-right font-bold text-gray-900">{fmtAmt(inv.total_amount)}</td>
                                                                            <td className="px-3 py-3 text-center">
                                                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLES[inv.status] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                                                                    {inv.status}
                                                                                </span>
                                                                            </td>
                                                                            <td className="px-3 py-3 text-center">
                                                                                <select
                                                                                    value={inv.status}
                                                                                    onChange={e => handleStatusChange(v.id, inv.id, e.target.value)}
                                                                                    className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-primary-blue cursor-pointer"
                                                                                >
                                                                                    <option value="Pending">Pending</option>
                                                                                    <option value="Approved">Approved</option>
                                                                                    <option value="Paid">Paid</option>
                                                                                    <option value="Rejected">Rejected</option>
                                                                                </select>
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <VendorOnboardingModal
                isOpen={showOnboarding}
                onClose={() => setShowOnboarding(false)}
                onVendorAdded={() => { loadVendors(); setShowOnboarding(false); }}
            />
        </MainLayout>
    );
};

export default VendorManagementPage;
