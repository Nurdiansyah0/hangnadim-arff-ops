-- =========================================================
-- ASSET MANAGEMENT (VEHICLES, EXTINGUISHERS, AGENTS)
-- =========================================================

CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    vehicle_type VARCHAR(50),
    status vehicle_status_enum DEFAULT 'READY',
    water_capacity_l DECIMAL(12,2),
    foam_capacity_l DECIMAL(12,2),
    powder_capacity_kg DECIMAL(12,2),
    last_service_date DATE,
    next_service_due DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_vehicles_updated_at BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION set_updated_at_if_changed();
CREATE TRIGGER audit_vehicles AFTER INSERT OR UPDATE OR DELETE ON vehicles FOR EACH ROW EXECUTE FUNCTION process_audit_log();

CREATE TABLE IF NOT EXISTS extinguishing_agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    brand VARCHAR(100),
    min_requirement DECIMAL(12,2) DEFAULT 0,
    unit VARCHAR(20) NOT NULL,
    inventory_level DECIMAL(12,2) DEFAULT 0,
    last_procurement_year VARCHAR(10),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fire_extinguishers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    serial_number VARCHAR(50) UNIQUE NOT NULL,
    location_description VARCHAR(255) NOT NULL,
    agent_type VARCHAR(50),
    capacity_kg DECIMAL(10,2),
    status fire_extinguisher_status_enum DEFAULT 'READY',
    last_inspection_date DATE,
    expiry_date DATE,
    latitude FLOAT8,
    longitude FLOAT8,
    floor VARCHAR(50),
    building VARCHAR(100),
    photo_url TEXT,
    geom GEOMETRY(POINT, 4326),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fire_extinguishers_geom ON fire_extinguishers USING GIST (geom);

CREATE TRIGGER trg_fire_extinguisher_geom_sync 
BEFORE INSERT OR UPDATE OF latitude, longitude ON fire_extinguishers 
FOR EACH ROW EXECUTE FUNCTION sync_fire_extinguisher_geom();

CREATE TRIGGER trg_fire_extinguishers_updated_at BEFORE UPDATE ON fire_extinguishers FOR EACH ROW EXECUTE FUNCTION set_updated_at_if_changed();
