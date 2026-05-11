import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// ── Seller info from gw_settings ──────────────────────────────────────────
const getSellerInfo = () => {
    try {
        const s = JSON.parse(localStorage.getItem('gw_settings') || '{}');
        const companyName = s.companyName || 'Garage Productions Pvt. Ltd';
        // Signatory must be a personal name — detect corporate names and fall back
        const rawSignatory = (s.signatory || '').trim();
        const isCorporate = /\b(pvt|ltd|limited|llp|inc|corp|productions|media|services|solutions|industries|enterprises|company)\b/i.test(rawSignatory);
        const signatory = (rawSignatory && !isCorporate) ? rawSignatory : 'Saurabh Gupta';
        return {
            name:          companyName,
            gstin:         s.gstin              || '09AAGCG1126N1ZG',
            pan:           s.pan                || 'AAGCG1126N',
            cin:           s.cin                || '',
            address:       s.address            || 'Near Royal Hotel, 3rd Floor, Hazratganj',
            city:          s.city               || 'Lucknow, Uttar Pradesh - 226001',
            state:         s.state              || 'Uttar Pradesh',
            stateCode:     s.stateCode          || '09',
            email:         s.email              || 'finance@garageproductions.in',
            signatory,
            bankHolder:    s.accountHolderName  || companyName,
            bankName:      s.bankName           || 'HDFC Bank Limited',
            accountNo:     s.accountNo          || '',
            ifsc:          s.ifsc               || '',
            branch:        s.branch             || '',
            swiftCode:     s.swiftCode          || '',
            logoDataUrl:      s.logoDataUrl        || '',
            signatureDataUrl: s.signatureDataUrl   || '',
        };
    } catch {
        return {
            name: 'Garage Productions Pvt. Ltd', gstin: '09AAGCG1126N1ZG',
            pan: 'AAGCG1126N', cin: '', address: 'Near Royal Hotel, 3rd Floor, Hazratganj',
            city: 'Lucknow, Uttar Pradesh - 226001', state: 'Uttar Pradesh', stateCode: '09',
            email: 'finance@garageproductions.in', signatory: 'Saurabh Gupta',
            bankHolder: 'Garage Productions Pvt.Ltd', bankName: 'HDFC Bank Limited',
            accountNo: '', ifsc: '', branch: '', swiftCode: '',
            logoDataUrl: '', signatureDataUrl: '',
        };
    }
};

// ── Number to Indian words ─────────────────────────────────────────────────
const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'];
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

// NOTE: Rs. is used instead of Rs symbol — standard PDF fonts (Helvetica/Times)
// do not include the Rs glyph (U+20B9); using Rs. avoids garbled output.
const fmtN = (n) =>
    new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);

const fmtAmt = (n) => `Rs. ${fmtN(n)}`;

// ── Main generator ─────────────────────────────────────────────────────────
export function generateInvoicePDF(invoice, client) {
    const S = getSellerInfo();
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const PW = 210;
    const ML = 10;
    const MR = 10;
    const CW = PW - ML - MR; // 190mm

    const isSplit  = invoice.taxType === 'split' || invoice.taxType === 'split5';
    const halfRate = invoice.taxType === 'split' ? 0.09 : invoice.taxType === 'split5' ? 0.025 : 0;
    const fullRate = invoice.taxType === 'igst'  ? 0.18 : invoice.taxType === 'igst5'  ? 0.05  : 0;
    const rateLabel = invoice.taxType === 'split' ? '9' : invoice.taxType === 'split5' ? '2.5' : invoice.taxType === 'igst' ? '18' : '5';
    const total   = parseFloat(invoice.total)   || 0;
    const cgst    = parseFloat(invoice.cgst)    || 0;
    const sgst    = parseFloat(invoice.sgst)    || 0;
    const igst    = parseFloat(invoice.igst)    || 0;
    const taxAmt  = cgst + sgst + igst;

    const invDate = invoice.invoiceDate
        ? new Date(invoice.invoiceDate + 'T00:00:00')
            .toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })
        : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });

    // Timestamp for digital signature
    const now = new Date();
    const signTs = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, '0'),
        String(now.getDate()).padStart(2, '0'),
    ].join('.') + ' ' +
        String(now.getHours()).padStart(2, '0') + ':' +
        String(now.getMinutes()).padStart(2, '0') + ':' +
        String(now.getSeconds()).padStart(2, '0') + " +05'30'";

    // ── Drawing helpers ───────────────────────────────────────────────────
    const dline = (x1, y1, x2, y2, lw = 0.3) => {
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(lw);
        doc.line(x1, y1, x2, y2);
    };
    const drect = (x, y, w, h, lw = 0.3) => {
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(lw);
        doc.rect(x, y, w, h);
    };
    const sf = (style, size, gray = 0) => {
        doc.setFont('helvetica', style);
        doc.setFontSize(size);
        doc.setTextColor(gray, gray, gray);
    };
    const tx = (str, x, y, opts = {}) => doc.text(String(str ?? ''), x, y, opts);

    let y = 8;

    // ════════════════════════════════════════════════════════════════
    // 1. TITLE ROW
    // ════════════════════════════════════════════════════════════════
    sf('bold', 15);
    tx('Tax Invoice', PW / 2, y + 7, { align: 'center' });
    sf('normal', 9);
    tx('e-Invoice', PW - MR - 17, y + 5);
    y += 12;

    // ════════════════════════════════════════════════════════════════
    // 2. QR BOX + IRN/ACK INFO
    // ════════════════════════════════════════════════════════════════
    const QR = 30;
    const qrX = PW - MR - QR;
    drect(qrX, y, QR, QR);
    sf('normal', 6, 130);
    tx('QR Code', qrX + QR / 2, y + QR / 2 - 1, { align: 'center' });
    tx('(e-Invoice)', qrX + QR / 2, y + QR / 2 + 4, { align: 'center' });

    const irnAreaW = CW - QR - 5;
    sf('normal', 7.5, 60);
    tx('IRN', ML, y + 5);
    tx(':', ML + 10, y + 5);
    sf('normal', 7, 0);
    const irnStr = invoice.irn || '(Not Applicable - threshold not met)';
    const irnLines = doc.splitTextToSize(irnStr, irnAreaW - 14);
    irnLines.forEach((l, i) => tx(l, ML + 13, y + 5 + i * 3.8));

    sf('normal', 7.5, 60);
    tx('Ack No.', ML, y + 13);  tx(':', ML + 10, y + 13);
    sf('normal', 7.5, 0);
    tx(invoice.ackNo || '-', ML + 13, y + 13);

    sf('normal', 7.5, 60);
    tx('Ack Date', ML, y + 19);  tx(':', ML + 10, y + 19);
    sf('normal', 7.5, 0);
    tx(invDate, ML + 13, y + 19);

    y += QR + 4;

    // ════════════════════════════════════════════════════════════════
    // 3. SELLER (left 100mm) + METADATA GRID (right 90mm)
    // ════════════════════════════════════════════════════════════════
    const LEFT_W  = 100;
    const RIGHT_W = CW - LEFT_W; // 90
    const RX      = ML + LEFT_W;
    const META_C  = RIGHT_W / 2; // 45 each

    const tableY = y;

    // Right metadata rows
    const metaRows = [
        { l1: 'Invoice No.',           v1: invoice.invoiceNumber || '',    l2: 'Dated',                  v2: invDate,                    h: 13 },
        { l1: 'Delivery Note',         v1: '',                             l2: 'Mode/Terms of Payment',  v2: invoice.paymentTerms || '',  h: 10 },
        { l1: 'Reference No. & Date.', v1: '',                             l2: 'Other References',       v2: '',                          h: 10 },
        { l1: "Buyer's Order No.",     v1: invoice.poNumber || '',         l2: 'Dated',                  v2: invoice.poDate || '',        h: 10 },
        { l1: 'Dispatch Doc No.',      v1: '',                             l2: 'Delivery Note Date',     v2: '',                          h: 10 },
        { l1: 'Dispatched through',    v1: '',                             l2: 'Destination',            v2: '',                          h: 10 },
    ];
    const TERMS_H      = 10;
    const RIGHT_TOTAL  = metaRows.reduce((s, r) => s + r.h, 0) + TERMS_H; // 73mm

    let rY = tableY;
    metaRows.forEach(row => {
        drect(RX,          rY, META_C, row.h);
        drect(RX + META_C, rY, META_C, row.h);
        sf('normal', 6.5, 70);
        tx(row.l1, RX + 1.5, rY + 3.5);
        tx(row.l2, RX + META_C + 1.5, rY + 3.5);
        sf(row.l1 === 'Invoice No.' || row.l1 === "Buyer's Order No." ? 'bold' : 'normal', 8.5, 0);
        tx(row.v1, RX + 1.5, rY + row.h - 3);
        sf(row.l2 === 'Dated' ? 'bold' : 'normal', 8.5, 0);
        tx(row.v2, RX + META_C + 1.5, rY + row.h - 3);
        rY += row.h;
    });
    drect(RX, rY, RIGHT_W, TERMS_H);
    sf('normal', 6.5, 70);
    tx('Terms of Delivery', RX + 1.5, rY + 3.5);
    sf('bold', 8.5, 0);
    tx('30 Days', RX + 1.5, rY + TERMS_H - 3);
    rY += TERMS_H;

    // Left column — seller 30 | consignee 21 | buyer 22 = 73
    const SEL_H = 30;
    const CON_H = Math.round((RIGHT_TOTAL - SEL_H) / 2);
    const BUY_H = RIGHT_TOTAL - SEL_H - CON_H;

    // Seller
    drect(ML, tableY, LEFT_W, SEL_H);
    let sY = tableY + 4;
    sf('bold', 9, 0);
    tx(S.name, ML + 2, sY); sY += 5;
    sf('normal', 7.5, 0);
    const fullAddr = [S.address, S.city].filter(Boolean).join(', ');
    doc.splitTextToSize(fullAddr, LEFT_W - 5).slice(0, 2).forEach(l => { tx(l, ML + 2, sY); sY += 3.5; });
    if (S.cin) { tx('CIN ' + S.cin, ML + 2, sY); sY += 3.5; }
    tx('GSTIN/UIN: ' + S.gstin, ML + 2, sY); sY += 3.5;
    tx('State Name : ' + S.state + ', Code : ' + S.stateCode, ML + 2, sY); sY += 3.5;
    tx('E-Mail : ' + S.email, ML + 2, sY);

    // Consignee
    const conY = tableY + SEL_H;
    drect(ML, conY, LEFT_W, CON_H);
    let cY = conY + 3;
    sf('normal', 6.5, 70); tx('Consignee (Ship to)', ML + 2, cY); cY += 4;
    sf('bold', 8.5, 0); tx((client.clientName || '').toUpperCase(), ML + 2, cY); cY += 4;
    sf('normal', 7.5, 0);
    doc.splitTextToSize(client.address || '', LEFT_W - 5).slice(0, 2).forEach(l => { tx(l, ML + 2, cY); cY += 3.5; });
    tx('GSTIN/UIN       : ' + (client.gstNumber || ''), ML + 2, cY); cY += 3.5;
    tx('State Name      : ' + (client.state || '') + ', Code : ' + (client.stateCode || ''), ML + 2, cY);

    // Buyer
    const buyY = conY + CON_H;
    drect(ML, buyY, LEFT_W, BUY_H);
    let bY2 = buyY + 3;
    sf('normal', 6.5, 70); tx('Buyer (Bill to)', ML + 2, bY2); bY2 += 4;
    sf('bold', 8.5, 0); tx((client.clientName || '').toUpperCase(), ML + 2, bY2); bY2 += 4;
    sf('normal', 7.5, 0);
    doc.splitTextToSize(client.address || '', LEFT_W - 5).slice(0, 2).forEach(l => { tx(l, ML + 2, bY2); bY2 += 3.5; });
    tx('GSTIN/UIN       : ' + (client.gstNumber || ''), ML + 2, bY2); bY2 += 3.5;
    tx('State Name      : ' + (client.state || '') + ', Code : ' + (client.stateCode || ''), ML + 2, bY2);

    y = tableY + RIGHT_TOTAL + 2;

    // ════════════════════════════════════════════════════════════════
    // 4. LINE ITEMS TABLE
    // Columns:  Sl | Particulars | HSN/SAC | Qty | Rate | per | Amount
    // Widths:   10 |    60       |   20    | 18  |  28  | 12  |  42   = 190
    // ════════════════════════════════════════════════════════════════
    const itemBody = [];

    (invoice.lines || []).forEach((l, i) => {
        const rate    = parseFloat(l.rate) || 0;
        const qty     = parseFloat(l.qty)  || 1;
        const amount  = rate * qty;
        const cgstAmt = isSplit ? amount * halfRate : 0;
        const sgstAmt = isSplit ? amount * halfRate : 0;
        const igstAmt = !isSplit ? amount * fullRate : 0;

        // Service row
        itemBody.push([i + 1, l.description, l.hsn || '', qty > 0 ? qty : '', fmtN(rate), '', fmtN(amount)]);

        // Tax sub-rows
        if (isSplit) {
            itemBody.push(['', { content: `CGST Output ${rateLabel}%`, styles: { halign: 'right' } }, '', '',
                { content: `${rateLabel} %`, styles: { halign: 'right' } }, '', fmtN(cgstAmt)]);
            itemBody.push(['', { content: `SGST Output ${rateLabel}%`, styles: { halign: 'right' } }, '', '',
                { content: `${rateLabel} %`, styles: { halign: 'right' } }, '', fmtN(sgstAmt)]);
        } else {
            itemBody.push(['', { content: `IGST Output ${rateLabel}%`, styles: { halign: 'right' } }, '', '',
                { content: `${rateLabel} %`, styles: { halign: 'right' } }, '', fmtN(igstAmt)]);
        }
    });

    // Total row — use Rs. to avoid Rs symbol encoding issue
    itemBody.push([
        '', '', '', '',
        { content: 'Total', styles: { halign: 'right', fontStyle: 'bold' } },
        '',
        { content: fmtAmt(total), styles: { fontStyle: 'bold', halign: 'right' } },
    ]);

    autoTable(doc, {
        startY: y,
        head: [['Sl\nNo.', 'Particulars', 'HSN/\nSAC', 'Quantity', 'Rate', 'per', 'Amount']],
        body: itemBody,
        margin: { left: ML, right: MR },
        tableLineColor: [0, 0, 0],
        tableLineWidth: 0.3,
        styles: {
            fontSize: 8,
            cellPadding: { top: 1.5, right: 2, bottom: 1.5, left: 2 },
            lineColor: [0, 0, 0],
            lineWidth: 0.3,
            textColor: [0, 0, 0],
            overflow: 'linebreak',
        },
        headStyles: {
            fillColor: [255, 255, 255],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
            halign: 'center',
            fontSize: 7.5,
            cellPadding: 2,
        },
        alternateRowStyles: { fillColor: [255, 255, 255] },
        columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            1: { cellWidth: 60, halign: 'left' },
            2: { cellWidth: 20, halign: 'center' },
            3: { cellWidth: 18, halign: 'center' },
            4: { cellWidth: 28, halign: 'right' },
            5: { cellWidth: 12, halign: 'center' },
            6: { cellWidth: 42, halign: 'right' }, // wider for Rs. 1,00,000.00
        },
        didParseCell: (data) => {
            if (data.section !== 'body') return;
            if (data.column.index === 1) {
                const raw = typeof data.cell.raw === 'object' ? data.cell.raw?.content : data.cell.raw;
                const str = String(raw || '');
                if (str && !str.includes('CGST') && !str.includes('SGST') && !str.includes('IGST') && !str.includes('Total')) {
                    data.cell.styles.fontStyle = 'bold';
                }
            }
        },
    });

    y = doc.lastAutoTable.finalY;

    // ════════════════════════════════════════════════════════════════
    // 5. AMOUNT CHARGEABLE IN WORDS
    // ════════════════════════════════════════════════════════════════
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

    // ════════════════════════════════════════════════════════════════
    // 6. HSN/SAC TAX SUMMARY TABLE
    // split cols: HSN|Taxable|CGSTRate|CGSTAmt|SGSTRate|SGSTAmt|Total
    //             25 |  28   |  18    |  28   |  22    |  28   | 41 = 190
    // igst  cols: HSN|Taxable|IGSTRate|IGSTAmt|  (merged)      |Total
    //             25 |  38   |  22    |  50   |                | 55 = 190
    // ════════════════════════════════════════════════════════════════
    const hsnMap = {};
    (invoice.lines || []).forEach(l => {
        const hsn = l.hsn || '998361';
        const amt = (parseFloat(l.rate) || 0) * (parseFloat(l.qty) || 0);
        hsnMap[hsn] = (hsnMap[hsn] || 0) + amt;
    });

    let tT = 0, tC = 0, tS = 0, tI = 0;
    const hsnBody = [];
    Object.entries(hsnMap).forEach(([hsn, taxable]) => {
        tT += taxable;
        if (isSplit) {
            const c = taxable * halfRate, s = taxable * halfRate;
            tC += c; tS += s;
            hsnBody.push([hsn, fmtN(taxable), `${rateLabel}%`, fmtN(c), `${rateLabel}%`, fmtN(s), fmtN(c + s)]);
        } else {
            const ig = taxable * fullRate; tI += ig;
            hsnBody.push([hsn, fmtN(taxable), `${rateLabel}%`, fmtN(ig), '', '', fmtN(ig)]);
        }
    });
    if (isSplit) {
        hsnBody.push([{ content: 'Total', styles: { fontStyle: 'bold' } },
            { content: fmtN(tT), styles: { fontStyle: 'bold' } }, '',
            { content: fmtN(tC), styles: { fontStyle: 'bold' } }, '',
            { content: fmtN(tS), styles: { fontStyle: 'bold' } },
            { content: fmtN(tC + tS), styles: { fontStyle: 'bold' } }]);
    } else {
        hsnBody.push([{ content: 'Total', styles: { fontStyle: 'bold' } },
            { content: fmtN(tT), styles: { fontStyle: 'bold' } },
            '', { content: fmtN(tI), styles: { fontStyle: 'bold' } },
            '', '',
            { content: fmtN(tI), styles: { fontStyle: 'bold' } }]);
    }

    const hsnHead = isSplit
        ? [['HSN/SAC', 'Taxable\nValue', 'CGST\nRate', 'CGST\nAmount', 'SGST/UTGST\nRate', 'SGST/UTGST\nAmount', 'Total\nTax Amount']]
        : [['HSN/SAC', 'Taxable\nValue', 'IGST\nRate', 'IGST\nAmount', '', '', 'Total\nTax Amount']];

    const hsnCols = isSplit ? {
        0: { cellWidth: 25, halign: 'left' },
        1: { cellWidth: 28, halign: 'right' },
        2: { cellWidth: 18, halign: 'center' },
        3: { cellWidth: 28, halign: 'right' },
        4: { cellWidth: 22, halign: 'center' },
        5: { cellWidth: 28, halign: 'right' },
        6: { cellWidth: 41, halign: 'right' },
    } : {
        0: { cellWidth: 25, halign: 'left' },
        1: { cellWidth: 38, halign: 'right' },
        2: { cellWidth: 22, halign: 'center' },
        3: { cellWidth: 50, halign: 'right' },
        4: { cellWidth: 0 }, 5: { cellWidth: 0 },
        6: { cellWidth: 55, halign: 'right' },
    };

    autoTable(doc, {
        startY: y,
        head: hsnHead,
        body: hsnBody,
        margin: { left: ML, right: MR },
        tableLineColor: [0, 0, 0],
        tableLineWidth: 0.3,
        styles: {
            fontSize: 7.5,
            cellPadding: { top: 1.5, right: 2, bottom: 1.5, left: 2 },
            lineColor: [0, 0, 0],
            lineWidth: 0.3,
            textColor: [0, 0, 0],
        },
        headStyles: {
            fillColor: [255, 255, 255],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
            halign: 'center',
            fontSize: 7,
        },
        alternateRowStyles: { fillColor: [255, 255, 255] },
        columnStyles: hsnCols,
    });

    y = doc.lastAutoTable.finalY;

    // ════════════════════════════════════════════════════════════════
    // 7. TAX AMOUNT IN WORDS
    // ════════════════════════════════════════════════════════════════
    const TAX_H = 8;
    drect(ML, y, CW, TAX_H);
    sf('normal', 7.5, 70);
    tx('Tax Amount (in words)  :  ', ML + 2, y + 5);
    const taxLblW = doc.getStringUnitWidth('Tax Amount (in words)  :  ') * 7.5 / doc.internal.scaleFactor;
    sf('bold', 8.5, 0);
    tx('INR ' + numberToWords(taxAmt) + ' Only', ML + 2 + taxLblW, y + 5);
    y += TAX_H;

    // ════════════════════════════════════════════════════════════════
    // 8. BANK DETAILS (right) + COMPANY PAN (left bottom)
    // ════════════════════════════════════════════════════════════════
    const BANK_H = 72;
    drect(ML, y, CW, BANK_H);
    const DIVX = ML + CW / 2 + 5;
    dline(DIVX, y, DIVX, y + BANK_H);

    const BCX  = DIVX + 3;      // bank content x (right panel)
    const BREX = PW - MR - 2;   // right edge for right-aligned items

    // Bank details
    let bkY = y + 4;
    sf('normal', 7.5, 70);
    tx("Company's Bank Details", BCX, bkY); bkY += 5;

    const bankRows = [
        ["A/c Holder's Name : ", S.bankHolder],
        ["Bank Name         : ", S.bankName],
        ["A/c No.           : ", S.accountNo || '-'],
        ["Branch & IFS Code : ", [S.branch, S.ifsc].filter(Boolean).join(' & ') || '-'],
        ["SWIFT Code        : ", S.swiftCode || ''],
    ];
    bankRows.forEach(([lbl, val]) => {
        sf('normal', 7.5, 70); tx(lbl, BCX, bkY);
        const lblW = doc.getStringUnitWidth(lbl) * 7.5 / doc.internal.scaleFactor;
        sf('bold', 7.5, 0); tx(val, BCX + lblW, bkY);
        bkY += 4;
    });

    // "for [company]" header — bold, right-aligned
    bkY += 2;
    sf('bold', 8, 0);
    tx('for ' + S.name, BREX, bkY, { align: 'right' });
    bkY += 5;

    // Signature area — name in Times Bold Italic + annotation clamped to page right
    if (S.signatureDataUrl) {
        try {
            doc.addImage(S.signatureDataUrl, BREX - 38, bkY, 36, 14, undefined, 'FAST');
        } catch {}
        bkY += 16;
    } else {
        doc.setFont('times', 'bolditalic');
        doc.setFontSize(13);
        doc.setTextColor(0, 0, 0);
        const nameX = BCX + 2;
        tx(S.signatory, nameX, bkY + 7);

        // Annotation clamped so it never spills past the right margin
        const nameW   = doc.getStringUnitWidth(S.signatory) * 13 / doc.internal.scaleFactor;
        const annotX  = Math.min(nameX + nameW + 2, BREX - 46);
        const annotW  = BREX - annotX - 1;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(5.5);
        doc.setTextColor(60, 60, 60);
        const annotLine = doc.splitTextToSize('Digitally signed by ' + S.signatory, annotW)[0];
        tx(annotLine,       annotX, bkY + 3);
        tx('Date: ' + signTs, annotX, bkY + 7);

        bkY += 12;
    }

    // Underline + "Authorised Signatory" — fixed inside box, 10 / 5 mm from bottom
    dline(BREX - 45, y + BANK_H - 10, BREX, y + BANK_H - 10);
    sf('normal', 7.5, 0);
    tx('Authorised Signatory', BREX, y + BANK_H - 5, { align: 'right' });

    // Disclaimer text — positioned dynamically above PAN line
    const disclaimer =
        'Payment should be cleared within the above mentioned due date. ' +
        'We reserve the right to charge interest at 18% in case of delay of payment after due date. ' +
        'Recipient of service would bear Rs.500/- for bank cheque return charges. ' +
        'TDS, if applicable, may be deducted at the rate of 2% under the provisions of section 194C ' +
        'of the Income Tax Act, 1961, on the Taxable Value.';
    const discW = DIVX - ML - 5;
    sf('normal', 6, 0);
    const discLines = doc.splitTextToSize(disclaimer, discW);
    let dY = y + 5;
    discLines.forEach(l => { tx(l, ML + 2, dY); dY += 3.3; });

    // Company PAN at bottom-left of bank section
    const panY = y + BANK_H - 6;
    sf('normal', 7.5, 70);
    tx("Company's PAN  :  ", ML + 2, panY);
    const panLblW = doc.getStringUnitWidth("Company's PAN  :  ") * 7.5 / doc.internal.scaleFactor;
    sf('bold', 7.5, 0);
    tx(S.pan, ML + 2 + panLblW, panY);

    y += BANK_H + 6;

    // ════════════════════════════════════════════════════════════════
    // 9. FOOTER
    // ════════════════════════════════════════════════════════════════
    sf('normal', 8, 60);
    tx('This is a Computer Generated Invoice', PW / 2, y, { align: 'center' });

    return doc;
}

export function downloadInvoicePDF(invoice, client) {
    const doc = generateInvoicePDF(invoice, client);
    doc.save(`${invoice.invoiceNumber.replace(/\//g, '-')}.pdf`);
}

export function openInvoicePDFInTab(invoice, client) {
    const doc  = generateInvoicePDF(invoice, client);
    const blob = doc.output('blob');
    const url  = URL.createObjectURL(blob);
    window.open(url, '_blank');
}
