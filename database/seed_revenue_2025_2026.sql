-- ========================================
-- Supplement Revenue Records: Jul 2025 - Feb 2026
-- ========================================
-- This script adds revenue records for months not covered by the initial seed

DO $$
DECLARE
    client_record RECORD;
    service_record RECORD;
    revenue_date DATE;
    month_offset INT;
BEGIN
    -- Generate revenue for Jul 2025 to Jan 2026 (7 more months)
    FOR client_record IN
        SELECT id, client_name FROM clients WHERE deleted_at IS NULL
    LOOP
        FOR service_record IN
            SELECT cs.service_id, cs.monthly_amount, s.name as service_name
            FROM client_services cs
            JOIN services s ON s.id = cs.service_id
            WHERE cs.client_id = client_record.id
        LOOP
            -- months 0..6 = Jul 2025 to Jan 2026
            FOR month_offset IN 0..6 LOOP
                revenue_date := DATE '2025-07-01' + (month_offset || ' months')::INTERVAL;

                -- Skip if record already exists
                IF NOT EXISTS (
                    SELECT 1 FROM revenue_records
                    WHERE client_id = client_record.id
                      AND service_id = service_record.service_id
                      AND record_date = revenue_date
                ) THEN
                    INSERT INTO revenue_records (client_id, service_id, amount, record_date, record_type)
                    VALUES (
                        client_record.id,
                        service_record.service_id,
                        service_record.monthly_amount,
                        revenue_date,
                        'Recurring'
                    );
                END IF;
            END LOOP;
        END LOOP;
    END LOOP;
END $$;

-- Also add February 2026 (current month)
DO $$
DECLARE
    client_record RECORD;
    service_record RECORD;
BEGIN
    FOR client_record IN
        SELECT id FROM clients WHERE deleted_at IS NULL
    LOOP
        FOR service_record IN
            SELECT cs.service_id, cs.monthly_amount
            FROM client_services cs
            WHERE cs.client_id = client_record.id
        LOOP
            IF NOT EXISTS (
                SELECT 1 FROM revenue_records
                WHERE client_id = client_record.id
                  AND service_id = service_record.service_id
                  AND record_date = DATE '2026-02-01'
            ) THEN
                INSERT INTO revenue_records (client_id, service_id, amount, record_date, record_type)
                VALUES (
                    client_record.id,
                    service_record.service_id,
                    service_record.monthly_amount,
                    DATE '2026-02-01',
                    'Recurring'
                );
            END IF;
        END LOOP;
    END LOOP;
END $$;
