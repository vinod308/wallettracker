import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import EmployeeOnboardingModal from '../components/employees/EmployeeOnboardingModal';
import { computeSalaryBreakdown } from '../utils/generateSalarySlipPDF';
import UpgradeModal from '../components/subscription/UpgradeModal';
import employeeService from '../services/employeeService';

const EMPLOYEE_LIMIT = 5;

const STATUS_STYLES = {
    'Active':    'bg-green-50 text-green-700 border-green-200',
    'Inactive':  'bg-gray-50 text-gray-600 border-gray-200',
    'On Leave':  'bg-yellow-50 text-yellow-700 border-yellow-200',
    'Resigned':  'bg-red-50 text-red-600 border-red-200',
};
const TYPE_STYLES = {
    'Full-time':  'bg-blue-50 text-blue-700 border-blue-100',
    'Part-time':  'bg-purple-50 text-purple-700 border-purple-100',
    'Intern':     'bg-teal-50 text-teal-700 border-teal-100',
    'Contractor': 'bg-amber-50 text-amber-700 border-amber-100',
};

const fmt = (n) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;

const EmployeeManagementPage = () => {
    const navigate = useNavigate();
    const [employees,   setEmployees]   = useState([]);
    const [showModal,   setShowModal]   = useState(false);
    const [showUpgrade, setShowUpgrade] = useState(false);
    const [search,      setSearch]      = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter,  setTypeFilter]  = useState('all');

    const handleAddEmployee = () => {
        if (employees.length >= EMPLOYEE_LIMIT) setShowUpgrade(true);
        else setShowModal(true);
    };

    const loadEmployees = useCallback(async () => {
        try {
            const serverEmployees = await employeeService.getAll();
            if (serverEmployees.length > 0) {
                setEmployees(serverEmployees);
                localStorage.setItem('gw_employees', JSON.stringify(serverEmployees));
            } else {
                // Auto-migrate: push localStorage employees to DB if server is empty
                const local = JSON.parse(localStorage.getItem('gw_employees') || '[]');
                if (local.length > 0) {
                    const saved = await employeeService.bulkCreate(local);
                    const result = saved.length > 0 ? saved : local;
                    setEmployees(result);
                    if (saved.length > 0) localStorage.setItem('gw_employees', JSON.stringify(result));
                }
            }
        } catch {
            try { setEmployees(JSON.parse(localStorage.getItem('gw_employees') || '[]')); }
            catch { setEmployees([]); }
        }
    }, []);

    useEffect(() => { loadEmployees(); }, [loadEmployees]);

    const active       = employees.filter(e => e.status === 'Active');
    const departments  = [...new Set(employees.map(e => e.department).filter(Boolean))];
    const monthlyPayroll = active.reduce((s, e) => s + (computeSalaryBreakdown(e.salary).netPay || 0), 0);

    const filtered = employees.filter(e => {
        const q = search.toLowerCase();
        const ok = !q
            || (e.fullName     || '').toLowerCase().includes(q)
            || (e.employeeId   || '').toLowerCase().includes(q)
            || (e.designation  || '').toLowerCase().includes(q)
            || (e.department   || '').toLowerCase().includes(q);
        return ok
            && (statusFilter === 'all' || e.status === statusFilter)
            && (typeFilter   === 'all' || e.employmentType === typeFilter);
    });

    return (
        <MainLayout>
            <div>
                {/* Header */}
                <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Employee Management</h1>
                        <p className="mt-1 text-sm text-gray-600">Manage employees, salaries, and payroll records</p>
                    </div>
                    <button
                        onClick={handleAddEmployee}
                        className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-primary-blue text-white rounded-xl text-sm font-semibold hover:bg-[#4338ca] transition-all shadow-sm"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add Employee
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5 mb-6">
                    {[
                        { label: 'Total Employees', value: employees.length,     sub: 'Onboarded',          color: 'text-gray-900' },
                        { label: 'Active',           value: active.length,        sub: 'Currently working',  color: 'text-green-600' },
                        { label: 'Monthly Payroll',  value: fmt(monthlyPayroll),  sub: 'Net pay (active)',   color: 'text-primary-blue' },
                        { label: 'Departments',      value: departments.length,   sub: 'Unique teams',       color: 'text-purple-600' },
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
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex-1 min-w-[200px] relative">
                            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input type="text" placeholder="Search by name, ID, designation…"
                                value={search} onChange={e => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent" />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {['all', 'Active', 'Inactive', 'On Leave', 'Resigned'].map(s => (
                                <button key={s} onClick={() => setStatusFilter(s)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${statusFilter === s ? 'bg-primary-blue text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
                                    {s === 'all' ? 'All Status' : s}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {['all', 'Full-time', 'Part-time', 'Intern', 'Contractor'].map(t => (
                                <button key={t} onClick={() => setTypeFilter(t)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${typeFilter === t ? 'bg-purple-600 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
                                    {t === 'all' ? 'All Types' : t}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl shadow-card border border-gray-100/50 overflow-hidden">
                    {filtered.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <p className="text-gray-500 font-medium">
                                {employees.length === 0 ? 'No employees added yet' : 'No employees match your search'}
                            </p>
                            {employees.length === 0 && (
                                <button onClick={() => setShowModal(true)}
                                    className="mt-4 px-5 py-2.5 bg-primary-blue text-white rounded-xl text-sm font-semibold hover:bg-[#4338ca] transition-colors">
                                    + Add First Employee
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50/80">
                                    <tr>
                                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Designation</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Department</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Type</th>
                                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Gross</th>
                                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Net Pay</th>
                                        <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filtered.map(emp => {
                                        const bd = computeSalaryBreakdown(emp.salary);
                                        return (
                                            <tr key={emp.id}
                                                className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                                                onClick={() => navigate(`/employees/${emp.id}`)}>
                                                <td className="px-5 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-xl bg-primary-blue/10 flex items-center justify-center flex-shrink-0">
                                                            <span className="text-primary-blue font-bold text-sm">
                                                                {(emp.fullName || '?').charAt(0).toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-900">{emp.fullName}</p>
                                                            <p className="text-xs text-gray-400">{emp.employeeId}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{emp.designation}</td>
                                                <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">{emp.department}</td>
                                                <td className="px-4 py-3 hidden sm:table-cell">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${TYPE_STYLES[emp.employmentType] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                                        {emp.employmentType}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right font-semibold text-gray-900">{fmt(emp.salary)}</td>
                                                <td className="px-4 py-3 text-right text-green-700 font-semibold hidden md:table-cell">{fmt(bd.netPay)}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLES[emp.status] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                                        {emp.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <button
                                                        onClick={e => { e.stopPropagation(); navigate(`/employees/${emp.id}`); }}
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

            <EmployeeOnboardingModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onEmployeeAdded={() => { loadEmployees(); setShowModal(false); }}
            />
            <UpgradeModal
                isOpen={showUpgrade}
                onClose={() => setShowUpgrade(false)}
                reason="You've reached the 5-employee limit on your current plan. Upgrade to add more employees."
            />
        </MainLayout>
    );
};

export default EmployeeManagementPage;
