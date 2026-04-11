-- =========================================================
-- MAINTENANCE RECORDS SYSTEM
-- =========================================================

-- 1. Maintenance Type Enum
DO $$ BEGIN
    CREATE TYPE maintenance_type_enum AS ENUM ('SCHEDULED', 'UNSCHEDULED', 'REPAIR');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Maintenance Records Table
CREATE TABLE IF NOT EXISTS maintenance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    maintenance_type maintenance_type_enum NOT NULL,
    description TEXT NOT NULL,
    performed_by UUID NOT NULL REFERENCES personnels(id),
    performed_at DATE NOT NULL,
    cost DECIMAL(12, 2),
    next_due DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Trigger Function to Update Vehicle Service Dates
CREATE OR REPLACE FUNCTION sync_vehicle_maintenance_dates()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE vehicles
    SET 
        last_service_date = NEW.performed_at,
        next_service_due = CASE 
            WHEN NEW.next_due IS NOT NULL THEN NEW.next_due 
            ELSE next_service_due -- Keep existing if new is null
        END,
        updated_at = NOW()
    WHERE id = NEW.vehicle_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Apply Trigger
DROP TRIGGER IF EXISTS trg_sync_maintenance_dates ON maintenance_records;
CREATE TRIGGER trg_sync_maintenance_dates
AFTER INSERT OR UPDATE ON maintenance_records
FOR EACH ROW
EXECUTE FUNCTION sync_vehicle_maintenance_dates();

-- 5. Add update_at trigger for maintenance_records
DROP TRIGGER IF EXISTS trg_maintenance_records_updated_at ON maintenance_records;
CREATE TRIGGER trg_maintenance_records_updated_at
BEFORE UPDATE ON maintenance_records
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_if_changed();
