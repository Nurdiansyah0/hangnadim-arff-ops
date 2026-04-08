-- =========================================================
-- SYSTEM AUDIT LOGGING
-- =========================================================

CREATE TABLE audit_logs (
    id UUID NOT NULL,
    actor_id UUID, -- References personnels.id
    table_name VARCHAR(50) NOT NULL,
    action VARCHAR(20) NOT NULL,
    original_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Generate partitions for 2026
SELECT generate_partitions('audit_logs', DATE '2026-01-01', 12);

-- Audit log trigger function
CREATE OR REPLACE FUNCTION process_audit_log() RETURNS TRIGGER AS $$
DECLARE
    v_actor_id UUID;
BEGIN
    -- Actor ID should usually come from a session variable in a real app,
    -- but for now we leave it null or try to infer.
    
    IF (TG_OP = 'DELETE') THEN
        INSERT INTO audit_logs (id, actor_id, table_name, action, original_data, new_data)
        VALUES (uuid_generate_v4(), NULL, TG_TABLE_NAME, 'DELETE', to_jsonb(OLD), NULL);
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO audit_logs (id, actor_id, table_name, action, original_data, new_data)
        VALUES (uuid_generate_v4(), NULL, TG_TABLE_NAME, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO audit_logs (id, actor_id, table_name, action, original_data, new_data)
        VALUES (uuid_generate_v4(), NULL, TG_TABLE_NAME, 'INSERT', NULL, to_jsonb(NEW));
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Example: Audit personnels and users
CREATE TRIGGER audit_personnels AFTER INSERT OR UPDATE OR DELETE ON personnels FOR EACH ROW EXECUTE FUNCTION process_audit_log();
CREATE TRIGGER audit_users AFTER INSERT OR UPDATE OR DELETE ON users FOR EACH ROW EXECUTE FUNCTION process_audit_log();
CREATE TRIGGER audit_vehicles AFTER INSERT OR UPDATE OR DELETE ON vehicles FOR EACH ROW EXECUTE FUNCTION process_audit_log();
