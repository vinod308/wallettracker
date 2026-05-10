CREATE TABLE IF NOT EXISTS vendors (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    vendor_name VARCHAR(200) NOT NULL,
    vendor_type VARCHAR(50) NOT NULL DEFAULT 'Freelancer',
    gst_number VARCHAR(20),
    pan_number VARCHAR(10),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    country VARCHAR(100) DEFAULT 'India',
    contact_person VARCHAR(100),
    email VARCHAR(255),
    mobile VARCHAR(15),
    alt_mobile VARCHAR(15),
    website VARCHAR(500),
    account_holder VARCHAR(100),
    bank_name VARCHAR(200),
    account_number VARCHAR(20),
    ifsc_code VARCHAR(11),
    upi_id VARCHAR(100),
    swift_code VARCHAR(11),
    status VARCHAR(20) DEFAULT 'Active',
    onboarded_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON vendors(user_id);
CREATE INDEX IF NOT EXISTS idx_vendors_email ON vendors(email);
CREATE INDEX IF NOT EXISTS idx_vendors_status ON vendors(status);
