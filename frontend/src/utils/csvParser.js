/**
 * CSV Parser Utility
 * Parses Garage Wallet Tracker data from Google Sheets (via backend proxy).
 * Backend fetches CSV from Google Sheets and serves it at /api/sheets/csv/:sheet
 * Handles Indian number format, multiline fields, "+" separated amounts.
 */

import Papa from 'papaparse';

// Google Sheets configuration — backend proxy URLs
// Adding a new month is as simple as adding a new entry here + creating the sheet
export const CSV_FILES = {
    april: { path: '/api/sheets/csv/april', month: 'April 2025', monthKey: 'april', order: 0 },
    may:   { path: '/api/sheets/csv/may',   month: 'May 2025',   monthKey: 'may',   order: 1 },
    june:  { path: '/api/sheets/csv/june',  month: 'June 2025',  monthKey: 'june',  order: 2 },
    july:  { path: '/api/sheets/csv/july',  month: 'July 2025',  monthKey: 'july',  order: 3 },
};

/**
 * Parse Indian formatted currency string to number.
 * "3,71,700"      → 371700
 * "2,94,995.28"   → 294995.28
 * "1,88.800"      → 188800  ← spreadsheet typo: period used instead of comma
 *                             Indian lakh format X,XX,XXX but entered as X,XX.XXX
 *
 * Typo detection rule:
 *   If we see X,XX.YYY where YYY is *exactly* 3 digits (no further decimals),
 *   the period is almost certainly a mistyped thousands-separator comma.
 *   Legitimate paise values always have ≤ 2 decimal digits (e.g. 96,70,132.33).
 */
export const parseIndianCurrency = (str) => {
    if (!str || typeof str !== 'string') return 0;
    let cleaned = str.trim().replace(/₹/g, '').replace(/\s/g, '');
    if (!cleaned) return 0;

    // Fix typo: "1,88.800" → "1,88,800"  (period before exactly-3-digit group = mistyped comma)
    cleaned = cleaned.replace(/(\d{1,3}),(\d{2})\.(\d{3})(?!\d)/, '$1,$2,$3');

    const num = parseFloat(cleaned.replace(/,/g, ''));
    return isNaN(num) ? 0 : num;
};

/**
 * Parse amount field that may contain multiple values separated by "+"
 * "2,94,995.28 + 2,94,273.12 + 3,78,613.62" → sum of all
 */
export const parseAmountField = (str) => {
    if (!str || typeof str !== 'string') return 0;
    const cleaned = str.trim();
    if (!cleaned) return 0;
    const parts = cleaned.split('+');
    let total = 0;
    for (const part of parts) {
        total += parseIndianCurrency(part);
    }
    return total;
};

/**
 * Parse a single sheet and return structured records.
 * Fetches CSV from backend proxy (which pulls from Google Sheets).
 */
export const parseCSVFile = async (fileConfig) => {
    try {
        const response = await fetch(fileConfig.path);

        if (!response.ok) {
            console.error(`[csvParser] Failed to fetch ${fileConfig.monthKey}: HTTP ${response.status}`);
            return [];
        }

        const csvText = await response.text();

        return new Promise((resolve) => {
            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    const records = results.data
                        .filter(row => row['Client Name'] && row['Client Name'].trim())
                        .map(row => {
                            const serviceMRR = parseAmountField(row['Service April MRR Amount(Rs)']);
                            const addonsMRR  = parseAmountField(row['Addons MRR Amount(Rs)']);

                            // Compute total from service + addons (CSV total column can have data-entry errors)
                            const finalTotal = serviceMRR + addonsMRR;

                            return {
                                month:         fileConfig.month,
                                monthKey:      fileConfig.monthKey,
                                monthOrder:    fileConfig.order,
                                contractStart: (row['Contract Start'] || '').trim(),
                                invoiceNumber: (row['Invoice Number'] || '').trim(),
                                clientName:    (row['Client Name'] || '').trim(),
                                services:      (row['Services'] || '').trim(),
                                addons:        (row['Addons'] || '').trim(),
                                clientType:    (row['Type'] || '').trim() || 'Retainer',
                                invoiceDate:   (row['Invoice Date'] || '').trim(),
                                serviceMRR,
                                addonsMRR,
                                totalMRR:      finalTotal,
                                paymentStatus: (row['Payment Status'] || '').trim() || 'Unpaid',
                                clientStatus:  (row['Client Status'] || '').trim() || 'Active',
                            };
                        });

                    resolve(records);
                },
                error: (error) => {
                    console.error(`[csvParser] PapaParse error for ${fileConfig.monthKey}:`, error);
                    resolve([]);
                },
            });
        });
    } catch (error) {
        console.error(`[csvParser] Network error fetching ${fileConfig.monthKey}:`, error);
        return [];
    }
};

// Module-level cache — Google Sheets data is fetched once per session
// Call invalidateCSVCache() to force a fresh fetch on next access
let _csvCache = null;
let _csvCachePromise = null;

/**
 * Load all sheets and return combined dataset.
 * Results are cached so subsequent calls return instantly.
 */
export const loadAllCSVData = async () => {
    if (_csvCache) return _csvCache;
    if (_csvCachePromise) return _csvCachePromise;

    _csvCachePromise = (async () => {
        const files = Object.values(CSV_FILES);
        const results = await Promise.all(files.map(f => parseCSVFile(f)));
        _csvCache = results.flat();
        _csvCachePromise = null;
        return _csvCache;
    })();

    return _csvCachePromise;
};

/**
 * Invalidate the in-memory cache so the next loadAllCSVData() call
 * re-fetches fresh data from Google Sheets via the backend proxy.
 */
export const invalidateCSVCache = () => {
    _csvCache = null;
    _csvCachePromise = null;
};

/**
 * Detect services from description text
 */
export const detectServices = (servicesText, addonsText) => {
    const combined = `${servicesText || ''} ${addonsText || ''}`.toLowerCase();
    const detected = [];

    const servicePatterns = {
        'Digital Marketing':    /digital marketing/i,
        'SEO':                  /\bseo\b/i,
        'Social Media':         /social media/i,
        'Content Marketing':    /content (marketing|creation|writing|creator)/i,
        'Performance Marketing':/performance marketing|google ads|ppc|lead (gen|campaign)/i,
        'Paid Ads':             /paid ads|promotions|campaign/i,
        'Web Development':      /website|web development|web revamp/i,
        'Design':               /design|branding/i,
        'Analytics':            /analytics/i,
        'E-Learning':           /e-content|lms|module|course|training/i,
        'Maintenance':          /maintenance|ssl/i,
        'Outdoor Advertising':  /outdoor advertising|signage|glow sign|flex board/i,
        // Solar/Hardware: require explicit "solar" or specific hardware terms.
        // "installation" alone is intentionally excluded — it's too generic and
        // matches unrelated phrases like "Glow Sign Boards Installation".
        'Solar/Hardware':       /\bsolar\b|solar panel|solar energy|solar installation|inverter|battery (storage|backup|pack)|hardware (supply|material|product|install)|photovoltaic|pv panel/i,
        'Lead Generation':      /lead (gen|campaign)|recruitment/i,
        'Email Marketing':      /email marketing/i,
        'Video Production':     /video|youtube|yt|shorts|ugc/i,
        'Travel Services':      /air ticket|hotel booking/i,
    };

    for (const [name, pattern] of Object.entries(servicePatterns)) {
        if (pattern.test(combined)) {
            detected.push(name);
        }
    }

    return detected.length > 0 ? detected : ['General Services'];
};

/**
 * All possible services for upsell comparison
 */
export const ALL_DIGITAL_SERVICES = [
    'SEO', 'PPC Ads', 'Social Media Management', 'Content Marketing',
    'Email Marketing', 'Analytics', 'Web Development', 'Design',
    'Performance Marketing', 'Video Production', 'Paid Ads',
];

export const ALL_ELEARNING_SERVICES = [
    'LMS Setup', 'Course Creation', 'Training Automation',
    'Certification Systems', 'E-Content Development',
];

/**
 * Normalize client name for matching across months
 */
export const normalizeClientName = (name) => {
    return (name || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/private limited|pvt\.? ltd\.?|limited|ltd\.?/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
};
