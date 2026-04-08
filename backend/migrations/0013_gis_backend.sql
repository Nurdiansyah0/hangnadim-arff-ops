-- Task 2.1 — GIS Backend (PostGIS + Koordinat)
-- Part of Phase 2: GIS & Maintenance

-- 1. Activate PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Create Fire Extinguisher Status Enum (to align with repo code)
DO $$ BEGIN
    CREATE TYPE fire_extinguisher_status_enum AS ENUM ('READY', 'IN_USE', 'MAINTENANCE', 'OUT_OF_SERVICE', 'EXPIRED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Harmonize fire_extinguishers table with backend model & repository
DO $$ BEGIN
    ALTER TABLE fire_extinguishers RENAME COLUMN code TO serial_number;
EXCEPTION WHEN undefined_column THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE fire_extinguishers RENAME COLUMN location TO location_description;
EXCEPTION WHEN undefined_column THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE fire_extinguishers RENAME COLUMN capacity TO capacity_kg;
EXCEPTION WHEN undefined_column THEN NULL; END $$;

-- Update status column to use the new specific enum
ALTER TABLE fire_extinguishers ALTER COLUMN status DROP DEFAULT;
ALTER TABLE fire_extinguishers 
    ALTER COLUMN status TYPE fire_extinguisher_status_enum 
    USING (CASE 
        WHEN status::text = 'ACTIVE' THEN 'READY'::fire_extinguisher_status_enum
        WHEN status::text = 'INACTIVE' THEN 'OUT_OF_SERVICE'::fire_extinguisher_status_enum
        ELSE 'READY'::fire_extinguisher_status_enum
    END);
ALTER TABLE fire_extinguishers ALTER COLUMN status SET DEFAULT 'READY';

ALTER TABLE fire_extinguishers 
    ADD COLUMN IF NOT EXISTS latitude FLOAT8,
    ADD COLUMN IF NOT EXISTS longitude FLOAT8,
    ADD COLUMN IF NOT EXISTS floor VARCHAR(50),
    ADD COLUMN IF NOT EXISTS building VARCHAR(100),
    ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- 4. Add PostGIS Geometry Column
ALTER TABLE fire_extinguishers
    ADD COLUMN IF NOT EXISTS geom GEOMETRY(POINT, 4326);

CREATE INDEX IF NOT EXISTS idx_fire_extinguishers_geom ON fire_extinguishers USING GIST (geom);

-- 5. Create Trigger to sync geom from lat/lng
CREATE OR REPLACE FUNCTION sync_fire_extinguisher_geom() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.geom = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
    ELSE
        NEW.geom = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_fire_extinguisher_geom_sync ON fire_extinguishers;
CREATE TRIGGER trg_fire_extinguisher_geom_sync 
BEFORE INSERT OR UPDATE OF latitude, longitude ON fire_extinguishers 
FOR EACH ROW EXECUTE FUNCTION sync_fire_extinguisher_geom();

-- 6. Update inspections table to support APAR and location capture
ALTER TABLE inspections ALTER COLUMN vehicle_id DROP NOT NULL;
ALTER TABLE inspections
    ADD COLUMN IF NOT EXISTS fire_extinguisher_id UUID REFERENCES fire_extinguishers(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS latitude FLOAT8,
    ADD COLUMN IF NOT EXISTS longitude FLOAT8,
    ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES personnels(id),
    ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add index for spatial performance on inspections if needed (optional for now)
COMMENT ON COLUMN inspections.latitude IS 'User location latitude at time of scan';
COMMENT ON COLUMN inspections.longitude IS 'User location longitude at time of scan';
