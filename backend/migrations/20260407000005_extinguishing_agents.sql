-- =========================================================
-- MIGRATION: EXTINGUISHING AGENTS & RBAC
-- =========================================================

CREATE TABLE extinguishing_agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    brand VARCHAR(255),
    min_requirement DECIMAL(12,2) NOT NULL,
    unit VARCHAR(10) NOT NULL,
    inventory_level DECIMAL(12,2) NOT NULL,
    last_procurement_year VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_extinguishing_agents_updated_at BEFORE UPDATE ON extinguishing_agents FOR EACH ROW EXECUTE FUNCTION set_updated_at_if_changed();

-- Seed Data from CSV
INSERT INTO extinguishing_agents (name, brand, min_requirement, unit, inventory_level, last_procurement_year) VALUES 
('Water', 'none', 97200, 'L', 100000, 'none'),
('Aqueous Film Forming Foam (AFFF)', 'FoamTec & Sthamex,monofofex', 2916, 'L', 3100, '2021, 2022'),
('Dry Chemical Powder (DCP)', 'Combitroxin', 450, 'Kg', 1400, '2017');

-- RBAC: Permissions
INSERT INTO permissions (name, description) VALUES 
('VIEW_INVENTORY', 'Akses melihat stok logistik/agen pemadam'),
('UPDATE_INVENTORY', 'Akses memperbarui level stok logistik'),
('MANAGE_INVENTORY', 'Akses penuh kelola master data logistik')
ON CONFLICT (name) DO NOTHING;

-- Link Permissions to Roles
-- Super Admin (1) & Manager (2) get everything
INSERT INTO role_permissions (role_id, permission_id) 
SELECT 1, id FROM permissions WHERE name IN ('VIEW_INVENTORY', 'UPDATE_INVENTORY', 'MANAGE_INVENTORY') ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (role_id, permission_id) 
SELECT 2, id FROM permissions WHERE name IN ('VIEW_INVENTORY', 'UPDATE_INVENTORY', 'MANAGE_INVENTORY') ON CONFLICT DO NOTHING;

-- Firefighter (3) gets VIEW_INVENTORY only
INSERT INTO role_permissions (role_id, permission_id) 
SELECT 3, id FROM permissions WHERE name = 'VIEW_INVENTORY' ON CONFLICT DO NOTHING;