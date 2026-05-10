import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const getBuyerInfo = () => {
    try {
        const s = JSON.parse(localStorage.getItem('gw_settings') || '{}');
        const companyName = s.companyName || 'Garage Productions Pvt. Ltd';
        const rawSignatory = (s.signatory || '').trim();
        const isCorporate = /\b(pvt|ltd|limited|llp|inc|corp|productions|media|services|solutions|industries|enterprises|company)\b/i.test(rawSignatory);
        const signatory = (rawSignatory && !isCorporate) ? rawSignatory : 'Saurabh Gupta';
        return {
            name:     companyName,
            gstin:    s.gstin    || '09AAGCG1126N1ZG',
            pan:      s.pan      || 'AAGCG1126N',
            address:  s.address  || 'Near Royal Hotel, 3rd Floor, Hazratganj',
            city:     s.city     || 'Lucknow, Uttar Pradesh - 226001',
            state:    s.state    || 'Uttar Pradesh',
            stateCode:s.stateCode|| '09',
            email:    s.email    || 'finance@garageproductions.in',
            signatory,
        };
    } catch {
        return {
            name: 'Garage Productions Pvt. Ltd', gstin: '09AAGCG1126N1ZG',
            pan: 'AAGCG1126N', address: 'Near Royal Hotel, 3rd Floor, Hazratganj',
            city: 'Lucknow, Uttar Pradesh - 226001', state: 'Uttar Pradesh', stateCode: '09',
            email: 'finance@garageproductions.in', signatory: 'Saurabh Gupta',
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

const fmtN = (n) =>
    new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(parseFloat(n) || 0);

const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export function generatePIPDF(invoice, vendor) {
    const B   = getBuyerInfo();
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const PW = 210, ML = 10, MR = 10, CW = PW - ML - MR;

    const totalAmount = parseFloat(invoice.total_amount) || 0;
    const subAmount   = parseFloat(invoice.sub_amount)   || 0;
    const gstAmount   = parseFloat(invoice.gst_amount)   || 0;
    const gstRate     = parseFloat(invoice.gst_rate)     || 18;
    const halfGst     = gstRate / 2;
    const cgstAmt     = gstAmount / 2;
    const sgstAmt     = gstAmount / 2;

    const vendorName = vendor.vendorName || vendor.vendor_name || '';
    const vendorType = vendor.vendorType || vendor.vendor_type || '—';
    const gstNo      = vendor.gstNumber  || vendor.gst_number  || '';
    const panNo      = vendor.panNumber  || vendor.pan_number  || '—';
    const vAddr      = [vendor.address, vendor.city, vendor.state].filter(Boolean).join(', ');

    const dline = (x1, y1, x2, y2, lw = 0.3) => { doc.setDrawColor(0,0,0); doc.setLineWidth(lw); doc.line(x1, y1, x2, y2); };
    const drect = (x, y, w, h, lw = 0.3) => { doc.setDrawColor(0,0,0); doc.setLineWidth(lw); doc.rect(x, y, w, h); };
    const sf    = (style, size, gray = 0) => { doc.setFont('helvetica', style); doc.setFontSize(size); doc.setTextColor(gray, gray, gray); };
    const tx    = (str, x, y, opts = {}) => doc.text(String(str ?? ''), x, y, opts);

    let y = 8;

    // ── 1. TITLE ──────────────────────────────────────────────────────────────
    sf('bold', 15);
    tx('Purchase Invoice', PW / 2, y + 7, { align: 'center' });
    y += 14;

    // ── 2. HEADER BOX — Vendor (left) / Buyer (right) ─────────────────────────
    const LEFT_W = 95, RIGHT_W = CW - 95, RX = ML + 95, HEAD_H = 38;
    drect(ML, y, LEFT_W, HEAD_H);
    drect(RX, y, RIGHT_W, HEAD_H);

    let lY = y + 4;
    sf('normal', 6.5, 80); tx('Vendor / Supplier (Issued By)', ML + 2, lY); lY += 4;
    sf('bold', 9, 0); tx(vendorName.toUpperCase(), ML + 2, lY); lY += 4.5;
    sf('normal', 7.5, 0);
    if (vAddr) doc.splitTextToSize(vAddr, LEFT_W - 5).slice(0, 2).forEach(l => { tx(l, ML + 2, lY); lY += 3.5; });
    if (gstNo) { tx('GSTIN: ' + gstNo, ML + 2, lY); lY += 3.5; }
    tx('PAN: ' + panNo, ML + 2, lY);

    let rY = y + 4;
    sf('normal', 6.5, 80); tx('Buyer', RX + 2, rY); rY += 4;
    sf('bold', 9, 0); tx(B.name, RX + 2, rY); rY += 4.5;
    sf('normal', 7.5, 0);
    doc.splitTextToSize([B.address, B.city].filter(Boolean).join(', '), RIGHT_W - 5).slice(0, 2).forEach(l => { tx(l, RX + 2, rY); rY += 3.5; });
    tx('GSTIN: ' + B.gstin, RX + 2, rY); rY += 3.5;
    tx('State: ' + B.state + ' | Code: ' + B.stateCode, RX + 2, rY);

    y += HEAD_H + 2;

    // ── 3. METADATA GRID ──────────────────────────────────────────────────────
    const META_C = CW / 2;
    const META_ROWS = [
        { l1: 'Invoice Number', v1: invoice.invoice_number || '', l2: 'Invoice Date', v2: fmtDate(invoice.invoice_date), h: 12 },
        { l1: 'Due Date',       v1: fmtDate(invoice.due_date),    l2: 'Status',       v2: invoice.status || 'Pending',       h: 10 },
        { l1: 'Vendor Type',    v1: vendorType,                   l2: 'GST Rate',     v2: gstRate + '%',                     h: 10 },
    ];

    META_ROWS.forEach(row => {
        drect(ML,          y, META_C, row.h);
        drect(ML + META_C, y, META_C, row.h);
        sf('normal', 6.5, 70);
        tx(row.l1, ML + 2,          y + 3.5);
        tx(row.l2, ML + META_C + 2, y + 3.5);
        sf('bold', 8.5, 0);
        tx(row.v1, ML + 2,          y + row.h - 3);
        tx(row.v2, ML + META_C + 2, y + row.h - 3);
        y += row.h;
    });

    y += 2;

    // ── 4. LINE ITEMS TABLE ────────────────────────────────────────────────────
    const itemBody = [
        [1, invoice.description || 'Professional Services', '1', fmtN(subAmount), fmtN(subAmount)],
        ['', { content: `CGST @ ${halfGst}%`, styles: { halign: 'right' } }, '', { content: `${halfGst}%`, styles: { halign: 'right' } }, fmtN(cgstAmt)],
        ['', { content: `SGST @ ${halfGst}%`, styles: { halign: 'right' } }, '', { content: `${halfGst}%`, styles: { halign: 'right' } }, fmtN(sgstAmt)],
        ['', '', '', { content: 'Total', styles: { halign: 'right', fontStyle: 'bold' } },
            { content: 'Rs. ' + fmtN(totalAmount), styles: { fontStyle: 'bold', halign: 'right' } }],
    ];

    autoTable(doc, {
        startY: y,
        head: [['Sl\nNo.', 'Description', 'Qty', 'Rate (Rs.)', 'Amount (Rs.)']],
        body: itemBody,
        margin: { left: ML, right: MR },
        tableLineColor: [0, 0, 0], tableLineWidth: 0.3,
        styles: {
            fontSize: 8,
            cellPadding: { top: 1.5, right: 2, bottom: 1.5, left: 2 },
            lineColor: [0, 0, 0], lineWidth: 0.3, textColor: [0, 0, 0], overflow: 'linebreak',
        },
        headStyles: {
            fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold',
            halign: 'center', fontSize: 7.5, cellPadding: 2,
        },
        alternateRowStyles: { fillColor: [255, 255, 255] },
        columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            1: { cellWidth: 88, halign: 'left' },
            2: { cellWidth: 14, halign: 'center' },
            3: { cellWidth: 38, halign: 'right' },
            4: { cellWidth: 40, halign: 'right' },
        },
        didParseCell: (data) => {
            if (data.section !== 'body' || data.column.index !== 1) return;
            const raw = typeof data.cell.raw === 'object' ? data.cell.raw?.content : data.cell.raw;
            const str = String(raw || '');
            if (str && !str.includes('CGST') && !str.includes('SGST')) data.cell.styles.fontStyle = 'bold';
        },
    });

    y = doc.lastAutoTable.finalY;

    // ── 5. AMOUNT IN WORDS ────────────────────────────────────────────────────
    const AMT_H = 14;
    drect(ML, y, CW, AMT_H);
    dline(ML + CW * 0.65, y, ML + CW * 0.65, y + AMT_H);
    sf('normal', 7.5, 70);
    tx('Amount Chargeable (in words)', ML + 2, y + 4.5);
    sf('bold', 9, 0);
    tx('INR ' + numberToWords(totalAmount) + ' Only', ML + 2, y + 10.5);
    sf('normal', 7.5, 70);
    tx('E. & O.E', ML + CW * 0.65 + 2, y + 4.5);
    y += AMT_H;

    // ── 6. NOTES ──────────────────────────────────────────────────────────────
    if (invoice.notes && invoice.notes.trim()) {
        const NOTES_H = 14;
        drect(ML, y, CW, NOTES_H);
        sf('normal', 6.5, 70); tx('Notes:', ML + 2, y + 4);
        sf('normal', 7.5, 0);
        doc.splitTextToSize(invoice.notes.trim(), CW - 6).slice(0, 2).forEach((l, i) => tx(l, ML + 2, y + 8.5 + i * 3.5));
        y += NOTES_H;
    }

    // ── 7. SIGNATURE ──────────────────────────────────────────────────────────
    const SIG_H = 35;
    drect(ML, y, CW, SIG_H);
    dline(ML + CW / 2, y, ML + CW / 2, y + SIG_H);

    let lbY = y + 5;
    sf('normal', 7.5, 70); tx('Invoice received by', ML + 3, lbY); lbY += 4;
    sf('bold', 8, 0); tx(B.name, ML + 3, lbY); lbY += 4;
    sf('normal', 7.5, 60); tx('Email: ' + B.email, ML + 3, lbY);

    const BREX = PW - MR - 2;
    let bkY = y + 4;
    sf('bold', 8, 0); tx('for ' + vendorName, BREX, bkY, { align: 'right' });
    dline(BREX - 45, y + SIG_H - 10, BREX, y + SIG_H - 10);
    sf('normal', 7.5, 0);
    tx('Authorised Signatory', BREX, y + SIG_H - 5, { align: 'right' });

    y += SIG_H + 6;

    // ── 8. FOOTER ─────────────────────────────────────────────────────────────
    sf('normal', 8, 60);
    tx('This is a Computer Generated Purchase Invoice', PW / 2, y, { align: 'center' });

    return doc;
}

export function downloadPIPDF(invoice, vendor) {
    const doc = generatePIPDF(invoice, vendor);
    doc.save(`PI-${(invoice.invoice_number || 'invoice').replace(/\//g, '-')}.pdf`);
}

export function openPIPDFInTab(invoice, vendor) {
    const doc  = generatePIPDF(invoice, vendor);
    const blob = doc.output('blob');
    const url  = URL.createObjectURL(blob);
    window.open(url, '_blank');
}
