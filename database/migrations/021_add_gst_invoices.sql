-- Migration: GST Invoice Integration
-- Adds GSTIN to clients and creates gst_invoices table for NIC e-Invoice portal sync

ALTER TABLE clients
    ADD COLUMN IF NOT EXISTS gstin VARCHAR(15),
    ADD COLUMN IF NOT EXISTS gst_state_code VARCHAR(2);

CREATE TABLE IF NOT EXISTS gst_invoices (
    id SERIAL PRIMARY KEY,
    client_id INT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

    -- Invoice identity
    invoice_number  VARCHAR(50) NOT NULL,
    invoice_date    DATE NOT NULL,
    invoice_type    VARCHAR(20) DEFAULT 'TAX INVOICE'
        CHECK (invoice_type IN ('TAX INVOICE', 'CREDIT NOTE', 'DEBIT NOTE', 'BILL OF SUPPLY')),

    -- GST portal fields (populated when source = 'GST Portal')
    irn      VARCHAR(64) UNIQUE,
    ack_no   VARCHAR(20),
    ack_date TIMESTAMP,

    -- Buyer
    buyer_name    VARCHAR(200),
    buyer_gstin   VARCHAR(15),
    buyer_address TEXT,

    -- Line description
    description TEXT,

    -- Amounts
    taxable_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    cgst_rate      DECIMAL(5,2)  DEFAULT 0,
    cgst_amount    DECIMAL(12,2) DEFAULT 0,
    sgst_rate      DECIMAL(5,2)  DEFAULT 0,
    sgst_amount    DECIMAL(12,2) DEFAULT 0,
    igst_rate      DECIMAL(5,2)  DEFAULT 0,
    igst_amount    DECIMAL(12,2) DEFAULT 0,
    total_amount   DECIMAL(12,2) NOT NULL DEFAULT 0,

    -- Status
    status         VARCHAR(20) DEFAULT 'Active'  CHECK (status IN ('Active', 'Cancelled')),
    payment_status VARCHAR(20) DEFAULT 'Unpaid'  CHECK (payment_status IN ('Paid', 'Unpaid', 'Partial')),

    -- Tracks whether the record came from the portal or was typed manually
    source VARCHAR(20) DEFAULT 'Manual' CHECK (source IN ('Manual', 'GST Portal')),

    created_by INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_gst_inv_client  ON gst_invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_gst_inv_irn     ON gst_invoices(irn);
CREATE INDEX IF NOT EXISTS idx_gst_inv_date    ON gst_invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_gst_inv_payment ON gst_invoices(payment_status);
CREATE INDEX IF NOT EXISTS idx_gst_inv_buyer   ON gst_invoices(buyer_gstin);

COMMENT ON TABLE gst_invoices IS 'GST tax invoices — either fetched from NIC e-Invoice portal or entered manually';
COMMENT ON COLUMN gst_invoices.irn IS '64-char Invoice Reference Number from NIC IRP';
COMMENT ON COLUMN gst_invoices.source IS 'Manual = typed by user; GST Portal = fetched via NIC IRP API';
