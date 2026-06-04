import React, { useState } from 'react';
import Modal from '../common/Modal';
import invoiceService from '../../services/invoiceService';
import { downloadEWBPDF } from '../../utils/generateEWBPDF';

const TRANS_MODES = [
    { value: '1', label: '1 - Road' },
    { value: '2', label: '2 - Rail' },
    { value: '3', label: '3 - Air' },
    { value: '4', label: '4 - Ship' },
];

const GenerateEWBModal = ({ isOpen, onClose, invoice, onSuccess }) => {
    const [transMode,    setTransMode]    = useState('1');
    const [distance,     setDistance]     = useState('');
    const [vehNo,        setVehNo]        = useState('');
    const [vehType,      setVehType]      = useState('R');
    const [transName,    setTransName]    = useState('');
    const [transId,      setTransId]      = useState('');
    const [transDocNo,   setTransDocNo]   = useState('');
    const [transDocDate, setTransDocDate] = useState('');
    const [loading,      setLoading]      = useState(false);
    const [error,        setError]        = useState('');
    const [result,       setResult]       = useState(null);

    const isRoad = transMode === '1';

    const reset = () => {
        setTransMode('1'); setDistance(''); setVehNo(''); setVehType('R');
        setTransName(''); setTransId(''); setTransDocNo(''); setTransDocDate('');
        setError(''); setResult(null);
    };

    const handleClose = () => { reset(); onClose(); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await invoiceService.generateEWB({
                invoiceId:          invoice.id,
                irn:                invoice.irn,
                ewbDistance:        distance || 0,
                ewbTransMode:       transMode,
                ewbTransporterId:   transId,
                ewbTransporterName: transName,
                ewbVehNo:           vehNo,
                ewbVehType:         vehType,
                ewbTransDocNo:      transDocNo,
                ewbTransDocDate:    transDocDate,
            });
            setResult(res.data.data);
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'EWB generation failed');
        } finally {
            setLoading(false);
        }
    };

    const handleDone = () => {
        onSuccess(result);
        handleClose();
    };

    if (!invoice) return null;

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Generate E-Way Bill">
            <div className="space-y-4 min-w-[480px]">

                {/* Invoice context */}
                <div className="bg-gray-50 rounded-lg p-3 text-sm">
                    <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-800">{invoice.invoice_number}</span>
                        <span className="text-gray-500">{invoice.invoice_date?.split('T')[0]}</span>
                    </div>
                    <div className="mt-1 text-xs text-gray-500 font-mono truncate" title={invoice.irn}>
                        IRN: {invoice.irn}
                    </div>
                    {invoice.buyer_name && (
                        <div className="mt-0.5 text-xs text-gray-600">{invoice.buyer_name}</div>
                    )}
                </div>

                {result ? (
                    /* Success state */
                    <div className="space-y-3">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm">
                            <p className="font-semibold text-green-800 text-base mb-2">E-Way Bill Generated</p>
                            <div className="space-y-1 text-green-700">
                                <div className="flex justify-between">
                                    <span>EWB No.</span>
                                    <span className="font-mono font-bold">{result.ewb_no}</span>
                                </div>
                                {result.ewb_valid_upto && (
                                    <div className="flex justify-between">
                                        <span>Valid Upto</span>
                                        <span className="font-medium">{result.ewb_valid_upto}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => downloadEWBPDF(result)}
                                className="flex-1 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                            >
                                ↓ Download EWB PDF
                            </button>
                            <button
                                onClick={handleDone}
                                className="flex-1 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Form state */
                    <form onSubmit={handleSubmit} className="space-y-4">

                        {/* Transport Mode + Distance */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Transport Mode <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={transMode}
                                    onChange={e => setTransMode(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {TRANS_MODES.map(m => (
                                        <option key={m.value} value={m.value}>{m.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Distance (km) <span className="text-gray-400 font-normal">— 0 = auto</span>
                                </label>
                                <input
                                    type="number" min="0" max="4000"
                                    value={distance}
                                    onChange={e => setDistance(e.target.value)}
                                    placeholder="0"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        {/* Road-specific: Vehicle No + Type */}
                        {isRoad && (
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Vehicle Number
                                    </label>
                                    <input
                                        type="text"
                                        value={vehNo}
                                        onChange={e => setVehNo(e.target.value.toUpperCase())}
                                        placeholder="e.g. UP32AB1234"
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Vehicle Type
                                    </label>
                                    <select
                                        value={vehType}
                                        onChange={e => setVehType(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="R">Regular</option>
                                        <option value="O">ODC (Over-Dimensional Cargo)</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* Non-road: Doc No + Date */}
                        {!isRoad && (
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Transport Doc No.
                                    </label>
                                    <input
                                        type="text"
                                        value={transDocNo}
                                        onChange={e => setTransDocNo(e.target.value)}
                                        placeholder="LR / RR / Airway Bill No."
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Transport Doc Date
                                    </label>
                                    <input
                                        type="date"
                                        value={transDocDate}
                                        onChange={e => setTransDocDate(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Transporter Name + GSTIN (optional) */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Transporter Name <span className="text-gray-400 font-normal">optional</span>
                                </label>
                                <input
                                    type="text"
                                    value={transName}
                                    onChange={e => setTransName(e.target.value)}
                                    placeholder="e.g. DTDC Courier"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Transporter GSTIN <span className="text-gray-400 font-normal">optional</span>
                                </label>
                                <input
                                    type="text"
                                    value={transId}
                                    onChange={e => setTransId(e.target.value.toUpperCase())}
                                    placeholder="15-character GSTIN"
                                    maxLength={15}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
                                {error}
                            </div>
                        )}

                        <div className="flex gap-3 pt-1">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="flex-1 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 disabled:opacity-50"
                            >
                                {loading ? 'Generating…' : 'Generate E-Way Bill'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </Modal>
    );
};

export default GenerateEWBModal;
