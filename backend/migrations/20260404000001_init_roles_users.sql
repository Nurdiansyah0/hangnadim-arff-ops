-- =========================================================
-- 1. EXTENSIONS & ENUMS
-- =========================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE status_enum AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
CREATE TYPE severity_enum AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE leave_status_enum AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE vehicle_status_enum AS ENUM ('READY', 'MAINTENANCE', 'REPAIR', 'OUT_OF_SERVICE');
CREATE TYPE approval_status_enum AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED');
CREATE TYPE attendance_status_enum AS ENUM ('PRESENT', 'LATE', 'ABSENT', 'ON_LEAVE');
CREATE TYPE cert_status_enum AS ENUM ('ACTIVE', 'EXPIRED', 'WAITING_RENEWAL');
CREATE TYPE runway_enum AS ENUM ('04', '22'); -- Khusus Hang Nadim

-- =========================================================
-- 2. AUTOMATION FUNCTIONS
-- =========================================================

CREATE OR REPLACE FUNCTION create_monthly_partition(parent_table TEXT, start_date DATE) RETURNS VOID AS $$
DECLARE
    end_date DATE := (start_date + INTERVAL '1 month')::DATE;
    partition_name TEXT := parent_table || '_' || TO_CHAR(start_date, 'YYYY_MM');
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = partition_name) THEN
        EXECUTE FORMAT('CREATE TABLE %I PARTITION OF %I FOR VALUES FROM (%L) TO (%L);', partition_name, parent_table, start_date, end_date);
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_partitions(parent_table TEXT, start_date DATE, months_ahead INT) RETURNS VOID AS $$
BEGIN
    FOR i IN 0..months_ahead LOOP
        PERFORM create_monthly_partition(parent_table, (start_date + (i || ' month')::INTERVAL)::DATE);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_updated_at_if_changed() RETURNS TRIGGER AS $$
BEGIN
    IF NEW IS DISTINCT FROM OLD THEN
        NEW.updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================================================
-- 3. CORE TABLES (ORGANIZATION & AUTH)
-- =========================================================

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE role_permissions (
    role_id INT REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INT REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE positions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE personnels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nip_nik VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    position_id INT REFERENCES positions(id) ON DELETE SET NULL,
    status status_enum DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    personnel_id UUID REFERENCES personnels(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE personnel_roles (
     personnel_id UUID REFERENCES personnels(id) ON DELETE CASCADE,
     role_id INT REFERENCES roles(id) ON DELETE CASCADE,
     PRIMARY KEY (personnel_id, role_id)
);

-- =========================================================
-- 4. MASTER DATA
-- =========================================================

CREATE TABLE shifts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(10) UNIQUE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL
);

CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    vehicle_type VARCHAR(50),
    status vehicle_status_enum DEFAULT 'READY',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE trainings (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50)
);

CREATE TABLE compartments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE parts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    compartment_id INT REFERENCES compartments(id) ON DELETE CASCADE
);

CREATE TABLE damage_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

-- =========================================================
-- 5. AVIATION & WATCHROOM MASTER
-- =========================================================

-- Pergerakan Pesawat (Aviation Monitoring)
CREATE TABLE flight_routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flight_number VARCHAR(20) NOT NULL,
    origin VARCHAR(100),
    destination VARCHAR(100),
    runway runway_enum NOT NULL, -- "04" atau "22"
    actual_time TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dokumen SOP & Arsip Compliance
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uploader_id UUID REFERENCES personnels(id),
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50),
    file_path TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================
-- 6. ASSIGNMENTS & COMPLIANCE
-- =========================================================

CREATE TABLE shift_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    personnel_id UUID REFERENCES personnels(id) ON DELETE CASCADE,
    shift_id INT REFERENCES shifts(id),
    assignment_date DATE NOT NULL,
    UNIQUE(personnel_id, assignment_date)
);

CREATE TABLE personnel_certifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    personnel_id UUID REFERENCES personnels(id) ON DELETE CASCADE,
    training_id INT REFERENCES trainings(id) ON DELETE CASCADE,
    cert_number VARCHAR(100) UNIQUE NOT NULL,
    issue_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    status cert_status_enum DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE attendances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    personnel_id UUID REFERENCES personnels(id) ON DELETE CASCADE,
    check_in TIMESTAMPTZ,
    check_out TIMESTAMPTZ,
    status attendance_status_enum DEFAULT 'PRESENT',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    personnel_id UUID REFERENCES personnels(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status leave_status_enum DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================
-- 7. OPERATIONS & LOGBOOK (PARTITIONED)
-- =========================================================

CREATE TABLE inspections (
    id UUID NOT NULL,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    personnel_id UUID REFERENCES personnels(id),
    tanggal DATE NOT NULL,
    status approval_status_enum DEFAULT 'DRAFT',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (id, tanggal)
) PARTITION BY RANGE (tanggal);

CREATE TABLE watchroom_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES personnels(id),
    entry_type VARCHAR(50), -- RADIO_CHECK, STANDBY, etc
    description TEXT NOT NULL,
    payload JSONB,          -- Untuk data dinamis
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    commander_id UUID REFERENCES personnels(id),
    description TEXT NOT NULL,
    location TEXT,
    dispatch_time TIMESTAMPTZ NOT NULL,
    arrival_time TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    severity severity_enum DEFAULT 'LOW'
);

CREATE TABLE audit_logs (
    id UUID NOT NULL,
    user_id UUID,
    table_name VARCHAR(50) NOT NULL,
    action VARCHAR(20) NOT NULL,
    original_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Generate Partisi
SELECT generate_partitions('inspections', DATE '2026-01-01', 12);
SELECT generate_partitions('audit_logs', DATE '2026-01-01', 12);

-- =========================================================
-- 8. TRIGGERS & INDEXING
-- =========================================================

CREATE TRIGGER trg_personnels_updated_at BEFORE UPDATE ON personnels FOR EACH ROW EXECUTE FUNCTION set_updated_at_if_changed();
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at_if_changed();

CREATE INDEX idx_flight_number ON flight_routes(flight_number);
CREATE INDEX idx_watchroom_time ON watchroom_logs(created_at);

-- =========================================================
-- 9. SEED DATA
-- =========================================================

INSERT INTO roles (name) VALUES ('Super Admin'), ('Manager'), ('Firefighter');
INSERT INTO positions (name) VALUES ('Head of ARFF Unit'), ('Rescue Officer');
INSERT INTO shifts (name, start_time, end_time) VALUES ('Alpha', '08:00:00', '20:00:00'), ('Bravo', '20:00:00', '08:00:00');

-- Admin Personnel & User
INSERT INTO personnels (id, nip_nik, full_name, position_id) VALUES ('d290f1ee-6c54-4b01-90e6-d701748f0851', '12345678', 'Nurdiansyah Admin', 1);
INSERT INTO personnel_roles (personnel_id, role_id) VALUES ('d290f1ee-6c54-4b01-90e6-d701748f0851', 1);
INSERT INTO users (username, email, password_hash, personnel_id)
VALUES ('admin123', 'admin@arff.hangnadim.id', '$2b$12$N9u3Pj5T8H8s6ZJ1C6W4POnT.h/F6N0q05iBxDqJ5gXJ2O8N73V9u', 'd290f1ee-6c54-4b01-90e6-d701748f0851');

-- =========================================================
-- END OF MIGRATION
-- =========================================================
