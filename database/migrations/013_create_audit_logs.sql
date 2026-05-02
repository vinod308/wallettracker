-- Migration: Create audit_logs table
-- Description: Audit trail for security and compliance

CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INT,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_action ON audit_logs(action);

-- Comments
COMMENT ON TABLE audit_logs IS 'Audit trail for security monitoring and compliance';
COMMENT ON COLUMN audit_logs.old_values IS 'JSON snapshot of data before change';
COMMENT ON COLUMN audit_logs.new_values IS 'JSON snapshot of data after change';
