-- =========================================================
-- 0028_RACI_RBAC: Granular RBAC based on RACI Matrix
-- =========================================================

-- 1. Create New Granular Roles
INSERT INTO roles (id, name) VALUES 
(12, 'Admin (Office)')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- 2. Define Granular Permissions (Mapping 20 Activities)
INSERT INTO permissions (name, description) VALUES 
-- Ops & Readiness
('MANAGE_READY_STATE', 'Accountable/Responsible for overall shift readiness'),
('VIEW_READY_STATE', 'Can view shift readiness status'),

-- Incident & Emergency
('LEAD_INCIDENT_FIRE', 'Field commander for fire incidents (A/R)'),
('EXECUTE_FIRE_OPS', 'Primary executor for firefighting tasks (R)'),
('MANAGE_EVACUATION', 'Accountable for passenger/crew evacuation'),
('VIEW_INCIDENT_LOGS', 'Can view incident reports and logs'),

-- Fire Protection & Prevention
('MANAGE_RISK_ID', 'Responsible for risk identification and fire protection'),
('EXECUTE_INSPECTION', 'Conduct routine inspections of area and equipment'),
('MANAGE_STANDARDS', 'Maintenance and application of technical standards'),
('MANAGE_TRAINING', 'Planning and execution of training/socialization'),

-- Assets & Maintenance
('MANAGE_VEHICLE_MAINT', 'Technical responsibility for vehicle/equipment maintenance'),

-- Quality, Governance & Coordination
('MANAGE_SOP_EVAL', 'Monitoring quality and evaluating SOPs'),
('EXECUTE_INTERNAL_AUDIT', 'Performing internal audits and performance reports'),
('MANAGE_POLICY', 'Accountable for setting new procedures and policies'),
('MANAGE_COORD_SAFETY', 'Coordination with VP Safety/Security/Rescue'),
('EVALUATE_PERFORMANCE', 'Evaluating personnel performance per shift'),
('MANAGE_SCHEDULING', 'Planning shift schedules and rotations'),

-- Data & Communications
('MANAGE_AIRPORT_MONITOR', 'Real-time monitoring of airport activities'),
('MANAGE_NOTIFICATION', 'Receiving alarms and notifying personnel'),
('MANAGE_ARCHIVE', 'Updating databases and managing documentation archives'),

-- Dashboard & Results
('VIEW_MATRIX_DASHBOARD', 'Access to full results and matrix dashboards')
ON CONFLICT (name) DO NOTHING;

-- 3. Role-Permission Mapping (Based on RACI)

-- Clear existing role-permission for roles we are redefining (3-6, 8-9, 12)
DELETE FROM role_permissions WHERE role_id IN (2, 3, 4, 5, 6, 8, 9, 12);

-- VC (Role 2): Informed of everything + Dashboard
INSERT INTO role_permissions (role_id, permission_id)
SELECT 2, id FROM permissions WHERE name LIKE 'VIEW_%' OR name = 'VIEW_MATRIX_DASHBOARD';

-- Manager (Role 3): A/R for Readiness, Risk ID, Standards, Training, Quality, Policy, Coordination, Performance Eval, Sched
INSERT INTO role_permissions (role_id, permission_id)
SELECT 3, id FROM permissions WHERE name IN (
    'MANAGE_READY_STATE', 'MANAGE_RISK_ID', 'MANAGE_STANDARDS', 'MANAGE_TRAINING', 
    'MANAGE_SOP_EVAL', 'MANAGE_POLICY', 'MANAGE_COORD_SAFETY', 'EVALUATE_PERFORMANCE', 
    'MANAGE_SCHEDULING', 'VIEW_MATRIX_DASHBOARD', 'VIEW_INCIDENT_LOGS'
);

-- TL P&Q (Role 4): A/R for Inspection, Quality/SOP Eval, Audit
INSERT INTO role_permissions (role_id, permission_id)
SELECT 4, id FROM permissions WHERE name IN (
    'EXECUTE_INSPECTION', 'MANAGE_RISK_ID', 'MANAGE_SOP_EVAL', 'EXECUTE_INTERNAL_AUDIT', 
    'VIEW_READY_STATE', 'VIEW_INCIDENT_LOGS'
);

-- TL Shift (Role 5): A/R for Readiness, Incident Lead, Evacuation lead, Training help, Performance eval help, Sched help
INSERT INTO role_permissions (role_id, permission_id)
SELECT 5, id FROM permissions WHERE name IN (
    'MANAGE_READY_STATE', 'LEAD_INCIDENT_FIRE', 'MANAGE_EVACUATION', 'EXECUTE_INSPECTION',
    'MANAGE_TRAINING', 'EVALUATE_PERFORMANCE', 'MANAGE_SCHEDULING', 'VIEW_INCIDENT_LOGS'
);

-- TL Maintenance (Role 6): A/R for Vehicle Maintenance, Standards help
INSERT INTO role_permissions (role_id, permission_id)
SELECT 6, id FROM permissions WHERE name IN (
    'MANAGE_VEHICLE_MAINT', 'MANAGE_STANDARDS', 'VIEW_READY_STATE', 'VIEW_INCIDENT_LOGS'
);

-- Squad Leader (Role 8): Execute Fire Ops, Evacuation execute, Inspection help. Incident Lead level 2.
INSERT INTO role_permissions (role_id, permission_id)
SELECT 8, id FROM permissions WHERE name IN (
    'LEAD_INCIDENT_FIRE', 'MANAGE_EVACUATION', 'EXECUTE_INSPECTION', 'VIEW_READY_STATE', 'VIEW_INCIDENT_LOGS'
);

-- Officer (Role 9): Execute Fire Ops, Evacuation execute, Inspection help. Informed of others.
INSERT INTO role_permissions (role_id, permission_id)
SELECT 9, id FROM permissions WHERE name IN (
    'EXECUTE_FIRE_OPS', 'MANAGE_EVACUATION', 'EXECUTE_INSPECTION', 'VIEW_READY_STATE', 'VIEW_INCIDENT_LOGS', 'MANAGE_AIRPORT_MONITOR', 'MANAGE_NOTIFICATION', 'MANAGE_COORD_SAFETY', 'MANAGE_ARCHIVE'
);

-- Admin (Office) (Role 12): Risk ID doc, Inspection doc, Audit doc, Reporting, Archive, Sched record
INSERT INTO role_permissions (role_id, permission_id)
SELECT 12, id FROM permissions WHERE name IN (
    'MANAGE_RISK_ID', 'EXECUTE_INSPECTION', 'EXECUTE_INTERNAL_AUDIT', 'MANAGE_ARCHIVE', 'MANAGE_SCHEDULING'
);

-- Superuser (Role 1): Everything
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions
ON CONFLICT DO NOTHING;

-- 4. Re-assign Personnel Roles based on Positions (RACI Alignment)
-- Clear existing non-superuser roles to re-sync
DELETE FROM personnel_roles WHERE role_id != 1;

INSERT INTO personnel_roles (personnel_id, role_id)
SELECT 
    p.id,
    CASE 
        WHEN pos.name = 'Airport Rescue & Fire Fighting Manager' THEN 3
        WHEN pos.name = 'Vice President' THEN 2
        WHEN pos.name = 'RFF Performance Standard Team Leader' THEN 4
        WHEN pos.name = 'RFF OperationTeam Leader' THEN 5
        WHEN pos.name = 'RFF Maintenance Team Leader' THEN 6
        WHEN pos.name = 'Rescue and Fire Fighting Squad Leader' THEN 8
        WHEN pos.name = 'Rescue Officer' THEN 9
        WHEN pos.name = 'Admin' THEN 12
        ELSE 9 -- Default Officer
    END
FROM personnels p
JOIN positions pos ON p.position_id = pos.id
ON CONFLICT DO NOTHING;
