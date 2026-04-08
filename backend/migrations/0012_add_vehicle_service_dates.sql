-- Migration to add missing service date columns to vehicles table
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS last_service_date DATE,
ADD COLUMN IF NOT EXISTS next_service_due DATE;

-- Update comments
COMMENT ON COLUMN vehicles.last_service_date IS 'The date of the last maintenance/service';
COMMENT ON COLUMN vehicles.next_service_due IS 'The scheduled date for the next maintenance';
