-- =========================================================
-- 1. POSITIONS & ROLES
-- =========================================================

INSERT INTO positions (id, name) VALUES 
(1, 'Airport Rescue & Fire Fighting Manager'),
(2, 'Vice President'),
(3, 'RFF Performance Standard Team Leader'),
(4, 'RFF OperationTeam Leader'),
(5, 'RFF Maintenance Team Leader'),
(6, 'Rescue and Fire Fighting Squad Leader'),
(7, 'Rescue Officer'),
(8, 'Admin')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

SELECT setval('positions_id_seq', 8);

INSERT INTO roles (id, name) VALUES 
(1, 'Superuser'),
(2, 'Vice President'),
(3, 'Manager'),
(4, 'RFF Performance Standard Team Leader'),
(5, 'RFF OperationTeam Leader'),
(6, 'RFF Maintenance Team Leader'),
(7, 'Rescue and Fire Fighting Squad Leader'),
(8, 'Rescue Officer')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

SELECT setval('roles_id_seq', 8);

-- =========================================================
-- 2. PERMISSIONS & ADMIN USER
-- =========================================================

INSERT INTO permissions (name, description) VALUES 
('VIEW_INVENTORY', 'Can view asset inventory'),
('UPDATE_INVENTORY', 'Can update asset quantities'),
('MANAGE_INVENTORY', 'Full control over assets'),
('VIEW_REPORTS', 'Can view operational reports'),
('APPROVE_REPORTS', 'Can approve inspections/logs')
ON CONFLICT (name) DO NOTHING;

INSERT INTO personnels (id, nip_nik, full_name, position_id, status) 
VALUES (
    'd290f1ee-6c54-4b01-90e6-d701748f0851', 
    '12345678', 
    'Nurdiansyah Admin', 
    (SELECT id FROM positions WHERE name = 'Admin'), 
    'ACTIVE'
) ON CONFLICT (nip_nik) DO NOTHING;

INSERT INTO users (personnel_id, username, email, password_hash)
VALUES (
    'd290f1ee-6c54-4b01-90e6-d701748f0851',
    'admin123',
    'admin@arff.hangnadim.id',
    '$2b$12$f6gY9rjtJiyLxzby/uVAZOT1ZggsGktM42rQ1K3EpaeS14ACA./pe'
) ON CONFLICT (username) DO NOTHING;

INSERT INTO personnel_roles (personnel_id, role_id)
VALUES ('d290f1ee-6c54-4b01-90e6-d701748f0851', 1)
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id) 
SELECT 1, id FROM permissions ON CONFLICT DO NOTHING;

-- =========================================================
-- 3. SHIFTS
-- =========================================================

INSERT INTO shifts (name, start_time, end_time) VALUES 
('Morning', '08:00:00', '20:00:00'), 
('Night', '20:00:00', '08:00:00'),
('Normal', '08:00:00', '16:00:00')
ON CONFLICT (name) DO NOTHING;

-- =========================================================
-- 4. MASTER ASSETS (VEHICLES & AGENTS)
-- =========================================================

INSERT INTO vehicles (code, name, vehicle_type, status, water_capacity_l, foam_capacity_l, powder_capacity_kg) VALUES
('FOAM TENDER 1', 'Foam Tender 1', 'ARFF', 'READY', 12000, 1500, 250),
('FOAM TENDER 2', 'Foam Tender 2', 'ARFF', 'READY', 12000, 1500, 250),
('FOAM TENDER 3', 'Foam Tender 3', 'ARFF', 'READY', 12000, 1500, 250),
('FOAM TENDER 4', 'Foam Tender 4', 'ARFF', 'READY', 12000, 1500, 250),
('FOAM TENDER 5', 'Foam Tender 5', 'ARFF', 'READY', 12000, 1500, 250),
('NURSE TENDER 1', 'Nurse Tender 1', 'ARFF', 'READY', 8000, 0, 0),
('NURSE TENDER 2', 'Nurse Tender 2', 'ARFF', 'READY', 8000, 0, 0),
('AMBULANCE 1', 'Ambulance 1', 'RESCUE', 'READY', 0, 0, 0),
('AMBULANCE 2', 'Ambulance 2', 'RESCUE', 'READY', 0, 0, 0),
('UTILITY', 'Utility', 'UTILITY', 'READY', 0, 0, 0),
('FCP COMMAND POS', 'FCP (Command Pos)', 'COMMAND_VEHICLE', 'READY', 0, 0, 0),
('COMMANDO CAR', 'Commando Car', 'COMMAND_VEHICLE', 'READY', 0, 0, 0)
ON CONFLICT (code) DO NOTHING;

INSERT INTO extinguishing_agents (name, unit, description) VALUES
('Water', 'Liters', 'Main extinguishing agent'),
('Foam AFFF', 'Liters', 'Aqueous Film Forming Foam'),
('Dry Chemical Powder', 'Kg', 'Purple-K or similar')
ON CONFLICT (name) DO NOTHING;

-- =========================================================
-- 5. TEMPLATES (INSPECTION & TASK)
-- =========================================================

-- APAR Template
INSERT INTO inspection_templates (name, target_type, frequency) VALUES ('Monthly APAR Check', 'FIRE_EXTINGUISHER', 'MONTHLY') ON CONFLICT (name) DO NOTHING;
INSERT INTO template_items (template_id, category, item_name, item_order) 
SELECT id, 'Visual', 'Pressure Gauge (Green Zone)', 1 FROM inspection_templates WHERE name = 'Monthly APAR Check' UNION ALL
SELECT id, 'Physical', 'Safety Seal & Pin Intact', 2 FROM inspection_templates WHERE name = 'Monthly APAR Check' UNION ALL
SELECT id, 'Physical', 'Nozzle/Hose Condition', 3 FROM inspection_templates WHERE name = 'Monthly APAR Check' UNION ALL
SELECT id, 'Physical', 'Cylinder Condition (No Rust/Dents)', 4 FROM inspection_templates WHERE name = 'Monthly APAR Check'
ON CONFLICT (template_id, item_name) DO NOTHING;

-- ARFF Vehicle Template
INSERT INTO inspection_templates (name, target_type, frequency) VALUES ('Daily Vehicle Check (ARFF)', 'VEHICLE', 'DAILY') ON CONFLICT (name) DO NOTHING;
INSERT INTO template_items (template_id, category, item_name, item_order) 
SELECT id, 'Engine', 'Oil Level', 1 FROM inspection_templates WHERE name = 'Daily Vehicle Check (ARFF)' UNION ALL
SELECT id, 'Engine', 'Coolant Level', 2 FROM inspection_templates WHERE name = 'Daily Vehicle Check (ARFF)' UNION ALL
SELECT id, 'System', 'Water Pump Operation', 3 FROM inspection_templates WHERE name = 'Daily Vehicle Check (ARFF)' UNION ALL
SELECT id, 'System', 'Foam Proportioner', 4 FROM inspection_templates WHERE name = 'Daily Vehicle Check (ARFF)' UNION ALL
SELECT id, 'Safety', 'Lights & Siren', 5 FROM inspection_templates WHERE name = 'Daily Vehicle Check (ARFF)'
ON CONFLICT (template_id, item_name) DO NOTHING;

-- Ambulance Template
INSERT INTO inspection_templates (name, target_type, frequency) VALUES ('Daily Ambulance Check', 'VEHICLE', 'DAILY') ON CONFLICT (name) DO NOTHING;
INSERT INTO template_items (template_id, category, item_name, item_order)
SELECT id, 'Engine', 'Oil & Coolant Levels', 1 FROM inspection_templates WHERE name = 'Daily Ambulance Check' UNION ALL
SELECT id, 'Emergency', 'Sirens & Warning Lights', 2 FROM inspection_templates WHERE name = 'Daily Ambulance Check' UNION ALL
SELECT id, 'Medical', 'Oxygen Cylinder Pressure', 3 FROM inspection_templates WHERE name = 'Daily Ambulance Check' UNION ALL
SELECT id, 'Medical', 'Stretcher & Trolley Condition', 4 FROM inspection_templates WHERE name = 'Daily Ambulance Check' UNION ALL
SELECT id, 'Medical', 'First Aid Kit & Medical Cabinet', 5 FROM inspection_templates WHERE name = 'Daily Ambulance Check' UNION ALL
SELECT id, 'System', 'Communication Radio / HT', 6 FROM inspection_templates WHERE name = 'Daily Ambulance Check'
ON CONFLICT (template_id, item_name) DO NOTHING;

-- Task Templates (Hybrid System)
INSERT INTO task_templates (position, task_name, description) VALUES
('DRIVER', 'Vehicle Physical Inspection', 'Check fluid levels, tires, body condition, and warning systems.'),
('DRIVER', 'Pump & Agent Operations Check', 'Run standard pump tests, check water/foam levels.'),
('DRIVER', 'Communications Link Test', 'Radio check with Watchroom & Ground Control.'),
('RESCUEMAN', 'Locker Equipment Inventory', 'Check and account for all rescue tools, hoses, and nozzles.'),
('RESCUEMAN', 'Breathing Apparatus (BA) Set', 'Verify BA pressure levels and mask integrity.'),
('RESCUEMAN', 'PPE Readiness', 'Ensure fire suit, helmet, gloves, and boots are prepositioned.'),
('WATCHROOM', 'Line Comm Verification', 'Test hotlines to ATC, Tower, and City Fire Dept.'),
('WATCHROOM', 'Daily Flight Schedule Review', 'Review daily flight schedules and identify critical flights.'),
('WATCHROOM', 'Weather & Notam Update', 'Log daily weather and active NOTAMs.'),
('OSC', 'Shift Briefing & Readiness', 'Conduct shift briefing, verify overall manpower and vehicle readiness.'),
('OSC', 'Vehicle Bay Check', 'Physical walkthrough of the vehicle bay.')
ON CONFLICT DO NOTHING;
