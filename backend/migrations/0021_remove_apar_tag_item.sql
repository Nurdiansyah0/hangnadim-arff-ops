-- Migration: Remove redundant 'Inspection Tag Present' item from APAR template
-- Since the digital audit acts as the definitive inspection record.

DELETE FROM template_items 
WHERE item_name = 'Inspection Tag Present' 
AND template_id = (SELECT id FROM inspection_templates WHERE name = 'Monthly APAR Check');
