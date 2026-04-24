-- =========================================================
-- 1. INSPECTIONS (PARTITIONED)
-- =========================================================

CREATE TABLE IF NOT EXISTS inspection_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    target_type VARCHAR(50) NOT NULL,
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

CREATE TABLE IF NOT EXISTS inspections (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    fire_extinguisher_id UUID REFERENCES fire_extinguishers(id) ON DELETE CASCADE,
    personnel_id UUID REFERENCES personnels(id),
    tanggal DATE NOT NULL,
    status approval_status_enum DEFAULT 'DRAFT',
    latitude FLOAT8,
    longitude FLOAT8,
    approved_by UUID REFERENCES personnels(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (id, tanggal)
) PARTITION BY RANGE (tanggal);

SELECT generate_partitions('inspections', DATE '2026-01-01', 12);

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

-- =========================================================
-- 2. FINDINGS SYSTEM
-- =========================================================

DO $$ BEGIN CREATE TYPE finding_status_enum AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'); EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS findings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_result_id UUID REFERENCES inspection_results(id) ON DELETE CASCADE,
    severity severity_enum NOT NULL DEFAULT 'MEDIUM',
    description TEXT,
    assigned_to UUID REFERENCES personnels(id),
    status finding_status_enum NOT NULL DEFAULT 'OPEN',
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trg_findings_updated_at BEFORE UPDATE ON findings FOR EACH ROW EXECUTE FUNCTION set_updated_at_if_changed();

CREATE OR REPLACE FUNCTION fn_create_finding_on_fail() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.result = 'FAIL' THEN
        INSERT INTO findings (inspection_result_id, description, status)
        VALUES (NEW.id, 'Automatic finding from inspection failure: ' || COALESCE(NEW.notes, 'No notes provided'), 'OPEN');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_create_finding_on_fail AFTER INSERT ON inspection_results FOR EACH ROW EXECUTE FUNCTION fn_create_finding_on_fail();

-- =========================================================
-- 3. MAINTENANCE RECORDS
-- =========================================================

DO $$ BEGIN CREATE TYPE maintenance_type_enum AS ENUM ('SCHEDULED', 'UNSCHEDULED', 'REPAIR'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS maintenance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    maintenance_type maintenance_type_enum,
    description TEXT NOT NULL,
    status maintenance_status_enum NOT NULL DEFAULT 'REQUESTED',
    performed_by UUID NOT NULL REFERENCES personnels(id),
    performed_at DATE,
    cost DECIMAL(12, 2),
    next_due DATE,
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION sync_vehicle_maintenance_dates() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'COMPLETED' AND NEW.performed_at IS NOT NULL THEN
        UPDATE vehicles
        SET 
            last_service_date = NEW.performed_at,
            next_service_due = CASE 
                WHEN NEW.next_due IS NOT NULL THEN NEW.next_due 
                ELSE next_service_due 
            END,
            updated_at = NOW()
        WHERE id = NEW.vehicle_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_maintenance_dates AFTER INSERT OR UPDATE ON maintenance_records FOR EACH ROW EXECUTE FUNCTION sync_vehicle_maintenance_dates();
CREATE TRIGGER trg_maintenance_records_updated_at BEFORE UPDATE ON maintenance_records FOR EACH ROW EXECUTE FUNCTION set_updated_at_if_changed();

-- =========================================================
-- 4. KPI DEFINITIONS
-- =========================================================

CREATE TABLE IF NOT EXISTS kpi_definitions (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    threshold_green DECIMAL(12,2) NOT NULL,
    threshold_yellow DECIMAL(12,2) NOT NULL,
    threshold_red DECIMAL(12,2) NOT NULL,
    regulation_ref VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_kpi_definitions_updated_at BEFORE UPDATE ON kpi_definitions FOR EACH ROW EXECUTE FUNCTION set_updated_at_if_changed();

-- =========================================================
-- 5. DOCUMENTS
-- =========================================================

DO $$ BEGIN CREATE TYPE doc_status_enum AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    doc_type VARCHAR(50) NOT NULL,
    file_url TEXT NOT NULL,
    version VARCHAR(20) DEFAULT '1.0',
    status doc_status_enum DEFAULT 'DRAFT',
    uploaded_by UUID REFERENCES personnels(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION set_updated_at_if_changed();
