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
            name:          companyName,
            gstin:         s.gstin             || '09AAGCG1126N1ZG',
            pan:           s.pan               || 'AAGCG1126N',
            address:       s.address           || 'Near Royal Hotel, 3rd Floor, Hazratganj',
            city:          s.city              || 'Lucknow, Uttar Pradesh - 226001',
            state:         s.state             || 'Uttar Pradesh',
            stateCode:     s.stateCode         || '09',
            email:         s.email             || 'finance@garageproductions.in',
            signatory,
            signatureDataUrl: s.signatureDataUrl || '',
        };
    } catch {
        return {
            name: 'Garage Productions Pvt. Ltd', gstin: '09AAGCG1126N1ZG',
            pan: 'AAGCG1126N', address: 'Near Royal Hotel, 3rd Floor, Hazratganj',
            city: 'Lucknow, Uttar Pradesh - 226001', state: 'Uttar Pradesh', stateCode: '09',
            email: 'finance@garageproductions.in', signatory: 'Saurabh Gupta', signatureDataUrl: '',
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
    new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);
const fmtAmt = (n) => `Rs. ${fmtN(n)}`;

export function generatePOPDF(po, vendor) {
    const B   = getBuyerInfo(); // Garage = Buyer
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const PW = 210;
    const ML = 10;
    const MR = 10;
    const CW = PW - ML - MR;

    const isSplit = po.taxType !== 'igst';
    const total   = parseFloat(po.total)   || 0;
    const cgst    = parseFloat(po.cgst)    || 0;
    const sgst    = parseFloat(po.sgst)    || 0;
    const igst    = parseFloat(po.igst)    || 0;

    const poDate = po.poDate
        ? new Date(po.poDate + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })
        : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });

    const now = new Date();
    const signTs = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('.') + ' '
        + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0') + ':' + String(now.getSeconds()).padStart(2, '0') + " +05'30'";

    const dline = (x1, y1, x2, y2, lw = 0.3) => { doc.setDrawColor(0, 0, 0); doc.setLineWidth(lw); doc.line(x1, y1, x2, y2); };
    const drect = (x, y, w, h, lw = 0.3) => { doc.setDrawColor(0, 0, 0); doc.setLineWidth(lw); doc.rect(x, y, w, h); };
    const sf = (style, size, gray = 0) => { doc.setFont('helvetica', style); doc.setFontSize(size); doc.setTextColor(gray, gray, gray); };
    const tx = (str, x, y, opts = {}) => doc.text(String(str ?? ''), x, y, opts);

    let y = 8;

    // ── 1. TITLE ──────────────────────────────────────────────────────────────
    sf('bold', 15);
    tx('Purchase Order', PW / 2, y + 7, { align: 'center' });
    y += 14;

    // ── 2. HEADER BOX — Buyer (left) + Vendor (right) ─────────────────────────
    const LEFT_W  = 95;
    const RIGHT_W = CW - LEFT_W;
    const RX      = ML + LEFT_W;

    const HEAD_H = 38;
    drect(ML, y, LEFT_W, HEAD_H);
    drect(RX, y, RIGHT_W, HEAD_H);

    // Buyer (Garage) — left
    let lY = y + 4;
    sf('normal', 6.5, 80); tx('Buyer / Issued By', ML + 2, lY); lY += 4;
    sf('bold', 9, 0); tx(B.name, ML + 2, lY); lY += 4.5;
    sf('normal', 7.5, 0);
    doc.splitTextToSize([B.address, B.city].filter(Boolean).join(', '), LEFT_W - 5).slice(0, 2).forEach(l => { tx(l, ML + 2, lY); lY += 3.5; });
    tx('GSTIN: ' + B.gstin, ML + 2, lY); lY += 3.5;
    tx('State: ' + B.state + ' | Code: ' + B.stateCode, ML + 2, lY); lY += 3.5;
    tx('Email: ' + B.email, ML + 2, lY);

    // Vendor (Supplier) — right
    let rY = y + 4;
    sf('normal', 6.5, 80); tx('Vendor / Supplier', RX + 2, rY); rY += 4;
    sf('bold', 9, 0); tx((vendor.vendorName || '').toUpperCase(), RX + 2, rY); rY += 4.5;
    sf('normal', 7.5, 0);
    const vAddr = [vendor.address, vendor.city, vendor.state].filter(Boolean).join(', ');
    doc.splitTextToSize(vAddr, RIGHT_W - 5).slice(0, 2).forEach(l => { tx(l, RX + 2, rY); rY += 3.5; });
    if (vendor.gstNumber) { tx('GSTIN: ' + vendor.gstNumber, RX + 2, rY); rY += 3.5; }
    tx('PAN: ' + (vendor.panNumber || '—'), RX + 2, rY);

    y += HEAD_H + 2;

    // ── 3. METADATA GRID ──────────────────────────────────────────────────────
    const META_ROWS = [
        { l1: 'PO Number', v1: po.poNumber || '', l2: 'PO Date', v2: poDate, h: 12 },
        { l1: 'Start Date', v1: po.startDate || '—', l2: 'End Date', v2: po.endDate || '—', h: 10 },
        { l1: 'Payment Terms', v1: po.paymentTerms || '—', l2: 'Vendor Type', v2: vendor.vendorType || '—', h: 10 },
    ];
    const META_C = CW / 2;

    META_ROWS.forEach(row => {
        drect(ML,          y, META_C, row.h);
        drect(ML + META_C, y, META_C, row.h);
        sf('normal', 6.5, 70);
        tx(row.l1, ML + 2, y + 3.5);
        tx(row.l2, ML + META_C + 2, y + 3.5);
        sf(row.l1 === 'PO Number' ? 'bold' : 'normal', 8.5, 0);
        tx(row.v1, ML + 2, y + row.h - 3);
        sf(row.l2 === 'PO Date' ? 'bold' : 'normal', 8.5, 0);
        tx(row.v2, ML + META_C + 2, y + row.h - 3);
        y += row.h;
    });

    y += 2;

    // ── 4. LINE ITEMS TABLE ────────────────────────────────────────────────────
    const itemBody = [];
    (po.lines || []).forEach((l, i) => {
        const rate   = parseFloat(l.rate) || 0;
        const qty    = parseFloat(l.qty)  || 1;
        const amount = rate * qty;
        const cgstA  = isSplit ? amount * 0.09 : 0;
        const sgstA  = isSplit ? amount * 0.09 : 0;
        const igstA  = !isSplit ? amount * 0.18 : 0;

        itemBody.push([i + 1, l.description, l.deliverables || '—', qty > 0 ? qty : '', fmtN(rate), fmtN(amount)]);

        if (isSplit) {
            itemBody.push(['', { content: 'CGST Output 9%', styles: { halign: 'right' } }, '', '', { content: '9%', styles: { halign: 'right' } }, fmtN(cgstA)]);
            itemBody.push(['', { content: 'SGST Output 9%', styles: { halign: 'right' } }, '', '', { content: '9%', styles: { halign: 'right' } }, fmtN(sgstA)]);
        } else {
            itemBody.push(['', { content: 'IGST Output 18%', styles: { halign: 'right' } }, '', '', { content: '18%', styles: { halign: 'right' } }, fmtN(igstA)]);
        }
    });

    itemBody.push([
        '', '', '', '',
        { content: 'Total', styles: { halign: 'right', fontStyle: 'bold' } },
        { content: fmtAmt(total), styles: { fontStyle: 'bold', halign: 'right' } },
    ]);

    autoTable(doc, {
        startY: y,
        head: [['Sl\nNo.', 'Work Description', 'Deliverables', 'Qty', 'Rate', 'Amount']],
        body: itemBody,
        margin: { left: ML, right: MR },
        tableLineColor: [0, 0, 0],
        tableLineWidth: 0.3,
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
            1: { cellWidth: 60, halign: 'left' },
            2: { cellWidth: 48, halign: 'left' },
            3: { cellWidth: 14, halign: 'center' },
            4: { cellWidth: 26, halign: 'right' },
            5: { cellWidth: 32, halign: 'right' },
        },
        didParseCell: (data) => {
            if (data.section !== 'body' || data.column.index !== 1) return;
            const raw = typeof data.cell.raw === 'object' ? data.cell.raw?.content : data.cell.raw;
            const str = String(raw || '');
            if (str && !str.includes('CGST') && !str.includes('SGST') && !str.includes('IGST') && !str.includes('Total')) {
                data.cell.styles.fontStyle = 'bold';
            }
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
    tx('INR ' + numberToWords(total) + ' Only', ML + 2, y + 10.5);
    sf('normal', 7.5, 70);
    tx('E. & O.E', ML + CW * 0.65 + 2, y + 4.5);
    y += AMT_H;

    // ── 6. NOTES ──────────────────────────────────────────────────────────────
    if (po.notes && po.notes.trim()) {
        const NOTES_H = 14;
        drect(ML, y, CW, NOTES_H);
        sf('normal', 6.5, 70); tx('Notes / Terms:', ML + 2, y + 4);
        sf('normal', 7.5, 0);
        doc.splitTextToSize(po.notes.trim(), CW - 6).slice(0, 2).forEach((l, i) => tx(l, ML + 2, y + 8.5 + i * 3.5));
        y += NOTES_H;
    }

    // ── 7. SIGNATURE ──────────────────────────────────────────────────────────
    const BANK_H = 40;
    drect(ML, y, CW, BANK_H);
    const DIVX = ML + CW / 2;
    dline(DIVX, y, DIVX, y + BANK_H);

    // Left — Terms summary
    let lbY = y + 5;
    sf('normal', 7.5, 70); tx('Approved & Issued By', ML + 3, lbY); lbY += 4;
    sf('bold', 8, 0); tx(B.name, ML + 3, lbY); lbY += 4;
    sf('normal', 7.5, 60); tx('PAN: ' + B.pan, ML + 3, lbY);

    // Right — Signatory
    const BREX = PW - MR - 2;
    let bkY = y + 4;
    sf('bold', 8, 0); tx('for ' + B.name, BREX, bkY, { align: 'right' }); bkY += 5;

    if (B.signatureDataUrl) {
        try { doc.addImage(B.signatureDataUrl, BREX - 38, bkY, 36, 14, undefined, 'FAST'); } catch {}
        bkY += 16;
    } else {
        doc.setFont('times', 'bolditalic'); doc.setFontSize(13); doc.setTextColor(0, 0, 0);
        const nameX = DIVX + 3;
        tx(B.signatory, nameX, bkY + 7);
        const nameW  = doc.getStringUnitWidth(B.signatory) * 13 / doc.internal.scaleFactor;
        const annotX = Math.min(nameX + nameW + 2, BREX - 46);
        const annotW = BREX - annotX - 1;
        doc.setFont('helvetica', 'normal'); doc.setFontSize(5.5); doc.setTextColor(60, 60, 60);
        tx(doc.splitTextToSize('Digitally signed by ' + B.signatory, annotW)[0], annotX, bkY + 3);
        tx('Date: ' + signTs, annotX, bkY + 7);
    }

    dline(BREX - 45, y + BANK_H - 10, BREX, y + BANK_H - 10);
    sf('normal', 7.5, 0);
    tx('Authorised Signatory', BREX, y + BANK_H - 5, { align: 'right' });

    y += BANK_H + 6;

    // ── 8. FOOTER ─────────────────────────────────────────────────────────────
    sf('normal', 8, 60);
    tx('This is a Computer Generated Purchase Order', PW / 2, y, { align: 'center' });

    return doc;
}

export function downloadPOPDF(po, vendor) {
    const doc = generatePOPDF(po, vendor);
    doc.save(`${po.poNumber.replace(/\//g, '-')}.pdf`);
}

export function openPOPDFInTab(po, vendor) {
    const doc  = generatePOPDF(po, vendor);
    const blob = doc.output('blob');
    const url  = URL.createObjectURL(blob);
    window.open(url, '_blank');
}
