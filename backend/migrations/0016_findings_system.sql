-- Enums for Status (Severity already exists in 0001)
DO $$ BEGIN
    CREATE TYPE finding_status_enum AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Findings Table
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

-- Sync updated_at using existing trigger function
DROP TRIGGER IF EXISTS trg_findings_updated_at ON findings;
CREATE TRIGGER trg_findings_updated_at
BEFORE UPDATE ON findings
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_if_changed();

-- Trigger to auto-create finding on inspection FAIL
CREATE OR REPLACE FUNCTION fn_create_finding_on_fail()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.result = 'FAIL' THEN
        INSERT INTO findings (inspection_result_id, description, status)
        VALUES (NEW.id, 'Automatic finding from inspection failure: ' || COALESCE(NEW.notes, 'No notes provided'), 'OPEN');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_create_finding_on_fail ON inspection_results;
CREATE TRIGGER trg_create_finding_on_fail
AFTER INSERT ON inspection_results
FOR EACH ROW
EXECUTE FUNCTION fn_create_finding_on_fail();
