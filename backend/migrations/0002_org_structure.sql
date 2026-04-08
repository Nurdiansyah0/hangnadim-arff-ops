-- =========================================================
-- 1. ORGANIZATIONAL HIERARCHY
-- =========================================================

CREATE TABLE positions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE personnels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nip_nik VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    position_id INT REFERENCES positions(id) ON DELETE SET NULL,
    employment_status employment_status_enum,
    shift shift_enum,
    status status_enum DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================
-- 2. RBAC (ROLES & PERMISSIONS)
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

CREATE TABLE personnel_roles (
    personnel_id UUID REFERENCES personnels(id) ON DELETE CASCADE,
    role_id INT REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (personnel_id, role_id)
);

-- Triggers for personnels
CREATE TRIGGER trg_personnels_updated_at BEFORE UPDATE ON personnels FOR EACH ROW EXECUTE FUNCTION set_updated_at_if_changed();
