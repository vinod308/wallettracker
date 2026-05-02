-- Migration: Create renewal_tasks table
-- Description: Contract renewal tasks and assignments

CREATE TABLE renewal_tasks (
    id SERIAL PRIMARY KEY,
    client_id INT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    contract_id INT NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    assigned_to INT NOT NULL REFERENCES users(id),
    priority VARCHAR(10) CHECK (priority IN ('High', 'Medium', 'Low')),
    due_date DATE NOT NULL,
    proposed_terms TEXT,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Cancelled')),
    created_by INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_renewal_tasks_assigned ON renewal_tasks(assigned_to);
CREATE INDEX idx_renewal_tasks_due_date ON renewal_tasks(due_date);
CREATE INDEX idx_renewal_tasks_status ON renewal_tasks(status);
CREATE INDEX idx_renewal_tasks_client ON renewal_tasks(client_id);

-- Comments
COMMENT ON TABLE renewal_tasks IS 'Contract renewal tasks assigned to account managers';
COMMENT ON COLUMN renewal_tasks.due_date IS 'Recommended: 30 days before contract end_date';
