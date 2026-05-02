-- Migration: Create client_services table
-- Description: Many-to-many relationship between clients and services

CREATE TABLE client_services (
    id SERIAL PRIMARY KEY,
    client_id INT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    service_id INT NOT NULL REFERENCES services(id),
    is_addon BOOLEAN DEFAULT FALSE,
    monthly_amount DECIMAL(12, 2),
    yearly_amount DECIMAL(12, 2),
    billing_frequency VARCHAR(10) CHECK (billing_frequency IN ('Monthly', 'Yearly')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(client_id, service_id)
);

-- Indexes for performance
CREATE INDEX idx_client_services_client ON client_services(client_id);
CREATE INDEX idx_client_services_service ON client_services(service_id);

-- Comments
COMMENT ON TABLE client_services IS 'Services provided to clients with pricing';
COMMENT ON COLUMN client_services.is_addon IS 'TRUE if this is an add-on service';
