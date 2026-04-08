-- =========================================================
-- 1. EXTENSIONS & GLOBAL PERMISSIONS
-- =========================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================
-- 2. SHARED ENUMS
-- =========================================================

DO $$ BEGIN
    CREATE TYPE status_enum AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE severity_enum AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE leave_status_enum AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE vehicle_status_enum AS ENUM ('READY', 'MAINTENANCE', 'REPAIR', 'OUT_OF_SERVICE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE approval_status_enum AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE attendance_status_enum AS ENUM ('PRESENT', 'LATE', 'ABSENT', 'ON_LEAVE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE cert_status_enum AS ENUM ('ACTIVE', 'EXPIRED', 'WAITING_RENEWAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE runway_enum AS ENUM ('04', '22');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE employment_status_enum AS ENUM ('PNS', 'PKWT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE shift_enum AS ENUM ('Alpha', 'Bravo', 'Charlie', 'Normal');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE duty_position_enum AS ENUM ('DRIVER', 'WATCHROOM', 'NOZZLEMAN', 'AST_NOZZLEMAN', 'RESCUEMAN', 'OSC');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE inspection_result_enum AS ENUM ('PASS', 'FAIL', 'N_A');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =========================================================
-- 3. GLOBAL AUTOMATION FUNCTIONS
-- =========================================================

-- Trigger to update 'updated_at' column
CREATE OR REPLACE FUNCTION set_updated_at_if_changed() RETURNS TRIGGER AS $$
BEGIN
    IF NEW IS DISTINCT FROM OLD THEN
        NEW.updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Partition Generation Function
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
