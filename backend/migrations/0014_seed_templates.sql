-- =========================================================
-- INSPECTION TEMPLATES & ITEMS SEED
-- =========================================================

-- 1. APAR (Fire Extinguisher) Template
INSERT INTO inspection_templates (name, target_type, frequency) 
VALUES ('Monthly APAR Check', 'FIRE_EXTINGUISHER', 'MONTHLY')
ON CONFLICT (id) DO NOTHING;

-- 2. APAR Template Items
-- Assuming the template id is 1 as it's the first one
INSERT INTO template_items (template_id, category, item_name, item_order) VALUES
(1, 'Visual', 'Pressure Gauge (Green Zone)', 1),
(1, 'Physical', 'Safety Seal & Pin Intact', 2),
(1, 'Physical', 'Nozzle/Hose Condition', 3),
(1, 'Physical', 'Cylinder Condition (No Rust/Dents)', 4),
(1, 'Label', 'Inspection Tag Present', 5)
ON CONFLICT DO NOTHING;

-- 3. Vehicle (ARFF) Template
INSERT INTO inspection_templates (name, target_type, frequency) 
VALUES ('Daily Vehicle Check (ARFF)', 'VEHICLE', 'DAILY')
ON CONFLICT (id) DO NOTHING;

-- 4. Vehicle Template Items
INSERT INTO template_items (template_id, category, item_name, item_order) VALUES
(2, 'Engine', 'Oil Level', 1),
(2, 'Engine', 'Coolant Level', 2),
(2, 'System', 'Water Pump Operation', 3),
(2, 'System', 'Foam Proportioner', 4),
(2, 'Safety', 'Lights & Siren', 5)
ON CONFLICT DO NOTHING;
