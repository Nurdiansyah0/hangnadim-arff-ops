-- =========================================================
-- DAILY OPERATIONS (LOGS, INCIDENTS, ASSIGNMENTS)
-- =========================================================

CREATE TABLE watchroom_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    personnel_id UUID REFERENCES personnels(id),
    entry_type VARCHAR(50), -- RADIO_CHECK, STANDBY, etc
    description TEXT NOT NULL,
    payload JSONB,
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    commander_id UUID REFERENCES personnels(id),
    description TEXT NOT NULL,
    location TEXT,
    dispatch_time TIMESTAMPTZ NOT NULL,
    arrival_time TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    severity severity_enum DEFAULT 'LOW',
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE duty_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    personnel_id UUID NOT NULL REFERENCES personnels(id) ON DELETE CASCADE,
    shift_id INTEGER REFERENCES shifts(id),
    vehicle_id UUID REFERENCES vehicles(id),
    position duty_position_enum NOT NULL DEFAULT 'RESCUEMAN',
    status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, COMPLETED, CANCELLED
    assignment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(personnel_id, assignment_date)
);

CREATE TABLE shift_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    personnel_id UUID REFERENCES personnels(id) ON DELETE CASCADE,
    shift_id INT REFERENCES shifts(id),
    assignment_date DATE NOT NULL,
    UNIQUE(personnel_id, assignment_date)
);

CREATE TRIGGER trg_watchroom_logs_updated_at BEFORE UPDATE ON watchroom_logs FOR EACH ROW EXECUTE FUNCTION set_updated_at_if_changed();
CREATE TRIGGER trg_incidents_updated_at BEFORE UPDATE ON incidents FOR EACH ROW EXECUTE FUNCTION set_updated_at_if_changed();
CREATE TRIGGER trg_duty_assignments_updated_at BEFORE UPDATE ON duty_assignments FOR EACH ROW EXECUTE FUNCTION set_updated_at_if_changed();
