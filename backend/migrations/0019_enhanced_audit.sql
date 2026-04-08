-- =========================================================
-- ENHANCED AUDIT TRAIL & TRACEABILITY
-- =========================================================

-- 1. Update audit log trigger to capture the Actor ID from the session context
CREATE OR REPLACE FUNCTION process_audit_log() RETURNS TRIGGER AS $$
DECLARE
    v_actor_id UUID;
BEGIN
    -- Capture Actor ID from session setting (set by backend in transaction)
    -- current_setting with 'true' as second arg returns NULL instead of error if not found
    BEGIN
        v_actor_id := NULLIF(current_setting('app.current_actor_id', true), '')::UUID;
    EXCEPTION WHEN others THEN
        v_actor_id := NULL;
    END;
    
    IF (TG_OP = 'DELETE') THEN
        INSERT INTO audit_logs (id, actor_id, table_name, action, original_data, new_data)
        VALUES (uuid_generate_v4(), v_actor_id, TG_TABLE_NAME, 'DELETE', to_jsonb(OLD), NULL);
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO audit_logs (id, actor_id, table_name, action, original_data, new_data)
        VALUES (uuid_generate_v4(), v_actor_id, TG_TABLE_NAME, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO audit_logs (id, actor_id, table_name, action, original_data, new_data)
        VALUES (uuid_generate_v4(), v_actor_id, TG_TABLE_NAME, 'INSERT', NULL, to_jsonb(NEW));
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 2. Apply audit triggers to operational tables for traceability
DROP TRIGGER IF EXISTS audit_inspections ON inspections;
CREATE TRIGGER audit_inspections AFTER INSERT OR UPDATE OR DELETE ON inspections 
FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_maintenance_records ON maintenance_records;
CREATE TRIGGER audit_maintenance_records AFTER INSERT OR UPDATE OR DELETE ON maintenance_records 
FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_findings ON findings;
CREATE TRIGGER audit_findings AFTER INSERT OR UPDATE OR DELETE ON findings 
FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_fire_extinguishers ON fire_extinguishers;
CREATE TRIGGER audit_fire_extinguishers AFTER INSERT OR UPDATE OR DELETE ON fire_extinguishers 
FOR EACH ROW EXECUTE FUNCTION process_audit_log();
