-- =========================================================
-- INSPECTION SYSTEM (TEMPLATES & RESULTS)
-- =========================================================

CREATE TABLE IF NOT EXISTS inspection_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    target_type VARCHAR(50) NOT NULL, -- VEHICLE, FIRE_EXTINGUISHER, etc
    frequency VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS template_items (
    id SERIAL PRIMARY KEY,
    template_id INTEGER NOT NULL REFERENCES inspection_templates(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    item_order INTEGER NOT NULL,
    UNIQUE(template_id, item_name)
);

-- Partitioned Inspections Table
CREATE TABLE IF NOT EXISTS inspections (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    personnel_id UUID REFERENCES personnels(id),
    tanggal DATE NOT NULL,
    status approval_status_enum DEFAULT 'DRAFT',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (id, tanggal)
) PARTITION BY RANGE (tanggal);

CREATE TABLE IF NOT EXISTS inspection_results (
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

-- Generate initial partitions for 2026
SELECT generate_partitions('inspections', DATE '2026-01-01', 12);
