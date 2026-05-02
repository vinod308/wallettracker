-- Migration: Create contracts table
-- Description: Client contracts with renewal tracking

CREATE TABLE contracts (
    id SERIAL PRIMARY KEY,
    client_id INT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    mrr DECIMAL(12, 2) NOT NULL,
    auto_renew BOOLEAN DEFAULT FALSE,
    renewal_status VARCHAR(20) DEFAULT 'Not Started' CHECK (renewal_status IN (
        'Not Started', 'Client Contacted', 'Proposal Sent',
        'Negotiating', 'Awaiting Signature', 'Renewed', 'Lost'
    )),
    assigned_to INT REFERENCES users(id),
    previous_contract_id INT REFERENCES contracts(id),
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Expired', 'Renewed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_contracts_client_id ON contracts(client_id);
CREATE INDEX idx_contracts_end_date ON contracts(end_date);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_renewal_status ON contracts(renewal_status);
CREATE INDEX idx_contracts_assigned ON contracts(assigned_to);

-- Comments
COMMENT ON TABLE contracts IS 'Client contracts with renewal state machine';
COMMENT ON COLUMN contracts.mrr IS 'Monthly Recurring Revenue';
COMMENT ON COLUMN contracts.auto_renew IS 'Auto-renewal enabled (renews 30 days before expiry)';
COMMENT ON COLUMN contracts.renewal_status IS 'Renewal process state machine';
COMMENT ON COLUMN contracts.previous_contract_id IS 'Links to previous contract when renewed';
