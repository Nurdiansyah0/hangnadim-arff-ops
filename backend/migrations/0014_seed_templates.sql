-- =========================================================
-- INSPECTION TEMPLATES & ITEMS SEED
-- =========================================================

-- 1. APAR (Fire Extinguisher) Template
INSERT INTO inspection_templates (name, target_type, frequency) 
VALUES ('Monthly APAR Check', 'FIRE_EXTINGUISHER', 'MONTHLY')
ON CONFLICT (name) DO NOTHING;

-- 2. APAR Template Items
INSERT INTO template_items (template_id, category, item_name, item_order) 
SELECT id, 'Visual', 'Pressure Gauge (Green Zone)', 1 FROM inspection_templates WHERE name = 'Monthly APAR Check' UNION ALL
SELECT id, 'Physical', 'Safety Seal & Pin Intact', 2 FROM inspection_templates WHERE name = 'Monthly APAR Check' UNION ALL
SELECT id, 'Physical', 'Nozzle/Hose Condition', 3 FROM inspection_templates WHERE name = 'Monthly APAR Check' UNION ALL
SELECT id, 'Physical', 'Cylinder Condition (No Rust/Dents)', 4 FROM inspection_templates WHERE name = 'Monthly APAR Check' UNION ALL
SELECT id, 'Label', 'Inspection Tag Present', 5 FROM inspection_templates WHERE name = 'Monthly APAR Check'
ON CONFLICT (template_id, item_name) DO NOTHING;

-- 3. Vehicle (ARFF) Template
INSERT INTO inspection_templates (name, target_type, frequency) 
VALUES ('Daily Vehicle Check (ARFF)', 'VEHICLE', 'DAILY')
ON CONFLICT (name) DO NOTHING;

-- 4. Vehicle Template Items
INSERT INTO template_items (template_id, category, item_name, item_order) 
SELECT id, 'Engine', 'Oil Level', 1 FROM inspection_templates WHERE name = 'Daily Vehicle Check (ARFF)' UNION ALL
SELECT id, 'Engine', 'Coolant Level', 2 FROM inspection_templates WHERE name = 'Daily Vehicle Check (ARFF)' UNION ALL
SELECT id, 'System', 'Water Pump Operation', 3 FROM inspection_templates WHERE name = 'Daily Vehicle Check (ARFF)' UNION ALL
SELECT id, 'System', 'Foam Proportioner', 4 FROM inspection_templates WHERE name = 'Daily Vehicle Check (ARFF)' UNION ALL
SELECT id, 'Safety', 'Lights & Siren', 5 FROM inspection_templates WHERE name = 'Daily Vehicle Check (ARFF)'
ON CONFLICT (template_id, item_name) DO NOTHING;
