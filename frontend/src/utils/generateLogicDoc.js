/**
 * Generate Functional Logic Documentation as a downloadable Word (.docx) file
 * Uses the `docx` library to produce a professionally formatted document
 */

import {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    WidthType, HeadingLevel, AlignmentType, BorderStyle, ShadingType,
    PageBreak,
} from 'docx';
import { saveAs } from 'file-saver';

// ── Color constants ──────────────────────────────────────────
const BLUE   = '1F4788';
const GREEN  = '28A745';
const RED    = 'DC3545';
const GRAY   = '6C757D';
const LTGRAY = 'F8F9FA';
const WHITE  = 'FFFFFF';

// ── Helper builders ──────────────────────────────────────────
const heading = (text, level = HeadingLevel.HEADING_1) =>
    new Paragraph({ heading: level, spacing: { before: 300, after: 120 }, children: [new TextRun({ text, bold: true, font: 'Calibri' })] });

const subheading = (text) => heading(text, HeadingLevel.HEADING_2);
const subsubheading = (text) => heading(text, HeadingLevel.HEADING_3);

const para = (text, opts = {}) =>
    new Paragraph({
        spacing: { after: 100 },
        children: [new TextRun({ text, size: 22, font: 'Calibri', ...opts })],
    });

const bold = (text) => para(text, { bold: true });
const italic = (text) => para(text, { italics: true, color: GRAY });

const bullet = (text, level = 0) =>
    new Paragraph({
        bullet: { level },
        spacing: { after: 60 },
        children: [new TextRun({ text, size: 22, font: 'Calibri' })],
    });

const formula = (text) =>
    new Paragraph({
        spacing: { before: 80, after: 80 },
        indent: { left: 400 },
        shading: { type: ShadingType.SOLID, color: 'F0F0F0' },
        children: [new TextRun({ text, size: 20, font: 'Consolas', color: '333333' })],
    });

const noBorder = { style: BorderStyle.NONE, size: 0, color: WHITE };
const thinBorder = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
const borders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };

const cell = (text, opts = {}) =>
    new TableCell({
        borders,
        shading: opts.header ? { type: ShadingType.SOLID, color: BLUE } : opts.shade ? { type: ShadingType.SOLID, color: LTGRAY } : undefined,
        width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
        children: [new Paragraph({
            spacing: { before: 40, after: 40 },
            children: [new TextRun({
                text: String(text),
                size: 20,
                font: 'Calibri',
                bold: !!opts.header,
                color: opts.header ? WHITE : '212529',
            })],
        })],
    });

const tableRow = (cells, isHeader = false) =>
    new TableRow({ children: cells.map(c => cell(c, { header: isHeader })) });

const table = (headers, rows) =>
    new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
            tableRow(headers, true),
            ...rows.map((r, i) => new TableRow({
                children: r.map(c => cell(c, { shade: i % 2 === 0 })),
            })),
        ],
    });

const spacer = () => new Paragraph({ spacing: { after: 200 }, children: [] });
const pageBreak = () => new Paragraph({ children: [new PageBreak()] });

// ── Main export function ─────────────────────────────────────
export const generateLogicDocument = async () => {
    const doc = new Document({
        creator: 'Garage WalletTracker',
        title: 'Functional Logic Documentation',
        description: 'Complete business logic, formulas, and decision rules for the Wallet Tracker system',
        sections: [{
            properties: {
                page: {
                    margin: { top: 1000, right: 1000, bottom: 1000, left: 1000 },
                },
            },
            children: [
                // ═══════════════════ TITLE PAGE ═══════════════════
                spacer(), spacer(), spacer(), spacer(),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 200 },
                    children: [new TextRun({ text: 'GARAGE WALLETTRACKER', size: 52, bold: true, font: 'Calibri', color: BLUE })],
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 100 },
                    children: [new TextRun({ text: 'Functional Logic Documentation', size: 36, font: 'Calibri', color: GRAY })],
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 400 },
                    children: [new TextRun({ text: 'Complete Business Logic, Formulas & Decision Rules', size: 24, font: 'Calibri', color: GRAY })],
                }),
                spacer(),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: `Generated: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`, size: 22, font: 'Calibri', color: GRAY })],
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 100 },
                    children: [new TextRun({ text: 'Audience: Product Managers & Business Analysts', size: 22, font: 'Calibri', color: GRAY })],
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 100 },
                    children: [new TextRun({ text: 'Data Source: CSV Invoice Files (April – July 2025) + Manual Entries', size: 22, font: 'Calibri', color: GRAY })],
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: 'Currency: Indian Rupees (INR, ₹)', size: 22, font: 'Calibri', color: GRAY })],
                }),

                pageBreak(),

                // ═══════════════ TABLE OF CONTENTS ═══════════════
                heading('TABLE OF CONTENTS'),
                para('Section 1 — Invoice Summary (Per Selected Period)'),
                para('Section 2 — Client Invoice Overview (Active vs At Risk)'),
                para('Section 3 — Contracts Expiring Soon & Upsell Opportunities'),
                para('Section 4 — At Risk Clients (Client Management Page)'),
                para('Section 5 — Revenue Value Calculation'),
                para('Section 6 — Month-over-Month Growth Analysis'),
                para('Section 7 — Detailed Client Wallet Analysis'),
                para('Section 8 — Key Insights (AI Panel)'),
                para('Section 9 — Churn Risk Prediction'),
                para('Section 10 — Recommendation Engine'),
                para('Section 11 — Revenue Forecast'),
                para('Section 12 — Service Revenue Mix'),
                para('Definitions Glossary'),
                para('Edge Cases'),

                pageBreak(),

                // ═══════════════ SECTION 1 ═══════════════
                heading('SECTION 1 — Invoice Summary (Per Selected Period)'),

                subheading('What It Shows'),
                para('A summary bar displaying: Service MRR total, Addons MRR total, Total MRR, number of invoices, and how many are paid — all scoped to the currently selected date range.'),

                subheading('How "Paid Clients" Count Is Determined'),
                para('A record counts as "paid" if its Payment Status field from the CSV contains the word "paid" (case-insensitive).'),
                bullet('Values like "Paid", "PAID", or "Partially Paid" all match'),
                bullet('Values like "Unpaid", "Pending", or blank do NOT match'),
                spacer(),
                bold('Formula:'),
                formula('Paid Count = count of records where paymentStatus contains "paid"'),
                formula('Total Invoices = count of records where invoiceNumber is not empty'),
                spacer(),
                bold('Example for June 2025:'),
                bullet('System filters all records where monthKey = "june"'),
                bullet('If 10 records exist, and all 10 have paymentStatus = "Paid" → shows "10 Paid"'),
                bullet('If 9 have "Paid" and 1 has "Unpaid" → shows "9 Paid"'),

                subheading('How Active vs Inactive Clients Are Determined'),
                para('The system uses two statuses:'),
                table(
                    ['Status', 'Condition'],
                    [
                        ['Active', 'Default status. Every client starts as Active.'],
                        ['At Risk', 'Revenue dropped 15% or more between two most recent months.'],
                    ]
                ),
                spacer(),
                para('There is no "Inactive" status in the current system. A client who existed last month but not this month still shows as "Active" (or "At Risk" if they met the decline threshold).'),

                subheading('How Missing Clients Are Detected'),
                bullet('The system builds a client list from ALL months (April through July, plus manually added months)'),
                bullet('Client identified by normalizing name: lowercase, collapse spaces, strip "Pvt Ltd" / "Private Limited" / "Ltd"'),
                bullet('If a client appears in April, May, June but NOT July → still in "All Clients" with monthCount = 3'),
                bullet('Status remains "Active" UNLESS revenue dropped 15%+ between two most recent months'),

                subheading('MRR Calculation Rule (Critical)'),
                formula('Total MRR = Service MRR + Addons MRR'),
                para('The CSV\'s own "Total" column is NEVER trusted. The system always recomputes the total as the sum of Service MRR and Addons MRR. This prevents data entry errors in the CSV from propagating.', { bold: true, color: RED }),

                subheading('Required Fields Used'),
                table(
                    ['Field', 'Source'],
                    [
                        ['Payment Status', 'CSV column, defaults to "Unpaid" if blank'],
                        ['Invoice Number', 'CSV column, used to count total invoices'],
                        ['Service MRR Amount', 'CSV column, parsed from Indian currency format'],
                        ['Addons MRR Amount', 'CSV column, parsed from Indian currency format'],
                    ]
                ),

                pageBreak(),

                // ═══════════════ SECTION 2 ═══════════════
                heading('SECTION 2 — Client Invoice Overview (Active vs At Risk)'),

                subheading('Active Client Calculation'),
                para('Definition: "Active Clients" on the dashboard = the number of unique clients who have at least one invoice record in the currently selected date range.'),
                bold('Formula:'),
                formula('Active Clients = count of distinct client names in filtered records'),
                spacer(),
                bold('Steps:'),
                bullet('Take all records matching the selected date range (e.g., "This Month" = July only)'),
                bullet('Normalize each client name (lowercase, remove legal suffixes)'),
                bullet('Count unique client names'),
                bullet('This count becomes the "Active Clients" KPI'),
                spacer(),
                bold('Example:'),
                para('If the date range is "This Month" (July) and 10 unique clients have July invoices → Active Clients = 10.'),

                subheading('At Risk Client Calculation'),
                para('A client is marked "At Risk" when their revenue declined by 15% or more between their two most recent months.'),
                bold('Formula:'),
                formula('Revenue Change % = ((Latest Month MRR − Previous Month MRR) / Previous Month MRR) × 100'),
                formula('If Revenue Change % ≤ −15 → Status = "At Risk"'),
                formula('Otherwise → Status = "Active"'),
                spacer(),
                bold('Required Conditions:'),
                bullet('Client must have data in at least 2 different months'),
                bullet('"Latest" and "Previous" determined by month order (July > June > May > April)'),
                bullet('If previous month MRR = 0, change is treated as 0% (not infinity)'),
                spacer(),
                bold('Example:'),
                para('Carrier Airconditioning had ₹2,00,000 in June and ₹1,60,000 in July'),
                formula('Change = ((1,60,000 − 2,00,000) / 2,00,000) × 100 = −20%'),
                para('Since −20% ≤ −15% → marked "At Risk"'),

                subheading('What Does NOT Trigger "At Risk"'),
                bullet('Missing from a month (no invoice in July) → does NOT trigger'),
                bullet('Having only 1 month of data → cannot compute change, stays "Active"'),
                bullet('Revenue decline of −14% → stays "Active" (threshold is strictly ≤ −15%)'),

                pageBreak(),

                // ═══════════════ SECTION 3 ═══════════════
                heading('SECTION 3 — Contracts Expiring Soon & Upsell Opportunities'),

                subheading('How Contracts Are Generated'),
                para('Contracts are auto-generated from CSV data, not manually entered. The system estimates contract dates based on when client invoices appear.'),
                spacer(),
                bold('Contract Start Date:'),
                para('The first month the client appears in the data.'),
                italic('Example: If earliest record is April → Start Date = 01-April-2025'),
                spacer(),
                bold('Contract End Date:'),
                para('Last month of data + 3 months (assumes 3-month contract cycles).'),
                italic('Example: If last invoice is July (order 3), end order = 3 + 3 = 6 → October 2025'),
                spacer(),
                bold('Months Remaining:'),
                formula('Months Remaining = End Month Order − Current Month Order (July = 3)'),
                bullet('If result ≤ 0 → Status = "Expiring", Renewal = "Needs Renewal"'),
                bullet('If result > 0 → Status = "Active", Renewal = "On Track"'),
                spacer(),
                bold('Is Expiring Soon:'),
                formula('True when End Month Order ≤ 4 (within 1 month of current)'),
                spacer(),
                bold('Days Until Expiry (dashboard):'),
                formula('Days Until Expiry = Months Remaining × 30'),
                spacer(),
                bold('Contract MRR:'),
                formula('Contract MRR = Client Total Revenue / Number of Months Active'),

                subheading('30/60/90 Day Filter'),
                table(
                    ['Filter', 'Rule'],
                    [
                        ['30 days', 'Shows contracts where daysUntilExpiry ≤ 30'],
                        ['60 days', 'Shows contracts where daysUntilExpiry ≤ 60'],
                        ['90 days', 'Shows contracts where daysUntilExpiry ≤ 90'],
                    ]
                ),

                subheading('How Potential Gain (Upsell) Is Calculated'),
                bold('Step 1 — Classify business type:'),
                bullet('If client uses "E-Learning" or "Course Creation" → eLearning client'),
                bullet('If client uses "Digital Marketing", "Social Media", "SEO", "Paid Ads", or "Performance Marketing" → Digital Marketing client'),
                bullet('Default → Digital Marketing'),
                spacer(),
                bold('Step 2 — Full service catalogs:'),
                table(
                    ['Type', 'Services in Catalog'],
                    [
                        ['Digital Marketing (11)', 'SEO, PPC Ads, Social Media Mgmt, Content Marketing, Email Marketing, Analytics, Web Dev, Design, Performance Marketing, Video Production, Paid Ads'],
                        ['eLearning (5)', 'LMS Setup, Course Creation, Training Automation, Certification Systems, E-Content Development'],
                    ]
                ),
                spacer(),
                bold('Step 3 — Find missing services:'),
                formula('Missing Services = Full Catalog − Client\'s Detected Services'),
                para('Matching is fuzzy (case-insensitive substring match in both directions).'),
                spacer(),
                bold('Step 4 — Calculate Estimated Gain:'),
                formula('Average Monthly Revenue = Client Total Revenue / Month Count'),
                formula('Estimated Gain = Number of Missing Services × (Average Monthly Revenue × 0.15)'),
                para('Each missing service is estimated to potentially add 15% of the client\'s average monthly spend.'),
                spacer(),
                bold('Example:'),
                bullet('Client total revenue ₹8,00,000 across 4 months → Avg Monthly = ₹2,00,000'),
                bullet('Missing 5 services from Digital catalog'),
                formula('Estimated Gain = 5 × (₹2,00,000 × 0.15) = 5 × ₹30,000 = ₹1,50,000'),
                spacer(),
                bold('Step 5 — Calculate Probability:'),
                formula('Probability = min(85, 40 + (Months Active × 10) − (Missing Count × 3))'),
                formula('Probability = max(20, result)   // Never below 20%'),
                para('Longer relationships increase probability. Many missing services reduce it slightly.'),
                spacer(),
                bold('Step 6 — Determine Priority:'),
                table(
                    ['Missing Services Count', 'Priority'],
                    [
                        ['5 or more', 'High'],
                        ['3 or 4', 'Medium'],
                        ['1 or 2', 'Low'],
                    ]
                ),
                spacer(),
                bold('Excluded Clients:'),
                para('"The Computers India" and "NTPC Education and Research Society" are excluded from upsell analysis entirely.'),

                pageBreak(),

                // ═══════════════ SECTION 4 ═══════════════
                heading('SECTION 4 — At Risk Clients (Client Management Page)'),

                subheading('How the System Marks a Client "At Risk"'),
                para('There is exactly one trigger for "At Risk" status:'),
                formula('Revenue Change between two most recent months ≤ −15%'),
                para('This is the ONLY condition. The system does not check payment delays, contract expiry dates, service usage reduction, or manual flags.', { bold: true }),

                subheading('Why Specific Clients Appear as "At Risk"'),
                para('Example: Carrier Airconditioning — their revenue declined more than 15% between their second-most-recent month and most-recent month.'),
                bold('Process:'),
                bullet('Sort all of the client\'s monthly data by month order (newest first)'),
                bullet('Take the top two months'),
                bullet('Compute: ((Latest MRR − Previous MRR) / Previous MRR) × 100'),
                bullet('If result ≤ −15% → "At Risk"'),

                subheading('Why Solar/Hardware Add-on Clients May Appear'),
                para('If a client\'s services are detected as "Solar/Hardware" (via regex: solar, inverter, battery, panel, installation), and their revenue dropped 15%+, they appear as "At Risk." These are NOT manually marked.'),

                subheading('Complete Risk Condition List'),
                table(
                    ['#', 'Condition', 'Triggers "At Risk"?'],
                    [
                        ['1', 'Revenue drop ≥ 15% between two most recent months', 'YES — only trigger'],
                        ['2', 'Client missing from latest month', 'No'],
                        ['3', 'Payment status is "Unpaid"', 'No'],
                        ['4', 'Contract expiring soon', 'No'],
                        ['5', 'Only 1 month of data', 'No (need 2 months)'],
                        ['6', 'Fewer services than before', 'No'],
                        ['7', 'Manual flag', 'No'],
                    ]
                ),

                pageBreak(),

                // ═══════════════ SECTION 5 ═══════════════
                heading('SECTION 5 — Revenue Value Calculation'),

                subheading('Data Sources'),
                table(
                    ['File', 'Period'],
                    [
                        ['april.csv', 'April 2025'],
                        ['may.csv', 'May 2025'],
                        ['june.csv', 'June 2025'],
                        ['july.csv', 'July 2025'],
                    ]
                ),
                para('Each CSV contains one row per client per month with columns for Service MRR, Addons MRR, and Total MRR.'),

                subheading('Which Invoices Are Included'),
                para('ALL invoices for the selected month are included, regardless of payment status, client status, or client type.'),

                subheading('Tax, Add-ons, and Unpaid Invoices'),
                table(
                    ['Question', 'Answer'],
                    [
                        ['Is tax included?', 'Tax is NOT separately tracked. Amounts are as-is from CSV.'],
                        ['Are add-ons included?', 'YES. Total = Service MRR + Addons MRR.'],
                        ['Are unpaid invoices counted?', 'YES. Payment status does not affect revenue totals.'],
                    ]
                ),

                subheading('Formula'),
                formula('Month Revenue = SUM of (Service MRR + Addons MRR) for every record in that month'),
                spacer(),
                bold('Example:'),
                bullet('Client A: Service MRR = ₹2,95,000, Addons MRR = ₹50,000 → ₹3,45,000'),
                bullet('Client B: Service MRR = ₹1,88,800, Addons MRR = ₹0 → ₹1,88,800'),
                bullet('April Revenue = ₹3,45,000 + ₹1,88,800 + ... (sum of all clients)'),

                subheading('How Indian Currency Is Parsed'),
                bullet('Remove ₹ symbols and spaces'),
                bullet('Remove all commas'),
                bullet('Parse as decimal number'),
                bullet('Values with "+" (like "2,94,995.28 + 3,78,613.62") → split by "+", parse each part, sum'),

                pageBreak(),

                // ═══════════════ SECTION 6 ═══════════════
                heading('SECTION 6 — Month-over-Month Growth Analysis'),

                subheading('Calculation Logic'),
                formula('Growth % = ((Current Month MRR − Previous Month MRR) / Previous Month MRR) × 100'),
                para('"Current" and "Previous" = the client\'s two most recent months sorted by month order, NOT necessarily consecutive calendar months.'),
                spacer(),
                bold('Example:'),
                bullet('Client has April (₹2,00,000) and July (₹2,50,000), no May/June'),
                bullet('Latest = July, Previous = April'),
                formula('Growth = ((2,50,000 − 2,00,000) / 2,00,000) × 100 = +25%'),

                subheading('What Counts as Revenue'),
                formula('Total MRR = Service MRR + Addons MRR (for all records in that month for that client)'),

                subheading('Edge Cases'),
                table(
                    ['Scenario', 'Behavior'],
                    [
                        ['Previous month MRR = 0', 'Growth % treated as 0% (no division by zero)'],
                        ['Only 1 month of data', 'Excluded from growth analysis'],
                        ['Client missing from recent months', 'Growth compares their two most recent months'],
                    ]
                ),

                subheading('Status Labels'),
                table(
                    ['Growth %', 'Status Label'],
                    [
                        ['> +10%', 'Fast Growing'],
                        ['> 0% (but ≤ 10%)', 'Growing'],
                        ['0% to −5%', 'Stable'],
                        ['Below −5%', 'Declining'],
                    ]
                ),

                pageBreak(),

                // ═══════════════ SECTION 7 ═══════════════
                heading('SECTION 7 — Detailed Client Wallet Analysis'),

                subheading('Wallet Share (Revenue Contribution %)'),
                formula('Client Wallet Share % = (Client Total Revenue / Total Wallet) × 100'),
                para('Total Wallet = sum of all clients\' total revenue across all months.'),
                spacer(),
                bold('Example:'),
                bullet('Enrich Data Services total = ₹33,04,000'),
                bullet('Total Wallet = ₹1,17,15,756'),
                formula('Wallet Share = (33,04,000 / 1,17,15,756) × 100 = 28.2%'),

                subheading('Revenue Ranking'),
                para('Clients sorted by totalRevenue descending. Highest cumulative revenue across all months = rank #1.'),

                subheading('Add-on Dependency'),
                formula('Addon Dependency = Client\'s Total Addons MRR across all months'),
                para('If ₹0, the client has no add-on purchases.'),

                subheading('Growth Pattern Classification'),
                para('Same formula as Section 6. Badges on Client Detail Page:'),
                table(
                    ['Condition', 'Badge'],
                    [
                        ['Growth > +10%', 'Growth Client'],
                        ['Growth < −10%', 'Declining'],
                        ['3+ missing services, not growing/declining', 'Upsell Potential'],
                        ['None of the above', 'Stable'],
                    ]
                ),

                pageBreak(),

                // ═══════════════ SECTION 8 ═══════════════
                heading('SECTION 8 — Key Insights (AI Panel)'),

                subheading('How Insights Are Generated'),
                para('All insights are RULE-BASED, NOT AI-generated. The system applies fixed rules to CSV data and produces formatted text. No machine learning or language models are used.', { bold: true }),

                subheading('Insight Rules'),
                table(
                    ['Insight', 'Trigger', 'Confidence'],
                    [
                        ['Revenue Growth Detected', 'At least 1 client with 2+ months and positive growth', 'min(95, 70 + |growth%|)'],
                        ['Churn Risk Alert', 'At least 1 client with growth < −5%', 'Fixed 78%'],
                        ['High-Priority Upsell', 'At least 1 upsell with priority = "High"', 'Fixed 85%'],
                        ['New Client Retention', 'At least 1 client with only 1 month of data', 'Fixed 72%'],
                        ['Add-on Revenue Pattern', 'At least 1 client has addons MRR > 0', 'Fixed 80%'],
                    ]
                ),

                pageBreak(),

                // ═══════════════ SECTION 9 ═══════════════
                heading('SECTION 9 — Churn Risk Prediction'),

                subheading('Risk Score Calculation'),
                para('The system assigns points for each risk factor and sums them. Maximum capped at 95.'),
                spacer(),
                table(
                    ['Risk Factor', 'Points', 'Condition'],
                    [
                        ['Single month engagement', '+30', 'Client has data in only 1 month'],
                        ['No July invoice', '+35', 'Client has no record for July (latest month)'],
                        ['Revenue declined >10%', '+25', 'revenueChange < −10% between two most recent months'],
                        ['Limited service adoption', '+10', 'Client has 1 or fewer detected services'],
                        ['No add-on purchases', '+5', 'Total addons MRR across all months = ₹0'],
                    ]
                ),
                spacer(),
                bold('Formula:'),
                formula('Risk Score = sum of applicable factors (capped at 95)'),

                subheading('Risk Levels'),
                table(
                    ['Risk Score', 'Level'],
                    [
                        ['≥ 60', 'High'],
                        ['35 to 59', 'Medium'],
                        ['21 to 34', 'Low'],
                        ['≤ 20', 'Not shown (filtered out)'],
                    ]
                ),

                subheading('Example Calculation'),
                bold('Client "XYZ Corp" — appeared only in April, 1 service, no add-ons:'),
                table(
                    ['Factor', 'Points'],
                    [
                        ['Single month (1 month only)', '+30'],
                        ['No July invoice', '+35'],
                        ['Limited services (1 service)', '+10'],
                        ['No add-ons', '+5'],
                        ['TOTAL', '80'],
                    ]
                ),
                para('Risk Score = 80 → High Risk'),
                spacer(),
                bold('Client "ABC Ltd" — April through July, 3 services, has add-ons, revenue flat:'),
                table(
                    ['Factor', 'Points'],
                    [
                        ['Not single month', '+0'],
                        ['Has July invoice', '+0'],
                        ['Revenue not declining >10%', '+0'],
                        ['Has 3 services', '+0'],
                        ['Has add-ons', '+0'],
                        ['TOTAL', '0'],
                    ]
                ),
                para('Risk Score = 0 → Not shown (below threshold of 20)'),

                subheading('Factor Weightage'),
                para('The factors are NOT percentage-weighted like a traditional risk model. They use fixed point values:'),
                bullet('No July invoice: 35 pts (heaviest — implies potential churn)'),
                bullet('Single month: 30 pts (new client, high uncertainty)'),
                bullet('Revenue decline: 25 pts (direct signal of disengagement)'),
                bullet('Few services: 10 pts (low stickiness)'),
                bullet('No add-ons: 5 pts (minimal cross-sell, weakest signal)'),

                pageBreak(),

                // ═══════════════ SECTION 10 ═══════════════
                heading('SECTION 10 — Recommendation Engine'),

                subheading('How Recommendations Are Generated'),
                para('All recommendations are rule-based. The system checks specific data conditions and generates fixed recommendation templates. No AI or machine learning is involved.'),

                subheading('Recommendation Rules'),
                table(
                    ['Recommendation', 'Trigger', 'Impact', 'Effort', 'Expected Revenue Formula'],
                    [
                        ['Bundle Missing Services', '≥1 high-priority upsell', 'High', 'Low', 'Sum of estimatedGain for all high-priority upsells'],
                        ['Re-engage Inactive Clients', '≥1 client has no July invoice', 'High', 'Medium', '(Total Revenue / Month Count) × 0.5 per client'],
                        ['Cross-sell Add-on Services', '≥1 client with 2+ months, no add-ons', 'Medium', 'Low', 'Count × Avg addon value × 0.3'],
                        ['Service Portfolio Expansion', '≥1 client with 2+ months, ≤2 services', 'Medium', 'Medium', 'Count × ₹1,50,000 (fixed estimate)'],
                    ]
                ),
                spacer(),
                para('Recommendations sorted by Expected Revenue descending — highest potential impact shown first.'),

                pageBreak(),

                // ═══════════════ SECTION 11 ═══════════════
                heading('SECTION 11 — Revenue Forecast'),

                subheading('How Future Revenue Is Predicted'),
                para('The system uses simple linear extrapolation — not a statistical model or AI.'),
                spacer(),
                bold('Steps:'),
                bullet('Take all months that have data (e.g., April, May, June, July)'),
                bullet('Compute growth rate between each consecutive pair'),
                bullet('Average all growth rates'),
                bullet('Project forward 5 months (Aug through Dec)'),
                spacer(),
                bold('Formulas:'),
                formula('Growth Rate(i) = (Month[i] MRR − Month[i−1] MRR) / Month[i−1] MRR'),
                formula('Avg Growth Rate = Sum of all growth rates / (months − 1)'),
                formula('Predicted MRR for Month N = Last Actual MRR × (1 + Avg Growth Rate)^N'),
                spacer(),
                bold('Confidence Interval:'),
                formula('Upper Bound = Predicted × 1.15'),
                formula('Lower Bound = Predicted × 0.85'),
                spacer(),
                bold('Example:'),
                bullet('April = ₹24L, May = ₹25L, June = ₹26L, July = ₹27L'),
                bullet('Growth rates: 4.17%, 4.00%, 3.85% → Average: 4.01%'),
                formula('August = ₹27,00,000 × 1.0401 = ₹28,08,270'),
                formula('September = ₹27,00,000 × 1.0401² = ₹29,20,856'),

                pageBreak(),

                // ═══════════════ SECTION 12 ═══════════════
                heading('SECTION 12 — Service Revenue Mix'),

                subheading('How Service Revenue Is Allocated'),
                para('When a client uses multiple services, the revenue is split equally among all detected services.'),
                formula('Revenue Per Service = Client\'s Total MRR / Number of Detected Services'),
                spacer(),
                bold('Example:'),
                bullet('Client has Total MRR = ₹3,00,000 and 3 services (SEO, Social Media, Design)'),
                bullet('Each service gets attributed ₹1,00,000'),

                subheading('Service Revenue Share %'),
                formula('Service Share % = (Service Total Revenue / Sum of All Services Revenue) × 100'),

                pageBreak(),

                // ═══════════════ DEFINITIONS ═══════════════
                heading('DEFINITIONS GLOSSARY'),
                table(
                    ['Term', 'Definition'],
                    [
                        ['MRR', 'Monthly Recurring Revenue — Service MRR + Addons MRR for one record'],
                        ['Service MRR', 'Revenue from core services (CSV "Service MRR Amount" column)'],
                        ['Addons MRR', 'Revenue from add-on services (CSV "Addons MRR Amount" column)'],
                        ['Total MRR', 'Always calculated as Service MRR + Addons MRR (CSV total ignored)'],
                        ['Total Revenue', 'Sum of Total MRR across all months for a client'],
                        ['Active Client', 'Default status; every client with invoice data'],
                        ['At Risk', 'Client whose revenue dropped ≥ 15% between two most recent months'],
                        ['Month Order', 'Sorting value: Jan=−3, Feb=−2, Mar=−1, Apr=0, May=1, Jun=2, Jul=3, Aug=4 ... Dec=8'],
                        ['Normalized Name', 'Lowercase, collapsed spaces, stripped "Pvt Ltd" / "Private Limited" / "Ltd"'],
                        ['Detected Services', 'Services identified by regex pattern matching on CSV text fields'],
                        ['Wallet Share', 'Client\'s total revenue as a % of all clients\' total revenue'],
                        ['Estimated Gain', 'Missing services count × 15% of client avg monthly revenue'],
                    ]
                ),

                spacer(),

                // ═══════════════ EDGE CASES ═══════════════
                heading('EDGE CASES'),
                table(
                    ['Scenario', 'System Behavior'],
                    [
                        ['Client exists in April but not July', 'Still "Active" (not "At Risk" unless revenue dropped 15%+)'],
                        ['Client has only 1 month of data', 'Cannot compute growth → stays "Active", +30 pts churn risk'],
                        ['Previous month MRR = 0', 'Growth % treated as 0% (no division by zero)'],
                        ['CSV total column has wrong value', 'Ignored — system always computes Service + Addons'],
                        ['Client name varies slightly across CSVs', 'Normalized (lowercase, strip suffixes) for matching'],
                        ['No clients in selected date range', 'All KPIs show 0, empty state messages displayed'],
                        ['Same client+service+month added twice', 'Upsert: replaces existing record instead of duplicating'],
                    ]
                ),

                spacer(),
                spacer(),

                // ═══════════════ FOOTER ═══════════════
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 400 },
                    children: [new TextRun({ text: '— End of Document —', size: 22, font: 'Calibri', color: GRAY, italics: true })],
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 100 },
                    children: [new TextRun({ text: 'Garage WalletTracker | Confidential', size: 18, font: 'Calibri', color: GRAY })],
                }),
            ],
        }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `WalletTracker_Functional_Logic_Documentation_${new Date().toISOString().split('T')[0]}.docx`);
};
