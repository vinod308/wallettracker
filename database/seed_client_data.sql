-- ========================================
-- Garage WalletTracker - Client Data Seed
-- ========================================
-- Updated with July 2025 invoice data from Excel
-- This script populates the database with real client data

-- First, let's ensure services table has all required services
INSERT INTO services (name, category) VALUES
    ('Social Media', 'Marketing'),
    ('Performance Marketing', 'Marketing'),
    ('SEO', 'Marketing'),
    ('Design', 'Creative'),
    ('Web Development', 'Technology'),
    ('Analytics', 'Data'),
    ('Content Marketing', 'Marketing'),
    ('Paid Ads', 'Marketing'),
    ('Maintenance', 'Technology'),
    ('Digital Marketing', 'Marketing'),
    ('Lead Generation', 'Marketing'),
    ('Solar Installation', 'Technology')
ON CONFLICT (name) DO NOTHING;

-- ========================================
-- INSERT CLIENTS (11 total - 10 existing + 1 new from July CSV)
-- ========================================

-- Client 1: DJT Fashion Pvt Ltd (from CSV: DJT Fashion Private Limited)
INSERT INTO clients (project_name, client_name, client_type, industry, estimated_total_budget, status, created_by, created_at)
VALUES ('Digital Marketing Services', 'DJT Fashion Pvt Ltd', 'Retainer', 'Fashion & Retail', 5000000, 'Active', 1, NOW())
RETURNING id;

-- Client 2: Shyam Metalics & Energy Ltd (from CSV: Shyam Metalics and energy limited)
INSERT INTO clients (project_name, client_name, client_type, industry, estimated_total_budget, status, created_by, created_at)
VALUES ('Digital Marketing Services', 'Shyam Metalics & Energy Ltd', 'Retainer', 'Manufacturing', 7000000, 'Active', 1, NOW())
RETURNING id;

-- Client 3: Center for Catalyzing Change (not in July CSV - no July invoice)
INSERT INTO clients (project_name, client_name, client_type, industry, estimated_total_budget, status, created_by, created_at)
VALUES ('Ministry Design Campaign', 'Center for Catalyzing Change', 'Contractor', 'Non-Profit', 800000, 'Inactive', 1, NOW())
RETURNING id;

-- Client 4: TLG India Pvt Ltd (not in July CSV - no July invoice)
INSERT INTO clients (project_name, client_name, client_type, industry, estimated_total_budget, status, created_by, created_at)
VALUES ('E-Learning Content Development', 'TLG India Pvt Ltd', 'Retainer', 'Education', 3500000, 'Inactive', 1, NOW())
RETURNING id;

-- Client 5: Carrier Airconditioning & Refrigeration (from CSV)
INSERT INTO clients (project_name, client_name, client_type, industry, estimated_total_budget, status, created_by, created_at)
VALUES ('Digital Marketing Retainership', 'Carrier Airconditioning & Refrigeration', 'Retainer', 'HVAC & Manufacturing', 4500000, 'Active', 1, NOW())
RETURNING id;

-- Client 6: Kaizzen PR Services Pvt Ltd (not in July CSV - no July invoice)
INSERT INTO clients (project_name, client_name, client_type, industry, estimated_total_budget, status, created_by, created_at)
VALUES ('Social Media & PR Integration', 'Kaizzen PR Services Pvt Ltd', 'Retainer', 'Public Relations', 6000000, 'Inactive', 1, NOW())
RETURNING id;

-- Client 7: The Indus Entrepreneurs - Delhi (not in July CSV - no July invoice)
INSERT INTO clients (project_name, client_name, client_type, industry, estimated_total_budget, status, created_by, created_at)
VALUES ('Community Engagement Campaign', 'The Indus Entrepreneurs – Delhi', 'Contractor', 'Business Networking', 2000000, 'Inactive', 1, NOW())
RETURNING id;

-- Client 8: Utkarsh Small Finance Bank (from CSV: Utkarsh Bank Finance bank limited)
INSERT INTO clients (project_name, client_name, client_type, industry, estimated_total_budget, status, created_by, created_at)
VALUES ('Digital Marketing & Lead Generation', 'Utkarsh Small Finance Bank', 'Retainer', 'Banking & Finance', 30000000, 'Active', 1, NOW())
RETURNING id;

-- Client 9: Enrich Data Services Pvt Ltd (not in July CSV - no July invoice)
INSERT INTO clients (project_name, client_name, client_type, industry, estimated_total_budget, status, created_by, created_at)
VALUES ('Content Strategy & Development', 'Enrich Data Services Pvt Ltd', 'Retainer', 'Data & Technology', 15000000, 'Inactive', 1, NOW())
RETURNING id;

-- Client 10: VIP Industries Ltd (from CSV: Vip Industries Limited)
INSERT INTO clients (project_name, client_name, client_type, industry, estimated_total_budget, status, created_by, created_at)
VALUES ('Digital Marketing Services', 'VIP Industries Ltd', 'Retainer', 'Consumer Goods', 9000000, 'Active', 1, NOW())
RETURNING id;

-- Client 11: Shudanshu Rai (NEW from July CSV - one-time solar project)
INSERT INTO clients (project_name, client_name, client_type, industry, estimated_total_budget, status, created_by, created_at)
VALUES ('Solar Installation Project', 'Shudanshu Rai', 'Contractor', 'Solar Energy', 509444, 'Active', 1, NOW())
RETURNING id;

-- ========================================
-- INSERT CONTRACTS (updated MRR from July CSV)
-- ========================================

-- Client 1: DJT Fashion - MRR updated to ₹4,13,000 from July CSV
INSERT INTO contracts (client_id, start_date, end_date, mrr, auto_renew, renewal_status, assigned_to, status)
VALUES (
    (SELECT id FROM clients WHERE client_name = 'DJT Fashion Pvt Ltd'),
    '2025-01-01',
    '2026-03-25',
    413000,
    false,
    'Client Contacted',
    1,
    'Active'
);

-- Client 2: Shyam Metalics - MRR ₹2,95,000 (same as CSV)
INSERT INTO contracts (client_id, start_date, end_date, mrr, auto_renew, renewal_status, assigned_to, status)
VALUES (
    (SELECT id FROM clients WHERE client_name = 'Shyam Metalics & Energy Ltd'),
    '2025-02-01',
    '2026-02-24',
    295000,
    false,
    'Proposal Sent',
    1,
    'Active'
);

-- Client 3: Center for Catalyzing Change - No July invoice (inactive)
INSERT INTO contracts (client_id, start_date, end_date, mrr, auto_renew, renewal_status, assigned_to, status)
VALUES (
    (SELECT id FROM clients WHERE client_name = 'Center for Catalyzing Change'),
    '2025-11-01',
    '2026-04-30',
    60470,
    false,
    'Not Started',
    1,
    'Active'
);

-- Client 4: TLG India - No July invoice (inactive)
INSERT INTO contracts (client_id, start_date, end_date, mrr, auto_renew, renewal_status, assigned_to, status)
VALUES (
    (SELECT id FROM clients WHERE client_name = 'TLG India Pvt Ltd'),
    '2024-12-01',
    '2026-06-09',
    159469,
    true,
    'Not Started',
    1,
    'Active'
);

-- Client 5: Carrier - Service MRR ₹1,88,800 from CSV
INSERT INTO contracts (client_id, start_date, end_date, mrr, auto_renew, renewal_status, assigned_to, status)
VALUES (
    (SELECT id FROM clients WHERE client_name = 'Carrier Airconditioning & Refrigeration'),
    '2025-01-15',
    '2026-03-05',
    188800,
    false,
    'Negotiating',
    1,
    'Active'
);

-- Client 6: Kaizzen PR - No July invoice (inactive)
INSERT INTO contracts (client_id, start_date, end_date, mrr, auto_renew, renewal_status, assigned_to, status)
VALUES (
    (SELECT id FROM clients WHERE client_name = 'Kaizzen PR Services Pvt Ltd'),
    '2024-10-01',
    '2026-08-28',
    250000,
    true,
    'Not Started',
    1,
    'Active'
);

-- Client 7: The Indus Entrepreneurs - No July invoice (inactive)
INSERT INTO contracts (client_id, start_date, end_date, mrr, auto_renew, renewal_status, assigned_to, status)
VALUES (
    (SELECT id FROM clients WHERE client_name = 'The Indus Entrepreneurs – Delhi'),
    '2025-01-10',
    '2026-03-15',
    118000,
    false,
    'Not Started',
    1,
    'Active'
);

-- Client 8: Utkarsh Bank - Service MRR ₹4,53,000 base retainer
INSERT INTO contracts (client_id, start_date, end_date, mrr, auto_renew, renewal_status, assigned_to, status)
VALUES (
    (SELECT id FROM clients WHERE client_name = 'Utkarsh Small Finance Bank'),
    '2024-07-01',
    '2027-06-30',
    453000,
    true,
    'Not Started',
    1,
    'Active'
);

-- Client 9: Enrich Data - No July invoice (inactive)
INSERT INTO contracts (client_id, start_date, end_date, mrr, auto_renew, renewal_status, assigned_to, status)
VALUES (
    (SELECT id FROM clients WHERE client_name = 'Enrich Data Services Pvt Ltd'),
    '2024-06-01',
    '2026-05-31',
    826000,
    true,
    'Not Started',
    1,
    'Active'
);

-- Client 10: VIP Industries - Service MRR ₹3,71,700 from CSV
INSERT INTO contracts (client_id, start_date, end_date, mrr, auto_renew, renewal_status, assigned_to, status)
VALUES (
    (SELECT id FROM clients WHERE client_name = 'VIP Industries Ltd'),
    '2024-09-01',
    '2026-04-05',
    371700,
    false,
    'Client Contacted',
    1,
    'Active'
);

-- Client 11: Shudanshu Rai - One-time project contract
INSERT INTO contracts (client_id, start_date, end_date, mrr, auto_renew, renewal_status, assigned_to, status)
VALUES (
    (SELECT id FROM clients WHERE client_name = 'Shudanshu Rai'),
    '2025-07-01',
    '2025-08-31',
    509444,
    false,
    'Not Started',
    1,
    'Active'
);

-- ========================================
-- LINK SERVICES TO CLIENTS
-- ========================================

-- Client 1: DJT Fashion - Digital Marketing Services (₹4,13,000 total from July CSV)
INSERT INTO client_services (client_id, service_id, is_addon, monthly_amount, billing_frequency)
VALUES
    ((SELECT id FROM clients WHERE client_name = 'DJT Fashion Pvt Ltd'),
     (SELECT id FROM services WHERE name = 'Social Media'), false, 150000, 'Monthly'),
    ((SELECT id FROM clients WHERE client_name = 'DJT Fashion Pvt Ltd'),
     (SELECT id FROM services WHERE name = 'SEO'), false, 100000, 'Monthly'),
    ((SELECT id FROM clients WHERE client_name = 'DJT Fashion Pvt Ltd'),
     (SELECT id FROM services WHERE name = 'Performance Marketing'), false, 100000, 'Monthly'),
    ((SELECT id FROM clients WHERE client_name = 'DJT Fashion Pvt Ltd'),
     (SELECT id FROM services WHERE name = 'Paid Ads'), false, 63000, 'Monthly');

-- Client 2: Shyam Metalics - Digital Marketing Services (₹2,95,000 from July CSV)
INSERT INTO client_services (client_id, service_id, is_addon, monthly_amount, billing_frequency)
VALUES
    ((SELECT id FROM clients WHERE client_name = 'Shyam Metalics & Energy Ltd'),
     (SELECT id FROM services WHERE name = 'Social Media'), false, 100000, 'Monthly'),
    ((SELECT id FROM clients WHERE client_name = 'Shyam Metalics & Energy Ltd'),
     (SELECT id FROM services WHERE name = 'Performance Marketing'), false, 120000, 'Monthly'),
    ((SELECT id FROM clients WHERE client_name = 'Shyam Metalics & Energy Ltd'),
     (SELECT id FROM services WHERE name = 'SEO'), false, 75000, 'Monthly');

-- Client 3: Center for Catalyzing Change - Design (historical, no July invoice)
INSERT INTO client_services (client_id, service_id, is_addon, monthly_amount, billing_frequency)
VALUES
    ((SELECT id FROM clients WHERE client_name = 'Center for Catalyzing Change'),
     (SELECT id FROM services WHERE name = 'Design'), false, 60470, 'Monthly');

-- Client 4: TLG India - Content Marketing, Web Development (historical, no July invoice)
INSERT INTO client_services (client_id, service_id, is_addon, monthly_amount, billing_frequency)
VALUES
    ((SELECT id FROM clients WHERE client_name = 'TLG India Pvt Ltd'),
     (SELECT id FROM services WHERE name = 'Content Marketing'), false, 90000, 'Monthly'),
    ((SELECT id FROM clients WHERE client_name = 'TLG India Pvt Ltd'),
     (SELECT id FROM services WHERE name = 'Web Development'), false, 69469, 'Monthly');

-- Client 5: Carrier - Service ₹1,88,800 + Addons ₹2,15,468 from CSV
INSERT INTO client_services (client_id, service_id, is_addon, monthly_amount, billing_frequency)
VALUES
    ((SELECT id FROM clients WHERE client_name = 'Carrier Airconditioning & Refrigeration'),
     (SELECT id FROM services WHERE name = 'Social Media'), false, 65000, 'Monthly'),
    ((SELECT id FROM clients WHERE client_name = 'Carrier Airconditioning & Refrigeration'),
     (SELECT id FROM services WHERE name = 'Paid Ads'), false, 85000, 'Monthly'),
    ((SELECT id FROM clients WHERE client_name = 'Carrier Airconditioning & Refrigeration'),
     (SELECT id FROM services WHERE name = 'Analytics'), false, 38800, 'Monthly'),
    ((SELECT id FROM clients WHERE client_name = 'Carrier Airconditioning & Refrigeration'),
     (SELECT id FROM services WHERE name = 'Maintenance'), true, 215468, 'Monthly');

-- Client 6: Kaizzen PR - Social Media, Content, SEO (historical, no July invoice)
INSERT INTO client_services (client_id, service_id, is_addon, monthly_amount, billing_frequency)
VALUES
    ((SELECT id FROM clients WHERE client_name = 'Kaizzen PR Services Pvt Ltd'),
     (SELECT id FROM services WHERE name = 'Social Media'), false, 120000, 'Monthly'),
    ((SELECT id FROM clients WHERE client_name = 'Kaizzen PR Services Pvt Ltd'),
     (SELECT id FROM services WHERE name = 'Content Marketing'), false, 80000, 'Monthly'),
    ((SELECT id FROM clients WHERE client_name = 'Kaizzen PR Services Pvt Ltd'),
     (SELECT id FROM services WHERE name = 'SEO'), false, 50000, 'Monthly');

-- Client 7: The Indus Entrepreneurs (historical, no July invoice)
INSERT INTO client_services (client_id, service_id, is_addon, monthly_amount, billing_frequency)
VALUES
    ((SELECT id FROM clients WHERE client_name = 'The Indus Entrepreneurs – Delhi'),
     (SELECT id FROM services WHERE name = 'Social Media'), false, 70000, 'Monthly'),
    ((SELECT id FROM clients WHERE client_name = 'The Indus Entrepreneurs – Delhi'),
     (SELECT id FROM services WHERE name = 'Content Marketing'), false, 48000, 'Monthly');

-- Client 8: Utkarsh Bank - Base services + addon campaigns from CSV
INSERT INTO client_services (client_id, service_id, is_addon, monthly_amount, billing_frequency)
VALUES
    ((SELECT id FROM clients WHERE client_name = 'Utkarsh Small Finance Bank'),
     (SELECT id FROM services WHERE name = 'Social Media'), false, 150000, 'Monthly'),
    ((SELECT id FROM clients WHERE client_name = 'Utkarsh Small Finance Bank'),
     (SELECT id FROM services WHERE name = 'Performance Marketing'), false, 120000, 'Monthly'),
    ((SELECT id FROM clients WHERE client_name = 'Utkarsh Small Finance Bank'),
     (SELECT id FROM services WHERE name = 'SEO'), false, 90000, 'Monthly'),
    ((SELECT id FROM clients WHERE client_name = 'Utkarsh Small Finance Bank'),
     (SELECT id FROM services WHERE name = 'Content Marketing'), false, 93000, 'Monthly'),
    ((SELECT id FROM clients WHERE client_name = 'Utkarsh Small Finance Bank'),
     (SELECT id FROM services WHERE name = 'Lead Generation'), true, 2493658.80, 'Monthly');

-- Client 9: Enrich Data (historical, no July invoice)
INSERT INTO client_services (client_id, service_id, is_addon, monthly_amount, billing_frequency)
VALUES
    ((SELECT id FROM clients WHERE client_name = 'Enrich Data Services Pvt Ltd'),
     (SELECT id FROM services WHERE name = 'Content Marketing'), false, 350000, 'Monthly'),
    ((SELECT id FROM clients WHERE client_name = 'Enrich Data Services Pvt Ltd'),
     (SELECT id FROM services WHERE name = 'Web Development'), false, 300000, 'Monthly'),
    ((SELECT id FROM clients WHERE client_name = 'Enrich Data Services Pvt Ltd'),
     (SELECT id FROM services WHERE name = 'Design'), false, 176000, 'Monthly');

-- Client 10: VIP Industries - Service ₹3,71,700 + Addons ₹2,35,410 from CSV
INSERT INTO client_services (client_id, service_id, is_addon, monthly_amount, billing_frequency)
VALUES
    ((SELECT id FROM clients WHERE client_name = 'VIP Industries Ltd'),
     (SELECT id FROM services WHERE name = 'Social Media'), false, 120000, 'Monthly'),
    ((SELECT id FROM clients WHERE client_name = 'VIP Industries Ltd'),
     (SELECT id FROM services WHERE name = 'SEO'), false, 100000, 'Monthly'),
    ((SELECT id FROM clients WHERE client_name = 'VIP Industries Ltd'),
     (SELECT id FROM services WHERE name = 'Paid Ads'), false, 110000, 'Monthly'),
    ((SELECT id FROM clients WHERE client_name = 'VIP Industries Ltd'),
     (SELECT id FROM services WHERE name = 'Analytics'), false, 41700, 'Monthly'),
    ((SELECT id FROM clients WHERE client_name = 'VIP Industries Ltd'),
     (SELECT id FROM services WHERE name = 'Performance Marketing'), true, 235410, 'Monthly');

-- Client 11: Shudanshu Rai - Solar Installation (one-time project)
INSERT INTO client_services (client_id, service_id, is_addon, monthly_amount, billing_frequency)
VALUES
    ((SELECT id FROM clients WHERE client_name = 'Shudanshu Rai'),
     (SELECT id FROM services WHERE name = 'Solar Installation'), false, 509444, 'Monthly');

-- ========================================
-- GENERATE REVENUE RECORDS (April - July 2025)
-- ========================================
-- Historical revenue for April-June, current for July

DO $$
DECLARE
    client_record RECORD;
    service_record RECORD;
    month_offset INT;
    revenue_date DATE;
BEGIN
    -- Loop through each client
    FOR client_record IN
        SELECT id, client_name FROM clients WHERE deleted_at IS NULL
    LOOP
        -- Loop through each service for this client
        FOR service_record IN
            SELECT cs.service_id, cs.monthly_amount, cs.is_addon, s.name as service_name
            FROM client_services cs
            JOIN services s ON s.id = cs.service_id
            WHERE cs.client_id = client_record.id
        LOOP
            -- Generate revenue for April to July 2025 (4 months)
            FOR month_offset IN 0..3 LOOP
                revenue_date := DATE '2025-04-01' + (month_offset || ' months')::INTERVAL;

                INSERT INTO revenue_records (client_id, service_id, amount, record_date, record_type)
                VALUES (
                    client_record.id,
                    service_record.service_id,
                    service_record.monthly_amount,
                    revenue_date,
                    CASE WHEN service_record.is_addon THEN 'One-Time' ELSE 'Recurring' END
                );
            END LOOP;
        END LOOP;
    END LOOP;
END $$;

-- ========================================
-- INSERT JULY 2025 INVOICES (from Excel CSV)
-- ========================================
-- Exact data from "Client Invoice april to september - July.csv"

-- Invoice 1: VIP Industries Ltd
INSERT INTO invoices (client_id, invoice_number, invoice_date, invoice_month, contract_start, services_description, addons_description, service_mrr, addons_mrr, total_mrr, payment_status)
VALUES (
    (SELECT id FROM clients WHERE client_name = 'VIP Industries Ltd'),
    'GPPL/2025-26/52',
    '2025-07-01',
    'July 2025',
    '2025-07-01',
    'Digital Marketing Services',
    'Social Media Promotions July 2025 with agency fees 5%',
    371700,
    235410,
    607110,
    'Paid'
);

-- Invoice 2: DJT Fashion Pvt Ltd
INSERT INTO invoices (client_id, invoice_number, invoice_date, invoice_month, contract_start, services_description, addons_description, service_mrr, addons_mrr, total_mrr, payment_status)
VALUES (
    (SELECT id FROM clients WHERE client_name = 'DJT Fashion Pvt Ltd'),
    'GPPL/2025-26/39',
    '2025-07-01',
    'July 2025',
    '2025-07-01',
    'Digital Marketing Services Retainer Month of June 2025',
    NULL,
    413000,
    0,
    413000,
    'Paid'
);

-- Invoice 3: Carrier Airconditioning & Refrigeration
INSERT INTO invoices (client_id, invoice_number, invoice_date, invoice_month, contract_start, services_description, addons_description, service_mrr, addons_mrr, total_mrr, payment_status)
VALUES (
    (SELECT id FROM clients WHERE client_name = 'Carrier Airconditioning & Refrigeration'),
    'GPPL/2025-26/1',
    '2025-07-01',
    'July 2025',
    '2025-07-01',
    'Digital Marketing Services Retainership Month Of July 2025',
    'Digital Marketing Services Glow Sign Boards Installation || Weather cool Services',
    188800,
    215468,
    404268,
    'Paid'
);

-- Invoice 4: Shyam Metalics & Energy Ltd
INSERT INTO invoices (client_id, invoice_number, invoice_date, invoice_month, contract_start, services_description, addons_description, service_mrr, addons_mrr, total_mrr, payment_status)
VALUES (
    (SELECT id FROM clients WHERE client_name = 'Shyam Metalics & Energy Ltd'),
    'GPPL/2025-26/59',
    '2025-07-01',
    'July 2025',
    '2025-07-01',
    'Digital Marketing Services Retainer Month of July 2025',
    NULL,
    295000,
    0,
    295000,
    'Paid'
);

-- Invoice 5: Utkarsh Small Finance Bank
INSERT INTO invoices (client_id, invoice_number, invoice_date, invoice_month, contract_start, services_description, addons_description, service_mrr, addons_mrr, total_mrr, payment_status)
VALUES (
    (SELECT id FROM clients WHERE client_name = 'Utkarsh Small Finance Bank'),
    'GPPL/2025-26/33',
    '2025-07-01',
    'July 2025',
    '2025-07-01',
    NULL,
    'Digital Marketing Services: Personal Loan Lead Campaign, Gold Loan Lead Campaign, Recruitment Campaign in 10/13/14 cities, Lead Generation Digital Campaign',
    0,
    2493658.80,
    2493658.80,
    'Paid'
);

-- Invoice 6: Shudanshu Rai (one-time project)
INSERT INTO invoices (client_id, invoice_number, invoice_date, invoice_month, contract_start, services_description, addons_description, service_mrr, addons_mrr, total_mrr, payment_status)
VALUES (
    (SELECT id FROM clients WHERE client_name = 'Shudanshu Rai'),
    'GPPL/2025-26/58',
    '2025-07-01',
    'July 2025',
    '2025-07-01',
    'Panel 550 WT MONO HALF CUT NON DCR Hybrid Solar Inverter 7.5 kW, Lithium Ion Battery 100 Ah, Cabling + Installation',
    NULL,
    509444,
    0,
    509444,
    'Paid'
);

-- ========================================
-- CREATE UPSELL OPPORTUNITIES
-- ========================================

-- DJT Fashion - Could add Analytics (already has Digital Marketing)
INSERT INTO upsell_opportunities (client_id, recommended_services, potential_gain, probability, priority, status)
VALUES (
    (SELECT id FROM clients WHERE client_name = 'DJT Fashion Pvt Ltd'),
    ARRAY['Analytics', 'Content Marketing'],
    200000,
    75,
    'High',
    'Identified'
);

-- Shyam Metalics - Could add Paid Ads and Analytics
INSERT INTO upsell_opportunities (client_id, recommended_services, potential_gain, probability, priority, status)
VALUES (
    (SELECT id FROM clients WHERE client_name = 'Shyam Metalics & Energy Ltd'),
    ARRAY['Paid Ads', 'Analytics'],
    120000,
    60,
    'Medium',
    'Identified'
);

-- Carrier - Addons are growing (₹2,15,468 in July), could add Content Marketing
INSERT INTO upsell_opportunities (client_id, recommended_services, potential_gain, probability, priority, status)
VALUES (
    (SELECT id FROM clients WHERE client_name = 'Carrier Airconditioning & Refrigeration'),
    ARRAY['Content Marketing', 'Web Development'],
    180000,
    70,
    'High',
    'In Progress'
);

-- VIP Industries - Addons growing (₹2,35,410 in July), could add Web Development
INSERT INTO upsell_opportunities (client_id, recommended_services, potential_gain, probability, priority, status)
VALUES (
    (SELECT id FROM clients WHERE client_name = 'VIP Industries Ltd'),
    ARRAY['Web Development', 'Content Marketing'],
    250000,
    80,
    'High',
    'Identified'
);

-- Utkarsh Bank - Massive addon revenue (₹24,93,658), could formalize campaign services
INSERT INTO upsell_opportunities (client_id, recommended_services, potential_gain, probability, priority, status)
VALUES (
    (SELECT id FROM clients WHERE client_name = 'Utkarsh Small Finance Bank'),
    ARRAY['Analytics', 'Web Development'],
    500000,
    85,
    'High',
    'In Progress'
);

-- Shudanshu Rai - Could add Maintenance after solar installation
INSERT INTO upsell_opportunities (client_id, recommended_services, potential_gain, probability, priority, status)
VALUES (
    (SELECT id FROM clients WHERE client_name = 'Shudanshu Rai'),
    ARRAY['Maintenance'],
    50000,
    40,
    'Low',
    'Identified'
);

-- ========================================
-- SUMMARY (Updated with July 2025 data)
-- ========================================
-- Total clients: 11 (6 active in July, 5 inactive)
-- July invoices: 6
--
-- July Revenue Breakdown:
--   VIP Industries Ltd:     Service ₹3,71,700  + Addons ₹2,35,410  = Total ₹6,07,110
--   DJT Fashion Pvt Ltd:    Service ₹4,13,000  + Addons ₹0         = Total ₹4,13,000
--   Carrier Airconditioning: Service ₹1,88,800 + Addons ₹2,15,468  = Total ₹4,04,268
--   Shyam Metalics:         Service ₹2,95,000  + Addons ₹0         = Total ₹2,95,000
--   Utkarsh Bank:           Service ₹0         + Addons ₹24,93,659 = Total ₹24,93,659
--   Shudanshu Rai:          Service ₹5,09,444  + Addons ₹0         = Total ₹5,09,444
--
-- Total July MRR: ₹45,22,481
-- Total Service MRR: ₹17,77,944
-- Total Addons MRR: ₹29,44,537
--
-- Payment Status: All Paid
-- Upsell opportunities: 6
