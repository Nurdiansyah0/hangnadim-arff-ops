-- =========================================================
-- CORE SEED DATA (ROLES, POSITIONS, ADMIN)
-- =========================================================

-- 1. Initial Positions
INSERT INTO positions (name) VALUES 
('Airport Rescue & Fire Fighting Manager'),
('Vice President'),
('RFF Performance Standard Team Leader'),
('RFF OperationTeam Leader'),
('RFF Maintenance Team Leader'),
('Rescue and Fire Fighting Squad Leader'),
('Rescue Officer'),
('Admin')
ON CONFLICT (name) DO NOTHING;

-- 2. Initial Roles
INSERT INTO roles (id, name) VALUES 
(1, 'Superuser'),
(2, 'Vice President'),
(3, 'Manager'),
(4, 'RFF Performance Standard Team Leader'),
(5, 'RFF OperationTeam Leader'),
(6, 'RFF Maintenance Team Leader'),
(7, 'Team Leader (General)'),
(8, 'Squad Leader'),
(9, 'Officer')
ON CONFLICT (id) DO NOTHING;

-- Reset role id sequence
SELECT setval('roles_id_seq', 9);

-- 3. Initial Permissions
INSERT INTO permissions (name, description) VALUES 
('VIEW_INVENTORY', 'Can view asset inventory'),
('UPDATE_INVENTORY', 'Can update asset quantities'),
('MANAGE_INVENTORY', 'Full control over assets'),
('VIEW_REPORTS', 'Can view operational reports'),
('APPROVE_REPORTS', 'Can approve inspections/logs')
ON CONFLICT (name) DO NOTHING;

-- 4. Initial Personnel (Admin Account)
INSERT INTO personnels (id, nip_nik, full_name, position_id, status) 
VALUES (
    'd290f1ee-6c54-4b01-90e6-d701748f0851', 
    '12345678', 
    'Nurdiansyah Admin', 
    (SELECT id FROM positions WHERE name = 'Admin'), 
    'ACTIVE'
) ON CONFLICT (nip_nik) DO NOTHING;

-- 5. Initial User Account (Linked to Admin Personnel)
INSERT INTO users (personnel_id, username, email, password_hash)
VALUES (
    'd290f1ee-6c54-4b01-90e6-d701748f0851',
    'admin123',
    'admin@arff.hangnadim.id',
    '$2b$12$f6gY9rjtJiyLxzby/uVAZOT1ZggsGktM42rQ1K3EpaeS14ACA./pe' -- admin123
) ON CONFLICT (username) DO NOTHING;

-- 6. Link Admin to Superuser Role
INSERT INTO personnel_roles (personnel_id, role_id)
VALUES ('d290f1ee-6c54-4b01-90e6-d701748f0851', 1)
ON CONFLICT DO NOTHING;

-- 7. Basic Role-Permission Mapping
INSERT INTO role_permissions (role_id, permission_id) 
SELECT 1, id FROM permissions ON CONFLICT DO NOTHING;
