/**
 * Garage WalletTracker - Comprehensive Application Documentation Generator
 * Generates a professional Word document (.docx) documenting the entire web application
 *
 * Run: node generate-doc.js
 * Output: Garage_WalletTracker_Documentation.docx
 */

const {
    Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow,
    TableCell, WidthType, AlignmentType, BorderStyle, ShadingType,
    PageBreak, TabStopPosition, TabStopType, Header, Footer,
    ImageRun, NumberFormat, LevelFormat,
} = require('docx');
const fs = require('fs');

// ── Brand Colors ──────────────────────────────────────────────────────
const BRAND = {
    primaryBlue: '1F4788',
    indigo: '4F46E5',
    green: '28A745',
    red: 'DC3545',
    purple: '6F42C1',
    orange: 'FD7E14',
    gray900: '212529',
    gray700: '495057',
    gray500: '6C757D',
    gray300: 'DEE2E6',
    white: 'FFFFFF',
    background: 'F7F8FC',
};

// ── Reusable helpers ──────────────────────────────────────────────────
function heading(text, level = HeadingLevel.HEADING_1) {
    return new Paragraph({
        text,
        heading: level,
        spacing: { before: level === HeadingLevel.HEADING_1 ? 400 : 240, after: 120 },
    });
}

function h1(text) { return heading(text, HeadingLevel.HEADING_1); }
function h2(text) { return heading(text, HeadingLevel.HEADING_2); }
function h3(text) { return heading(text, HeadingLevel.HEADING_3); }

function para(text, opts = {}) {
    return new Paragraph({
        children: [new TextRun({ text, size: opts.size || 22, font: 'Calibri', color: opts.color || BRAND.gray700, bold: opts.bold, italics: opts.italics })],
        spacing: { after: opts.after || 120 },
        alignment: opts.alignment,
    });
}

function bold(text, opts = {}) {
    return para(text, { ...opts, bold: true, color: opts.color || BRAND.gray900 });
}

function bullet(text, level = 0) {
    return new Paragraph({
        children: [new TextRun({ text, size: 22, font: 'Calibri', color: BRAND.gray700 })],
        bullet: { level },
        spacing: { after: 60 },
    });
}

function richPara(runs, opts = {}) {
    return new Paragraph({
        children: runs.map(r => new TextRun({ size: 22, font: 'Calibri', color: BRAND.gray700, ...r })),
        spacing: { after: opts.after || 120 },
        alignment: opts.alignment,
    });
}

function pageBreak() {
    return new Paragraph({ children: [new PageBreak()] });
}

function spacer(pts = 200) {
    return new Paragraph({ text: '', spacing: { after: pts } });
}

function simpleTable(headers, rows) {
    const headerRow = new TableRow({
        tableHeader: true,
        children: headers.map(h => new TableCell({
            children: [new Paragraph({
                children: [new TextRun({ text: h, bold: true, size: 20, font: 'Calibri', color: BRAND.white })],
                alignment: AlignmentType.CENTER,
            })],
            shading: { type: ShadingType.CLEAR, fill: BRAND.primaryBlue },
            width: { size: Math.floor(100 / headers.length), type: WidthType.PERCENTAGE },
        })),
    });

    const dataRows = rows.map((row, ri) => new TableRow({
        children: row.map(cell => new TableCell({
            children: [new Paragraph({
                children: [new TextRun({ text: String(cell), size: 20, font: 'Calibri', color: BRAND.gray700 })],
            })],
            shading: ri % 2 === 0 ? { type: ShadingType.CLEAR, fill: BRAND.white } : { type: ShadingType.CLEAR, fill: 'F8F9FA' },
        })),
    }));

    return new Table({
        rows: [headerRow, ...dataRows],
        width: { size: 100, type: WidthType.PERCENTAGE },
    });
}

// ══════════════════════════════════════════════════════════════════════
//  DOCUMENT SECTIONS
// ══════════════════════════════════════════════════════════════════════

function coverPage() {
    return [
        spacer(600),
        new Paragraph({
            children: [new TextRun({ text: 'GARAGE WALLETTRACKER', size: 56, bold: true, font: 'Calibri', color: BRAND.primaryBlue })],
            alignment: AlignmentType.CENTER,
        }),
        spacer(80),
        new Paragraph({
            children: [new TextRun({ text: 'Comprehensive Application Documentation', size: 32, font: 'Calibri', color: BRAND.gray500 })],
            alignment: AlignmentType.CENTER,
        }),
        spacer(60),
        new Paragraph({
            children: [new TextRun({ text: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', size: 24, color: BRAND.indigo })],
            alignment: AlignmentType.CENTER,
        }),
        spacer(200),
        new Paragraph({
            children: [new TextRun({ text: 'Full-Stack Fintech Web Application', size: 28, font: 'Calibri', color: BRAND.gray700 })],
            alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
            children: [new TextRun({ text: 'Client Revenue Management | Wallet Share Analysis | Contract Renewals', size: 22, font: 'Calibri', color: BRAND.gray500 })],
            alignment: AlignmentType.CENTER,
        }),
        spacer(400),
        new Paragraph({
            children: [new TextRun({ text: 'Developed by: Garage Collective', size: 24, font: 'Calibri', color: BRAND.gray700, bold: true })],
            alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
            children: [new TextRun({ text: `Document Version: 1.0  |  Date: ${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}`, size: 20, font: 'Calibri', color: BRAND.gray500 })],
            alignment: AlignmentType.CENTER,
        }),
        spacer(100),
        new Paragraph({
            children: [new TextRun({ text: 'CONFIDENTIAL', size: 20, bold: true, font: 'Calibri', color: BRAND.red })],
            alignment: AlignmentType.CENTER,
        }),
        pageBreak(),
    ];
}

// ── Section 1: Table of Contents (manually formatted) ─────────────────
function tableOfContents() {
    const items = [
        ['1', 'Project Overview', '3'],
        ['2', 'Authentication Module', '5'],
        ['3', 'Layout Structure', '7'],
        ['4', 'Dashboard Module', '9'],
        ['5', 'Client Management Module', '13'],
        ['6', 'Individual Client Profile', '15'],
        ['7', 'Wallet Intelligence', '17'],
        ['8', 'AI Overview Module', '19'],
        ['9', 'Contracts & Renewals', '21'],
        ['10', 'Reports & Scheduling', '23'],
        ['11', 'Data Handling (CSV Architecture)', '25'],
        ['12', 'UI/UX Design System', '28'],
        ['13', 'Technical Architecture', '30'],
        ['14', 'Security Measures', '32'],
        ['15', 'Error Handling & Edge Cases', '33'],
        ['16', 'Settings & Profile', '34'],
        ['17', 'Future Scalability & Roadmap', '36'],
    ];

    return [
        h1('Table of Contents'),
        spacer(40),
        ...items.map(([num, title, page]) =>
            richPara([
                { text: `${num}.  `, bold: true, color: BRAND.indigo },
                { text: title, color: BRAND.gray900 },
                { text: `  ${'.' .repeat(60 - title.length)}  ${page}`, color: BRAND.gray500 },
            ])
        ),
        pageBreak(),
    ];
}

// ── Section 1: Project Overview ────────────────────────────────────────
function projectOverview() {
    return [
        h1('1. Project Overview'),
        para('Garage WalletTracker is a production-grade fintech web application designed for Garage Collective to manage client revenue, wallet share analysis, contract renewals, and upsell opportunities. The platform provides comprehensive business intelligence derived from monthly CSV invoice data spanning April through July 2025.'),

        h2('1.1 Purpose & Goals'),
        bullet('Track and visualize client revenue across multiple months and service categories'),
        bullet('Identify upsell opportunities by analyzing service gaps across clients'),
        bullet('Monitor contract status and flag expiring or at-risk contracts'),
        bullet('Provide AI-driven insights including churn risk prediction and revenue forecasting'),
        bullet('Generate professional reports in PDF, Excel, and CSV formats'),
        bullet('Enable share-of-wallet analysis for strategic business decisions'),

        h2('1.2 Technology Stack'),
        simpleTable(
            ['Layer', 'Technology', 'Version', 'Purpose'],
            [
                ['Frontend', 'React', '18+', 'UI components & SPA routing'],
                ['Build Tool', 'Vite', '5.4', 'Fast HMR, dev server, bundling'],
                ['Styling', 'TailwindCSS', '3.x', 'Utility-first CSS framework'],
                ['Charts', 'Recharts', '2.x', 'Interactive SVG chart library'],
                ['Data Parsing', 'PapaParse', '5.x', 'CSV parsing with streaming support'],
                ['PDF Export', 'jsPDF + AutoTable', '2.x', 'Client-side PDF generation'],
                ['Excel Export', 'xlsx (SheetJS)', '0.18+', 'Excel workbook generation'],
                ['File Download', 'file-saver', '2.x', 'Browser-based file downloads'],
                ['Backend', 'Node.js + Express', '18+ / 4.x', 'REST API server'],
                ['Database', 'PostgreSQL', '15+', 'Relational data storage'],
                ['Auth', 'JWT + bcrypt', '-', 'Secure token-based authentication'],
            ]
        ),
        spacer(100),

        h2('1.3 Application URLs'),
        bullet('Frontend: http://localhost:5173 (Vite dev server)'),
        bullet('Backend API: http://localhost:5000 (Express server)'),
        bullet('Database: PostgreSQL on localhost:5432, database name: wallettracker'),

        h2('1.4 Data Period'),
        para('The application processes invoice data from 4 monthly CSV files: April 2025, May 2025, June 2025, and July 2025. These files contain client names, service descriptions, addon details, invoice amounts in Indian Rupee format, payment statuses, and contract types.'),
        pageBreak(),
    ];
}

// ── Section 2: Authentication Module ──────────────────────────────────
function authenticationModule() {
    return [
        h1('2. Authentication Module'),
        para('The authentication system provides secure access control with JWT-based session management, role-based access control (RBAC), and comprehensive validation flows.'),

        h2('2.1 Login Page (/login)'),
        bullet('Clean centered layout with Garage logo and "Welcome to GarageWallet" heading'),
        bullet('Email and password input fields with real-time validation'),
        bullet('Password visibility toggle (eye icon)'),
        bullet('"Caps Lock is on" warning displayed when detected'),
        bullet('"Remember me" checkbox for session persistence'),
        bullet('"Forgot Password?" link navigating to /forgot-password'),
        bullet('Rate limiting: 5 failed attempts triggers 15-minute lockout'),
        bullet('CAPTCHA appears after 3 consecutive failed attempts'),
        bullet('Error message: "The email or password you entered is incorrect. Please try again."'),

        h2('2.2 Signup Page (/signup)'),
        bold('Required Fields & Validation Rules:'),
        simpleTable(
            ['Field', 'Validation', 'Error Message'],
            [
                ['Full Name', 'Min 2, Max 50 chars, letters + spaces only', '"Name must be at least 2 characters"'],
                ['Email', 'Valid email format, unique check', '"Please enter a valid email address" / "This email is already registered"'],
                ['Password', 'Min 8 chars, 1 uppercase, 1 number, 1 special', '"Password must be at least 8 characters"'],
                ['Confirm Password', 'Must match password', '"Passwords do not match"'],
                ['Terms', 'Must be checked', '"You must agree to Terms of Service to continue"'],
            ]
        ),
        spacer(60),
        bullet('Password strength indicator: Weak / Medium / Strong / Very Strong'),
        bullet('Real-time password rule checklist (checkmarks appear as rules are met)'),

        h2('2.3 Forgot Password Flow'),
        bullet('User enters registered email address'),
        bullet('System sends password reset link (valid for 1 hour)'),
        bullet('Unified response: "If an account exists with this email, a reset link has been sent"'),
        bullet('Reset page validates token, prompts for new password with same strength rules'),

        h2('2.4 Session Management'),
        bullet('JWT tokens stored in HTTP-only cookies (secure, sameSite: strict)'),
        bullet('30-minute session timeout with inactivity tracking'),
        bullet('Warning modal displayed at 28 minutes of inactivity'),
        bullet('Auto-logout at 30 minutes with redirect to login page'),
        bullet('Session refresh on every authenticated API call'),

        h2('2.5 Role-Based Access Control'),
        simpleTable(
            ['Role', 'Dashboard', 'Clients', 'Contracts', 'Reports', 'Settings', 'User Mgmt'],
            [
                ['Admin', 'Full', 'Full', 'Full', 'Full', 'Full', 'Full'],
                ['Account Manager', 'Full', 'Full', 'Full', 'Full', 'Own Profile', 'None'],
                ['Finance', 'View Only', 'View Only', 'View Only', 'Full', 'Own Profile', 'None'],
            ]
        ),
        pageBreak(),
    ];
}

// ── Section 3: Layout Structure ────────────────────────────────────────
function layoutStructure() {
    return [
        h1('3. Layout Structure'),
        para('All authenticated pages are wrapped in MainLayout, which provides a consistent three-part structure: a sticky Header at the top, a fixed-width Sidebar on the left, and a flexible main content area.'),

        h2('3.1 MainLayout Component'),
        para('File: frontend/src/components/layout/MainLayout.jsx'),
        bullet('Root container: min-h-screen with background color #F7F8FC'),
        bullet('Header renders at top, sticky with z-50'),
        bullet('Below header: flex container with Sidebar + main content'),
        bullet('Main content area: flex-1 with p-6 padding'),
        bullet('All protected route pages receive children prop for rendering inside this layout'),

        h2('3.2 Header Component'),
        para('File: frontend/src/components/layout/Header.jsx'),
        bullet('Sticky top navigation bar (bg-white, border-bottom)'),
        bullet('Left side: Garage logo image (h-9, auto width)'),
        bullet('Right side: Notification bell icon + Profile dropdown'),

        h3('3.2.1 Notification Bell'),
        bullet('Bell SVG icon with relative positioning for red dot indicator'),
        bullet('Click toggles dropdown panel (w-80, rounded-2xl, shadow)'),
        bullet('Shows "No notifications" placeholder when empty'),
        bullet('Dropdown lists notification items with title and timestamp'),

        h3('3.2.2 Profile Dropdown'),
        bullet('Shows user avatar (first letter of name in purple circle)'),
        bullet('Displays full name and role (hidden on mobile, visible on md+)'),
        bullet('Chevron-down icon for dropdown indicator'),
        bullet('Dropdown contains: "Profile Settings" (navigates to /settings) and "Logout" (red, calls logout and redirects to /login)'),

        h2('3.3 Sidebar Component'),
        para('File: frontend/src/components/layout/Sidebar.jsx'),
        bullet('Fixed-width sidebar: w-64, bg-white, border-right, min-h-screen'),
        bullet('Sticky positioning: top-16 (below 64px header)'),
        bullet('Navigation uses NavLink from React Router with active state detection'),

        h3('3.3.1 Sidebar Menu Items'),
        simpleTable(
            ['Menu Item', 'Route Path', 'Icon Description'],
            [
                ['Dashboard', '/dashboard', 'Home/house icon'],
                ['Client Management', '/clients', 'People/users group icon'],
                ['Wallet Intelligence', '/wallet', 'Bar chart icon'],
                ['AI Overview', '/ai-overview', 'Lightbulb icon'],
                ['Contracts & Renewals', '/contracts', 'Document icon'],
                ['Reports & Scheduling', '/reports', 'Chart document icon'],
                ['Settings & Profile', '/settings', 'Gear/cog icon'],
            ]
        ),
        spacer(60),
        bullet('Active state: bg-indigo-50 with primary blue text color'),
        bullet('Inactive state: text-gray-500, hover shows bg-gray-50'),
        bullet('Each item uses 13px font size with rounded-xl padding'),

        h3('3.3.2 Sidebar Footer'),
        bullet('Positioned absolute at bottom of sidebar'),
        bullet('Border-top separator'),
        bullet('Copyright text: "(c) 2026 Garage Collective" in text-xs gray-400'),
        pageBreak(),
    ];
}

// ── Section 4: Dashboard Module ────────────────────────────────────────
function dashboardModule() {
    return [
        h1('4. Dashboard Module'),
        para('File: frontend/src/pages/DashboardPage.jsx'),
        para('The Dashboard is the primary landing page after login. It provides a comprehensive real-time overview of business metrics, all driven by the useCSVData hook with dynamic date-range filtering.'),

        h2('4.1 Page Header'),
        bullet('Title: "Dashboard" (text-3xl, font-bold)'),
        bullet('Welcome message: "Welcome back, [User Name]" with name highlighted in primary blue'),
        bullet('Two action buttons: "+ Add Client" (blue, navigates to /clients) and "Export Report" (white/outlined, navigates to /reports)'),

        h2('4.2 Date Range Selector'),
        para('Component: DateRangeSelector.jsx'),
        bullet('Options: This Month (July 2025), Last Month (June 2025), YTD (Apr-Jul 2025), Q1 (Apr-Jun 2025), Custom'),
        bullet('Custom range allows selecting start/end month from April-July'),
        bullet('All dashboard data dynamically recalculates when range changes'),
        bullet('Period label displayed showing the active date context'),

        h2('4.3 KPI Cards'),
        para('Component: KPISection.jsx + KPICard.jsx'),
        bold('4 Key Performance Indicator cards displayed in a grid:'),
        simpleTable(
            ['KPI', 'Computation', 'Format'],
            [
                ['Total MRR', 'Sum of filteredClients[].filteredRevenue', 'Indian currency (e.g., Rs.29,28,939)'],
                ['Active Clients', 'Count of filteredClients', 'Number'],
                ['At-Risk Revenue', 'Sum of revenue from clients with status "At Risk"', 'Indian currency'],
                ['Avg Revenue/Client', 'Total MRR / Active Clients', 'Indian currency'],
            ]
        ),
        spacer(60),
        bullet('Each card: glass-card styling (bg-white/80, backdrop-blur-sm, rounded-2xl, shadow-card)'),
        bullet('Skeleton loader animation while data loads'),

        h2('4.4 Invoice Summary Bar'),
        bullet('Horizontal bar showing: Service MRR, Addons MRR, Total MRR, Invoice count with Paid count'),
        bullet('Computed from filteredData records for the selected period'),
        bullet('Glass-card styling with flex layout'),

        h2('4.5 Charts Section'),

        h3('4.5.1 Revenue Generated per Client (Bar Chart)'),
        para('Component: RevenueChart.jsx'),
        bullet('Stacked bar chart (Recharts BarChart) showing serviceMRR and addonsMRR per client'),
        bullet('Sorted by totalMRR descending'),
        bullet('Client names truncated to 20 chars with "..." suffix'),
        bullet('Custom tooltip showing full name, service MRR, addons MRR, and total'),
        bullet('Gradient fill with primary blue and indigo colors'),

        h3('4.5.2 Client AOV - Average Order Value (Bar Chart)'),
        para('Component: AOVChart.jsx'),
        bullet('Computed as filteredRevenue / number of active months'),
        bullet('Horizontal bar chart with client names on Y-axis'),
        bullet('Tooltip shows AOV value and months active'),

        h3('4.5.3 Monthly Revenue Trend (Line/Area Chart)'),
        para('Component: MonthlyTrendChart.jsx'),
        bullet('Full-width area chart spanning all 4 months (April-July)'),
        bullet('Lines for totalMRR, serviceMRR, and addonsMRR'),
        bullet('Also shows client count per month'),
        bullet('Uses raw data (not filtered) to always show complete trend'),

        h2('4.6 Client Revenue Overview Table'),
        para('Component: ClientRevenueTable.jsx'),
        bullet('Table columns: Client Name, Invoice #, Type, Service MRR, Addons MRR, Total MRR, Payment Status, Status'),
        bullet('Data mapped from filteredClients with latest record for invoice number'),
        bullet('Status badges: Active (green), At Risk (red)'),
        bullet('Payment Status badges: Paid (green), Unpaid (amber)'),
        bullet('Row hover effect with subtle background change'),

        h2('4.7 Service Revenue Mix'),
        para('Component: ServiceRevenueMix.jsx'),
        bullet('Vertical list of detected services with animated progress bars'),
        bullet('Each service shows: name, revenue amount, client count, percentage share'),
        bullet('Percentage computed from total service revenue across filtered data'),
        bullet('Services detected using regex pattern matching (detectServices function)'),

        h2('4.8 Contracts Expiring Soon'),
        para('Component: ContractsExpiring.jsx'),
        bullet('Lists contracts auto-generated from CSV data with estimated dates'),
        bullet('Color-coded urgency: red (expired), orange (1 month), yellow (2 months), green (3+ months)'),
        bullet('Shows client name, MRR, start/end date estimates'),

        h2('4.9 Upsell Opportunities'),
        para('Component: UpsellOpportunities.jsx + UpsellModal.jsx'),
        bullet('Lists clients with service gaps identified by comparing detected services vs full service catalog'),
        bullet('Each opportunity shows: client name, recommended services, potential gain, probability, priority'),
        bullet('Priority calculated: High (5+ missing), Medium (3-4 missing), Low (1-2 missing)'),
        bullet('Probability formula: min(85, 40 + monthCount*10 - missingCount*3)'),
        bullet('Clicking an opportunity opens UpsellModal with full details'),
        pageBreak(),
    ];
}

// ── Section 5: Client Management Module ────────────────────────────────
function clientManagement() {
    return [
        h1('5. Client Management Module'),
        para('File: frontend/src/pages/ClientsPage.jsx'),
        para('The Client Management page provides a comprehensive view of all clients extracted from CSV data with search, filter, sort, and navigation capabilities.'),

        h2('5.1 Page Header'),
        bullet('Title: "Client Management" (text-3xl, font-bold)'),
        bullet('Subtitle showing total client count and data source: "[N] clients tracked from CSV invoice data (April - July 2025)"'),

        h2('5.2 Statistics Cards'),
        bold('4 stats cards displayed in a responsive grid:'),
        simpleTable(
            ['Card', 'Value', 'Description'],
            [
                ['Total Clients', 'allClients.length', 'Shows active count below'],
                ['Total Revenue', 'Sum of all client revenue', 'Apr - Jul 2025 period'],
                ['Avg Revenue/Client', 'totalRevenue / clientCount', 'Per client total'],
                ['At Risk Clients', 'Count with status "At Risk"', '"Need attention" label'],
            ]
        ),

        h2('5.3 Filter & Search Bar'),
        bullet('Search input with magnifying glass icon - searches across client name, type, and services'),
        bullet('Status filter tabs: All, Active, At Risk - pill-style toggle buttons'),
        bullet('Sort dropdown: Revenue (default), Name, Services, Activity (months)'),
        bullet('Sort order toggle button (chevron rotates for asc/desc)'),
        bullet('All filters combine and update table in real-time via useMemo'),

        h2('5.4 Client Table'),
        para('Component: frontend/src/components/clients/ClientTable.jsx'),
        bullet('Columns: Client Name, Type, Total Revenue, Services, Avg MRR, Status, Actions'),
        bullet('Client type shown as badge: Retainer (indigo) or other types (orange)'),
        bullet('Services column: shows first 3 detected services + "+N more" badge'),
        bullet('Avg MRR calculated as totalRevenue / monthCount'),
        bullet('Status badges: Active (green), At Risk (red)'),
        bullet('Upsell badge (amber) appears if client has upsell opportunities'),
        bullet('"View Details" button navigates to /client/[normalizedName]'),
        bullet('Empty state with message when no clients match filters'),

        h2('5.5 Client Data Shape (from useCSVData)'),
        simpleTable(
            ['Field', 'Type', 'Description'],
            [
                ['id', 'string', 'Normalized client name (lowercase, no Pvt/Ltd)'],
                ['clientName', 'string', 'Most recent display name from CSV'],
                ['clientType', 'string', 'Business type (Retainer, etc.)'],
                ['detectedServices', 'string[]', 'Array of service names detected via regex'],
                ['months', 'object', 'Map of monthKey to monthly data with records'],
                ['totalRevenue', 'number', 'Sum of totalMRR across all months'],
                ['totalServiceMRR', 'number', 'Sum of serviceMRR across all months'],
                ['totalAddonsMRR', 'number', 'Sum of addonsMRR across all months'],
                ['monthCount', 'number', 'Number of months client appears in'],
                ['status', 'string', 'Active or At Risk (based on -15% revenue decline)'],
            ]
        ),
        pageBreak(),
    ];
}

// ── Section 6: Individual Client Profile ───────────────────────────────
function clientProfile() {
    return [
        h1('6. Individual Client Profile'),
        para('File: frontend/src/pages/ClientDetailPage.jsx'),
        para('Route: /client/:id where id is the URL-encoded normalized client name'),

        h2('6.1 Page Header'),
        bullet('Back button ("< Back to Clients") navigating to /clients'),
        bullet('Client name as page title'),
        bullet('Dynamic badge system based on revenue patterns:'),
        bullet('Growth Client badge (green): revenue increased > 10% MoM', 1),
        bullet('Declining badge (red): revenue decreased > 10% MoM', 1),
        bullet('Upsell Potential badge (amber): 3+ missing services', 1),
        bullet('Stable badge (gray): default for other clients', 1),

        h2('6.2 Client Summary Card'),
        bullet('Glass-card with key metrics:'),
        bullet('Client type badge (Retainer/Contractor)', 1),
        bullet('Total lifetime revenue', 1),
        bullet('Number of active months', 1),
        bullet('Number of detected services', 1),
        bullet('Detected services displayed as colored tag chips'),

        h2('6.3 Monthly Breakdown Tables'),
        para('Component: MonthlyTable.jsx'),
        bullet('One table per month (sorted newest first)'),
        bullet('Each table shows service breakdown with individual amounts'),
        bullet('Service detection: detectServices(record.services, \'\') for base services'),
        bullet('Addon detection: detectServices(\'\', record.addons) for addon services'),
        bullet('Revenue distributed evenly across detected services when individual amounts unavailable'),
        bullet('Columns: Service Name, Category, Amount, Type (Recurring/Addon)'),
        bullet('Monthly total shown in footer row'),

        h2('6.4 Addon Insight Cards'),
        para('Component: AddonInsightCard.jsx'),
        bullet('Shows addon analysis per month when addons exist'),
        bullet('Displays addon services detected vs addon MRR amount'),

        h2('6.5 Client Comparison Charts'),
        para('Component: ClientComparisonCharts.jsx (lazy-loaded with Suspense)'),
        bullet('Revenue Trend Line Chart: plots totalMRR per month'),
        bullet('Service vs Addons Stacked Bar: compares service and addon revenue by month'),
        bullet('All charts use Recharts with glass-card containers'),
        bullet('Loading fallback: animated pulse skeleton placeholder'),
        pageBreak(),
    ];
}

// ── Section 7: Wallet Intelligence ─────────────────────────────────────
function walletIntelligence() {
    return [
        h1('7. Wallet Intelligence'),
        para('File: frontend/src/pages/WalletIntelligencePage.jsx'),
        para('Share-of-wallet analysis providing revenue rankings, growth detection, service coverage analysis, and expansion opportunity identification across all CSV data.'),

        h2('7.1 Summary Cards (4-column grid)'),
        simpleTable(
            ['Card', 'Value', 'Description'],
            [
                ['Total Wallet', 'Sum of all client revenue', '[N] clients tracked'],
                ['Avg Client Revenue', 'totalWallet / clientCount', 'Across all months'],
                ['Highest Revenue', 'Top client total revenue', 'Client name shown'],
                ['At Risk / Declining', 'Count of declining clients', 'Revenue decline > 5%'],
            ]
        ),

        h2('7.2 Revenue Share Distribution (Pie Chart)'),
        bullet('Donut-style PieChart (Recharts) showing each client\'s share of total revenue'),
        bullet('Inner radius: 50, Outer radius: 110'),
        bullet('Percentage labels displayed directly on segments'),
        bullet('Vertical legend on right side showing client names'),
        bullet('Custom tooltip: client name, currency value, percentage'),
        bullet('10-color palette cycling through COLORS array'),

        h2('7.3 Client Revenue Ranking (Horizontal Bar Chart)'),
        bullet('Horizontal BarChart with clients on Y-axis, revenue on X-axis'),
        bullet('Axis formatter: values > 1L shown as "X.XL", otherwise "XK"'),
        bullet('Each bar colored from the same 10-color palette'),
        bullet('Sorted by total revenue descending'),

        h2('7.4 Month-over-Month Growth Analysis Table'),
        bullet('Filters to clients with 2+ months of data'),
        bullet('Columns: Client, Previous MRR, Latest MRR, Growth %, Months Active, Status'),
        bullet('Growth calculated: ((latest - previous) / previous) * 100'),
        bullet('Status badges: Fast Growing (>10%), Growing (>0%), Stable (>-5%), Declining (<-5%)'),
        bullet('Color coding: green for positive, yellow for flat, red for negative growth'),

        h2('7.5 Service Coverage Analysis'),
        bullet('Grid of service cards (1-3 columns responsive)'),
        bullet('Each card shows: service name, client count, coverage progress bar'),
        bullet('Progress bar width = (clientCount / totalClients) * 100%'),
        bullet('Percentage label showing adoption rate'),

        h2('7.6 Detailed Client Wallet Analysis Table'),
        bullet('Full table with columns: Client, Type, Total Revenue, Service MRR, Addons MRR, Services count, Months, Status'),
        bullet('Sorted by total revenue descending'),
        bullet('Type badges: Retainer (indigo), other (orange)'),
        bullet('Status badges: Active (green), At Risk (red)'),
        pageBreak(),
    ];
}

// ── Section 8: AI Overview ─────────────────────────────────────────────
function aiOverview() {
    return [
        h1('8. AI Overview Module'),
        para('File: frontend/src/pages/AIOverviewPage.jsx'),
        para('Provides AI-driven analytics generated from actual CSV client data including pattern recognition, churn risk scoring, revenue forecasting, and actionable recommendations.'),

        h2('8.1 Key Insights Panel'),
        bold('Auto-generated insights based on data patterns:'),
        simpleTable(
            ['Insight Type', 'Trigger Condition', 'Icon Color'],
            [
                ['Revenue Growth Detected', 'Fastest growing client identified', 'Green'],
                ['Churn Risk Alert', 'Clients with revenue decline > 5%', 'Red'],
                ['High-Priority Upsell', 'Clients with High priority upsell opportunities', 'Blue'],
                ['New Client Retention', 'Clients appearing in only 1 month', 'Purple'],
                ['Add-on Revenue Pattern', 'Analysis of addon purchase patterns', 'Blue'],
            ]
        ),
        spacer(40),
        bullet('Each insight displays: icon, title, description, confidence percentage'),
        bullet('Confidence scores calculated from data strength (e.g., months of data, growth magnitude)'),

        h2('8.2 Revenue Forecast (Area Chart)'),
        bullet('Predicts revenue for Aug-Dec 2025 using linear extrapolation from Apr-Jul trends'),
        bullet('Algorithm: calculates average MoM growth rate, applies compound growth'),
        bullet('Confidence interval shown as shaded band (predicted +/- 15% variance)'),
        bullet('Recharts AreaChart with gradient fill and dotted data points'),
        bullet('Axis: months on X, revenue in Lakhs on Y'),

        h2('8.3 Most Common Service Gaps (Bar Chart)'),
        bullet('Aggregates missing services from all upsell opportunities'),
        bullet('Vertical bar chart showing: service name on X-axis, client count on Y-axis'),
        bullet('Top 8 service gaps displayed, sorted by frequency'),
        bullet('Each bar in a distinct color from the palette'),

        h2('8.4 Churn Risk Prediction'),
        bold('Risk scoring formula:'),
        simpleTable(
            ['Factor', 'Points', 'Description'],
            [
                ['Single month only', '+30', 'Client in only 1 CSV file'],
                ['No July invoice', '+35', 'Client missing from latest month'],
                ['Revenue declined > 10%', '+25', 'Month-over-month decrease'],
                ['Limited service adoption', '+10', 'Only 1 or fewer services'],
                ['No add-on purchases', '+5', 'Zero addon MRR across all months'],
            ]
        ),
        spacer(40),
        bullet('Max risk score capped at 95'),
        bullet('Risk levels: High (60+), Medium (35-59), Low (21-34)'),
        bullet('Only clients with score > 20 are displayed'),
        bullet('Each card shows: risk score in colored box, client name, risk factors, revenue at risk'),

        h2('8.5 Recommendation Engine'),
        bold('Four recommendation categories:'),
        bullet('Bundle Missing Services: target clients with significant service gaps'),
        bullet('Re-engage Inactive Clients: target clients with no July invoice'),
        bullet('Cross-sell Add-on Services: target returning clients with zero addons'),
        bullet('Service Portfolio Expansion: target clients using 2 or fewer services'),
        bullet('Each recommendation shows: Impact level, Effort level, Expected Revenue'),
        bullet('Total potential revenue displayed at bottom'),
        pageBreak(),
    ];
}

// ── Section 9: Contracts & Renewals ────────────────────────────────────
function contractsRenewals() {
    return [
        h1('9. Contracts & Renewals'),
        para('File: frontend/src/pages/ContractsPage.jsx'),
        para('Auto-generated contract tracking from CSV invoice data with renewal status management, urgency indicators, and filterable views.'),

        h2('9.1 Contract Auto-Generation Logic'),
        bullet('Start date: estimated from first month the client appears in CSV data'),
        bullet('End date: estimated as 3 months after the last active month'),
        bullet('MRR: calculated as totalRevenue / monthCount'),
        bullet('Status: "Expiring" if monthsRemaining <= 0, otherwise "Active"'),
        bullet('Renewal status: "Needs Renewal" if expiring, "On Track" otherwise'),

        h2('9.2 Statistics Cards (4-column grid)'),
        simpleTable(
            ['Card', 'Value', 'Description'],
            [
                ['Total Contracts', 'All client contracts', 'Active count shown'],
                ['Expiring Soon', 'Contracts needing attention', 'Orange colored'],
                ['Total MRR', 'Sum of all contract MRR', 'Green colored'],
                ['Revenue at Risk', 'MRR from expiring contracts', 'Red colored'],
            ]
        ),

        h2('9.3 Filter Tabs'),
        bullet('All Contracts: shows complete list'),
        bullet('Expiring Soon: only contracts with isExpiringSoon flag or "Expiring" status'),
        bullet('Active: only contracts with Active status and not expiring'),
        bullet('Needs Renewal: only contracts with "Needs Renewal" renewal status'),
        bullet('Selected tab shown in primary blue with white text'),

        h2('9.4 Contract Cards'),
        bullet('Each contract rendered as a card with left border color indicating urgency:'),
        bullet('Red border: monthsRemaining <= 0 (expired)', 1),
        bullet('Orange border: monthsRemaining <= 1', 1),
        bullet('Yellow border: monthsRemaining <= 2', 1),
        bullet('Green border: monthsRemaining > 2 (healthy)', 1),
        spacer(40),
        bullet('Card displays: Client name, type, MRR/month, start date, end date, months remaining, months active, total revenue'),

        h2('9.5 Renewal Status Management'),
        bullet('Each contract has a dropdown for updating renewal status'),
        bold('Available status transitions (7 states):'),
        bullet('Not Started -> Client Contacted -> Proposal Sent -> Negotiating -> Awaiting Signature -> Renewed', 1),
        bullet('Any state (except Renewed) -> Lost', 1),
        bullet('Status changes are tracked in local state (renewalStatuses)'),
        pageBreak(),
    ];
}

// ── Section 10: Reports & Scheduling ──────────────────────────────────
function reportsScheduling() {
    return [
        h1('10. Reports & Scheduling'),
        para('File: frontend/src/pages/ReportsPage.jsx'),
        para('Comprehensive report generation system with 4 report types, 3 export formats, and quick data export capabilities. All reports are generated entirely from CSV data.'),

        h2('10.1 Report Types'),
        simpleTable(
            ['Report', 'Icon Color', 'Content'],
            [
                ['Monthly Revenue', 'Blue', 'Top clients by revenue, monthly trend data, service/addon breakdown'],
                ['Client Expansion', 'Green', 'Upsell opportunities, missing services, estimated gains, priority'],
                ['Service Performance', 'Purple', 'Service revenue, client adoption rate, market share %'],
                ['Risk & Churn', 'Red', 'At-risk clients, risk scores, revenue change, risk factors'],
            ]
        ),

        h2('10.2 Report Generation Flow'),
        bullet('1. User selects report type from 4 card options (click to select, border highlights)'),
        bullet('2. Clicks "Generate Report" button (disabled until type selected)'),
        bullet('3. 500ms simulated generation with spinner animation'),
        bullet('4. Report data computed from useCSVData hook values'),
        bullet('5. Preview panel appears with summary cards + data table/list'),
        bullet('6. Export buttons appear: PDF, Excel, CSV'),

        h2('10.3 Export Formats'),

        h3('10.3.1 PDF Export (jsPDF + jspdf-autotable)'),
        bullet('Branded header: Garage blue (#1F4788) rectangle bar with white text'),
        bullet('Title: "Garage WalletTracker" + report type + generation timestamp'),
        bullet('Summary section with labeled metrics'),
        bullet('Auto-table with proper headers, colored header row matching report type'),
        bullet('Page footer: "Page X of Y | Garage WalletTracker | Confidential"'),

        h3('10.3.2 Excel Export (xlsx/SheetJS)'),
        bullet('Multi-sheet workbook: "Summary" sheet + report-specific data sheet'),
        bullet('Summary sheet: Metric / Value columns for all summary stats'),
        bullet('Data sheet: full report data with proper column headers'),
        bullet('File naming: [ReportType]_Report_YYYY-MM-DD.xlsx'),

        h3('10.3.3 CSV Export (file-saver)'),
        bullet('Standard CSV format with headers row'),
        bullet('Values properly quoted with escaped double-quotes'),
        bullet('File naming: [ReportType]_Report_YYYY-MM-DD.csv'),

        h2('10.4 Quick Data Export Section'),
        bullet('Export All Clients (Excel): full client data with services, revenue, status'),
        bullet('Export All Clients (CSV): same data in CSV format'),
        bullet('Export Monthly Trend (CSV): month, totalMRR, serviceMRR, addonsMRR, clientCount'),
        bullet('All quick exports use direct data from useCSVData without generating a report'),

        h2('10.5 Report Preview'),
        bullet('Monthly Revenue: monthly trend cards (4 months) + top clients table'),
        bullet('Client Expansion: opportunity cards with priority badges and missing service tags'),
        bullet('Service Performance: service bars with progress indicators and percentage'),
        bullet('Risk & Churn: risk cards with score indicators, risk factor descriptions, and revenue bars'),
        pageBreak(),
    ];
}

// ── Section 11: Data Handling (CSV Architecture) ───────────────────────
function dataHandling() {
    return [
        h1('11. Data Handling (CSV Architecture)'),
        para('The application uses a fully client-side CSV-driven architecture where all business data is sourced from 4 monthly CSV files served as static assets. This eliminates real-time database dependency for data display.'),

        h2('11.1 CSV File Structure'),
        simpleTable(
            ['File', 'Path', 'Month', 'Order'],
            [
                ['april.csv', '/data/april.csv', 'April 2025', '0'],
                ['may.csv', '/data/may.csv', 'May 2025', '1'],
                ['june.csv', '/data/june.csv', 'June 2025', '2'],
                ['july.csv', '/data/july.csv', 'July 2025', '3'],
            ]
        ),

        h2('11.2 CSV Column Mapping'),
        para('File: frontend/src/utils/csvParser.js'),
        simpleTable(
            ['CSV Column Header', 'Mapped Field', 'Parser'],
            [
                ['Client Name', 'clientName', 'String, trimmed'],
                ['Services', 'services', 'String (service descriptions)'],
                ['Addons', 'addons', 'String (addon descriptions)'],
                ['Type', 'clientType', 'String, default "Retainer"'],
                ['Invoice Number', 'invoiceNumber', 'String'],
                ['Invoice Date', 'invoiceDate', 'String'],
                ['Contract Start', 'contractStart', 'String'],
                ['Service April MRR Amount(Rs)', 'serviceMRR', 'parseAmountField()'],
                ['Addons MRR Amount(Rs)', 'addonsMRR', 'parseAmountField()'],
                ['Total April MRR Amount(...)', 'totalMRR', 'parseAmountField()'],
                ['Payment Status', 'paymentStatus', 'String, default "Unpaid"'],
                ['Client Status', 'clientStatus', 'String, default "Active"'],
            ]
        ),

        h2('11.3 Indian Currency Parsing'),
        para('Function: parseIndianCurrency(str)'),
        bullet('Handles Indian number format: "3,71,700" -> 371700'),
        bullet('Handles decimal values: "2,94,995.28" -> 294995.28'),
        bullet('Strips currency symbols, commas, and whitespace'),

        para('Function: parseAmountField(str)'),
        bullet('Handles multi-value fields: "2,94,995.28 + 3,78,613.62" -> sum of all parts'),
        bullet('Splits by "+" separator and sums each parseIndianCurrency result'),

        h2('11.4 Service Detection System'),
        para('Function: detectServices(servicesText, addonsText)'),
        bold('Pattern matching rules:'),
        simpleTable(
            ['Service', 'Regex Pattern'],
            [
                ['Digital Marketing', '/digital marketing/i'],
                ['SEO', '/\\bseo\\b/i'],
                ['Social Media', '/social media/i'],
                ['Content Marketing', '/content (marketing|creation|writing|creator)/i'],
                ['Performance Marketing', '/performance marketing|google ads|ppc|lead (gen|campaign)/i'],
                ['Web Development', '/website|web development|web revamp/i'],
                ['Design', '/design|branding/i'],
                ['Analytics', '/analytics/i'],
                ['E-Learning', '/e-content|lms|module|course|training/i'],
                ['Video Production', '/video|youtube|yt|shorts|ugc/i'],
                ['Email Marketing', '/email marketing/i'],
            ]
        ),
        spacer(40),
        bullet('Combines services and addons text for matching'),
        bullet('Returns ["General Services"] if no patterns match'),

        h2('11.5 Client Name Normalization'),
        para('Function: normalizeClientName(name)'),
        bullet('Converts to lowercase, trims whitespace'),
        bullet('Removes: "Private Limited", "Pvt. Ltd.", "Limited", "Ltd."'),
        bullet('Collapses multiple spaces to single space'),
        bullet('Used as unique client ID for cross-month matching'),

        h2('11.6 useCSVData Hook'),
        para('File: frontend/src/hooks/useCSVData.js'),
        para('The central data engine that fetches CSV files once and provides computed data to all pages.'),

        bold('Exported values:'),
        bullet('loading, error - data fetch status'),
        bullet('rawData - all CSV records combined'),
        bullet('filteredData - records filtered by selected date range'),
        bullet('allClients - unique client list with aggregated data'),
        bullet('filteredClients - clients with period-specific revenue'),
        bullet('kpis - computed KPI metrics'),
        bullet('revenueChartData, aovChartData - chart-ready data'),
        bullet('monthlyTrend - 4-month revenue trend'),
        bullet('serviceRevenueMix - service breakdown'),
        bullet('upsellOpportunities - service gap analysis'),
        bullet('walletIntelligence - wallet analysis data'),
        bullet('contracts - auto-generated contract data'),
        bullet('getClientById(id), getClientByName(name) - lookup functions'),
        bullet('handleRangeChange, handleCustomRange - date range controls'),
        pageBreak(),
    ];
}

// ── Section 12: UI/UX Design System ────────────────────────────────────
function designSystem() {
    return [
        h1('12. UI/UX Design System'),
        para('The application follows a modern fintech-grade design language with glass morphism, subtle animations, and consistent component patterns throughout.'),

        h2('12.1 Color Palette'),
        simpleTable(
            ['Color Name', 'Hex Code', 'Usage'],
            [
                ['Primary Blue', '#1F4788', 'Headers, primary buttons, active sidebar'],
                ['Indigo', '#4F46E5', 'Active states, chart colors, links'],
                ['Green', '#28A745', 'Success states, growth indicators, revenue'],
                ['Red', '#DC3545', 'Error states, at-risk, decline indicators'],
                ['Purple', '#6F42C1', 'User avatars, chart accent color'],
                ['Orange', '#FD7E14', 'Warnings, expiring soon indicators'],
                ['Yellow', '#FFC107', 'Caution states, flat/stable indicators'],
                ['Background', '#F7F8FC', 'Page background color'],
                ['Card White', '#FFFFFF (80%)', 'Glass card backgrounds (with opacity)'],
                ['Border', '#DEE2E6', 'Card and section borders'],
                ['Text Primary', '#212529', 'Main text, headings'],
                ['Text Secondary', '#6C757D', 'Descriptions, labels, metadata'],
            ]
        ),

        h2('12.2 Glass Morphism Card Pattern'),
        para('The primary container pattern used throughout the application:'),
        bold('CSS Classes: bg-white/80 backdrop-blur-sm rounded-2xl shadow-card border border-gray-100/50'),
        bullet('Semi-transparent white background (80% opacity)'),
        bullet('Backdrop blur for frosted glass effect'),
        bullet('Large border radius (16px) for modern rounded corners'),
        bullet('Custom shadow (shadow-card defined in Tailwind config)'),
        bullet('Subtle border with 50% opacity'),

        h2('12.3 Typography'),
        simpleTable(
            ['Element', 'Classes', 'Usage'],
            [
                ['Page Title', 'text-3xl font-bold text-gray-900', 'Main page headings'],
                ['Section Title', 'text-base font-semibold text-gray-900', 'Card headers'],
                ['Body Text', 'text-sm text-gray-600', 'Descriptions, table cells'],
                ['Label', 'text-xs font-medium text-gray-500 uppercase tracking-wider', 'KPI labels, stat labels'],
                ['Metric', 'text-2xl font-medium', 'Large numbers, KPI values'],
            ]
        ),

        h2('12.4 Interactive States'),
        bullet('Button hover: opacity change, shadow increase, translateY(-2px) lift'),
        bullet('Card hover: shadow-dropdown, subtle scale effect'),
        bullet('Table row hover: bg-gray-50/50 transition-colors'),
        bullet('Tab active: primary blue background, white text, shadow-sm'),
        bullet('Tab inactive: bg-gray-50, text-gray-700, hover bg-gray-100'),
        bullet('All transitions: 200ms ease-in-out duration'),

        h2('12.5 Loading States'),
        bullet('Skeleton loaders: animate-pulse with gray rectangles matching content layout'),
        bullet('KPI cards: 4 rectangle placeholders in grid'),
        bullet('Tables: header + row placeholders'),
        bullet('Charts: large rectangle placeholder matching chart height'),
        bullet('Button loading: spinner animation + "Generating..." text'),

        h2('12.6 Badge System'),
        simpleTable(
            ['Badge Type', 'Colors', 'Usage'],
            [
                ['Active', 'bg-green-100 text-green-700', 'Client status, contract status'],
                ['At Risk', 'bg-red-100 text-red-700', 'Client risk status'],
                ['Retainer', 'bg-indigo-50 text-indigo-700', 'Client type'],
                ['High Priority', 'bg-red-100 text-red-700', 'Upsell priority'],
                ['Medium Priority', 'bg-yellow-100 text-yellow-700', 'Upsell priority'],
                ['Low Priority', 'bg-green-100 text-green-700', 'Upsell priority'],
                ['Growing', 'bg-green-100 text-green-700', 'Growth status'],
                ['Declining', 'bg-red-100 text-red-700', 'Growth status'],
                ['Service Tag', 'bg-indigo-50 text-indigo-600', 'Service chips'],
            ]
        ),
        pageBreak(),
    ];
}

// ── Section 13: Technical Architecture ─────────────────────────────────
function technicalArchitecture() {
    return [
        h1('13. Technical Architecture'),

        h2('13.1 Frontend Architecture'),
        para('The frontend follows a feature-based component organization with clear separation between pages, reusable components, data services, and state management.'),

        bold('Directory Structure:'),
        bullet('frontend/src/pages/ - Page-level components (12 pages)'),
        bullet('frontend/src/components/ - Reusable UI components organized by feature'),
        bullet('frontend/src/components/layout/ - Layout components (MainLayout, Header, Sidebar)'),
        bullet('frontend/src/components/dashboard/ - Dashboard-specific components (9 components)'),
        bullet('frontend/src/components/clients/ - Client page components (5 components)'),
        bullet('frontend/src/components/auth/ - Authentication forms (4 components)'),
        bullet('frontend/src/hooks/ - Custom React hooks (useAuth, useCSVData, useDebounce, useInactivity)'),
        bullet('frontend/src/context/ - React Context providers (AuthContext)'),
        bullet('frontend/src/services/ - API service layers (axios-based)'),
        bullet('frontend/src/utils/ - Utilities (csvParser, formatters, helpers, validators)'),
        bullet('frontend/src/routes/ - Routing (AppRouter, ProtectedRoute, RoleRoute)'),
        bullet('frontend/src/styles/ - Global CSS + Tailwind imports'),

        h2('13.2 Backend Architecture'),
        para('The backend follows the Controller -> Service -> Repository pattern with Express.js.'),
        bullet('backend/src/controllers/ - HTTP request handlers'),
        bullet('backend/src/services/ - Business logic layer'),
        bullet('backend/src/repositories/ - Database access layer (parameterized SQL)'),
        bullet('backend/src/middleware/ - Auth, RBAC, validation, error handling, rate limiting'),
        bullet('backend/src/routes/ - Express route definitions'),
        bullet('backend/src/config/ - Database connection, environment config'),
        bullet('backend/src/utils/ - Logger (Winston), helpers, constants'),

        h2('13.3 Routing Configuration'),
        para('File: frontend/src/routes/AppRouter.jsx'),
        simpleTable(
            ['Route', 'Component', 'Access'],
            [
                ['/login', 'LoginPage', 'Public (redirects to /dashboard if authenticated)'],
                ['/signup', 'SignupPage', 'Public (redirects to /dashboard if authenticated)'],
                ['/forgot-password', 'ForgotPasswordPage', 'Public'],
                ['/reset-password', 'ResetPasswordPage', 'Public'],
                ['/dashboard', 'DashboardPage', 'Protected'],
                ['/clients', 'ClientsPage', 'Protected'],
                ['/client/:id', 'ClientDetailPage', 'Protected'],
                ['/wallet', 'WalletIntelligencePage', 'Protected'],
                ['/ai-overview', 'AIOverviewPage', 'Protected'],
                ['/contracts', 'ContractsPage', 'Protected'],
                ['/reports', 'ReportsPage', 'Protected'],
                ['/settings', 'SettingsPage', 'Protected'],
                ['/', 'Redirect', 'To /dashboard or /login'],
                ['*', '404 Page', 'Public'],
            ]
        ),
        spacer(60),

        h2('13.4 State Management'),
        bullet('AuthContext: global authentication state (user, token, isAuthenticated)'),
        bullet('useCSVData: central data hook (fetches once, provides derived data via useMemo)'),
        bullet('Local state: page-specific filters, sorts, modals managed with useState'),
        bullet('No Redux or external state library - React Context + hooks pattern'),

        h2('13.5 Performance Optimizations'),
        bullet('CSV data fetched once on app mount via useEffect in useCSVData'),
        bullet('All derived data computed via useMemo with proper dependency arrays'),
        bullet('ClientComparisonCharts lazy-loaded with React.lazy() + Suspense'),
        bullet('Search inputs debounced to prevent excessive re-renders'),
        bullet('Client name truncation to prevent chart label overflow'),
        bullet('Chart ResponsiveContainer for automatic resize handling'),
        pageBreak(),
    ];
}

// ── Section 14: Security Measures ──────────────────────────────────────
function securityMeasures() {
    return [
        h1('14. Security Measures'),

        h2('14.1 Authentication Security'),
        bullet('Passwords hashed with bcrypt (12 salt rounds)'),
        bullet('JWT tokens stored in HTTP-only cookies (not accessible via JavaScript)'),
        bullet('Cookie flags: secure (production), sameSite: strict, maxAge: 30 minutes'),
        bullet('Account lockout after 5 failed login attempts (15-minute cooldown)'),
        bullet('CAPTCHA integration after 3 failed attempts'),

        h2('14.2 API Security'),
        bullet('Express-rate-limit: 5 requests per 15 minutes for login endpoint'),
        bullet('Helmet.js: security headers (CSP, X-Frame-Options, X-Content-Type-Options)'),
        bullet('CORS: restricted to frontend origin (http://localhost:5173)'),
        bullet('All database queries use parameterized SQL ($1, $2...) preventing SQL injection'),
        bullet('Input validation via express-validator on all endpoints'),

        h2('14.3 Session Management'),
        bullet('30-minute inactivity timeout with frontend timer (useInactivity hook)'),
        bullet('Warning modal at 28 minutes offering session extension'),
        bullet('Auto-logout at 30 minutes with token invalidation'),
        bullet('Session activity updated on every API call'),

        h2('14.4 Password Requirements'),
        bullet('Minimum 8 characters'),
        bullet('At least 1 uppercase letter'),
        bullet('At least 1 number'),
        bullet('At least 1 special character (!@#$%^&*)'),
        bullet('Password strength meter: Weak / Medium / Strong / Very Strong'),
        bullet('Whitespace stripped from pasted passwords'),

        h2('14.5 Frontend Security'),
        bullet('Protected routes: ProtectedRoute component wraps all authenticated pages'),
        bullet('Role-based rendering: RoleRoute component checks user.role'),
        bullet('Redirect to /login when token expired or missing'),
        bullet('No sensitive data stored in localStorage (only HTTP-only cookies)'),
        pageBreak(),
    ];
}

// ── Section 15: Error Handling ─────────────────────────────────────────
function errorHandling() {
    return [
        h1('15. Error Handling & Edge Cases'),

        h2('15.1 Data Loading Errors'),
        bullet('CSV fetch failure: "Failed to load data from CSV files" error banner (red, rounded-xl)'),
        bullet('Network disconnection: automatic retry behavior'),
        bullet('Empty CSV files: graceful degradation with empty state components'),

        h2('15.2 Authentication Errors'),
        bullet('Invalid credentials: "The email or password you entered is incorrect. Please try again."'),
        bullet('Account locked: "Too many login attempts. Please try again in 15 minutes"'),
        bullet('Session expired: redirect to login with session expiry message'),
        bullet('Unauthorized access (403): permission error page'),

        h2('15.3 Form Validation'),
        bullet('Real-time validation on blur and on change'),
        bullet('Error messages displayed below input fields in red text'),
        bullet('Submit buttons disabled until all required fields are valid'),
        bullet('Duplicate email/client name checked via API before submission'),

        h2('15.4 Empty States'),
        bullet('No clients: "No clients yet" with description and action button'),
        bullet('No matching search results: "No clients match this filter" message'),
        bullet('No contracts matching filter: "No contracts match this filter" with check icon'),
        bullet('No notifications: "No notifications" centered in dropdown'),
        bullet('No chart data: "No data" or "Insufficient data for predictions" messages'),

        h2('15.5 Loading States'),
        bullet('Every page has a dedicated skeleton loading state'),
        bullet('Skeleton uses animate-pulse class with gray rectangles'),
        bullet('Layout structure preserved during loading (same grid/flex as final content)'),
        bullet('Buttons show spinner + "Loading/Generating..." text during async operations'),

        h2('15.6 404 Page'),
        bullet('Catches all unmatched routes via Route path="*"'),
        bullet('Displays large "404" text, "Page not found" message, and "Go Home" link'),
        bullet('Centered layout with min-h-screen background'),
        pageBreak(),
    ];
}

// ── Section 16: Settings & Profile ─────────────────────────────────────
function settingsProfile() {
    return [
        h1('16. Settings & Profile'),
        para('File: frontend/src/pages/SettingsPage.jsx'),
        para('Multi-tab settings page accessible via sidebar or profile dropdown, with Profile, Security, Notifications, and User Management (Admin only) sections.'),

        h2('16.1 Tab Navigation'),
        bullet('Left sidebar with vertical tabs: Profile, Security, Notifications'),
        bullet('Admin users see additional "User Management" tab'),
        bullet('Active tab: primary blue background with white text'),
        bullet('Tabs use emoji icons for quick visual identification'),

        h2('16.2 Profile Tab'),
        bullet('Fields: Full Name (editable), Email (read-only, grayed), Phone Number, Department, Time Zone, Role (read-only)'),
        bullet('Time zone dropdown: Asia/Kolkata, America/New_York, America/Los_Angeles, Europe/London, Asia/Singapore'),
        bullet('"Save Changes" button with loading state'),
        bullet('Profile data fetched via settingsService.getUserProfile()'),

        h2('16.3 Security Tab'),
        bullet('Change Password form: Current Password, New Password, Confirm Password'),
        bullet('Validation: same rules as signup (8+ chars, uppercase, number, special)'),
        bullet('Success message: green banner "Password changed successfully" (auto-dismiss 5 seconds)'),
        bullet('Error display: red banner with specific error message'),
        bullet('All fields cleared after successful change'),

        h2('16.4 Notifications Tab'),
        bold('Email Notification Toggles:'),
        bullet('Contract Expiring Soon', 1),
        bullet('At-Risk Client Alert', 1),
        bullet('Upsell Opportunities', 1),
        bullet('Email Frequency: Real-time / Daily Digest / Weekly Summary', 1),

        bold('In-App Notification Toggles:'),
        bullet('Enable In-App Notifications', 1),
        bullet('Desktop Notifications (browser push)', 1),
        bullet('Notification Sound', 1),
        bullet('All toggles use styled checkbox with peer CSS pattern'),

        h2('16.5 User Management (Admin Only)'),
        bullet('Table showing all system users: Name, Email, Role, Status, Last Login'),
        bullet('Role dropdown per user: Admin, Account Manager, Finance'),
        bullet('Current user\'s role is read-only (disabled dropdown)'),
        bullet('Confirmation prompt before role change'),
        bullet('Status badges: Active (green), Inactive (gray)'),
        pageBreak(),
    ];
}

// ── Section 17: Future Scalability ─────────────────────────────────────
function futureScalability() {
    return [
        h1('17. Future Scalability & Roadmap'),

        h2('17.1 Architecture Readiness'),
        para('The current architecture is designed for seamless scaling:'),
        bullet('CSV-to-API migration: useCSVData hook can be refactored to fetch from REST API without changing any page components'),
        bullet('Backend already has full CRUD API endpoints for clients, contracts, and reports'),
        bullet('Database schema supports 1000+ clients and 10,000+ records'),
        bullet('Component modularity allows feature additions without refactoring existing code'),

        h2('17.2 Planned Enhancements'),

        h3('Short-term (1-3 months)'),
        bullet('Real-time database integration: replace CSV files with live API queries'),
        bullet('Edit Client modal: currently shows "coming soon" alert'),
        bullet('Add Client form: full modal with 11 validated fields'),
        bullet('Delete Client: confirmation dialog with soft-delete support'),
        bullet('Notification system: real-time in-app + email notifications'),

        h3('Medium-term (3-6 months)'),
        bullet('Two-Factor Authentication (2FA) with authenticator app support'),
        bullet('Slack integration for contract expiry and risk alerts'),
        bullet('Advanced report scheduling: cron-based automatic generation and email delivery'),
        bullet('Audit log: track all user actions (create, update, delete) with timestamps'),
        bullet('Data import wizard: upload new CSV files directly through the UI'),

        h3('Long-term (6-12 months)'),
        bullet('Predictive analytics: machine learning models for churn prediction'),
        bullet('Mobile application: React Native version with push notifications'),
        bullet('Multi-tenant support: multiple organizations on single platform'),
        bullet('API documentation: Swagger/OpenAPI auto-generated docs'),
        bullet('CI/CD pipeline: GitHub Actions for automated testing and deployment'),
        bullet('Docker containerization for consistent deployment environments'),

        h2('17.3 Performance Scaling Considerations'),
        bullet('Frontend: code splitting per route (already using React.lazy for heavy components)'),
        bullet('Backend: connection pooling (max 20 PostgreSQL connections)'),
        bullet('Caching: Redis for dashboard KPI caching (5-minute TTL)'),
        bullet('Database: proper indexing on all filter/sort columns'),
        bullet('Pagination: default 25 items, max 100 per page'),
        bullet('File storage: S3/Cloudinary for profile pictures and report files'),

        h2('17.4 Deployment Options'),
        simpleTable(
            ['Component', 'Recommended', 'Alternative'],
            [
                ['Frontend', 'Vercel / Netlify', 'Cloudflare Pages / AWS S3+CloudFront'],
                ['Backend', 'Railway / Render', 'DigitalOcean / AWS EC2'],
                ['Database', 'Supabase / Neon', 'AWS RDS / Heroku Postgres'],
                ['File Storage', 'AWS S3', 'Cloudinary / Azure Blob'],
                ['Monitoring', 'Sentry', 'Datadog / New Relic'],
            ]
        ),

        spacer(200),
        new Paragraph({
            children: [new TextRun({ text: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', size: 24, color: BRAND.indigo })],
            alignment: AlignmentType.CENTER,
        }),
        spacer(40),
        new Paragraph({
            children: [new TextRun({ text: 'End of Document', size: 24, bold: true, color: BRAND.gray500, font: 'Calibri' })],
            alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
            children: [new TextRun({ text: 'Garage WalletTracker - Confidential', size: 20, color: BRAND.gray500, font: 'Calibri', italics: true })],
            alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
            children: [new TextRun({ text: `Generated: ${new Date().toLocaleString('en-IN')}`, size: 18, color: BRAND.gray500, font: 'Calibri' })],
            alignment: AlignmentType.CENTER,
        }),
    ];
}

// ══════════════════════════════════════════════════════════════════════
//  MAIN - Assemble Document
// ══════════════════════════════════════════════════════════════════════

async function generateDocument() {
    console.log('Generating Garage WalletTracker Documentation...');

    const doc = new Document({
        creator: 'Garage Collective',
        title: 'Garage WalletTracker - Application Documentation',
        description: 'Comprehensive documentation for the Garage WalletTracker web application',
        styles: {
            default: {
                document: {
                    run: { font: 'Calibri', size: 22 },
                },
                heading1: {
                    run: { font: 'Calibri', size: 36, bold: true, color: BRAND.primaryBlue },
                    paragraph: { spacing: { before: 400, after: 160 } },
                },
                heading2: {
                    run: { font: 'Calibri', size: 28, bold: true, color: BRAND.indigo },
                    paragraph: { spacing: { before: 280, after: 120 } },
                },
                heading3: {
                    run: { font: 'Calibri', size: 24, bold: true, color: BRAND.gray900 },
                    paragraph: { spacing: { before: 200, after: 80 } },
                },
            },
        },
        numbering: {
            config: [{
                reference: 'default-bullet',
                levels: [
                    { level: 0, format: LevelFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT },
                    { level: 1, format: LevelFormat.BULLET, text: '\u25E6', alignment: AlignmentType.LEFT },
                ],
            }],
        },
        sections: [{
            properties: {
                page: {
                    margin: { top: 1440, right: 1200, bottom: 1440, left: 1200 },
                },
            },
            headers: {
                default: new Header({
                    children: [
                        new Paragraph({
                            children: [
                                new TextRun({ text: 'Garage WalletTracker  |  Application Documentation', size: 16, color: BRAND.gray500, font: 'Calibri', italics: true }),
                            ],
                            alignment: AlignmentType.RIGHT,
                        }),
                    ],
                }),
            },
            footers: {
                default: new Footer({
                    children: [
                        new Paragraph({
                            children: [
                                new TextRun({ text: 'Confidential  |  Garage Collective  |  ', size: 16, color: BRAND.gray500, font: 'Calibri' }),
                                new TextRun({ text: `Generated ${new Date().toLocaleDateString('en-IN')}`, size: 16, color: BRAND.gray500, font: 'Calibri' }),
                            ],
                            alignment: AlignmentType.CENTER,
                        }),
                    ],
                }),
            },
            children: [
                ...coverPage(),
                ...tableOfContents(),
                ...projectOverview(),
                ...authenticationModule(),
                ...layoutStructure(),
                ...dashboardModule(),
                ...clientManagement(),
                ...clientProfile(),
                ...walletIntelligence(),
                ...aiOverview(),
                ...contractsRenewals(),
                ...reportsScheduling(),
                ...dataHandling(),
                ...designSystem(),
                ...technicalArchitecture(),
                ...securityMeasures(),
                ...errorHandling(),
                ...settingsProfile(),
                ...futureScalability(),
            ],
        }],
    });

    const buffer = await Packer.toBuffer(doc);
    const outputPath = 'Garage_WalletTracker_Documentation.docx';
    fs.writeFileSync(outputPath, buffer);

    console.log(`\nDocument generated successfully!`);
    console.log(`Output: ${outputPath}`);
    console.log(`Size: ${(buffer.length / 1024).toFixed(1)} KB`);
    console.log(`Sections: 17 (Cover + TOC + 15 content sections)`);
}

generateDocument().catch(err => {
    console.error('Error generating document:', err);
    process.exit(1);
});
