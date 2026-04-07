DO $$ BEGIN
    CREATE TYPE inspection_result_enum AS ENUM ('PASS', 'FAIL', 'N_A');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE inspection_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    frequency VARCHAR(50) NOT NULL
);

CREATE TABLE template_items (
    id SERIAL PRIMARY KEY,
    template_id INTEGER NOT NULL REFERENCES inspection_templates(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    item_order INTEGER NOT NULL
);

CREATE TABLE inspection_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_id UUID NOT NULL,
    inspection_date DATE NOT NULL,
    template_item_id INTEGER NOT NULL REFERENCES template_items(id) ON DELETE CASCADE,
    result inspection_result_enum NOT NULL,
    notes TEXT,
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (inspection_id, inspection_date) REFERENCES inspections(id, tanggal) ON DELETE CASCADE
);

INSERT INTO inspection_templates (name, target_type, frequency)
VALUES
('Daily Foam Tender', 'VEHICLE', 'DAILY')
ON CONFLICT DO NOTHING;

WITH tmpl AS (
    SELECT id FROM inspection_templates WHERE name = 'Daily Foam Tender' LIMIT 1
)
INSERT INTO template_items (template_id, category, item_name, item_order)
SELECT tmpl.id, data.category, data.item_name, data.item_order
FROM tmpl,
LATERAL (VALUES
    ('Engine', 'Check engine oil level', 1),
    ('Engine', 'Inspect coolant lines', 2),
    ('Body', 'Inspect body panels for damage', 3),
    ('Pump', 'Check pump pressure gauge', 4),
    ('Pump', 'Verify hose condition', 5),
    ('Safety', 'Check warning lights', 6),
    ('Safety', 'Inspect fire extinguisher availability', 7),
    ('Electrical', 'Test battery voltage', 8),
    ('Tires', 'Check tire pressure', 9),
    ('Communication', 'Verify radio functionality', 10)
) AS data(category, item_name, item_order)
ON CONFLICT DO NOTHING;
