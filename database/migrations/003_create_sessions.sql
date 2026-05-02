-- Migration: Create sessions table
-- Description: Manage user sessions with 30-minute inactivity timeout

CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- Comments
COMMENT ON TABLE sessions IS 'Active user sessions with 30-minute inactivity timeout';
COMMENT ON COLUMN sessions.last_activity IS 'Updated on every API call to track inactivity';
COMMENT ON COLUMN sessions.expires_at IS 'Session expires 30 minutes after last_activity';
