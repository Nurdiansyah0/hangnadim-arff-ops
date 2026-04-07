-- =========================================================
-- Migration: 20260408000004_audit_logging_triggers.sql
-- Description: Add audit logging triggers for operational tables
-- =========================================================

-- Create audit_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    table_name TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    original_data JSONB,
    new_data JSONB,
    user_id UUID, -- Optional, set via session variable if available
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create the audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_func() RETURNS TRIGGER AS $$
DECLARE
    user_id_val UUID;
BEGIN
    -- Try to get user_id from session variable (optional)
    BEGIN
        user_id_val := current_setting('app.current_user_id')::UUID;
    EXCEPTION
        WHEN OTHERS THEN
            user_id_val := NULL;
    END;

    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (table_name, action, original_data, new_data, user_id)
        VALUES (TG_TABLE_NAME, TG_OP, NULL, row_to_json(NEW), user_id_val);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (table_name, action, original_data, new_data, user_id)
        VALUES (TG_TABLE_NAME, TG_OP, row_to_json(OLD), row_to_json(NEW), user_id_val);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (table_name, action, original_data, new_data, user_id)
        VALUES (TG_TABLE_NAME, TG_OP, row_to_json(OLD), NULL, user_id_val);
        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers on specified tables
-- Note: Only create if table exists to avoid errors

DO $$
DECLARE
    table_list TEXT[] := ARRAY['vehicles', 'fire_extinguishers', 'inspections', 'incidents', 'extinguishing_agents', 'personnel_certifications'];
    tbl TEXT;
BEGIN
    FOREACH tbl IN ARRAY table_list LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl) THEN
            EXECUTE FORMAT('DROP TRIGGER IF EXISTS audit_trigger ON %I;', tbl);
            EXECUTE FORMAT('CREATE TRIGGER audit_trigger AFTER INSERT OR UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();', tbl);
        END IF;
    END LOOP;
END $$;