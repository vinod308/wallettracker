/**
 * Google Sheets Proxy Route
 * Fetches CSV data from public Google Sheets and returns it to the frontend.
 * Caches responses (5-minute TTL) to avoid repeated API calls.
 * No authentication required — sheets are set to "Anyone can edit" (public).
 */

const express = require('express');
const router = express.Router();

const SPREADSHEET_ID = '1EKYKLaBwhmp_YVR070mIwaHoZFCZxZMgOYTnOxFwl-w';

// Sheet configuration — add future months here
const SHEETS_CONFIG = {
    april: { gid: '0',           month: 'April 2025', monthKey: 'april', order: 0 },
    may:   { gid: '1363399637',  month: 'May 2025',   monthKey: 'may',   order: 1 },
    june:  { gid: '196699132',   month: 'June 2025',  monthKey: 'june',  order: 2 },
    july:  { gid: '1370665613',  month: 'July 2025',  monthKey: 'july',  order: 3 },
};

// In-memory cache: { sheetName → { data: string, timestamp: number } }
const cache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const getFromCache = (key) => {
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
        cache.delete(key);
        return null;
    }
    return entry.data;
};

const setCache = (key, data) => {
    cache.set(key, { data, timestamp: Date.now() });
};

/**
 * GET /api/sheets/csv/:sheet
 * Returns raw CSV text for the given sheet name (april | may | june | july)
 */
router.get('/csv/:sheet', async (req, res) => {
    const { sheet } = req.params;
    const config = SHEETS_CONFIG[sheet];

    if (!config) {
        return res.status(404).json({
            error: 'Sheet not found',
            validSheets: Object.keys(SHEETS_CONFIG),
        });
    }

    // Serve from cache if available
    const cached = getFromCache(sheet);
    if (cached) {
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('X-Cache', 'HIT');
        return res.send(cached);
    }

    try {
        const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${config.gid}`;

        // Node 18+ has native fetch; works without extra packages
        const response = await fetch(url, {
            headers: { 'User-Agent': 'WalletTracker/1.0' },
        });

        if (!response.ok) {
            throw new Error(`Google Sheets responded with HTTP ${response.status}`);
        }

        const csvData = await response.text();

        if (!csvData || csvData.trim().length === 0) {
            throw new Error('Empty response from Google Sheets');
        }

        setCache(sheet, csvData);

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('X-Cache', 'MISS');
        res.setHeader('X-Sheet-Month', config.month);
        res.send(csvData);
    } catch (error) {
        console.error(`[SheetsProxy] Error fetching "${sheet}":`, error.message);
        res.status(502).json({
            error: 'Failed to fetch data from Google Sheets',
            sheet,
            details: error.message,
        });
    }
});

/**
 * GET /api/sheets/config
 * Returns metadata about available sheets (for flexible future-month additions)
 */
router.get('/config', (req, res) => {
    res.json({
        spreadsheetId: SPREADSHEET_ID,
        sheets: SHEETS_CONFIG,
        cacheStatus: Object.fromEntries(
            Object.keys(SHEETS_CONFIG).map(key => [
                key,
                cache.has(key) ? 'cached' : 'not cached',
            ])
        ),
    });
});

/**
 * POST /api/sheets/refresh
 * Clears the cache so the next request fetches fresh data from Google Sheets
 */
router.post('/refresh', (req, res) => {
    cache.clear();
    res.json({ success: true, message: 'Cache cleared — next fetch will pull fresh data from Google Sheets' });
});

module.exports = router;
