-- Migration: Create scheduled_reports table
-- Description: Automated report scheduling and configuration

CREATE TABLE scheduled_reports (
    id SERIAL PRIMARY KEY,
    report_type VARCHAR(50) NOT NULL,
    configuration JSON NOT NULL,
    frequency VARCHAR(20) CHECK (frequency IN ('Daily', 'Weekly', 'Monthly', 'Quarterly')),
    schedule_time TIME NOT NULL,
    schedule_day_of_week INT CHECK (schedule_day_of_week BETWEEN 0 AND 6),
    schedule_day_of_month INT CHECK (schedule_day_of_month BETWEEN 1 AND 31),
    recipients TEXT[],
    format VARCHAR(10) CHECK (format IN ('PDF', 'Excel', 'Both')),
    include_note TEXT,
    next_run_at TIMESTAMP,
    created_by INT REFERENCES users(id),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_scheduled_reports_next_run ON scheduled_reports(next_run_at);
CREATE INDEX idx_scheduled_reports_active ON scheduled_reports(active);
CREATE INDEX idx_scheduled_reports_type ON scheduled_reports(report_type);

-- Comments
COMMENT ON TABLE scheduled_reports IS 'Scheduled report configurations with cron-like execution';
COMMENT ON COLUMN scheduled_reports.configuration IS 'JSON object with report-specific configuration';
COMMENT ON COLUMN scheduled_reports.recipients IS 'Array of email addresses';
