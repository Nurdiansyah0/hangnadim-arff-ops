-- =========================================================
-- TASK GENERATION & SHIFT REPORTS
-- =========================================================

CREATE TABLE IF NOT EXISTS task_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    position VARCHAR(50) NOT NULL,
    task_name VARCHAR(150) NOT NULL,
    description TEXT,
    is_mandatory BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS daily_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES duty_assignments(id) ON DELETE CASCADE,
    task_name VARCHAR(150) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'PENDING',
    completed_at TIMESTAMPTZ,
    completed_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_task_unique ON daily_tasks(assignment_id, task_name);

CREATE TABLE IF NOT EXISTS shift_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_date DATE NOT NULL,
    shift_id INT NOT NULL REFERENCES shifts(id),
    team_leader_id UUID NOT NULL REFERENCES personnels(id),
    status VARCHAR(20) DEFAULT 'FINALIZED',
    approval_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_shift_report_date ON shift_reports(report_date, shift_id);
