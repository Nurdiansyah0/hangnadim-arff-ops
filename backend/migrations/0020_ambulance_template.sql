-- 1. Create Ambulance Template
INSERT INTO inspection_templates (name, target_type, frequency) 
VALUES ('Daily Ambulance Check', 'VEHICLE', 'DAILY')
ON CONFLICT (name) DO NOTHING;

-- 2. Add Items for Ambulance Check (excluding proportioner, etc)
INSERT INTO template_items (template_id, category, item_name, item_order)
SELECT id, 'Engine', 'Oil & Coolant Levels', 1 FROM inspection_templates WHERE name = 'Daily Ambulance Check'
UNION ALL
SELECT id, 'Emergency', 'Sirens & Warning Lights', 2 FROM inspection_templates WHERE name = 'Daily Ambulance Check'
UNION ALL
SELECT id, 'Medical', 'Oxygen Cylinder Pressure', 3 FROM inspection_templates WHERE name = 'Daily Ambulance Check'
UNION ALL
SELECT id, 'Medical', 'Stretcher & Trolley Condition', 4 FROM inspection_templates WHERE name = 'Daily Ambulance Check'
UNION ALL
SELECT id, 'Medical', 'First Aid Kit & Medical Cabinet', 5 FROM inspection_templates WHERE name = 'Daily Ambulance Check'
UNION ALL
SELECT id, 'System', 'Communication Radio / HT', 6 FROM inspection_templates WHERE name = 'Daily Ambulance Check'
ON CONFLICT (template_id, item_name) DO NOTHING;

-- 3. Data Correction: Mark AMB-1 as RESCUE
UPDATE vehicles SET vehicle_type = 'RESCUE' WHERE code LIKE 'AMB%';
