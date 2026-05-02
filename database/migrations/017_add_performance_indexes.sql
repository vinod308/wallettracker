-- Migration: Add performance indexes
-- Description: Additional indexes for billing_cycle, composite queries

-- Billing frequency index on client_services
CREATE INDEX IF NOT EXISTS idx_client_services_billing ON client_services(billing_frequency);

-- Composite indexes for common dashboard queries
CREATE INDEX IF NOT EXISTS idx_invoices_client_month ON invoices(client_id, invoice_month);
CREATE INDEX IF NOT EXISTS idx_revenue_client_date ON revenue_records(client_id, record_date);
CREATE INDEX IF NOT EXISTS idx_contracts_client_status ON contracts(client_id, status);

-- Status + date composite for contract renewal queries
CREATE INDEX IF NOT EXISTS idx_contracts_status_enddate ON contracts(status, end_date);

-- Composite index for month-specific upsert (client + service description + month)
CREATE INDEX IF NOT EXISTS idx_invoices_client_service_month ON invoices(client_id, invoice_month, services_description);
