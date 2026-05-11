import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import GenerateSalarySlipModal from '../components/employees/GenerateSalarySlipModal';
import { computeSalaryBreakdown, downloadSalarySlipPDF, openSalarySlipInTab } from '../utils/generateSalarySlipPDF';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

const STATUS_STYLES = {
    'Active':    'bg-green-100 text-green-700',
    'Inactive':  'bg-gray-100 text-gray-600',
    'On Leave':  'bg-yellow-100 text-yellow-700',
    'Resigned':  'bg-red-100 text-red-600',
};

const fmt     = (n) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const InfoBlock = ({ label, value }) => (
    <div>
        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
        <p className="text-sm font-medium text-gray-800 break-all">{value || '—'}</p>
    </div>
);

const EmployeeDetailPage = () => {
    const { employeeId } = useParams();
    const navigate = useNavigate();
    const [employee,      setEmployee]      = useState(null);
    const [slips,         setSlips]         = useState([]);
    const [showSlipModal, setShowSlipModal] = useState(false);

    const loadData = () => {
        try {
            const emps = JSON.parse(localStorage.getItem('gw_employees') || '[]');
            setEmployee(emps.find(e => e.id === employeeId) || null);
            const all = JSON.parse(localStorage.getItem('gw_salary_slips') || '[]');
            setSlips(
                all.filter(s => s.employeeId === employeeId)
                   .sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt))
            );
        } catch { setEmployee(null); setSlips([]); }
    };

    useEffect(() => { loadData(); }, [employeeId]);

    if (!employee) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <p className="text-gray-500 mb-4">Employee not found.</p>
                        <button onClick={() => navigate('/employees')} className="text-primary-blue hover:underline text-sm">
                            ← Back to Employees
                        </button>
                    </div>
                </div>
            </MainLayout>
        );
    }

    const bd = computeSalaryBreakdown(employee.salary);

    return (
        <MainLayout>
            <div className="space-y-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate('/employees')}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div className="w-14 h-14 rounded-2xl bg-primary-blue/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-primary-blue font-bold text-2xl">
                                {(employee.fullName || '?').charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{employee.fullName}</h1>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[employee.status] || 'bg-gray-100 text-gray-600'}`}>
                                    {employee.status}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500">{employee.designation} · {employee.employeeId}</p>
                        </div>
                    </div>
                    <button onClick={() => setShowSlipModal(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-primary-blue text-white rounded-xl text-sm font-semibold hover:bg-[#4338ca] transition-all shadow-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Generate Salary Slip
                    </button>
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-5">
                    {[
                        { label: 'Gross Salary',  value: fmt(employee.salary), sub: 'Per month',                           color: 'text-gray-900' },
                        { label: 'Net Pay',        value: fmt(bd.netPay),       sub: 'After deductions',                    color: 'text-green-600' },
                        { label: 'Department',     value: employee.department || '—', sub: 'Team',                          color: 'text-primary-blue' },
                        { label: 'Type',           value: employee.employmentType || '—', sub: employee.joiningDate ? 'Joined ' + fmtDate(employee.joiningDate) : 'Employment type', color: 'text-purple-600' },
                    ].map(s => (
                        <div key={s.label} className="bg-white rounded-2xl shadow-card border border-gray-100/50 p-4 sm:p-5">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{s.label}</p>
                            <h3 className={`text-base sm:text-lg font-semibold ${s.color} truncate`}>{s.value}</h3>
                            <p className="text-xs text-gray-400 mt-0.5 truncate">{s.sub}</p>
                        </div>
                    ))}
                </div>

                {/* Info cards */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    <div className="bg-white rounded-2xl shadow-card border border-gray-100/50 p-5">
                        <h3 className="text-sm font-semibold text-gray-700 mb-4 pb-3 border-b border-gray-50">Contact Information</h3>
                        <div className="space-y-3">
                            <InfoBlock label="Email"            value={employee.email} />
                            <InfoBlock label="Mobile"           value={employee.mobile} />
                            <InfoBlock label="Alternate Mobile" value={employee.altMobile} />
                            <InfoBlock label="Address"          value={[employee.address, employee.city, employee.state, employee.pincode].filter(Boolean).join(', ')} />
                            <InfoBlock label="Emergency Contact" value={employee.emergencyContact ? `${employee.emergencyContact}${employee.emergencyPhone ? ' · ' + employee.emergencyPhone : ''}` : '—'} />
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-card border border-gray-100/50 p-5">
                        <h3 className="text-sm font-semibold text-gray-700 mb-4 pb-3 border-b border-gray-50">Identity Documents</h3>
                        <div className="space-y-3">
                            <InfoBlock label="PAN Number"    value={employee.panNumber} />
                            <InfoBlock label="Aadhaar"       value={employee.aadhaarNumber ? '••••••••' + employee.aadhaarNumber.slice(-4) : '—'} />
                            <InfoBlock label="Joining Date"  value={fmtDate(employee.joiningDate)} />
                            <InfoBlock label="Onboarded At"  value={fmtDate(employee.onboardedAt)} />
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-card border border-gray-100/50 p-5">
                        <h3 className="text-sm font-semibold text-gray-700 mb-4 pb-3 border-b border-gray-50">Banking Details</h3>
                        <div className="space-y-3">
                            <InfoBlock label="Bank Name"       value={employee.bankName} />
                            <InfoBlock label="Account Number"  value={employee.accountNumber} />
                            <InfoBlock label="IFSC Code"       value={employee.ifscCode} />
                            <InfoBlock label="Account Holder"  value={employee.accountHolder} />
                            <InfoBlock label="UPI ID"          value={employee.upiId} />
                        </div>
                    </div>
                </div>

                {/* Salary breakdown */}
                <div className="bg-white rounded-2xl shadow-card border border-gray-100/50 p-5">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Salary Breakdown</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                            { label: 'Basic (50%)',    value: fmt(bd.basic),    bg: 'bg-blue-50 border-blue-100' },
                            { label: 'HRA (20%)',      value: fmt(bd.hra),      bg: 'bg-indigo-50 border-indigo-100' },
                            { label: 'Transport (10%)',value: fmt(bd.transport),bg: 'bg-purple-50 border-purple-100' },
                            { label: 'Special (20%)',  value: fmt(bd.special),  bg: 'bg-violet-50 border-violet-100' },
                            { label: 'PF (12% Basic)', value: `−${fmt(bd.pfEmp)}`, bg: 'bg-red-50 border-red-100' },
                            { label: 'Prof. Tax',      value: '−₹200',          bg: 'bg-orange-50 border-orange-100' },
                            { label: 'Gross Pay',      value: fmt(bd.gross),    bg: 'bg-green-50 border-green-100' },
                            { label: 'Net Pay',        value: fmt(bd.netPay),   bg: 'bg-emerald-50 border-emerald-200' },
                        ].map(item => (
                            <div key={item.label} className={`${item.bg} border rounded-xl p-3 text-center`}>
                                <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                                <p className="text-sm font-bold text-gray-800">{item.value}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Salary slips */}
                <div className="bg-white rounded-2xl shadow-card border border-gray-100/50 overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900">Salary Slips</h3>
                            <p className="text-xs text-gray-400">{slips.length} slip{slips.length !== 1 ? 's' : ''} generated</p>
                        </div>
                        <button onClick={() => setShowSlipModal(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary-blue border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            New Slip
                        </button>
                    </div>

                    {slips.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <p className="text-sm text-gray-400">No salary slips generated yet.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50/80">
                                    <tr>
                                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Period</th>
                                        <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Days Worked</th>
                                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Gross</th>
                                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Net Pay</th>
                                        <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Generated</th>
                                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {slips.map(slip => {
                                        const dim    = new Date(slip.year, slip.month, 0).getDate();
                                        const slipObj = { month: slip.month, year: slip.year, daysWorked: slip.daysWorked, notes: slip.notes };
                                        return (
                                            <tr key={slip.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-5 py-3 font-semibold text-gray-900">
                                                    {MONTH_NAMES[slip.month - 1]} {slip.year}
                                                </td>
                                                <td className="px-4 py-3 text-center text-gray-500 hidden sm:table-cell">
                                                    {slip.daysWorked || dim} / {dim}
                                                </td>
                                                <td className="px-4 py-3 text-right font-medium text-gray-700">{fmt(slip.gross)}</td>
                                                <td className="px-4 py-3 text-right font-bold text-green-700">{fmt(slip.netPay)}</td>
                                                <td className="px-4 py-3 text-center text-gray-400 text-xs hidden md:table-cell">
                                                    {fmtDate(slip.generatedAt)}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button
                                                            onClick={() => openSalarySlipInTab(employee, slipObj)}
                                                            title="View PDF"
                                                            className="p-1.5 text-gray-400 hover:text-primary-blue hover:bg-blue-50 rounded-lg transition-colors">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => downloadSalarySlipPDF(employee, slipObj)}
                                                            title="Download PDF"
                                                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                            </svg>
                                                        </button>
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
            </div>

            <GenerateSalarySlipModal
                isOpen={showSlipModal}
                onClose={() => { setShowSlipModal(false); loadData(); }}
                employee={employee}
            />
        </MainLayout>
    );
};

export default EmployeeDetailPage;
