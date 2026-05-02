-- Migration: Create notification_preferences table
-- Description: User notification preferences

CREATE TABLE notification_preferences (
    id SERIAL PRIMARY KEY,
    user_id INT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email_contract_expiring BOOLEAN DEFAULT TRUE,
    email_at_risk_client BOOLEAN DEFAULT TRUE,
    email_upsell_opportunity BOOLEAN DEFAULT TRUE,
    email_frequency VARCHAR(20) DEFAULT 'Real-time' CHECK (email_frequency IN ('Real-time', 'Daily Digest', 'Weekly Summary')),
    in_app_enabled BOOLEAN DEFAULT TRUE,
    desktop_notifications BOOLEAN DEFAULT FALSE,
    notification_sound BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_notification_prefs_user ON notification_preferences(user_id);

-- Comments
COMMENT ON TABLE notification_preferences IS 'User-specific notification preferences';
COMMENT ON COLUMN notification_preferences.email_frequency IS 'How often to batch email notifications';
