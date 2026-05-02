-- Migration: Create invoices table
-- Description: Track monthly invoices per client with service/addon MRR breakdown

CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    client_id INT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    invoice_date DATE NOT NULL,
    invoice_month VARCHAR(20) NOT NULL,
    contract_start DATE,
    services_description TEXT,
    addons_description TEXT,
    service_mrr DECIMAL(12, 2) DEFAULT 0,
    addons_mrr DECIMAL(12, 2) DEFAULT 0,
    total_mrr DECIMAL(12, 2) DEFAULT 0,
    payment_status VARCHAR(20) DEFAULT 'Unpaid' CHECK (payment_status IN ('Paid', 'Unpaid', 'Partial', 'Overdue')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_invoices_client ON invoices(client_id);
CREATE INDEX idx_invoices_date ON invoices(invoice_date);
CREATE INDEX idx_invoices_month ON invoices(invoice_month);
CREATE INDEX idx_invoices_payment ON invoices(payment_status);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);

-- Comments
COMMENT ON TABLE invoices IS 'Monthly client invoices with service/addon MRR breakdown';
COMMENT ON COLUMN invoices.invoice_month IS 'Month label (e.g. July 2025)';
COMMENT ON COLUMN invoices.service_mrr IS 'Service MRR Amount from Excel';
COMMENT ON COLUMN invoices.addons_mrr IS 'Addons MRR Amount from Excel';
COMMENT ON COLUMN invoices.total_mrr IS 'Total MRR (Service + Addons) from Excel';
