import React, { useState, useMemo, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { formatCurrency } from '../../utils/helpers';

const MONTH_OPTIONS = [
    { label: 'January',   key: 'january',   order: -3 },
    { label: 'February',  key: 'february',  order: -2 },
    { label: 'March',     key: 'march',     order: -1 },
    { label: 'April',     key: 'april',     order: 0  },
    { label: 'May',       key: 'may',       order: 1  },
    { label: 'June',      key: 'june',      order: 2  },
    { label: 'July',      key: 'july',      order: 3  },
    { label: 'August',    key: 'august',    order: 4  },
    { label: 'September', key: 'september', order: 5  },
    { label: 'October',   key: 'october',   order: 6  },
    { label: 'November',  key: 'november',  order: 7  },
    { label: 'December',  key: 'december',  order: 8  },
];

// Convert date strings like "01-Apr-2025" or "2025-04-01" → YYYY-MM-DD for <input type="date">
const toInputDate = (dateStr) => {
    if (!dateStr) return '';
    const monthAbbr = { jan:'01', feb:'02', mar:'03', apr:'04', may:'05', jun:'06',
                        jul:'07', aug:'08', sep:'09', oct:'10', nov:'11', dec:'12' };
    const parts = dateStr.split('-');
    if (parts.length === 3 && isNaN(Number(parts[1]))) {
        const m = monthAbbr[parts[1].toLowerCase().slice(0, 3)];
        if (m) return `${parts[2]}-${m}-${parts[0].padStart(2, '0')}`;
    }
    try {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
    } catch (_) {}
    return '';
};

const EMPTY_FORM = {
    month: 'july',
    clientType: 'Retainer',
    services: '',
    addons: '',
    serviceMRR: '',
    addonsMRR: '',
    billingCycle: 'Monthly',
    paymentStatus: 'Unpaid',
    invoiceNumber: '',
    contractStart: '',
};

const EditClientModal = ({ isOpen, onClose, client, onClientUpdated }) => {
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [errors, setErrors]     = useState({});
    const [loading, setLoading]   = useState(false);
    const [submitError, setSubmitError] = useState('');

    // Pre-fill from the client's latest month whenever the modal opens
    useEffect(() => {
        if (!client || !isOpen) return;

        const sortedMonths = Object.values(client.months).sort((a, b) => b.monthOrder - a.monthOrder);
        const latestMonth  = sortedMonths[0];
        const latestRecord = latestMonth?.records?.[0] || {};

        setFormData({
            month:         latestMonth?.monthKey || 'july',
            clientType:    client.clientType || 'Retainer',
            services:      latestRecord.services   || '',
            addons:        latestRecord.addons     || '',
            serviceMRR:    latestMonth ? String(Math.round(latestMonth.serviceMRR)) : '',
            addonsMRR:     latestMonth ? String(Math.round(latestMonth.addonsMRR))  : '',
            billingCycle:  latestRecord.billingCycle  || 'Monthly',
            paymentStatus: latestRecord.paymentStatus || 'Unpaid',
            invoiceNumber: latestRecord.invoiceNumber || client.invoiceNumber || '',
            contractStart: toInputDate(latestRecord.contractStart),
        });
        setErrors({});
        setSubmitError('');
    }, [client, isOpen]);

    const computedTotalMRR = useMemo(() => {
        return (parseFloat(formData.serviceMRR) || 0) + (parseFloat(formData.addonsMRR) || 0);
    }, [formData.serviceMRR, formData.addonsMRR]);

    const selectedMonthMeta = useMemo(() => {
        return MONTH_OPTIONS.find(m => m.key === formData.month) || MONTH_OPTIONS[6];
    }, [formData.month]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
        if (submitError) setSubmitError('');
    };

    const validate = () => {
        const errs = {};
        if (!formData.month)           errs.month = 'Month is required';
        if (!formData.clientType)      errs.clientType = 'Client type is required';
        if (!formData.services.trim()) errs.services = 'Services / Plan is required';
        if (!formData.contractStart)   errs.contractStart = 'Start date is required';
        if (!formData.billingCycle)    errs.billingCycle = 'Billing cycle is required';

        const svc = formData.serviceMRR;
        if (svc === '' || svc === undefined) {
            errs.serviceMRR = 'Service MRR is required';
        } else if (isNaN(svc)) {
            errs.serviceMRR = 'Must be a number';
        } else if (parseFloat(svc) < 0) {
            errs.serviceMRR = 'Cannot be negative';
        }

        const addon = formData.addonsMRR;
        if (addon !== '' && isNaN(addon))          errs.addonsMRR = 'Must be a number';
        if (addon !== '' && parseFloat(addon) < 0) errs.addonsMRR = 'Cannot be negative';

        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            setLoading(true);
            const serviceMRR = parseFloat(formData.serviceMRR) || 0;
            const addonsMRR  = parseFloat(formData.addonsMRR)  || 0;

            const updatedRecord = {
                month:         `${selectedMonthMeta.label} 2025`,
                monthKey:      selectedMonthMeta.key,
                monthOrder:    selectedMonthMeta.order,
                contractStart: formData.contractStart,
                invoiceNumber: formData.invoiceNumber.trim(),
                clientName:    client.clientName,
                services:      formData.services.trim(),
                addons:        formData.addons.trim(),
                clientType:    formData.clientType,
                invoiceDate:   new Date().toLocaleDateString('en-IN'),
                serviceMRR,
                addonsMRR,
                totalMRR:      serviceMRR + addonsMRR,
                paymentStatus: formData.paymentStatus,
                clientStatus:  'Active',
                billingCycle:  formData.billingCycle,
                _manual:       true,
            };

            onClientUpdated?.(updatedRecord);
            onClose();
        } catch (_) {
            setSubmitError('Failed to save changes. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!client) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Client" size="lg">
            {/* Client name — read-only */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 mb-5">
                <p className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider mb-0.5">Editing</p>
                <p className="text-sm font-semibold text-indigo-900">{client.clientName}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {submitError && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                        <p className="text-sm text-red-800">{submitError}</p>
                    </div>
                )}

                {/* Row 1: Month + Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Month <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="month"
                            value={formData.month}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-blue ${errors.month ? 'border-red-400' : 'border-gray-200'}`}
                        >
                            {MONTH_OPTIONS.map(m => (
                                <option key={m.key} value={m.key}>{m.label}</option>
                            ))}
                        </select>
                        {errors.month && <p className="text-xs text-red-600 mt-1">{errors.month}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Type <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="clientType"
                            value={formData.clientType}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-blue ${errors.clientType ? 'border-red-400' : 'border-gray-200'}`}
                        >
                            <option value="Retainer">Retainer</option>
                            <option value="Contractor">Contractor</option>
                        </select>
                        {errors.clientType && <p className="text-xs text-red-600 mt-1">{errors.clientType}</p>}
                    </div>
                </div>

                {/* Row 2: Services + Addons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Services / Plan <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="services"
                            value={formData.services}
                            onChange={handleChange}
                            placeholder="e.g., Digital Marketing, SEO"
                            className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue ${errors.services ? 'border-red-400 bg-red-50/50' : 'border-gray-200'}`}
                        />
                        {errors.services && <p className="text-xs text-red-600 mt-1">{errors.services}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Addons</label>
                        <input
                            type="text"
                            name="addons"
                            value={formData.addons}
                            onChange={handleChange}
                            placeholder="e.g., Content Marketing, Paid Ads"
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
                        />
                    </div>
                </div>

                {/* Row 3: MRR fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Service MRR (₹) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            name="serviceMRR"
                            value={formData.serviceMRR}
                            onChange={handleChange}
                            placeholder="0"
                            min="0"
                            step="0.01"
                            className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue ${errors.serviceMRR ? 'border-red-400 bg-red-50/50' : 'border-gray-200'}`}
                        />
                        {errors.serviceMRR && <p className="text-xs text-red-600 mt-1">{errors.serviceMRR}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Addons MRR (₹)</label>
                        <input
                            type="number"
                            name="addonsMRR"
                            value={formData.addonsMRR}
                            onChange={handleChange}
                            placeholder="0"
                            min="0"
                            step="0.01"
                            className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue ${errors.addonsMRR ? 'border-red-400' : 'border-gray-200'}`}
                        />
                        {errors.addonsMRR && <p className="text-xs text-red-600 mt-1">{errors.addonsMRR}</p>}
                    </div>
                </div>

                {/* Total MRR */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/60 rounded-xl p-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">Total MRR (auto-calculated)</span>
                        <span className="text-lg font-bold text-green-700">{formatCurrency(computedTotalMRR)}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">Service MRR + Addons MRR</p>
                </div>

                {/* Row 4: Contract Start + Billing Cycle */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Contract Start Date <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            name="contractStart"
                            value={formData.contractStart}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue ${errors.contractStart ? 'border-red-400 bg-red-50/50' : 'border-gray-200'}`}
                        />
                        {errors.contractStart && <p className="text-xs text-red-600 mt-1">{errors.contractStart}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Billing Cycle <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="billingCycle"
                            value={formData.billingCycle}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-blue ${errors.billingCycle ? 'border-red-400' : 'border-gray-200'}`}
                        >
                            <option value="Monthly">Monthly</option>
                            <option value="Yearly">Yearly</option>
                        </select>
                        {errors.billingCycle && <p className="text-xs text-red-600 mt-1">{errors.billingCycle}</p>}
                    </div>
                </div>

                {/* Row 5: Invoice + Payment Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Invoice Number</label>
                        <input
                            type="text"
                            name="invoiceNumber"
                            value={formData.invoiceNumber}
                            onChange={handleChange}
                            placeholder="e.g., INV-2025-001"
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Status</label>
                        <select
                            name="paymentStatus"
                            value={formData.paymentStatus}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-blue"
                        >
                            <option value="Unpaid">Unpaid</option>
                            <option value="Paid">Paid</option>
                            <option value="Pending">Pending</option>
                        </select>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
                    <Button type="submit" loading={loading}>Save Changes</Button>
                </div>
            </form>
        </Modal>
    );
};

export default EditClientModal;
