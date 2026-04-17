-- 1. Add 'CREW' to duty_position_enum
-- Use DO block to avoid error if already exists
DO $$ BEGIN
    ALTER TYPE duty_position_enum ADD VALUE 'CREW';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Cleanup redundant vehicles from previous seed (to avoid duplicates in UI)
-- First release foreign key constraints by setting vehicle_id to NULL
UPDATE duty_assignments 
SET vehicle_id = NULL 
WHERE vehicle_id IN (SELECT id FROM vehicles WHERE code IN ('FOAM-1', 'FOAM-2', 'NUR-1', 'RSC-1'));

-- Then delete the vehicles
DELETE FROM vehicles WHERE code IN ('FOAM-1', 'FOAM-2', 'NUR-1', 'RSC-1');
