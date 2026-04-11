CREATE TABLE IF NOT EXISTS physical_fitness_tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    personnel_id UUID NOT NULL REFERENCES personnels(id) ON DELETE CASCADE,
    test_date DATE NOT NULL,
    run_12min_meters INTEGER NOT NULL,
    shuttle_run_seconds DECIMAL(5, 2) NOT NULL,
    pull_ups INTEGER NOT NULL,
    sit_ups INTEGER NOT NULL,
    push_ups INTEGER NOT NULL,
    score DECIMAL(5, 2), -- Optional aggregate score
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fitness_personnel ON physical_fitness_tests(personnel_id, test_date DESC);

-- Trigger to auto update updated_at
DROP TRIGGER IF EXISTS trg_fitness_tests_updated_at ON physical_fitness_tests;
CREATE TRIGGER trg_fitness_tests_updated_at
BEFORE UPDATE ON physical_fitness_tests
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_if_changed();
