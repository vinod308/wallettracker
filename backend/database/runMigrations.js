import 'dotenv/config';
import pkg from 'pg';
import bcrypt from 'bcrypt';

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
            DROP TABLE IF EXISTS subscriptions CASCADE;
            DROP TABLE IF EXISTS plans CASCADE;
            DROP TABLE IF EXISTS gst_invoices CASCADE;
            DROP TABLE IF EXISTS purchase_invoices CASCADE;
            DROP TABLE IF EXISTS invoices CASCADE;
            DROP TABLE IF EXISTS vendors CASCADE;
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
                role VARCHAR(20) DEFAULT 'Account Manager'
                    CHECK (role IN ('Admin', 'Account Manager', 'Finance', 'vendor_manager', 'vendor')),
                phone_number VARCHAR(20),
                department VARCHAR(100),
                time_zone VARCHAR(50) DEFAULT 'Asia/Kolkata',
                profile_picture_url TEXT,
                status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
                email_verified BOOLEAN DEFAULT FALSE,
                failed_login_attempts INT DEFAULT 0,
                account_locked_until TIMESTAMP,
                last_login_at TIMESTAMP,
                plan VARCHAR(20) DEFAULT 'free'
                    CHECK (plan IN ('free', 'basic', 'pro', 'enterprise')),
                plan_expires_at TIMESTAMP,
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

        // 16. Invoices Table
        console.log('📝 Creating invoices table...');
        await client.query(`
            CREATE TABLE invoices (
                id SERIAL PRIMARY KEY,
                client_id INT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
                invoice_number VARCHAR(50) UNIQUE NOT NULL,
                invoice_date DATE NOT NULL,
                invoice_month VARCHAR(20) NOT NULL,
                contract_start DATE,
                services_description TEXT,
                addons_description TEXT,
                service_mrr DECIMAL(12, 2) DEFAULT 0,
                addons_mrr DECIMAL(12, 2) DEFAULT 0,
                total_mrr DECIMAL(12, 2) DEFAULT 0,
                payment_status VARCHAR(20) DEFAULT 'Unpaid'
                    CHECK (payment_status IN ('Paid', 'Unpaid', 'Partial', 'Overdue')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX idx_invoices_client ON invoices(client_id);
            CREATE INDEX idx_invoices_date ON invoices(invoice_date);
            CREATE INDEX idx_invoices_month ON invoices(invoice_month);
            CREATE INDEX idx_invoices_payment ON invoices(payment_status);
            CREATE INDEX idx_invoices_number ON invoices(invoice_number);
        `);

        // 17. Vendors Table
        console.log('📝 Creating vendors table...');
        await client.query(`
            CREATE TABLE vendors (
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
            CREATE INDEX idx_vendors_user_id ON vendors(user_id);
            CREATE INDEX idx_vendors_email ON vendors(email);
            CREATE INDEX idx_vendors_status ON vendors(status);
        `);

        // 18. Purchase Invoices Table
        console.log('📝 Creating purchase_invoices table...');
        await client.query(`
            CREATE TABLE purchase_invoices (
                id SERIAL PRIMARY KEY,
                vendor_id INT NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
                invoice_number VARCHAR(50) NOT NULL,
                invoice_date DATE NOT NULL,
                due_date DATE,
                description TEXT,
                sub_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
                gst_rate DECIMAL(5,2) NOT NULL DEFAULT 18,
                gst_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
                total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
                status VARCHAR(20) DEFAULT 'Pending'
                    CHECK (status IN ('Pending','Approved','Paid','Rejected')),
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX idx_pi_vendor_id ON purchase_invoices(vendor_id);
            CREATE INDEX idx_pi_status ON purchase_invoices(status);
        `);

        // 19. GST Invoices Table
        console.log('📝 Creating gst_invoices table...');
        await client.query(`
            CREATE TABLE gst_invoices (
                id SERIAL PRIMARY KEY,
                client_id INT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
                invoice_number  VARCHAR(50) NOT NULL,
                invoice_date    DATE NOT NULL,
                invoice_type    VARCHAR(20) DEFAULT 'TAX INVOICE'
                    CHECK (invoice_type IN ('TAX INVOICE', 'CREDIT NOTE', 'DEBIT NOTE', 'BILL OF SUPPLY')),
                irn      VARCHAR(64) UNIQUE,
                ack_no   VARCHAR(20),
                ack_date TIMESTAMP,
                buyer_name    VARCHAR(200),
                buyer_gstin   VARCHAR(15),
                buyer_address TEXT,
                description TEXT,
                taxable_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
                cgst_rate      DECIMAL(5,2)  DEFAULT 0,
                cgst_amount    DECIMAL(12,2) DEFAULT 0,
                sgst_rate      DECIMAL(5,2)  DEFAULT 0,
                sgst_amount    DECIMAL(12,2) DEFAULT 0,
                igst_rate      DECIMAL(5,2)  DEFAULT 0,
                igst_amount    DECIMAL(12,2) DEFAULT 0,
                total_amount   DECIMAL(12,2) NOT NULL DEFAULT 0,
                status         VARCHAR(20) DEFAULT 'Active'
                    CHECK (status IN ('Active', 'Cancelled')),
                payment_status VARCHAR(20) DEFAULT 'Unpaid'
                    CHECK (payment_status IN ('Paid', 'Unpaid', 'Partial')),
                source VARCHAR(20) DEFAULT 'Manual'
                    CHECK (source IN ('Manual', 'GST Portal')),
                created_by INT REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX idx_gst_inv_client  ON gst_invoices(client_id);
            CREATE INDEX idx_gst_inv_irn     ON gst_invoices(irn);
            CREATE INDEX idx_gst_inv_date    ON gst_invoices(invoice_date);
            CREATE INDEX idx_gst_inv_payment ON gst_invoices(payment_status);
            CREATE INDEX idx_gst_inv_buyer   ON gst_invoices(buyer_gstin);
        `);

        // 20. Plans Table
        console.log('📝 Creating plans table...');
        await client.query(`
            CREATE TABLE plans (
                id               SERIAL PRIMARY KEY,
                name             VARCHAR(20) UNIQUE NOT NULL,
                label            VARCHAR(50) NOT NULL,
                max_clients      INT NOT NULL DEFAULT 5,
                max_vendors      INT NOT NULL DEFAULT 5,
                price_monthly    DECIMAL(10,2) DEFAULT 0,
                price_yearly     DECIMAL(10,2) DEFAULT 0,
                description      TEXT,
                is_active        BOOLEAN DEFAULT true,
                sort_order       INT DEFAULT 0
            );
        `);

        // 21. Subscriptions Table
        console.log('📝 Creating subscriptions table...');
        await client.query(`
            CREATE TABLE subscriptions (
                id            SERIAL PRIMARY KEY,
                user_id       INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                plan          VARCHAR(20) NOT NULL
                    CHECK (plan IN ('free', 'basic', 'pro', 'enterprise')),
                status        VARCHAR(20) NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'cancelled', 'expired', 'trial')),
                started_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                expires_at    TIMESTAMP,
                cancelled_at  TIMESTAMP,
                notes         TEXT,
                created_by    INT REFERENCES users(id),
                created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX idx_sub_user   ON subscriptions(user_id);
            CREATE INDEX idx_sub_status ON subscriptions(status);
            CREATE INDEX idx_sub_plan   ON subscriptions(plan);
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

        // Seed Plans Data
        console.log('🌱 Seeding plans data...');
        await client.query(`
            INSERT INTO plans (name, label, max_clients, max_vendors, price_monthly, price_yearly, description, sort_order)
            VALUES
                ('free',       'Free',       5,   5,   0,     0,     'Get started — up to 5 clients and 5 vendors',         1),
                ('basic',      'Basic',      10,  10,  299,   2990,  'Growing teams — up to 10 clients and 10 vendors',     2),
                ('pro',        'Pro',        500, 500, 599,   5990,  'Scale up — up to 500 clients and 500 vendors',        3),
                ('enterprise', 'Enterprise', -1,  -1,  1299,  12990, 'Unlimited clients and vendors — custom pricing',      4)
            ON CONFLICT (name) DO NOTHING;
        `);

        // Seed default admin user
        console.log('🌱 Seeding default admin user...');
        const passwordHash = await bcrypt.hash('Welcome@#1234', 12);
        await client.query(`
            INSERT INTO users (full_name, email, password_hash, role, status, plan)
            VALUES ('Vinod', 'vinod@garagemedia.net', $1, 'Admin', 'Active', 'free')
            ON CONFLICT (email) DO NOTHING;
        `, [passwordHash]);

        console.log('✅ All 21 tables created successfully!');
        console.log('✅ Services and plans seeded successfully!');
        console.log('✅ Default admin user seeded (vinod@garagemedia.net)');
        console.log('🎉 Database is ready!');
    } catch (error) {
        console.error('❌ Migration error:', error);
        throw error;
    } finally {
        await client.end();
    }
}

runMigrations();
