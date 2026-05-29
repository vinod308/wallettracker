import React from 'react';
import ReactDOM from 'react-dom';

const VendorAddChoiceModal = ({ isOpen, onClose, onCreateNew, onImport }) => {
    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Add Vendors</h2>
                        <p className="text-sm text-gray-500 mt-0.5">Choose how you'd like to add vendors</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Options */}
                <div className="grid grid-cols-2 gap-4 px-6 pb-6">
                    {/* Create New */}
                    <button
                        onClick={onCreateNew}
                        className="group flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-gray-200
                            hover:border-indigo-400 hover:bg-indigo-50/40 transition-all duration-200 text-center"
                    >
                        <div className="w-14 h-14 rounded-2xl bg-indigo-100 group-hover:bg-indigo-200 flex items-center justify-center transition-colors">
                            <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-900 group-hover:text-indigo-700 transition-colors">
                                Create New Vendor
                            </p>
                            <p className="text-xs text-gray-400 mt-1 leading-snug">
                                Fill in vendor details manually
                            </p>
                        </div>
                    </button>

                    {/* Import File */}
                    <button
                        onClick={onImport}
                        className="group flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-gray-200
                            hover:border-green-400 hover:bg-green-50/40 transition-all duration-200 text-center"
                    >
                        <div className="w-14 h-14 rounded-2xl bg-green-100 group-hover:bg-green-200 flex items-center justify-center transition-colors">
                            <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-900 group-hover:text-green-700 transition-colors">
                                Import File
                            </p>
                            <p className="text-xs text-gray-400 mt-1 leading-snug">
                                Upload from Excel or CSV
                            </p>
                        </div>
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default VendorAddChoiceModal;
