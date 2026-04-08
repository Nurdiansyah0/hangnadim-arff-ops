-- =========================================================
-- ASSET MANAGEMENT (VEHICLES & AGENTS)
-- =========================================================

CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    vehicle_type VARCHAR(50),
    status vehicle_status_enum DEFAULT 'READY',
    
    -- New capacity fields
    water_capacity_l DECIMAL(12,2),
    foam_capacity_l DECIMAL(12,2),
    powder_capacity_kg DECIMAL(12,2),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS extinguishing_agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    brand VARCHAR(100),
    min_requirement DECIMAL(12,2) DEFAULT 0,
    unit VARCHAR(20) NOT NULL, -- Liters, Kg
    inventory_level DECIMAL(12,2) DEFAULT 0,
    last_procurement_year VARCHAR(10),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fire_extinguishers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    location VARCHAR(255) NOT NULL,
    agent_type VARCHAR(50),
    capacity DECIMAL(10,2),
    status status_enum DEFAULT 'ACTIVE',
    last_inspection_date DATE,
    expiry_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_vehicles_updated_at ON vehicles;
CREATE TRIGGER trg_vehicles_updated_at BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION set_updated_at_if_changed();

DROP TRIGGER IF EXISTS trg_fire_extinguishers_updated_at ON fire_extinguishers;
CREATE TRIGGER trg_fire_extinguishers_updated_at BEFORE UPDATE ON fire_extinguishers FOR EACH ROW EXECUTE FUNCTION set_updated_at_if_changed();
