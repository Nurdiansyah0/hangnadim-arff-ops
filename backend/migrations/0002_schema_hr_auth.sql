-- =========================================================
-- 1. AUDIT TRAIL LOGGING
-- =========================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID NOT NULL,
    actor_id UUID, -- References personnels.id
    table_name VARCHAR(50) NOT NULL,
    action VARCHAR(20) NOT NULL,
    original_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

SELECT generate_partitions('audit_logs', DATE '2026-01-01', 12);

CREATE OR REPLACE FUNCTION process_audit_log() RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        INSERT INTO audit_logs (id, actor_id, table_name, action, original_data, new_data)
        VALUES (uuid_generate_v4(), NULL, TG_TABLE_NAME, 'DELETE', to_jsonb(OLD), NULL);
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO audit_logs (id, actor_id, table_name, action, original_data, new_data)
        VALUES (uuid_generate_v4(), NULL, TG_TABLE_NAME, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO audit_logs (id, actor_id, table_name, action, original_data, new_data)
        VALUES (uuid_generate_v4(), NULL, TG_TABLE_NAME, 'INSERT', NULL, to_jsonb(NEW));
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- =========================================================
-- 2. ORGANIZATIONAL HIERARCHY & PERSONNEL
-- =========================================================

CREATE TABLE IF NOT EXISTS positions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS personnels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nip_nik VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    position_id INT REFERENCES positions(id) ON DELETE SET NULL,
    employment_status employment_status_enum,
    shift shift_enum,
    status status_enum DEFAULT 'ACTIVE',
    phone_number VARCHAR(20),
    corporate_level VARCHAR(50),
    profile_picture_url TEXT,
    remaining_leave INTEGER DEFAULT 12,
    annual_leave_quota INTEGER DEFAULT 12,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_personnels_updated_at BEFORE UPDATE ON personnels FOR EACH ROW EXECUTE FUNCTION set_updated_at_if_changed();
CREATE TRIGGER audit_personnels AFTER INSERT OR UPDATE OR DELETE ON personnels FOR EACH ROW EXECUTE FUNCTION process_audit_log();

-- =========================================================
-- 3. RBAC (ROLES & PERMISSIONS)
-- =========================================================

CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INT REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INT REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS personnel_roles (
    personnel_id UUID REFERENCES personnels(id) ON DELETE CASCADE,
    role_id INT REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (personnel_id, role_id)
);

-- =========================================================
-- 4. AUTHENTICATION & USERS
-- =========================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    personnel_id UUID UNIQUE NOT NULL REFERENCES personnels(id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    status status_enum DEFAULT 'ACTIVE',
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at_if_changed();
CREATE TRIGGER audit_users AFTER INSERT OR UPDATE OR DELETE ON users FOR EACH ROW EXECUTE FUNCTION process_audit_log();

-- =========================================================
-- 5. COMPLIANCE & HR (CERTIFICATIONS, ATTENDANCE, LEAVE)
-- =========================================================

CREATE TABLE IF NOT EXISTS trainings (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS personnel_certifications (
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

CREATE TABLE IF NOT EXISTS attendances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    personnel_id UUID REFERENCES personnels(id) ON DELETE CASCADE,
    check_in TIMESTAMPTZ,
    check_out TIMESTAMPTZ,
    status attendance_status_enum DEFAULT 'PRESENT',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    personnel_id UUID REFERENCES personnels(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status leave_status_enum DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_personnel_certifications_updated_at BEFORE UPDATE ON personnel_certifications FOR EACH ROW EXECUTE FUNCTION set_updated_at_if_changed();
CREATE TRIGGER trg_leave_requests_updated_at BEFORE UPDATE ON leave_requests FOR EACH ROW EXECUTE FUNCTION set_updated_at_if_changed();
