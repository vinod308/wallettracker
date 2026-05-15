-- Migration: Subscription & Plan Management
-- Adds plan tracking to users and creates subscription history table

-- Add plan column to users (default = free)
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS plan VARCHAR(20) DEFAULT 'free'
        CHECK (plan IN ('free', 'basic', 'pro', 'enterprise')),
    ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMP;

-- Subscription history table (tracks every plan change)
CREATE TABLE IF NOT EXISTS subscriptions (
    id            SERIAL PRIMARY KEY,
    user_id       INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan          VARCHAR(20) NOT NULL CHECK (plan IN ('free', 'basic', 'pro', 'enterprise')),
    status        VARCHAR(20) NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active', 'cancelled', 'expired', 'trial')),
    started_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at    TIMESTAMP,                        -- NULL = never expires
    cancelled_at  TIMESTAMP,
    notes         TEXT,                             -- e.g. "upgraded by admin", "payment ref"
    created_by    INT REFERENCES users(id),
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sub_user   ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_sub_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_sub_plan   ON subscriptions(plan);

-- Plans reference table (single source of truth for limits & pricing)
CREATE TABLE IF NOT EXISTS plans (
    id               SERIAL PRIMARY KEY,
    name             VARCHAR(20) UNIQUE NOT NULL,   -- free | basic | pro | enterprise
    label            VARCHAR(50) NOT NULL,           -- display name
    max_clients      INT NOT NULL DEFAULT 5,         -- -1 = unlimited
    max_vendors      INT NOT NULL DEFAULT 5,         -- -1 = unlimited
    price_monthly    DECIMAL(10,2) DEFAULT 0,
    price_yearly     DECIMAL(10,2) DEFAULT 0,
    description      TEXT,
    is_active        BOOLEAN DEFAULT true,
    sort_order       INT DEFAULT 0
);

-- Seed plan data
INSERT INTO plans (name, label, max_clients, max_vendors, price_monthly, price_yearly, description, sort_order)
VALUES
    ('free',       'Free',       5,   5,   0,       0,       'Get started — up to 5 clients and 5 vendors',            1),
    ('basic',      'Basic',      10,  10,  999,     9990,    'Growing teams — up to 10 clients and 10 vendors',        2),
    ('pro',        'Pro',        500, 500, 2999,    29990,   'Scale up — up to 500 clients and 500 vendors',           3),
    ('enterprise', 'Enterprise', -1,  -1,  0,       0,       'Unlimited clients and vendors — custom pricing',         4)
ON CONFLICT (name) DO NOTHING;

COMMENT ON TABLE subscriptions IS 'Subscription history — one active row per user at any time';
COMMENT ON TABLE plans IS 'Plan definitions: limits, pricing, display labels';
COMMENT ON COLUMN plans.max_clients IS '-1 means unlimited';
COMMENT ON COLUMN plans.max_vendors IS '-1 means unlimited';
COMMENT ON COLUMN plans.price_monthly IS '0 for free and enterprise (custom)';
