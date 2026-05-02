-- Seed Data: Initial Services
-- Description: Pre-populate services catalog

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
