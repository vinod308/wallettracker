-- Migration: Create notifications table
-- Description: In-app notifications for users

CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(30) CHECK (type IN ('Contract Expiring', 'At-Risk Client', 'Upsell Alert')),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    link_url VARCHAR(500),
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read_at);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created ON notifications(created_at);

-- Comments
COMMENT ON TABLE notifications IS 'In-app notifications with read status tracking';
COMMENT ON COLUMN notifications.read_at IS 'NULL if unread, timestamp when marked as read';
