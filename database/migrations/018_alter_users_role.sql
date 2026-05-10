-- Add vendor and vendor_manager to users role constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
    CHECK (role IN ('Admin', 'Account Manager', 'Finance', 'vendor_manager', 'vendor'));
