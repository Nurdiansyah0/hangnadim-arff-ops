-- =========================================================
-- 0032_DAILY_TASKS: Hybrid Automated Task Generation & Shift Reports
-- =========================================================

-- 1. Task Templates (Hybrid System)
-- Allows dynamic mapping of positions to task lists.
CREATE TABLE IF NOT EXISTS task_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    position VARCHAR(50) NOT NULL, -- e.g., 'DRIVER', 'RESCUEMAN', 'WATCHROOM', 'OSC'
    task_name VARCHAR(150) NOT NULL,
    description TEXT,
    is_mandatory BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed intrinsic "hybrid" templates
INSERT INTO task_templates (position, task_name, description) VALUES
-- DRIVER
('DRIVER', 'Vehicle Physical Inspection', 'Check fluid levels, tires, body condition, and warning systems of the assigned vehicle.'),
('DRIVER', 'Pump & Agent Operations Check', 'Run standard pump tests, check water/foam levels, and ensure nozzles function.'),
('DRIVER', 'Communications Link Test', 'Radio check with Watchroom & Ground Control.'),

-- RESCUEMAN
('RESCUEMAN', 'Locker Equipment Inventory', 'Check and account for all rescue tools, hoses, and nozzles in the compartment.'),
('RESCUEMAN', 'Breathing Apparatus (BA) Set', 'Verify BA pressure levels and mask integrity.'),
('RESCUEMAN', 'PPE Readiness', 'Ensure fire suit, helmet, gloves, and boots are prepositioned.'),

-- WATCHROOM
('WATCHROOM', 'Line Comm Verification', 'Test hotlines to ATC, Tower, and City Fire Dept.'),
('WATCHROOM', 'Daily Flight Schedule Review', 'Review daily flight schedules and identify critical flights.'),
('WATCHROOM', 'Weather & Notam Update', 'Log daily weather and active NOTAMs.'),

-- OSC (On-Scene Commander)
('OSC', 'Shift Briefing & Readiness', 'Conduct shift briefing, verify overall manpower and vehicle readiness.'),
('OSC', 'Vehicle Bay Check', 'Physical walkthrough of the vehicle bay.')
ON CONFLICT DO NOTHING;

-- 2. Daily Tasks
-- Generated daily based on duty_assignments joining against task_templates.
CREATE TABLE IF NOT EXISTS daily_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES duty_assignments(id) ON DELETE CASCADE,
    task_name VARCHAR(150) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, COMPLETED, APPROVED
    completed_at TIMESTAMPTZ,
    completed_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Compound index to prevent duplicating the same task for the same assignment
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_task_unique ON daily_tasks(assignment_id, task_name);

-- 3. Shift Reports (Approval Layer)
-- Generated when the Team Leader approves the end-of-shift closure.
CREATE TABLE IF NOT EXISTS shift_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_date DATE NOT NULL,
    shift_id INT NOT NULL REFERENCES shifts(id),
    team_leader_id UUID NOT NULL REFERENCES personnels(id),
    status VARCHAR(20) DEFAULT 'FINALIZED',
    approval_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- A shift on a specific date can only have one finalized report
CREATE UNIQUE INDEX IF NOT EXISTS idx_shift_report_date ON shift_reports(report_date, shift_id);
