import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import VendorOnboardingModal from '../components/vendors/VendorOnboardingModal';

const VENDOR_TYPE_COLORS = {
    'Freelancer':          'bg-purple-50 text-purple-700 border-purple-100',
    'Agency':              'bg-blue-50 text-blue-700 border-blue-100',
    'Consultant':          'bg-teal-50 text-teal-700 border-teal-100',
    'Production House':    'bg-orange-50 text-orange-700 border-orange-100',
    'Software Vendor':     'bg-indigo-50 text-indigo-700 border-indigo-100',
    'Influencer':          'bg-pink-50 text-pink-700 border-pink-100',
    'Employee Contractor': 'bg-amber-50 text-amber-700 border-amber-100',
};

const fmt = (n) => `₹${Number((n || 0).toFixed(0)).toLocaleString('en-IN')}`;

const VendorManagementPage = () => {
    const navigate = useNavigate();
    const [vendors,         setVendors]         = useState([]);
    const [showOnboarding,  setShowOnboarding]  = useState(false);
    const [searchQuery,     setSearchQuery]      = useState('');
    const [typeFilter,      setTypeFilter]       = useState('all');

    const loadVendors = () => {
        const raw = JSON.parse(localStorage.getItem('gw_vendors') || '[]');
        setVendors(raw);
    };

    useEffect(() => { loadVendors(); }, []);

    const filtered = vendors.filter(v => {
        const q = searchQuery.toLowerCase();
        const matchSearch = !q || v.vendorName.toLowerCase().includes(q)
            || (v.contactPerson || '').toLowerCase().includes(q)
            || (v.vendorType || '').toLowerCase().includes(q)
            || (v.city || '').toLowerCase().includes(q);
        const matchType = typeFilter === 'all' || v.vendorType === typeFilter;
        return matchSearch && matchType;
    });

    // Stats
    const pos = JSON.parse(localStorage.getItem('gw_purchase_orders') || '[]');
    const totalPayable = pos.filter(p => p.status !== 'Paid').reduce((s, p) => s + (p.total || 0), 0);
    const paidThisMonth = pos.filter(p => {
        if (p.status !== 'Paid' || !p.paidAt) return false;
        const d = new Date(p.paidAt);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).reduce((s, p) => s + (p.total || 0), 0);

    const vendorPOMap = {};
    pos.forEach(p => {
        if (!vendorPOMap[p.vendorId]) vendorPOMap[p.vendorId] = { count: 0, pending: 0 };
        vendorPOMap[p.vendorId].count++;
        if (p.status !== 'Paid') vendorPOMap[p.vendorId].pending += p.total || 0;
    });

    return (
        <MainLayout>
            <div>
                {/* Header */}
                <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Vendor Management</h1>
                        <p className="mt-1 text-sm text-gray-600">
                            Manage vendors, freelancers, agencies, and payment workflows
                        </p>
                    </div>
                    <button
                        onClick={() => setShowOnboarding(true)}
                        className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-primary-blue text-white rounded-xl text-sm font-semibold hover:bg-[#4338ca] hover:shadow-[0_4px_12px_rgba(79,70,229,0.3)] transition-all duration-200 shadow-sm"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Vendor Onboarding
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5 mb-6">
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card border border-gray-100/50 p-5">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Total Vendors</p>
                        <h3 className="text-xl sm:text-2xl font-medium text-gray-900">{vendors.length}</h3>
                        <p className="text-xs text-gray-500 mt-1">Onboarded</p>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card border border-gray-100/50 p-5">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Total Payable</p>
                        <h3 className="text-xl sm:text-2xl font-medium text-orange-600">{fmt(totalPayable)}</h3>
                        <p className="text-xs text-gray-500 mt-1">Pending POs</p>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card border border-gray-100/50 p-5">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Total POs</p>
                        <h3 className="text-xl sm:text-2xl font-medium text-primary-blue">{pos.length}</h3>
                        <p className="text-xs text-gray-500 mt-1">All time</p>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card border border-gray-100/50 p-5">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Paid This Month</p>
                        <h3 className="text-xl sm:text-2xl font-medium text-green-600">{fmt(paidThisMonth)}</h3>
                        <p className="text-xs text-gray-500 mt-1">Completed payments</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card border border-gray-100/50 p-4 mb-6">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex-1 min-w-[200px] relative">
                            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search vendors, type, city..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                            />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            <button
                                onClick={() => setTypeFilter('all')}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${typeFilter === 'all' ? 'bg-primary-blue text-white shadow-sm' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}
                            >
                                All
                            </button>
                            {['Freelancer', 'Agency', 'Consultant', 'Production House'].map(t => (
                                <button
                                    key={t}
                                    onClick={() => setTypeFilter(t)}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${typeFilter === t ? 'bg-primary-blue text-white shadow-sm' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Vendor List */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card border border-gray-100/50 overflow-hidden">
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
                                                            <span className="text-primary-blue font-bold text-sm">
                                                                {v.vendorName.charAt(0).toUpperCase()}
                                                            </span>
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
                                                    <span className={`text-sm font-bold ${poInfo.count > 0 ? 'text-primary-blue' : 'text-gray-300'}`}>
                                                        {poInfo.count}
                                                    </span>
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
