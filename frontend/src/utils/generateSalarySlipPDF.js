import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const getCompanyInfo = () => {
    try {
        const s = JSON.parse(localStorage.getItem('gw_settings') || '{}');
        return {
            name:      s.companyName  || '',
            gstin:     s.gstin        || '',
            pan:       s.pan          || '',
            address:   s.address      || '',
            city:      s.city         || '',
            email:     s.email        || 'invoices@moneygence.com',
            signatory: s.signatory    || 'Authorized Signatory',
            signatureDataUrl: s.signatureDataUrl || '',
        };
    } catch {
        return {
            name: '', gstin: '', pan: '', address: '', city: '',
            email: 'invoices@moneygence.com', signatory: 'Authorized Signatory',
            signatureDataUrl: '',
        };
    }
};

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function u1000(n) {
    if (n === 0) return '';
    if (n < 20) return ONES[n];
    if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + ONES[n % 10] : '');
    return ONES[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + u1000(n % 100) : '');
}

function numberToWords(amount) {
    const n = Math.round(amount);
    if (n === 0) return 'Zero';
    let r = '';
    const cr   = Math.floor(n / 10000000);
    const lakh = Math.floor((n % 10000000) / 100000);
    const thou = Math.floor((n % 100000) / 1000);
    const rem  = n % 1000;
    if (cr)   r += u1000(cr)   + ' Crore ';
    if (lakh) r += u1000(lakh) + ' Lakh ';
    if (thou) r += u1000(thou) + ' Thousand ';
    if (rem)  r += u1000(rem);
    return r.trim();
}

const fmtN  = (n) => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);
const fmtI  = (n) => new Intl.NumberFormat('en-IN').format(Math.round(n || 0));
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

export function computeSalaryBreakdown(grossSalary) {
    const gross  = parseFloat(grossSalary) || 0;
    const basic  = Math.round(gross * 0.50);
    const hra    = Math.round(gross * 0.20);
    const transport = Math.round(gross * 0.10);
    const special   = gross - basic - hra - transport;
    const pfEmp  = Math.round(basic * 0.12);
    const pt     = 200;
    const netPay = gross - pfEmp - pt;
    return { gross, basic, hra, transport, special, pfEmp, pt, netPay };
}

export function generateSalarySlipPDF(employee, slip) {
    const C   = getCompanyInfo();
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const PW = 210, ML = 12, MR = 12, CW = PW - ML - MR;
    const { basic, hra, transport, special, pfEmp, pt, netPay, gross } = computeSalaryBreakdown(employee.salary);
    const monthName  = MONTH_NAMES[(slip.month || 1) - 1];
    const year       = slip.year || new Date().getFullYear();
    const daysInMonth = new Date(year, slip.month, 0).getDate();
    const daysWorked  = slip.daysWorked || daysInMonth;

    const sf  = (style, size, gray = 0) => { doc.setFont('helvetica', style); doc.setFontSize(size); doc.setTextColor(gray, gray, gray); };
    const tx  = (str, x, y, opts = {}) => doc.text(String(str ?? ''), x, y, opts);
    const drect = (x, y, w, h, lw = 0.3) => { doc.setDrawColor(0, 0, 0); doc.setLineWidth(lw); doc.rect(x, y, w, h); };
    const dline = (x1, y1, x2, y2, lw = 0.3) => { doc.setDrawColor(0, 0, 0); doc.setLineWidth(lw); doc.line(x1, y1, x2, y2); };

    let y = 10;

    // ── 1. HEADER ──────────────────────────────────────────────────────────────
    // Colored top bar
    doc.setFillColor(79, 70, 229);
    doc.rect(ML, y, CW, 18, 'F');
    sf('bold', 14, 255);
    tx(C.name, ML + CW / 2, y + 7, { align: 'center' });
    sf('normal', 8, 200);
    tx([C.address, C.city].filter(Boolean).join(' | ') + ' | ' + C.email, ML + CW / 2, y + 13, { align: 'center' });
    y += 22;

    // Salary Slip title bar
    doc.setFillColor(243, 244, 246);
    doc.rect(ML, y, CW, 10, 'F');
    sf('bold', 11, 30);
    tx(`SALARY SLIP — ${monthName.toUpperCase()} ${year}`, ML + CW / 2, y + 7, { align: 'center' });
    y += 14;

    // ── 2. EMPLOYEE DETAILS ───────────────────────────────────────────────────
    drect(ML, y, CW, 30);
    dline(ML + CW / 2, y, ML + CW / 2, y + 30);

    const LEFT_ROWS = [
        ['Employee ID',   employee.employeeId  || '—'],
        ['Name',          employee.fullName     || '—'],
        ['Designation',   employee.designation  || '—'],
        ['Department',    employee.department   || '—'],
    ];
    const RIGHT_ROWS = [
        ['Employment Type', employee.employmentType || 'Full-time'],
        ['Bank Account',    employee.accountNumber  || '—'],
        ['PAN Number',      employee.panNumber      || '—'],
        ['Days Worked',     `${daysWorked} / ${daysInMonth}`],
    ];

    LEFT_ROWS.forEach((row, i) => {
        const ry = y + 5 + i * 6.5;
        sf('normal', 7, 100); tx(row[0] + ':', ML + 2, ry);
        sf('bold', 7.5, 0); tx(row[1], ML + 30, ry);
    });
    RIGHT_ROWS.forEach((row, i) => {
        const ry = y + 5 + i * 6.5;
        sf('normal', 7, 100); tx(row[0] + ':', ML + CW / 2 + 2, ry);
        sf('bold', 7.5, 0); tx(row[1], ML + CW / 2 + 38, ry);
    });
    y += 34;

    // ── 3. EARNINGS & DEDUCTIONS TABLES ───────────────────────────────────────
    const halfW = (CW - 4) / 2;

    // Earnings table
    autoTable(doc, {
        startY: y,
        head: [['Earnings', 'Amount (₹)']],
        body: [
            ['Basic Salary',           fmtI(basic)],
            ['House Rent Allowance',   fmtI(hra)],
            ['Transport Allowance',    fmtI(transport)],
            ['Special Allowance',      fmtI(special)],
            [{ content: 'GROSS EARNINGS', styles: { fontStyle: 'bold' } }, { content: fmtI(gross), styles: { fontStyle: 'bold' } }],
        ],
        margin: { left: ML, right: ML + halfW + 4 },
        tableWidth: halfW,
        tableLineColor: [0, 0, 0], tableLineWidth: 0.3,
        styles: { fontSize: 8, cellPadding: { top: 2, right: 3, bottom: 2, left: 3 }, lineColor: [0, 0, 0], lineWidth: 0.3, textColor: [0, 0, 0] },
        headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        columnStyles: { 0: { halign: 'left' }, 1: { halign: 'right' } },
    });

    // Deductions table
    autoTable(doc, {
        startY: y,
        head: [['Deductions', 'Amount (₹)']],
        body: [
            ['Provident Fund (12%)',  fmtI(pfEmp)],
            ['Professional Tax',     fmtI(pt)],
            ['', ''],
            ['', ''],
            [{ content: 'TOTAL DEDUCTIONS', styles: { fontStyle: 'bold' } }, { content: fmtI(pfEmp + pt), styles: { fontStyle: 'bold' } }],
        ],
        margin: { left: ML + halfW + 4, right: MR },
        tableWidth: halfW,
        tableLineColor: [0, 0, 0], tableLineWidth: 0.3,
        styles: { fontSize: 8, cellPadding: { top: 2, right: 3, bottom: 2, left: 3 }, lineColor: [0, 0, 0], lineWidth: 0.3, textColor: [0, 0, 0] },
        headStyles: { fillColor: [220, 38, 38], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        columnStyles: { 0: { halign: 'left' }, 1: { halign: 'right' } },
    });

    y = doc.lastAutoTable.finalY + 3;

    // ── 4. NET PAY BOX ────────────────────────────────────────────────────────
    doc.setFillColor(79, 70, 229);
    doc.rect(ML, y, CW, 14, 'F');
    sf('bold', 10, 255);
    tx('NET PAY', ML + 4, y + 9);
    tx(`₹ ${fmtI(netPay)}`, PW - MR - 4, y + 9, { align: 'right' });
    y += 18;

    // ── 5. AMOUNT IN WORDS ────────────────────────────────────────────────────
    drect(ML, y, CW, 12);
    sf('normal', 7, 100); tx('Net Pay in Words:', ML + 2, y + 4.5);
    sf('bold', 8, 0); tx('INR ' + numberToWords(netPay) + ' Only', ML + 2, y + 9.5);
    y += 16;

    // ── 6. NOTES ──────────────────────────────────────────────────────────────
    if (slip.notes?.trim()) {
        drect(ML, y, CW, 12);
        sf('normal', 7, 100); tx('Notes:', ML + 2, y + 4.5);
        sf('normal', 7.5, 0);
        doc.splitTextToSize(slip.notes.trim(), CW - 6).slice(0, 2).forEach((l, i) => tx(l, ML + 2, y + 9 + i * 3.5));
        y += 16;
    }

    // ── 7. SIGNATURE ─────────────────────────────────────────────────────────
    const SIG_H = 32;
    drect(ML, y, CW, SIG_H);
    dline(ML + CW / 2, y, ML + CW / 2, y + SIG_H);

    sf('normal', 7, 100);
    tx('Employee Signature', ML + CW / 4, y + 27, { align: 'center' });

    const RX = ML + CW * 0.75;
    sf('bold', 8, 0); tx('for ' + C.name, RX, y + 6, { align: 'center' });
    if (C.signatureDataUrl) {
        try { doc.addImage(C.signatureDataUrl, 'PNG', RX - 20, y + 8, 40, 12); } catch {}
    }
    dline(RX - 28, y + SIG_H - 8, RX + 28, y + SIG_H - 8);
    sf('normal', 7, 100); tx(C.signatory + ' — Authorised Signatory', RX, y + SIG_H - 4, { align: 'center' });
    y += SIG_H + 8;

    // ── 8. FOOTER ─────────────────────────────────────────────────────────────
    sf('normal', 7.5, 130);
    tx('This is a computer-generated salary slip and does not require a physical signature.', PW / 2, y, { align: 'center' });

    return doc;
}

export function downloadSalarySlipPDF(employee, slip) {
    const doc  = generateSalarySlipPDF(employee, slip);
    const name = `Salary-Slip-${employee.employeeId}-${MONTH_NAMES[(slip.month || 1) - 1]}-${slip.year}.pdf`;
    doc.save(name);
}

export function openSalarySlipInTab(employee, slip) {
    const doc  = generateSalarySlipPDF(employee, slip);
    const blob = doc.output('blob');
    const url  = URL.createObjectURL(blob);
    window.open(url, '_blank');
}
