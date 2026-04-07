ALTER TABLE vehicles
    ADD COLUMN IF NOT EXISTS water_capacity_liters DECIMAL,
    ADD COLUMN IF NOT EXISTS foam_capacity_liters DECIMAL,
    ADD COLUMN IF NOT EXISTS dcp_capacity_kg DECIMAL,
    ADD COLUMN IF NOT EXISTS last_service_date DATE,
    ADD COLUMN IF NOT EXISTS next_service_due DATE;
