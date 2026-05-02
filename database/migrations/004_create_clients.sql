-- Migration: Create clients table
-- Description: Core client project information

CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    project_name VARCHAR(100) NOT NULL,
    client_name VARCHAR(100) NOT NULL,
    client_type VARCHAR(20) NOT NULL CHECK (client_type IN ('Retainer', 'Contractor')),
    industry VARCHAR(100),
    estimated_total_budget DECIMAL(12, 2),
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'At Risk')),
    created_by INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_clients_name ON clients(client_name);
CREATE INDEX idx_clients_project ON clients(project_name);
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_type ON clients(client_type);
CREATE INDEX idx_clients_industry ON clients(industry);

-- Comments
COMMENT ON TABLE clients IS 'Client project and organization information';
COMMENT ON COLUMN clients.estimated_total_budget IS 'Used for Share of Wallet calculations';
COMMENT ON COLUMN clients.deleted_at IS 'Soft delete timestamp';
