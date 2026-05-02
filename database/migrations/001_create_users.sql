-- Migration: Create users table
-- Description: Core user authentication and profile table

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(50) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'Account Manager' CHECK (role IN ('Admin', 'Account Manager', 'Finance')),
    phone_number VARCHAR(20),
    department VARCHAR(100),
    time_zone VARCHAR(50) DEFAULT 'Asia/Kolkata',
    profile_picture_url TEXT,
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    email_verified BOOLEAN DEFAULT FALSE,
    failed_login_attempts INT DEFAULT 0,
    account_locked_until TIMESTAMP,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_role ON users(role);

-- Comments
COMMENT ON TABLE users IS 'Core user authentication and profile information';
COMMENT ON COLUMN users.failed_login_attempts IS 'Track failed login attempts for account lockout (max 5)';
COMMENT ON COLUMN users.account_locked_until IS 'Account locked until this timestamp (15 min after 5th failure)';
