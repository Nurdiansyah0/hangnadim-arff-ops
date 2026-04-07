-- =========================================================
-- MIGRATION: REBUILD RBAC ROLES (1-9 Hierarchy)
-- =========================================================

-- 1. Ensure Manager Position exists
INSERT INTO positions (name) VALUES ('Airport Rescue & Fire Fighting Manager') ON CONFLICT DO NOTHING;

-- 2. Link Zulkarnain to Manager Position if not already
UPDATE personnels 
SET position_id = (SELECT id FROM positions WHERE name = 'Airport Rescue & Fire Fighting Manager' LIMIT 1)
WHERE full_name = 'ZULKARNAIN,S.Kom';

-- 3. Clear existing role mappings
TRUNCATE personnel_roles CASCADE;
TRUNCATE roles CASCADE;

-- 4. Insert New Roles with Fixed IDs
INSERT INTO roles (id, name) VALUES 
(1, 'Superuser'),
(2, 'Vice President'),
(3, 'Manager'),
(4, 'RFF Performance Standard Team Leader'),
(5, 'RFF OperationTeam Leader'),
(6, 'RFF Maintenance Team Leader'),
(7, 'Team Leader (General)'),
(8, 'Squad Leader'),
(9, 'Officer');

-- Reset sequence for roles if needed
SELECT setval('roles_id_seq', 9);

-- 5. Re-map Personnel to Roles based on Position Name
INSERT INTO personnel_roles (personnel_id, role_id)
SELECT 
    ps.id,
    CASE 
        WHEN p.name = 'Head of ARFF Unit' THEN 2
        WHEN p.name = 'Airport Rescue & Fire Fighting Manager' THEN 3
        WHEN p.name = 'RFF Performance Standard Team Leader' THEN 4
        WHEN p.name = 'RFF OperationTeam Leader' THEN 5
        WHEN p.name = 'RFF Maintenance Team Leader' THEN 6
        WHEN p.name = 'Rescue and Fire Fighting Squad Leader' THEN 8
        WHEN p.name LIKE '%Officer%' THEN 9
        ELSE 9 -- Default to Officer
    END as role_id
FROM personnels ps
JOIN positions p ON ps.position_id = p.id;

-- 6. Ensure Admin User is Superuser
INSERT INTO personnel_roles (personnel_id, role_id)
SELECT id, 1 FROM personnels WHERE full_name = 'Nurdiansyah Admin'
ON CONFLICT DO NOTHING;

-- 7. Restore Basic Permissions for Inventory (as created in 0005)
-- Note: 0005 migrations already created permissions, we just need to re-link them to new role IDs
INSERT INTO role_permissions (role_id, permission_id) 
SELECT 1, id FROM permissions WHERE name IN ('VIEW_INVENTORY', 'UPDATE_INVENTORY', 'MANAGE_INVENTORY') ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (role_id, permission_id) 
SELECT 2, id FROM permissions WHERE name IN ('VIEW_INVENTORY', 'UPDATE_INVENTORY', 'MANAGE_INVENTORY') ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (role_id, permission_id) 
SELECT 3, id FROM permissions WHERE name IN ('VIEW_INVENTORY', 'UPDATE_INVENTORY', 'MANAGE_INVENTORY') ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (role_id, permission_id) 
SELECT 8, id FROM permissions WHERE name = 'VIEW_INVENTORY' ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (role_id, permission_id) 
SELECT 9, id FROM permissions WHERE name = 'VIEW_INVENTORY' ON CONFLICT DO NOTHING;

