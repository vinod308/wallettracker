-- Migration: Create services table
-- Description: Available services catalog

CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_services_name ON services(name);
CREATE INDEX idx_services_category ON services(category);

-- Comments
COMMENT ON TABLE services IS 'Catalog of available services for clients';
