-- Migration: Create upsell_opportunities table
-- Description: Track potential upsell opportunities

CREATE TABLE upsell_opportunities (
    id SERIAL PRIMARY KEY,
    client_id INT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    recommended_services TEXT[],
    potential_gain DECIMAL(12, 2),
    probability INT CHECK (probability BETWEEN 0 AND 100),
    priority VARCHAR(10) CHECK (priority IN ('High', 'Medium', 'Low')),
    status VARCHAR(20) DEFAULT 'Identified' CHECK (status IN ('Identified', 'In Progress', 'Won', 'Lost')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_upsell_client ON upsell_opportunities(client_id);
CREATE INDEX idx_upsell_priority ON upsell_opportunities(priority);
CREATE INDEX idx_upsell_status ON upsell_opportunities(status);

-- Comments
COMMENT ON TABLE upsell_opportunities IS 'Identified upsell opportunities with success probability';
COMMENT ON COLUMN upsell_opportunities.recommended_services IS 'Array of service names to pitch';
COMMENT ON COLUMN upsell_opportunities.probability IS 'Success probability percentage (0-100)';
