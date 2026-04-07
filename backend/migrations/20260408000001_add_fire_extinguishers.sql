-- Create status enum for Fire Extinguishers
-- Migration: 20260408000001_add_fire_extinguishers.sql

DO $$ BEGIN
    CREATE TYPE fire_extinguisher_status_enum AS ENUM ('ACTIVE', 'EXPIRED', 'MAINTENANCE', 'OUT_OF_SERVICE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE fire_extinguishers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    serial_number VARCHAR(100) UNIQUE NOT NULL,
    agent_type VARCHAR(50) NOT NULL, -- CO2, DCP, Foam, etc
    capacity_kg DECIMAL(10, 2) NOT NULL,
    location_description TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    floor VARCHAR(20),
    building VARCHAR(100),
    expiry_date DATE NOT NULL,
    last_inspection_date DATE,
    status fire_extinguisher_status_enum DEFAULT 'ACTIVE',
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_fire_extinguishers_updated_at
BEFORE UPDATE ON fire_extinguishers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
