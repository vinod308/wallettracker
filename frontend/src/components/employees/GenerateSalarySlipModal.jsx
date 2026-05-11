import React, { useState } from 'react';
import { computeSalaryBreakdown, downloadSalarySlipPDF, openSalarySlipInTab } from '../../utils/generateSalarySlipPDF';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

const GenerateSalarySlipModal = ({ isOpen, onClose, employee }) => {
    const now = new Date();
    const [form, setForm] = useState({
        month: now.getMonth() + 1,
        year:  now.getFullYear(),
        daysWorked: '',
        notes: '',
    });
    const [done, setDone] = useState(false);
    const [slip, setSlip] = useState(null);

    if (!isOpen || !employee) return null;

    const set = (f, v) => setForm(p => ({ ...p, [f]: v }));
    const daysInMonth = new Date(parseInt(form.year), parseInt(form.month), 0).getDate();
    const bd  = computeSalaryBreakdown(employee.salary);
    const fmt = n => Math.round(n || 0).toLocaleString('en-IN');

    const handleGenerate = () => {
        const s = {
            month:      parseInt(form.month),
            year:       parseInt(form.year),
            daysWorked: parseInt(form.daysWorked) || daysInMonth,
            notes:      form.notes,
        };
        const all = JSON.parse(localStorage.getItem('gw_salary_slips') || '[]');
        all.push({
            id:          Date.now().toString(),
            employeeId:  employee.id,
            empCode:     employee.employeeId,
            ...s,
            gross:       bd.gross,
            netPay:      bd.netPay,
            generatedAt: new Date().toISOString(),
        });
        localStorage.setItem('gw_salary_slips', JSON.stringify(all));
        setSlip(s);
        setDone(true);
    };

    const handleClose = () => {
        setDone(false);
        setSlip(null);
        setForm({ month: now.getMonth() + 1, year: now.getFullYear(), daysWorked: '', notes: '' });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Generate Salary Slip</h2>
                        <p className="text-xs text-gray-500 mt-0.5">{employee.fullName} · {employee.employeeId}</p>
                    </div>
                    <button onClick={handleClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="px-6 py-5">
                    {!done ? (
                        <>
                            {/* Fields */}
                            <div className="grid grid-cols-2 gap-4 mb-5">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Month</label>
                                    <select value={form.month} onChange={e => set('month', e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-blue bg-white">
                                        {MONTH_NAMES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Year</label>
                                    <select value={form.year} onChange={e => set('year', e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-blue bg-white">
                                        {[2024, 2025, 2026, 2027].map(y => <option key={y}>{y}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                                        Days Worked <span className="text-gray-400 font-normal">(of {daysInMonth})</span>
                                    </label>
                                    <input type="number" min={1} max={daysInMonth} placeholder={daysInMonth}
                                        value={form.daysWorked} onChange={e => set('daysWorked', e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-blue" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                                        Notes <span className="text-gray-400 font-normal">(optional)</span>
                                    </label>
                                    <textarea rows={2} placeholder="Any remarks for this slip…"
                                        value={form.notes} onChange={e => set('notes', e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-blue resize-none" />
                                </div>
                            </div>

                            {/* Breakdown preview */}
                            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-5">
                                <p className="text-xs font-semibold text-indigo-700 mb-3">
                                    Breakdown — {MONTH_NAMES[parseInt(form.month) - 1]} {form.year}
                                </p>
                                <div className="space-y-1.5 text-sm">
                                    {[
                                        ['Basic Salary',        `₹${fmt(bd.basic)}`],
                                        ['HRA',                 `₹${fmt(bd.hra)}`],
                                        ['Transport Allowance', `₹${fmt(bd.transport)}`],
                                        ['Special Allowance',   `₹${fmt(bd.special)}`],
                                    ].map(([k, v]) => (
                                        <div key={k} className="flex justify-between">
                                            <span className="text-gray-600">{k}</span>
                                            <span className="font-medium text-gray-800">{v}</span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between font-semibold border-t border-indigo-200 pt-1.5 mt-1">
                                        <span className="text-indigo-700">Gross Earnings</span>
                                        <span className="text-indigo-700">₹{fmt(bd.gross)}</span>
                                    </div>
                                    <div className="flex justify-between text-red-600 text-xs">
                                        <span>Provident Fund (12%)</span>
                                        <span>−₹{fmt(bd.pfEmp)}</span>
                                    </div>
                                    <div className="flex justify-between text-red-600 text-xs">
                                        <span>Professional Tax</span>
                                        <span>−₹200</span>
                                    </div>
                                    <div className="flex justify-between font-bold border-t border-indigo-200 pt-1.5 mt-1 text-base">
                                        <span className="text-gray-900">Net Pay</span>
                                        <span className="text-primary-blue">₹{fmt(bd.netPay)}</span>
                                    </div>
                                </div>
                            </div>

                            <button onClick={handleGenerate}
                                className="w-full py-3 bg-primary-blue text-white font-semibold rounded-xl hover:bg-[#4338ca] transition-colors text-sm">
                                Generate &amp; Save Salary Slip
                            </button>
                        </>
                    ) : (
                        <div className="text-center py-4">
                            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <p className="text-lg font-bold text-gray-900 mb-1">Salary Slip Generated!</p>
                            <p className="text-sm text-gray-500 mb-6">{MONTH_NAMES[slip.month - 1]} {slip.year} · {employee.fullName}</p>
                            <div className="flex gap-3 justify-center">
                                <button onClick={() => openSalarySlipInTab(employee, slip)}
                                    className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    View PDF
                                </button>
                                <button onClick={() => downloadSalarySlipPDF(employee, slip)}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-primary-blue text-white rounded-xl text-sm font-semibold hover:bg-[#4338ca] transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Download PDF
                                </button>
                            </div>
                            <button onClick={handleClose} className="mt-4 text-sm text-gray-400 hover:text-gray-600 underline block mx-auto">
                                Close
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GenerateSalarySlipModal;
