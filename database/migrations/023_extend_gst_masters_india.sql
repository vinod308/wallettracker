-- Migration 023: Extend gst_invoices for Masters India GSP integration
-- Adds signed QR storage, HSN code, buyer location fields, supply type,
-- and 'Masters India' as a valid source value.

ALTER TABLE gst_invoices DROP CONSTRAINT IF EXISTS gst_invoices_source_check;
ALTER TABLE gst_invoices ADD CONSTRAINT gst_invoices_source_check
    CHECK (source IN ('Manual', 'GST Portal', 'Masters India'));

ALTER TABLE gst_invoices
    ADD COLUMN IF NOT EXISTS hsn_code         VARCHAR(8),
    ADD COLUMN IF NOT EXISTS signed_qr        TEXT,
    ADD COLUMN IF NOT EXISTS supply_type      VARCHAR(10) DEFAULT 'B2B',
    ADD COLUMN IF NOT EXISTS buyer_state_code VARCHAR(2),
    ADD COLUMN IF NOT EXISTS buyer_pin        VARCHAR(6);

COMMENT ON COLUMN gst_invoices.hsn_code         IS 'HSN/SAC code for the service or goods';
COMMENT ON COLUMN gst_invoices.signed_qr        IS 'SignedQRCode returned by Masters India / NIC IRP';
COMMENT ON COLUMN gst_invoices.supply_type      IS 'B2B, EXPWP, EXPWOP, SEZWP, SEZWOP';
COMMENT ON COLUMN gst_invoices.buyer_state_code IS '2-digit GST state code of buyer';
COMMENT ON COLUMN gst_invoices.buyer_pin        IS '6-digit PIN code of buyer location';
