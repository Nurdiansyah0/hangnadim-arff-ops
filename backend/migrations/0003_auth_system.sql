-- =========================================================
-- AUTHENTICATION & USER ACCESS
-- =========================================================

CREATE TABLE users (
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

-- Index for auth performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);

-- Trigger for users
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at_if_changed();

-- Add comments for clarity
COMMENT ON TABLE users IS 'Authentication and credential storage, linked 1:1 with personnels';
COMMENT ON COLUMN users.personnel_id IS 'Link to employee record in personnels table';
