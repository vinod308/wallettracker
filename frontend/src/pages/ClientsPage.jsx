import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import ClientOnboardingModal from '../components/clients/ClientOnboardingModal';
import api from '../services/api';

const CLIENT_TYPE_COLORS = {
    'Retainer':   'bg-indigo-50 text-indigo-700 border-indigo-100',
    'Contractor': 'bg-purple-50 text-purple-700 border-purple-100',
    'Project':    'bg-teal-50 text-teal-700 border-teal-100',
};

const STATUS_COLORS = {
    'Active':   'bg-green-50 text-green-700',
    'At Risk':  'bg-red-50 text-red-600',
    'Inactive': 'bg-gray-50 text-gray-500',
};

const fmt = (n) => `₹${Number((n || 0).toFixed(0)).toLocaleString('en-IN')}`;

const mapApiClient = (c) => ({
    id: c.id,
    clientName: c.client_name,
    projectName: c.project_name,
    clientType: c.client_type,
    industry: c.industry || '',
    status: c.status,
    totalMrr: parseFloat(c.total_mrr || 0),
    serviceCount: parseInt(c.service_count || 0),
    _source: 'api',
});

const ClientsPage = () => {
    const navigate = useNavigate();
    const [clients,        setClients]        = useState([]);
    const [loading,        setLoading]        = useState(true);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [searchQuery,    setSearchQuery]    = useState('');
    const [typeFilter,     setTypeFilter]     = useState('all');

    const loadClients = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/clients');
            const apiClients = (res.data?.data?.clients || []).map(mapApiClient);
            const apiNames = new Set(apiClients.map(c => c.clientName?.toLowerCase()));

            // Auto-migrate: push any localStorage-only clients to DB
            const local = JSON.parse(localStorage.getItem('gw_onboarded_clients') || '[]');
            const localOnly = local.filter(c => !apiNames.has((c.clientName || '').toLowerCase()));
            if (localOnly.length > 0) {
                localOnly.forEach(c => {
                    api.post('/clients/onboard', { clientName: c.clientName, clientType: c.clientType || 'Retainer' })
                        .catch(() => {});
                });
            }

            setClients([...apiClients, ...localOnly]);
        } catch {
            const raw = JSON.parse(localStorage.getItem('gw_onboarded_clients') || '[]');
            const migrated = raw.map((c, i) => c.id ? c : { ...c, id: `oc_legacy_${i}_${Date.now()}` });
            setClients(migrated);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadClients(); }, [loadClients]);

    const filtered = clients.filter(c => {
        const q = searchQuery.toLowerCase();
        const matchSearch = !q
            || c.clientName.toLowerCase().includes(q)
            || (c.contactPerson || '').toLowerCase().includes(q)
            || (c.clientType || '').toLowerCase().includes(q)
            || (c.state || '').toLowerCase().includes(q);
        const matchType = typeFilter === 'all' || c.clientType === typeFilter;
        return matchSearch && matchType;
    });

    const invoices = JSON.parse(localStorage.getItem('gw_invoices') || '[]');
    const totalInvoiced = invoices.reduce((s, inv) => s + (inv.total || 0), 0);
    const paidThisMonth = invoices.filter(inv => {
        if (inv.status !== 'Paid' || !inv.paidAt) return false;
        const d = new Date(inv.paidAt);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).reduce((s, inv) => s + (inv.total || 0), 0);

    const totalMrr = clients.filter(c => c._source === 'api').reduce((s, c) => s + (c.totalMrr || 0), 0);

    return (
        <MainLayout>
            <div>
                {/* Header */}
                <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Client Management</h1>
                        <p className="mt-1 text-sm text-gray-600">
                            Manage clients, invoices, and payment workflows
                        </p>
                    </div>
                    <button
                        onClick={() => setShowOnboarding(true)}
                        className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-primary-blue text-white rounded-xl text-sm font-semibold hover:bg-[#4338ca] hover:shadow-[0_4px_12px_rgba(79,70,229,0.3)] transition-all duration-200 shadow-sm"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Client Onboarding
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5 mb-6">
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card border border-gray-100/50 p-5">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Total Clients</p>
                        <h3 className="text-xl sm:text-2xl font-medium text-gray-900">{loading ? '—' : clients.length}</h3>
                        <p className="text-xs text-gray-500 mt-1">Onboarded</p>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card border border-gray-100/50 p-5">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Total MRR</p>
                        <h3 className="text-xl sm:text-2xl font-medium text-orange-600">{fmt(totalMrr || totalInvoiced)}</h3>
                        <p className="text-xs text-gray-500 mt-1">Monthly recurring</p>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card border border-gray-100/50 p-5">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Active Clients</p>
                        <h3 className="text-xl sm:text-2xl font-medium text-primary-blue">{clients.filter(c => c.status === 'Active').length}</h3>
                        <p className="text-xs text-gray-500 mt-1">Currently active</p>
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
                                placeholder="Search clients, type, state..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                            />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {['all', 'Retainer', 'Contractor', 'Project'].map(t => (
                                <button
                                    key={t}
                                    onClick={() => setTypeFilter(t)}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                                        typeFilter === t
                                            ? 'bg-primary-blue text-white shadow-sm'
                                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                    {t === 'all' ? 'All' : t}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Client List */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card border border-gray-100/50 overflow-hidden">
                    {loading ? (
                        <div className="text-center py-20">
                            <div className="w-8 h-8 border-2 border-primary-blue border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                            <p className="text-gray-500 text-sm">Loading clients...</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <p className="text-gray-500 font-medium">
                                {clients.length === 0 ? 'No clients onboarded yet' : 'No clients match your search'}
                            </p>
                            {clients.length === 0 && (
                                <button
                                    onClick={() => setShowOnboarding(true)}
                                    className="mt-4 px-5 py-2.5 bg-primary-blue text-white rounded-xl text-sm font-semibold hover:bg-[#4338ca] transition-colors"
                                >
                                    + Onboard First Client
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50/80">
                                    <tr>
                                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Industry</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Status</th>
                                        <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Services</th>
                                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">MRR</th>
                                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filtered.map(c => (
                                        <tr
                                            key={c.id}
                                            className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                                            onClick={() => navigate(`/clients/onboarded/${c.id}`)}
                                        >
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-primary-blue/10 flex items-center justify-center flex-shrink-0">
                                                        <span className="text-primary-blue font-bold text-sm">
                                                            {(c.clientName || '?').charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900 text-sm">{c.clientName}</p>
                                                        <p className="text-xs text-gray-400">{c.projectName || '—'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${CLIENT_TYPE_COLORS[c.clientType] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                                    {c.clientType || 'Retainer'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 hidden md:table-cell">
                                                <p className="text-xs text-gray-600">{c.industry || '—'}</p>
                                            </td>
                                            <td className="px-4 py-3 hidden lg:table-cell">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${STATUS_COLORS[c.status] || 'bg-gray-50 text-gray-500'}`}>
                                                    {c.status || '—'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`text-sm font-bold ${(c.serviceCount || 0) > 0 ? 'text-primary-blue' : 'text-gray-300'}`}>
                                                    {c.serviceCount || 0}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <span className={`text-sm font-bold ${(c.totalMrr || 0) > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                                                    {(c.totalMrr || 0) > 0 ? fmt(c.totalMrr) : '—'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    onClick={e => { e.stopPropagation(); navigate(`/clients/onboarded/${c.id}`); }}
                                                    className="px-3 py-1.5 text-xs font-medium text-primary-blue border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                                                >
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <ClientOnboardingModal
                isOpen={showOnboarding}
                onClose={() => setShowOnboarding(false)}
                onClientAdded={() => { loadClients(); setShowOnboarding(false); }}
            />
        </MainLayout>
    );
};

export default ClientsPage;
