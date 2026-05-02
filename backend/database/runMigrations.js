import 'dotenv/config';
import pkg from 'pg';

const { Client } = pkg;

const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'wallettracker',
});

async function runMigrations() {
    try {
        await client.connect();
        console.log('✅ Connected to PostgreSQL');

        // Drop tables if they exist (for clean setup)
        console.log('🗑️  Dropping existing tables...');
        await client.query(`
            DROP TABLE IF EXISTS audit_logs CASCADE;
            DROP TABLE IF EXISTS churn_reasons CASCADE;
            DROP TABLE IF EXISTS scheduled_reports CASCADE;
            DROP TABLE IF EXISTS notification_preferences CASCADE;
            DROP TABLE IF EXISTS notifications CASCADE;
            DROP TABLE IF EXISTS renewal_tasks CASCADE;
            DROP TABLE IF EXISTS upsell_opportunities CASCADE;
            DROP TABLE IF EXISTS revenue_records CASCADE;
            DROP TABLE IF EXISTS client_services CASCADE;
            DROP TABLE IF EXISTS services CASCADE;
            DROP TABLE IF EXISTS contracts CASCADE;
            DROP TABLE IF EXISTS clients CASCADE;
            DROP TABLE IF EXISTS sessions CASCADE;
            DROP TABLE IF EXISTS password_reset_tokens CASCADE;
            DROP TABLE IF EXISTS users CASCADE;
        `);

        // 1. Users Table
        console.log('📝 Creating users table...');
        await client.query(`
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
            CREATE INDEX idx_users_email ON users(email);
            CREATE INDEX idx_users_status ON users(status);
        `);

        // 2. Password Reset Tokens Table
        console.log('📝 Creating password_reset_tokens table...');
        await client.query(`
            CREATE TABLE password_reset_tokens (
                id SERIAL PRIMARY KEY,
                user_id INT NOT NULL REFERENCES users(id),
                token VARCHAR(255) UNIQUE NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                used_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX idx_reset_tokens_token ON password_reset_tokens(token);
            CREATE INDEX idx_reset_tokens_expires ON password_reset_tokens(expires_at);
        `);

        // 3. Sessions Table
        console.log('📝 Creating sessions table...');
        await client.query(`
            CREATE TABLE sessions (
                id SERIAL PRIMARY KEY,
                user_id INT NOT NULL REFERENCES users(id),
                token VARCHAR(255) UNIQUE NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ip_address VARCHAR(45),
                user_agent TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX idx_sessions_token ON sessions(token);
            CREATE INDEX idx_sessions_user_id ON sessions(user_id);
        `);

        // 4. Clients Table
        console.log('📝 Creating clients table...');
        await client.query(`
            CREATE TABLE clients (
                id SERIAL PRIMARY KEY,
                project_name VARCHAR(100) NOT NULL,
                client_name VARCHAR(100) NOT NULL,
                client_type VARCHAR(20) NOT NULL CHECK (client_type IN ('Retainer', 'Contractor')),
                industry VARCHAR(100),
                estimated_total_budget DECIMAL(12, 2),
                status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'At Risk')),
                created_by INT REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                deleted_at TIMESTAMP
            );
            CREATE INDEX idx_clients_name ON clients(client_name);
            CREATE INDEX idx_clients_status ON clients(status);
            CREATE INDEX idx_clients_type ON clients(client_type);
        `);

        // 5. Contracts Table
        console.log('📝 Creating contracts table...');
        await client.query(`
            CREATE TABLE contracts (
                id SERIAL PRIMARY KEY,
                client_id INT NOT NULL REFERENCES clients(id),
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                mrr DECIMAL(12, 2) NOT NULL,
                auto_renew BOOLEAN DEFAULT FALSE,
                renewal_status VARCHAR(20) DEFAULT 'Not Started' CHECK (renewal_status IN (
                    'Not Started', 'Client Contacted', 'Proposal Sent',
                    'Negotiating', 'Awaiting Signature', 'Renewed', 'Lost'
                )),
                assigned_to INT REFERENCES users(id),
                previous_contract_id INT REFERENCES contracts(id),
                status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Expired', 'Renewed')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX idx_contracts_client_id ON contracts(client_id);
            CREATE INDEX idx_contracts_end_date ON contracts(end_date);
            CREATE INDEX idx_contracts_status ON contracts(status);
        `);

        // 6. Services Table
        console.log('📝 Creating services table...');
        await client.query(`
            CREATE TABLE services (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) UNIQUE NOT NULL,
                category VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 7. Client Services Table (Many-to-Many)
        console.log('📝 Creating client_services table...');
        await client.query(`
            CREATE TABLE client_services (
                id SERIAL PRIMARY KEY,
                client_id INT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
                service_id INT NOT NULL REFERENCES services(id),
                is_addon BOOLEAN DEFAULT FALSE,
                monthly_amount DECIMAL(12, 2),
                yearly_amount DECIMAL(12, 2),
                billing_frequency VARCHAR(10) CHECK (billing_frequency IN ('Monthly', 'Yearly')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(client_id, service_id)
            );
            CREATE INDEX idx_client_services_client ON client_services(client_id);
            CREATE INDEX idx_client_services_service ON client_services(service_id);
        `);

        // 8. Revenue Records Table
        console.log('📝 Creating revenue_records table...');
        await client.query(`
            CREATE TABLE revenue_records (
                id SERIAL PRIMARY KEY,
                client_id INT NOT NULL REFERENCES clients(id),
                service_id INT REFERENCES services(id),
                amount DECIMAL(12, 2) NOT NULL,
                record_date DATE NOT NULL,
                record_type VARCHAR(20) CHECK (record_type IN ('Recurring', 'One-Time')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX idx_revenue_client ON revenue_records(client_id);
            CREATE INDEX idx_revenue_date ON revenue_records(record_date);
        `);

        // 9. Upsell Opportunities Table
        console.log('📝 Creating upsell_opportunities table...');
        await client.query(`
            CREATE TABLE upsell_opportunities (
                id SERIAL PRIMARY KEY,
                client_id INT NOT NULL REFERENCES clients(id),
                recommended_services TEXT[],
                potential_gain DECIMAL(12, 2),
                probability INT CHECK (probability BETWEEN 0 AND 100),
                priority VARCHAR(10) CHECK (priority IN ('High', 'Medium', 'Low')),
                status VARCHAR(20) DEFAULT 'Identified' CHECK (status IN ('Identified', 'In Progress', 'Won', 'Lost')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX idx_upsell_client ON upsell_opportunities(client_id);
            CREATE INDEX idx_upsell_priority ON upsell_opportunities(priority);
        `);

        // 10. Renewal Tasks Table
        console.log('📝 Creating renewal_tasks table...');
        await client.query(`
            CREATE TABLE renewal_tasks (
                id SERIAL PRIMARY KEY,
                client_id INT NOT NULL REFERENCES clients(id),
                contract_id INT NOT NULL REFERENCES contracts(id),
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
            CREATE INDEX idx_renewal_tasks_assigned ON renewal_tasks(assigned_to);
            CREATE INDEX idx_renewal_tasks_due_date ON renewal_tasks(due_date);
        `);

        // 11. Notifications Table
        console.log('📝 Creating notifications table...');
        await client.query(`
            CREATE TABLE notifications (
                id SERIAL PRIMARY KEY,
                user_id INT NOT NULL REFERENCES users(id),
                type VARCHAR(30) CHECK (type IN ('Contract Expiring', 'At-Risk Client', 'Upsell Alert')),
                title VARCHAR(200) NOT NULL,
                description TEXT,
                link_url VARCHAR(500),
                read_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX idx_notifications_user ON notifications(user_id);
            CREATE INDEX idx_notifications_read ON notifications(read_at);
        `);

        // 12. Scheduled Reports Table
        console.log('📝 Creating scheduled_reports table...');
        await client.query(`
            CREATE TABLE scheduled_reports (
                id SERIAL PRIMARY KEY,
                report_type VARCHAR(50) NOT NULL,
                configuration JSON NOT NULL,
                frequency VARCHAR(20) CHECK (frequency IN ('Daily', 'Weekly', 'Monthly', 'Quarterly')),
                schedule_time TIME NOT NULL,
                schedule_day_of_week INT,
                schedule_day_of_month INT,
                recipients TEXT[],
                format VARCHAR(10) CHECK (format IN ('PDF', 'Excel', 'Both')),
                include_note TEXT,
                next_run_at TIMESTAMP,
                created_by INT REFERENCES users(id),
                active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 13. Audit Logs Table
        console.log('📝 Creating audit_logs table...');
        await client.query(`
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
            CREATE INDEX idx_audit_user ON audit_logs(user_id);
            CREATE INDEX idx_audit_created ON audit_logs(created_at);
        `);

        // 14. Notification Preferences Table
        console.log('📝 Creating notification_preferences table...');
        await client.query(`
            CREATE TABLE notification_preferences (
                id SERIAL PRIMARY KEY,
                user_id INT UNIQUE NOT NULL REFERENCES users(id),
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
        `);

        // 15. Churn Reasons Table
        console.log('📝 Creating churn_reasons table...');
        await client.query(`
            CREATE TABLE churn_reasons (
                id SERIAL PRIMARY KEY,
                client_id INT NOT NULL REFERENCES clients(id),
                contract_id INT REFERENCES contracts(id),
                reason VARCHAR(50) CHECK (reason IN ('Pricing', 'Service Quality', 'Switched to Competitor', 'Other')),
                notes TEXT NOT NULL,
                churned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                logged_by INT REFERENCES users(id)
            );
        `);

        // Seed Services Data
        console.log('🌱 Seeding services data...');
        await client.query(`
            INSERT INTO services (name, category) VALUES
                ('Social Media', 'Marketing'),
                ('Performance Marketing', 'Marketing'),
                ('SEO', 'Marketing'),
                ('Design', 'Creative'),
                ('Web Development', 'Technology'),
                ('Analytics', 'Data'),
                ('Content Marketing', 'Marketing'),
                ('Paid Ads', 'Marketing'),
                ('Maintenance', 'Technology')
            ON CONFLICT (name) DO NOTHING;
        `);

        console.log('✅ All 15 tables created successfully!');
        console.log('✅ Services seeded successfully!');
        console.log('🎉 Database is ready!');
    } catch (error) {
        console.error('❌ Migration error:', error);
        throw error;
    } finally {
        await client.end();
    }
}

runMigrations();
