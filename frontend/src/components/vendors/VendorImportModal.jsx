import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import * as XLSX from 'xlsx';

const VALID_TYPES = [
    'Freelancer', 'Agency', 'Consultant', 'Production House',
    'Software Vendor', 'Influencer', 'Employee Contractor',
];

const TEMPLATE_HEADERS = [
    'Vendor Name *', 'Vendor Type *', 'GST Number', 'PAN Number *',
    'Address *', 'City *', 'State *', 'Pincode *', 'Country',
    'Contact Person *', 'Email *', 'Mobile *', 'Alt Mobile', 'Website',
    'Bank Account Holder', 'Bank Name', 'Account Number', 'IFSC Code', 'UPI ID',
];

const SAMPLE_ROW = [
    'ABC Technologies Pvt Ltd', 'Agency', '27AAPCS0472N1ZH', 'AAPCS0472N',
    '123 Tech Park, Andheri East', 'Mumbai', 'Maharashtra', '400059', 'India',
    'Rahul Sharma', 'rahul@abctech.com', '9876543210', '9876543211', 'www.abctech.com',
    'Rahul Sharma', 'HDFC Bank', '50100123456789', 'HDFC0001234', 'rahul@upi',
];

// Map spreadsheet header (lowercase, stripped of *) → vendor field key
const FIELD_MAP = {
    'vendor name':         'vendorName',
    'vendor type':         'vendorType',
    'gst number':          'gstNumber',
    'pan number':          'panNumber',
    'address':             'address',
    'city':                'city',
    'state':               'state',
    'pincode':             'pincode',
    'country':             'country',
    'contact person':      'contactPerson',
    'email':               'email',
    'mobile':              'mobile',
    'alt mobile':          'altMobile',
    'website':             'website',
    'bank account holder': 'accountHolder',
    'bank name':           'bankName',
    'account number':      'accountNumber',
    'ifsc code':           'ifscCode',
    'upi id':              'upiId',
};

const normalizeHeader = (h) => String(h || '').toLowerCase().replace(/\*/g, '').trim();

const downloadTemplate = () => {
    const instructionRows = [
        ['Column', 'Required', 'Notes'],
        ['Vendor Name',  'Yes', 'Minimum 2 characters'],
        ['Vendor Type',  'Yes', 'Must be one of: ' + VALID_TYPES.join(', ')],
        ['GST Number',   'No',  '15-character GST (e.g. 27AAPCS0472N1ZH)'],
        ['PAN Number',   'Yes', '10-character PAN (e.g. AAPCS0472N)'],
        ['Address',      'Yes', 'Full postal address'],
        ['City',         'Yes', ''],
        ['State',        'Yes', 'Full state name (e.g. Maharashtra)'],
        ['Pincode',      'Yes', '6-digit pincode'],
        ['Country',      'No',  'Default: India'],
        ['Contact Person','Yes',''],
        ['Email',        'Yes', 'Valid email address'],
        ['Mobile',       'Yes', '10-digit mobile starting with 6-9'],
        ['Alt Mobile',   'No',  ''],
        ['Website',      'No',  ''],
        ['Bank Account Holder','No',''],
        ['Bank Name',    'No',  ''],
        ['Account Number','No', ''],
        ['IFSC Code',    'No',  'Format: ABCD0123456'],
        ['UPI ID',       'No',  ''],
    ];

    const wsData = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS, SAMPLE_ROW]);
    wsData['!cols'] = TEMPLATE_HEADERS.map(() => ({ wch: 22 }));

    const wsInstr = XLSX.utils.aoa_to_sheet(instructionRows);
    wsInstr['!cols'] = [{ wch: 22 }, { wch: 10 }, { wch: 50 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsData, 'Vendors');
    XLSX.utils.book_append_sheet(wb, wsInstr, 'Instructions');
    XLSX.writeFile(wb, 'vendor_import_template.xlsx');
};

const VendorImportModal = ({ isOpen, onClose, onImported }) => {
    const [rows,      setRows]      = useState([]);
    const [colHeaders, setColHeaders] = useState([]);
    const [fileName,  setFileName]  = useState('');
    const [importing, setImporting] = useState(false);
    const [result,    setResult]    = useState(null);
    const [dragging,  setDragging]  = useState(false);
    const fileRef = useRef(null);

    if (!isOpen) return null;

    const reset = () => { setRows([]); setColHeaders([]); setFileName(''); setResult(null); };

    const parseFile = (file) => {
        reset();
        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const wb   = XLSX.read(data, { type: 'array' });
                const ws   = wb.Sheets[wb.SheetNames[0]];
                const all  = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
                if (!all.length || all.length < 2) {
                    alert('File must contain at least a header row and one data row.');
                    return;
                }
                setColHeaders(all[0].map(h => String(h)));
                setRows(all.slice(1).filter(r => r.some(c => String(c).trim())));
            } catch {
                alert('Could not read file. Please use a valid .xlsx, .xls, or .csv file.');
                reset();
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleFileChange = (e) => { const f = e.target.files?.[0]; if (f) parseFile(f); };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        const f = e.dataTransfer.files?.[0];
        if (f) parseFile(f);
    };

    const handleImport = () => {
        setImporting(true);
        const normalizedHeaders = colHeaders.map(normalizeHeader);

        const newVendors = [];
        const errors     = [];

        rows.forEach((row, idx) => {
            const v = { country: 'India' };
            normalizedHeaders.forEach((h, i) => {
                const field = FIELD_MAP[h];
                if (field) v[field] = String(row[i] || '').trim();
            });

            const rowErrors = [];
            if (!v.vendorName || v.vendorName.length < 2) rowErrors.push('Vendor Name required (min 2 chars)');
            if (!v.panNumber)       rowErrors.push('PAN Number required');
            if (!v.contactPerson)   rowErrors.push('Contact Person required');
            if (!v.email)           rowErrors.push('Email required');
            if (!v.mobile)          rowErrors.push('Mobile required');
            if (!v.city)            rowErrors.push('City required');
            if (!v.state)           rowErrors.push('State required');
            if (!v.address)         rowErrors.push('Address required');

            if (!v.vendorType || !VALID_TYPES.includes(v.vendorType)) v.vendorType = 'Agency';

            if (rowErrors.length) { errors.push({ row: idx + 2, msgs: rowErrors }); return; }

            v.id        = `vendor_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
            v.createdAt = new Date().toISOString();
            v.status    = 'Active';
            newVendors.push(v);
        });

        if (newVendors.length) {
            const existing = (() => {
                try { return JSON.parse(localStorage.getItem('gw_vendors') || '[]'); } catch { return []; }
            })();
            localStorage.setItem('gw_vendors', JSON.stringify([...existing, ...newVendors]));
            onImported?.();
        }

        setResult({ imported: newVendors.length, errors });
        setImporting(false);
    };

    const previewRows = rows.slice(0, 5);

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Import Vendors</h2>
                        <p className="text-sm text-gray-500 mt-0.5">Upload an Excel or CSV file to bulk-add vendors</p>
                    </div>
                    <button onClick={onClose}
                        className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="px-6 py-5 space-y-5">

                    {/* Template download */}
                    <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
                        <div>
                            <p className="text-sm font-semibold text-indigo-800">Download Template</p>
                            <p className="text-xs text-indigo-500 mt-0.5">Get the Excel template with all required columns and a sample row</p>
                        </div>
                        <button
                            onClick={downloadTemplate}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors flex-shrink-0 ml-4"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download Template
                        </button>
                    </div>

                    {/* Required columns note */}
                    <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                        <p className="text-xs font-semibold text-amber-800 mb-1">Required columns (marked with * in template)</p>
                        <p className="text-xs text-amber-700">
                            Vendor Name, Vendor Type, PAN Number, Address, City, State, Pincode, Contact Person, Email, Mobile
                        </p>
                        <p className="text-xs text-amber-600 mt-1">
                            <span className="font-semibold">Vendor Type</span> must be one of:{' '}
                            {VALID_TYPES.join(', ')}
                        </p>
                    </div>

                    {/* Drop zone */}
                    <div
                        ref={fileRef}
                        onDragOver={e => { e.preventDefault(); setDragging(true); }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById('vendor-import-input').click()}
                        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all
                            ${dragging ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'}`}
                    >
                        <input id="vendor-import-input" type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileChange} />
                        {fileName ? (
                            <div className="flex items-center justify-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-semibold text-gray-800">{fileName}</p>
                                    <p className="text-xs text-gray-400">{rows.length} data row{rows.length !== 1 ? 's' : ''} detected · click to replace</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                </div>
                                <p className="text-sm font-medium text-gray-700">Drop your file here or <span className="text-indigo-600">browse</span></p>
                                <p className="text-xs text-gray-400 mt-1">Supports .xlsx, .xls, .csv</p>
                            </>
                        )}
                    </div>

                    {/* Preview table */}
                    {rows.length > 0 && !result && (
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                Preview — first {Math.min(rows.length, 5)} of {rows.length} row{rows.length !== 1 ? 's' : ''}
                            </p>
                            <div className="overflow-x-auto rounded-xl border border-gray-100">
                                <table className="text-xs w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            {colHeaders.slice(0, 8).map((h, i) => (
                                                <th key={i} className="px-3 py-2 text-left font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                                            ))}
                                            {colHeaders.length > 8 && <th className="px-3 py-2 text-gray-400">+{colHeaders.length - 8} more</th>}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {previewRows.map((row, i) => (
                                            <tr key={i} className="hover:bg-gray-50">
                                                {row.slice(0, 8).map((cell, j) => (
                                                    <td key={j} className="px-3 py-2 text-gray-700 max-w-[140px] truncate">{String(cell)}</td>
                                                ))}
                                                {colHeaders.length > 8 && <td className="px-3 py-2 text-gray-300">…</td>}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Result */}
                    {result && (
                        <div className={`rounded-xl p-4 border ${result.imported > 0 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                            {result.imported > 0 && (
                                <div className="flex items-center gap-2 mb-2">
                                    <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <p className="text-sm font-semibold text-green-800">
                                        {result.imported} vendor{result.imported !== 1 ? 's' : ''} imported successfully
                                    </p>
                                </div>
                            )}
                            {result.errors.length > 0 && (
                                <div>
                                    <p className="text-sm font-semibold text-red-700 mb-2">
                                        {result.errors.length} row{result.errors.length !== 1 ? 's' : ''} skipped due to errors:
                                    </p>
                                    <ul className="space-y-1 max-h-32 overflow-y-auto">
                                        {result.errors.map((e, i) => (
                                            <li key={i} className="text-xs text-red-600">
                                                Row {e.row}: {e.msgs.join(', ')}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
                    <button onClick={() => { reset(); onClose(); }}
                        className="px-5 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors">
                        {result?.imported ? 'Close' : 'Cancel'}
                    </button>
                    {rows.length > 0 && !result && (
                        <button
                            onClick={handleImport}
                            disabled={importing}
                            className="flex items-center gap-2 px-5 py-2 bg-primary-blue hover:bg-[#4338ca] text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                        >
                            {importing ? (
                                <>
                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                    </svg>
                                    Importing…
                                </>
                            ) : (
                                <>Import {rows.length} Vendor{rows.length !== 1 ? 's' : ''}</>
                            )}
                        </button>
                    )}
                    {result?.imported > 0 && (
                        <button onClick={() => { reset(); onClose(); }}
                            className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors">
                            Done
                        </button>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default VendorImportModal;
