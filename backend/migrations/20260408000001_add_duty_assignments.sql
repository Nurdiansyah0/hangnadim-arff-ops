-- =========================================================
-- MIGRATION: ADD DUTY ASSIGNMENTS FOR REALTIME CONTEXT
-- =========================================================

CREATE TYPE duty_position_enum AS ENUM ('WATCHROOM', 'AIRSIDE', 'LANDSIDE', 'SUPPORT');

CREATE TABLE duty_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    personnel_id UUID REFERENCES personnels(id) ON DELETE CASCADE,
    shift_id INTEGER REFERENCES shifts(id),
    vehicle_id UUID REFERENCES vehicles(id),
    position duty_position_enum NOT NULL DEFAULT 'SUPPORT',
    status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, COMPLETED, CANCELLED
    assignment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(personnel_id, assignment_date) -- Only one duty assignment per personnel per day
);

-- Template Seed for Zulkarnain (testing)
INSERT INTO duty_assignments (personnel_id, shift_id, vehicle_id, position, status)
SELECT 
    p.id, 
    (SELECT id FROM shifts WHERE name = 'Normal' LIMIT 1),
    (SELECT id FROM vehicles LIMIT 1),
    'WATCHROOM',
    'ACTIVE'
FROM personnels p
WHERE p.full_name ILIKE 'Zulkarnain%'
ON CONFLICT DO NOTHING;
