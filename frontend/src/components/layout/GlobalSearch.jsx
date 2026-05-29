import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const CATEGORIES = [
    {
        key: 'clients',
        label: 'Clients',
        storage: 'gw_onboarded_clients',
        color: 'text-blue-600 bg-blue-50',
        dot: 'bg-blue-500',
        getName: (c) => c.clientName || '',
        getSub:  (c) => c.contactPerson || c.clientType || '',
        getRoute:(c) => `/clients/onboarded/${c.id}`,
    },
    {
        key: 'vendors',
        label: 'Vendors',
        storage: 'gw_vendors',
        color: 'text-purple-600 bg-purple-50',
        dot: 'bg-purple-500',
        getName: (v) => v.vendorName || '',
        getSub:  (v) => v.vendorType || v.city || '',
        getRoute:(v) => `/vendors/${v.id}`,
    },
    {
        key: 'employees',
        label: 'Employees',
        storage: 'gw_employees',
        color: 'text-green-600 bg-green-50',
        dot: 'bg-green-500',
        getName: (e) => e.fullName || '',
        getSub:  (e) => e.designation || e.department || '',
        getRoute:(e) => `/employees/${e.id}`,
    },
];

const MAX_PER_CAT = 4;

const GlobalSearch = () => {
    const navigate = useNavigate();
    const [query,   setQuery]   = useState('');
    const [results, setResults] = useState([]);
    const [open,    setOpen]    = useState(false);
    const [active,  setActive]  = useState(-1);
    const inputRef  = useRef(null);
    const wrapRef   = useRef(null);

    const search = useCallback((q) => {
        if (!q.trim()) { setResults([]); setOpen(false); return; }
        const lower = q.toLowerCase();
        const found = [];
        CATEGORIES.forEach(cat => {
            try {
                const items = JSON.parse(localStorage.getItem(cat.storage) || '[]') || [];
                const hits  = items
                    .filter(item => {
                        const name = cat.getName(item).toLowerCase();
                        const sub  = cat.getSub(item).toLowerCase();
                        const id   = String(item.id || item.employeeId || '').toLowerCase();
                        return name.includes(lower) || sub.includes(lower) || id.includes(lower);
                    })
                    .slice(0, MAX_PER_CAT);
                if (hits.length) found.push({ ...cat, hits });
            } catch {}
        });
        setResults(found);
        setOpen(found.length > 0);
        setActive(-1);
    }, []);

    useEffect(() => { search(query); }, [query, search]);

    // Close on outside click
    useEffect(() => {
        const handler = (e) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Keyboard shortcut: / to focus
    useEffect(() => {
        const handler = (e) => {
            if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
                e.preventDefault();
                inputRef.current?.focus();
            }
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, []);

    // Flat list for keyboard nav
    const flatItems = results.flatMap(cat => cat.hits.map(item => ({ cat, item })));

    const handleKeyDown = (e) => {
        if (!open) return;
        if (e.key === 'ArrowDown') { e.preventDefault(); setActive(p => Math.min(p + 1, flatItems.length - 1)); }
        if (e.key === 'ArrowUp')   { e.preventDefault(); setActive(p => Math.max(p - 1, 0)); }
        if (e.key === 'Escape')    { setOpen(false); inputRef.current?.blur(); }
        if (e.key === 'Enter' && active >= 0) {
            const { cat, item } = flatItems[active];
            go(cat, item);
        }
    };

    const go = (cat, item) => {
        navigate(cat.getRoute(item));
        setQuery('');
        setOpen(false);
        inputRef.current?.blur();
    };

    let flatIdx = 0;

    return (
        <div ref={wrapRef} className="relative w-full max-w-lg">
            {/* Input */}
            <div className="relative">
                <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onFocus={() => query.trim() && setOpen(results.length > 0)}
                    onKeyDown={handleKeyDown}
                    placeholder="Find vendor, client, employee…"
                    className="w-full pl-9 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400
                               focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent focus:bg-white transition-all"
                />
                {/* Shortcut hint */}
                {!query && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-300 font-mono bg-gray-100 px-1.5 py-0.5 rounded hidden sm:inline">
                        /
                    </span>
                )}
                {/* Clear button */}
                {query && (
                    <button
                        onClick={() => { setQuery(''); setOpen(false); inputRef.current?.focus(); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Dropdown */}
            {open && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-[200]">
                    {results.map((cat) => (
                        <div key={cat.key}>
                            {/* Category header */}
                            <div className="px-3 pt-2.5 pb-1 flex items-center gap-1.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${cat.dot}`} />
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{cat.label}</span>
                            </div>
                            {/* Items */}
                            {cat.hits.map((item) => {
                                const idx     = flatIdx++;
                                const isActive = idx === active;
                                const name    = cat.getName(item);
                                const sub     = cat.getSub(item);
                                const initial = (name || '?').charAt(0).toUpperCase();

                                return (
                                    <button
                                        key={item.id}
                                        onMouseDown={() => go(cat, item)}
                                        onMouseEnter={() => setActive(idx)}
                                        className={`w-full text-left px-3 py-2 flex items-center gap-3 transition-colors
                                            ${isActive ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}
                                    >
                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${cat.color}`}>
                                            {initial}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
                                            {sub && <p className="text-xs text-gray-400 truncate">{sub}</p>}
                                        </div>
                                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${cat.color}`}>
                                            {cat.label.slice(0, -1)}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    ))}

                    {/* No results */}
                    {results.length === 0 && query.trim() && (
                        <div className="px-4 py-6 text-center">
                            <p className="text-sm text-gray-500">No results for "<span className="font-medium">{query}</span>"</p>
                            <p className="text-xs text-gray-400 mt-1">Try searching by name, type, or ID</p>
                        </div>
                    )}

                    <div className="px-3 py-2 border-t border-gray-50 flex items-center gap-3">
                        <span className="text-[10px] text-gray-300 flex items-center gap-1">
                            <kbd className="bg-gray-100 px-1 rounded text-gray-400">↑↓</kbd> navigate
                        </span>
                        <span className="text-[10px] text-gray-300 flex items-center gap-1">
                            <kbd className="bg-gray-100 px-1 rounded text-gray-400">↵</kbd> open
                        </span>
                        <span className="text-[10px] text-gray-300 flex items-center gap-1">
                            <kbd className="bg-gray-100 px-1 rounded text-gray-400">esc</kbd> close
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GlobalSearch;
