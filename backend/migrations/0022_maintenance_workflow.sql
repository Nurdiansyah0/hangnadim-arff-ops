-- 1. Create Maintenance Status Enum
DO $$ BEGIN
    CREATE TYPE maintenance_status_enum AS ENUM ('REQUESTED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Alter Maintenance Records Table
ALTER TABLE maintenance_records
    ADD COLUMN status maintenance_status_enum NOT NULL DEFAULT 'REQUESTED';

ALTER TABLE maintenance_records
    ALTER COLUMN maintenance_type DROP NOT NULL;

ALTER TABLE maintenance_records
    ALTER COLUMN performed_at DROP NOT NULL;

-- 3. Modify trigger behavior: Only sync dates if status is and maintenance happened
CREATE OR REPLACE FUNCTION sync_vehicle_maintenance_dates()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update vehicle dates when a record is marked as COMPLETED and performed_at is logged
    IF NEW.status = 'COMPLETED' AND NEW.performed_at IS NOT NULL THEN
        UPDATE vehicles
        SET 
            last_service_date = NEW.performed_at,
            next_service_due = CASE 
                WHEN NEW.next_due IS NOT NULL THEN NEW.next_due 
                ELSE next_service_due -- Keep existing if new is null
            END,
            updated_at = NOW()
        WHERE id = NEW.vehicle_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
