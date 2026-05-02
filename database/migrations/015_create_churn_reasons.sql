-- Migration: Create churn_reasons table
-- Description: Track client churn with reasons for analytics

CREATE TABLE churn_reasons (
    id SERIAL PRIMARY KEY,
    client_id INT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    contract_id INT REFERENCES contracts(id),
    reason VARCHAR(50) CHECK (reason IN ('Pricing', 'Service Quality', 'Switched to Competitor', 'Other')),
    notes TEXT NOT NULL,
    churned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    logged_by INT REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX idx_churn_client ON churn_reasons(client_id);
CREATE INDEX idx_churn_reason ON churn_reasons(reason);
CREATE INDEX idx_churn_date ON churn_reasons(churned_at);

-- Comments
COMMENT ON TABLE churn_reasons IS 'Client churn tracking for analytics and improvement';
COMMENT ON COLUMN churn_reasons.notes IS 'Required detailed notes about churn';
