/**
 * Add Client Modal Component
 * CSV-driven client creation with instant UI refresh
 * Form fields match exact column structure of CSV invoice data
 * Each entry is tied to a specific month via Month selector
 */

import React, { useState, useMemo } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { formatCurrency } from '../../utils/helpers';
import { normalizeClientName } from '../../utils/csvParser';

// All 12 months with keys matching CSV monthKey convention and sort order
const MONTH_OPTIONS = [
    { label: 'January', key: 'january', order: -3 },
    { label: 'February', key: 'february', order: -2 },
    { label: 'March', key: 'march', order: -1 },
    { label: 'April', key: 'april', order: 0 },
    { label: 'May', key: 'may', order: 1 },
    { label: 'June', key: 'june', order: 2 },
    { label: 'July', key: 'july', order: 3 },
    { label: 'August', key: 'august', order: 4 },
    { label: 'September', key: 'september', order: 5 },
    { label: 'October', key: 'october', order: 6 },
    { label: 'November', key: 'november', order: 7 },
    { label: 'December', key: 'december', order: 8 },
];

const getCurrentMonthKey = () => {
    const keys = ['january', 'february', 'march', 'april', 'may', 'june',
                  'july', 'august', 'september', 'october', 'november', 'december'];
    return keys[new Date().getMonth()];
};

const INITIAL_FORM = {
    clientName: '',
    month: getCurrentMonthKey(),
    services: '',
    addons: '',
    clientType: 'Retainer',
    contractStart: '',
    serviceMRR: '',
    addonsMRR: '',
    billingCycle: 'Monthly',
    paymentStatus: 'Unpaid',
    invoiceNumber: '',
};

const AddClientModal = ({ isOpen, onClose, onClientAdded, existingClients = [] }) => {
    const [formData, setFormData] = useState({ ...INITIAL_FORM });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [submitError, setSubmitError] = useState('');

    // Live-computed Total MRR
    const computedTotalMRR = useMemo(() => {
        const svc = parseFloat(formData.serviceMRR) || 0;
        const addon = parseFloat(formData.addonsMRR) || 0;
        return svc + addon;
    }, [formData.serviceMRR, formData.addonsMRR]);

    // Selected month metadata
    const selectedMonth = useMemo(() => {
        return MONTH_OPTIONS.find(m => m.key === formData.month) || null;
    }, [formData.month]);

    // Check for duplicate: same client + same services + same month
    const duplicateInfo = useMemo(() => {
        if (!formData.clientName || formData.clientName.trim().length < 2 || !formData.month) return null;
        const normInput = normalizeClientName(formData.clientName);
        const client = existingClients.find(c => c.id === normInput);
        if (!client) return null;

        // Check if this client has data for the selected month
        const monthData = client.months?.[formData.month];
        if (!monthData) return null;

        // Check if services text matches any record in that month
        if (formData.services.trim()) {
            const svcInput = formData.services.toLowerCase().trim();
            const matchingRecord = monthData.records?.find(r =>
                (r.services || '').toLowerCase().trim() === svcInput
            );
            if (matchingRecord) {
                return {
                    type: 'exact',
                    clientName: client.clientName,
                    services: formData.services.trim(),
                    monthLabel: selectedMonth?.label || formData.month,
                };
            }
        }

        // Client exists for this month but with different services
        return {
            type: 'client_month',
            clientName: client.clientName,
            monthLabel: selectedMonth?.label || formData.month,
        };
    }, [formData.clientName, formData.month, formData.services, existingClients, selectedMonth]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
        }
        if (submitError) setSubmitError('');
    };

    const validateForm = () => {
        const newErrors = {};

        // Client Name - required, min 2 chars
        if (!formData.clientName.trim()) {
            newErrors.clientName = 'Client name is required';
        } else if (formData.clientName.trim().length < 2) {
            newErrors.clientName = 'Client name must be at least 2 characters';
        }

        // Month - required
        if (!formData.month) {
            newErrors.month = 'Month is required';
        }

        // Services / Plan - required
        if (!formData.services.trim()) {
            newErrors.services = 'Services/Plan is required';
        }

        // Duplicate check: same service + same month for same client
        if (!newErrors.services && !newErrors.month && duplicateInfo?.type === 'exact') {
            newErrors.services = 'This service already exists for selected month.';
        }

        // Client Type - required
        if (!formData.clientType) {
            newErrors.clientType = 'Please select client type';
        }

        // Contract Start Date - required
        if (!formData.contractStart) {
            newErrors.contractStart = 'Start date is required';
        }

        // Service MRR - required, numeric, >= 0
        if (!formData.serviceMRR && formData.serviceMRR !== 0) {
            newErrors.serviceMRR = 'Service MRR is required';
        } else if (isNaN(formData.serviceMRR)) {
            newErrors.serviceMRR = 'Service MRR must be a number';
        } else if (parseFloat(formData.serviceMRR) < 0) {
            newErrors.serviceMRR = 'Service MRR cannot be negative';
        }

        // Addons MRR - optional, but if provided must be numeric >= 0
        if (formData.addonsMRR !== '' && formData.addonsMRR !== undefined) {
            if (isNaN(formData.addonsMRR)) {
                newErrors.addonsMRR = 'Addons MRR must be a number';
            } else if (parseFloat(formData.addonsMRR) < 0) {
                newErrors.addonsMRR = 'Addons MRR cannot be negative';
            }
        }

        // Billing Cycle - required
        if (!formData.billingCycle) {
            newErrors.billingCycle = 'Billing cycle is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            setLoading(true);

            const serviceMRR = parseFloat(formData.serviceMRR) || 0;
            const addonsMRR = parseFloat(formData.addonsMRR) || 0;
            const monthMeta = selectedMonth || MONTH_OPTIONS[6];

            // Build record matching CSV parser output structure
            const newRecord = {
                month: `${monthMeta.label} 2025`,
                monthKey: monthMeta.key,
                monthOrder: monthMeta.order,
                contractStart: formData.contractStart,
                invoiceNumber: formData.invoiceNumber.trim() || '',
                clientName: formData.clientName.trim(),
                services: formData.services.trim(),
                addons: formData.addons.trim(),
                clientType: formData.clientType,
                invoiceDate: new Date().toLocaleDateString('en-IN'),
                serviceMRR,
                addonsMRR,
                totalMRR: serviceMRR + addonsMRR,
                paymentStatus: formData.paymentStatus,
                clientStatus: 'Active',
                billingCycle: formData.billingCycle,
                _manual: true,
            };

            // Also attempt to save to backend DB (non-blocking)
            try {
                const api = (await import('../../services/api')).default;
                await api.post('/clients', {
                    projectName: formData.clientName.trim(),
                    clientName: formData.clientName.trim(),
                    clientType: formData.clientType,
                    industry: '',
                    mrr: serviceMRR + addonsMRR,
                    contractStartDate: formData.contractStart,
                    contractEndDate: formData.contractStart,
                    services: [],
                    month: monthMeta.key,
                });
            } catch (apiErr) {
                console.warn('Backend save skipped:', apiErr.message);
            }

            // Inject record into useCSVData for instant UI update
            if (onClientAdded) {
                onClientAdded(newRecord);
            }

            handleClose();
        } catch (err) {
            console.error('Error adding client:', err);
            setSubmitError('Failed to add client. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({ ...INITIAL_FORM });
        setErrors({});
        setSubmitError('');
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Add New Client" size="lg">
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Submit Error */}
                {submitError && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                        <p className="text-sm text-red-800">{submitError}</p>
                    </div>
                )}

                {/* Editing Indicator */}
                {duplicateInfo?.type === 'client_month' && (
                    <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-3">
                        <p className="text-sm font-medium text-amber-800">
                            Editing: {duplicateInfo.clientName} &mdash; {duplicateInfo.monthLabel}
                        </p>
                        <p className="text-xs text-amber-600 mt-0.5">
                            This client already has data for {duplicateInfo.monthLabel}. A new service entry will be added for this month.
                        </p>
                    </div>
                )}

                {/* Row 1: Client Name + Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Client Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="clientName"
                            value={formData.clientName}
                            onChange={handleChange}
                            placeholder="e.g., Shyam Metalics & Energy Ltd"
                            className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent ${
                                errors.clientName ? 'border-red-400 bg-red-50/50' : 'border-gray-200'
                            }`}
                        />
                        {errors.clientName && <p className="text-xs text-red-600 mt-1">{errors.clientName}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Type <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="clientType"
                            value={formData.clientType}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-blue ${
                                errors.clientType ? 'border-red-400' : 'border-gray-200'
                            }`}
                        >
                            <option value="Retainer">Retainer</option>
                            <option value="Contractor">Contractor</option>
                        </select>
                        {errors.clientType && <p className="text-xs text-red-600 mt-1">{errors.clientType}</p>}
                    </div>
                </div>

                {/* Month Selector */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Month <span className="text-red-500">*</span>
                    </label>
                    <select
                        name="month"
                        value={formData.month}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-blue ${
                            errors.month ? 'border-red-400' : 'border-gray-200'
                        }`}
                    >
                        <option value="">Select month</option>
                        {MONTH_OPTIONS.map(m => (
                            <option key={m.key} value={m.key}>{m.label}</option>
                        ))}
                    </select>
                    {errors.month && <p className="text-xs text-red-600 mt-1">{errors.month}</p>}
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
                            placeholder="e.g., Digital Marketing, SEO, Social Media"
                            className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent ${
                                errors.services ? 'border-red-400 bg-red-50/50' : 'border-gray-200'
                            }`}
                        />
                        {errors.services && <p className="text-xs text-red-600 mt-1">{errors.services}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Addons
                        </label>
                        <input
                            type="text"
                            name="addons"
                            value={formData.addons}
                            onChange={handleChange}
                            placeholder="e.g., Content Marketing, Paid Ads"
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Row 3: Service MRR + Addons MRR */}
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
                            className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent ${
                                errors.serviceMRR ? 'border-red-400 bg-red-50/50' : 'border-gray-200'
                            }`}
                        />
                        {errors.serviceMRR && <p className="text-xs text-red-600 mt-1">{errors.serviceMRR}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Addons MRR (₹)
                        </label>
                        <input
                            type="number"
                            name="addonsMRR"
                            value={formData.addonsMRR}
                            onChange={handleChange}
                            placeholder="0"
                            min="0"
                            step="0.01"
                            className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent ${
                                errors.addonsMRR ? 'border-red-400' : 'border-gray-200'
                            }`}
                        />
                        {errors.addonsMRR && <p className="text-xs text-red-600 mt-1">{errors.addonsMRR}</p>}
                    </div>
                </div>

                {/* Live Total MRR Display */}
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
                            className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent ${
                                errors.contractStart ? 'border-red-400 bg-red-50/50' : 'border-gray-200'
                            }`}
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
                            className={`w-full px-3 py-2 border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-blue ${
                                errors.billingCycle ? 'border-red-400' : 'border-gray-200'
                            }`}
                        >
                            <option value="Monthly">Monthly</option>
                            <option value="Yearly">Yearly</option>
                        </select>
                        {errors.billingCycle && <p className="text-xs text-red-600 mt-1">{errors.billingCycle}</p>}
                    </div>
                </div>

                {/* Row 5: Invoice Number + Payment Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Invoice Number
                        </label>
                        <input
                            type="text"
                            name="invoiceNumber"
                            value={formData.invoiceNumber}
                            onChange={handleChange}
                            placeholder="e.g., INV-2025-001"
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Payment Status
                        </label>
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

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <Button variant="secondary" onClick={handleClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button type="submit" loading={loading}>
                        Add Client
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default AddClientModal;
