-- Migration: Create revenue_records table
-- Description: Historical revenue tracking for analytics

CREATE TABLE revenue_records (
    id SERIAL PRIMARY KEY,
    client_id INT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    service_id INT REFERENCES services(id),
    amount DECIMAL(12, 2) NOT NULL,
    record_date DATE NOT NULL,
    record_type VARCHAR(20) CHECK (record_type IN ('Recurring', 'One-Time')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_revenue_client ON revenue_records(client_id);
CREATE INDEX idx_revenue_date ON revenue_records(record_date);
CREATE INDEX idx_revenue_service ON revenue_records(service_id);
CREATE INDEX idx_revenue_type ON revenue_records(record_type);

-- Comments
COMMENT ON TABLE revenue_records IS 'Historical revenue data for analytics and reporting';
COMMENT ON COLUMN revenue_records.record_date IS 'Date the revenue was recognized';
