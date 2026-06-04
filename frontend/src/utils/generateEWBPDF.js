import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const getSellerInfo = () => {
    try {
        const s = JSON.parse(localStorage.getItem('gw_settings') || '{}');
        return {
            name:      s.companyName || '',
            gstin:     s.gstin       || '',
            address:   s.address     || '',
            city:      s.city        || '',
            state:     s.state       || '',
            stateCode: s.stateCode   || '',
            pin:       s.pin         || '',
        };
    } catch { return { name:'', gstin:'', address:'', city:'', state:'', stateCode:'', pin:'' }; }
};

const fmtN = (n) =>
    new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);

const fmtDateTime = (str) => {
    if (!str) return '-';
    try {
        const d = new Date(str);
        if (isNaN(d.getTime())) return String(str);
        const day = String(d.getDate()).padStart(2, '0');
        const mon = d.toLocaleString('en-IN', { month: 'short' });
        const yr  = String(d.getFullYear()).slice(2);
        const hh  = String(d.getHours()).padStart(2, '0');
        const mm  = String(d.getMinutes()).padStart(2, '0');
        return `${day}-${mon}-${yr} ${hh}:${mm}`;
    } catch { return String(str); }
};

const TRANS_MODE_LABELS = { '1': '1 - Road', '2': '2 - Rail', '3': '3 - Air', '4': '4 - Ship' };
const VEH_TYPE_LABELS   = { 'R': 'Regular', 'O': 'Over-Dimensional Cargo (ODC)' };

// Accepts both DB (snake_case) and localStorage (camelCase) invoice objects.
// Pass client object for localStorage invoices that don't embed buyer details.
export function generateEWBPDF(invoice, client = null) {
    const S = getSellerInfo();

    // ── Normalise fields (DB snake_case vs localStorage camelCase) ─────────────
    const ewbNo        = invoice.ewb_no        || invoice.ewbNo        || '-';
    const ewbDate      = invoice.ewb_date       || invoice.ewbDate      || null;
    const ewbValidUpto = invoice.ewb_valid_upto || invoice.ewbValidUpto || null;
    const irn          = invoice.irn            || '-';
    const invoiceNum   = invoice.invoice_number || invoice.invoiceNumber || '-';
    const invoiceDate  = (invoice.invoice_date  || invoice.invoiceDate  || '').split('T')[0];

    const transMode = invoice.ewb_trans_mode       || '1';
    const vehNo     = invoice.ewb_veh_no           || '-';
    const vehType   = invoice.ewb_veh_type         || 'R';
    const transName = invoice.ewb_transporter_name || '-';
    const distance  = (invoice.ewb_distance != null && invoice.ewb_distance > 0)
        ? `${invoice.ewb_distance} KM`
        : (invoice.ewb_distance === 0 ? 'Auto-calculated' : '-');

    const buyerName    = invoice.buyer_name    || client?.clientName || '-';
    const buyerGstin   = invoice.buyer_gstin   || client?.gstNumber  || '-';
    const buyerAddress = invoice.buyer_address || client?.address    || '-';
    const buyerState   = invoice.buyer_state_code || client?.stateCode || '-';
    const buyerPin     = invoice.buyer_pin     || client?.pinCode    || '';

    const firstLine   = invoice.lines?.[0] || {};
    const description = invoice.description || firstLine.description || '-';
    const hsnCode     = invoice.hsn_code    || firstLine.hsn         || '-';

    const taxable  = parseFloat(invoice.taxable_amount || invoice.subtotal || 0);
    const cgstAmt  = parseFloat(invoice.cgst_amount    || invoice.cgst     || 0);
    const sgstAmt  = parseFloat(invoice.sgst_amount    || invoice.sgst     || 0);
    const igstAmt  = parseFloat(invoice.igst_amount    || invoice.igst     || 0);
    const total    = parseFloat(invoice.total_amount   || invoice.total    || 0);

    // Derive tax rates from amounts (works for both DB and localStorage)
    const cgstRate = (cgstAmt > 0 && taxable > 0) ? +((cgstAmt / taxable) * 100).toFixed(1) : 0;
    const sgstRate = (sgstAmt > 0 && taxable > 0) ? +((sgstAmt / taxable) * 100).toFixed(1) : 0;
    const igstRate = (igstAmt > 0 && taxable > 0) ? +((igstAmt / taxable) * 100).toFixed(1) : 0;

    const taxRateLabel = cgstRate > 0
        ? `CGST ${cgstRate}% + SGST ${sgstRate}%`
        : `IGST ${igstRate}%`;

    // ── PDF setup ──────────────────────────────────────────────────────────────
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const PW = 210, ML = 10, MR = 10, CW = PW - ML - MR;

    const dline = (x1, y1, x2, y2, lw = 0.3) => {
        doc.setDrawColor(0); doc.setLineWidth(lw); doc.line(x1, y1, x2, y2);
    };
    const drect = (x, y, w, h, lw = 0.3) => {
        doc.setDrawColor(0); doc.setLineWidth(lw); doc.rect(x, y, w, h);
    };
    const sf = (style, size, gray = 0) => {
        doc.setFont('helvetica', style);
        doc.setFontSize(size);
        doc.setTextColor(gray, gray, gray);
    };
    const tx = (str, x, y, opts = {}) => doc.text(String(str ?? ''), x, y, opts);
    const fill = (x, y, w, h, r, g, b) => {
        doc.setFillColor(r, g, b); doc.rect(x, y, w, h, 'F');
    };

    let y = 8;

    // ── Title ──────────────────────────────────────────────────────────────────
    sf('bold', 16, 0);
    tx('e-Way Bill', PW / 2, y + 6, { align: 'center' });
    sf('normal', 8, 120);
    tx('(As per GST e-Way Bill Rules)', PW / 2, y + 11, { align: 'center' });
    y += 16;

    // ── Green header strip ─────────────────────────────────────────────────────
    fill(ML, y, CW, 8, 34, 139, 34);
    sf('bold', 8, 255);
    tx(`EWB No.: ${ewbNo}`, ML + 3, y + 5.5);
    tx(`Valid Upto: ${fmtDateTime(ewbValidUpto)}`, ML + 65, y + 5.5);
    tx(`Generated: ${fmtDateTime(ewbDate)}`, ML + 130, y + 5.5);
    y += 8;

    const SEC_HDR_H = 6;
    const c3 = CW / 3;

    // ════════════════════════════════════════════════════════════════════════════
    // 1. e-Way Bill Details
    // ════════════════════════════════════════════════════════════════════════════
    fill(ML, y, CW, SEC_HDR_H, 230, 230, 230);
    drect(ML, y, CW, SEC_HDR_H);
    sf('bold', 8, 0); tx('1. e-Way Bill Details', ML + 2, y + 4.2);
    y += SEC_HDR_H;

    const SEC1_H = 16;
    drect(ML, y, CW, SEC1_H);
    dline(ML + c3,     y, ML + c3,     y + SEC1_H);
    dline(ML + c3 * 2, y, ML + c3 * 2, y + SEC1_H);
    dline(ML, y + SEC1_H / 2, ML + CW, y + SEC1_H / 2, 0.2);

    const r1y = y + 5, r2y = y + SEC1_H / 2 + 5;

    sf('normal', 6.5, 100); tx('e-Way Bill No.', ML + 2, r1y);
    sf('bold', 8, 0);       tx(':  ' + ewbNo, ML + 27, r1y);

    sf('normal', 6.5, 100); tx('Generated Date', ML + c3 + 2, r1y);
    sf('bold', 8, 0);       tx(':  ' + fmtDateTime(ewbDate), ML + c3 + 27, r1y);

    sf('normal', 6.5, 100); tx('Valid Upto', ML + c3 * 2 + 2, r1y);
    sf('bold', 8, 0);       tx(':  ' + fmtDateTime(ewbValidUpto), ML + c3 * 2 + 20, r1y);

    sf('normal', 6.5, 100); tx('Supply Type', ML + 2, r2y);
    sf('bold', 8, 0);       tx(':  Outward Supply', ML + 27, r2y);

    sf('normal', 6.5, 100); tx('Transaction Type', ML + c3 + 2, r2y);
    sf('bold', 8, 0);       tx(':  Bill To - Ship To', ML + c3 + 27, r2y);

    sf('normal', 6.5, 100); tx('Approx Distance', ML + c3 * 2 + 2, r2y);
    sf('bold', 8, 0);       tx(':  ' + distance, ML + c3 * 2 + 27, r2y);

    y += SEC1_H + 3;

    // ════════════════════════════════════════════════════════════════════════════
    // 2. Address Details
    // ════════════════════════════════════════════════════════════════════════════
    fill(ML, y, CW, SEC_HDR_H, 230, 230, 230);
    drect(ML, y, CW, SEC_HDR_H);
    sf('bold', 8, 0); tx('2. Address Details', ML + 2, y + 4.2);
    y += SEC_HDR_H;

    const ADDR_H = 34;
    const half   = CW / 2;
    drect(ML, y, half, ADDR_H);
    drect(ML + half, y, half, ADDR_H);

    // From (Seller)
    let fY = y + 4;
    sf('normal', 6.5, 100); tx('From (Consignor / Supplier)', ML + 2, fY); fY += 4.5;
    sf('bold', 8.5, 0);     tx(S.name, ML + 2, fY); fY += 4.5;
    sf('normal', 7.5, 0);
    if (S.gstin) { tx('GSTIN  :  ' + S.gstin, ML + 2, fY); fY += 3.8; }
    const sellerAddr = [S.address, S.city].filter(Boolean).join(', ');
    doc.splitTextToSize(sellerAddr, half - 4).slice(0, 2).forEach(l => { tx(l, ML + 2, fY); fY += 3.5; });
    if (S.state) tx('State  :  ' + S.state + (S.pin ? ', ' + S.pin : ''), ML + 2, fY);

    // To (Buyer)
    const BX = ML + half + 2;
    let tY = y + 4;
    sf('normal', 6.5, 100); tx('To (Consignee / Recipient)', BX, tY); tY += 4.5;
    sf('bold', 8.5, 0);     tx(buyerName.toUpperCase(), BX, tY); tY += 4.5;
    sf('normal', 7.5, 0);
    if (buyerGstin && buyerGstin !== '-') { tx('GSTIN  :  ' + buyerGstin, BX, tY); tY += 3.8; }
    doc.splitTextToSize(buyerAddress, half - 4).slice(0, 2).forEach(l => { tx(l, BX, tY); tY += 3.5; });
    if (buyerState && buyerState !== '-') tx('State  :  ' + buyerState + (buyerPin ? ', ' + buyerPin : ''), BX, tY);

    y += ADDR_H + 3;

    // ════════════════════════════════════════════════════════════════════════════
    // 3. Goods Details
    // ════════════════════════════════════════════════════════════════════════════
    fill(ML, y, CW, SEC_HDR_H, 230, 230, 230);
    drect(ML, y, CW, SEC_HDR_H);
    sf('bold', 8, 0); tx('3. Goods Details', ML + 2, y + 4.2);
    y += SEC_HDR_H;

    autoTable(doc, {
        startY: y,
        head: [['HSN/SAC', 'Product / Description', 'Qty', 'Unit', 'Taxable Value', 'Tax Rate', 'CGST', 'SGST', 'IGST', 'Total Value']],
        body: [[
            hsnCode,
            description,
            '1',
            'NOS',
            fmtN(taxable),
            taxRateLabel,
            cgstAmt > 0 ? fmtN(cgstAmt) : '-',
            sgstAmt > 0 ? fmtN(sgstAmt) : '-',
            igstAmt > 0 ? fmtN(igstAmt) : '-',
            fmtN(total),
        ]],
        margin: { left: ML, right: MR },
        tableLineColor: [0, 0, 0],
        tableLineWidth: 0.3,
        styles: {
            fontSize: 7.5,
            cellPadding: { top: 2, right: 2, bottom: 2, left: 2 },
            lineColor: [0, 0, 0], lineWidth: 0.3, textColor: [0, 0, 0],
        },
        headStyles: {
            fillColor: [255, 255, 255], textColor: [0, 0, 0],
            fontStyle: 'bold', halign: 'center', fontSize: 7,
        },
        alternateRowStyles: { fillColor: [255, 255, 255] },
        columnStyles: {
            0: { cellWidth: 20, halign: 'center' },
            1: { cellWidth: 48, halign: 'left' },
            2: { cellWidth: 10, halign: 'center' },
            3: { cellWidth: 12, halign: 'center' },
            4: { cellWidth: 24, halign: 'right' },
            5: { cellWidth: 26, halign: 'center' },
            6: { cellWidth: 16, halign: 'right' },
            7: { cellWidth: 16, halign: 'right' },
            8: { cellWidth: 16, halign: 'right' },
            9: { cellWidth: 22, halign: 'right' },
        },
    });

    y = doc.lastAutoTable.finalY + 3;

    // ════════════════════════════════════════════════════════════════════════════
    // 4. Transportation Details
    // ════════════════════════════════════════════════════════════════════════════
    fill(ML, y, CW, SEC_HDR_H, 230, 230, 230);
    drect(ML, y, CW, SEC_HDR_H);
    sf('bold', 8, 0); tx('4. Transportation Details', ML + 2, y + 4.2);
    y += SEC_HDR_H;

    const TRANS_H = 16;
    drect(ML, y, CW, TRANS_H);
    dline(ML + c3,     y, ML + c3,     y + TRANS_H);
    dline(ML + c3 * 2, y, ML + c3 * 2, y + TRANS_H);
    dline(ML, y + TRANS_H / 2, ML + CW, y + TRANS_H / 2, 0.2);

    const tr1y = y + 5, tr2y = y + TRANS_H / 2 + 5;

    sf('normal', 6.5, 100); tx('Transport Mode', ML + 2, tr1y);
    sf('bold', 8, 0);       tx(':  ' + (TRANS_MODE_LABELS[transMode] || transMode), ML + 27, tr1y);

    sf('normal', 6.5, 100); tx('Vehicle No.',  ML + c3 + 2, tr1y);
    sf('bold', 8, 0);       tx(':  ' + vehNo,  ML + c3 + 22, tr1y);

    sf('normal', 6.5, 100); tx('Vehicle Type', ML + c3 * 2 + 2, tr1y);
    sf('bold', 8, 0);       tx(':  ' + (VEH_TYPE_LABELS[vehType] || vehType), ML + c3 * 2 + 22, tr1y);

    sf('normal', 6.5, 100); tx('Transporter',  ML + 2, tr2y);
    sf('bold', 8, 0);       tx(':  ' + transName, ML + 27, tr2y);

    sf('normal', 6.5, 100); tx('Invoice No.',  ML + c3 + 2, tr2y);
    sf('bold', 8, 0);       tx(':  ' + invoiceNum, ML + c3 + 22, tr2y);

    sf('normal', 6.5, 100); tx('Invoice Date', ML + c3 * 2 + 2, tr2y);
    sf('bold', 8, 0);       tx(':  ' + invoiceDate, ML + c3 * 2 + 22, tr2y);

    y += TRANS_H + 3;

    // ── IRN footer ─────────────────────────────────────────────────────────────
    drect(ML, y, CW, 8);
    sf('normal', 6.5, 80);
    tx('IRN : ' + irn, ML + 2, y + 5);

    y += 12;
    sf('normal', 7.5, 120);
    tx('This is a system generated E-Way Bill document.', PW / 2, y, { align: 'center' });

    return doc;
}

export function downloadEWBPDF(invoice, client = null) {
    const doc      = generateEWBPDF(invoice, client);
    const ewbNo    = invoice.ewb_no || invoice.ewbNo || 'bill';
    const invNum   = invoice.invoice_number || invoice.invoiceNumber || '';
    const fileName = `EWB-${(invNum || ewbNo).replace(/\//g, '-')}.pdf`;
    doc.save(fileName);
}
