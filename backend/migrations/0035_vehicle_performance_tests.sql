-- Create table for Vehicle Performance Tests
CREATE TABLE IF NOT EXISTS vehicle_performance_tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    inspector_id UUID REFERENCES personnels(id) ON DELETE SET NULL,
    test_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Performance Metrics
    top_speed_kmh FLOAT8 NOT NULL,
    discharge_range_m FLOAT8 NOT NULL,
    discharge_rate_lpm FLOAT8 NOT NULL,
    stopping_distance_m FLOAT8 NOT NULL,
    
    remarks TEXT,
    status VARCHAR(20) DEFAULT 'PASS', -- PASS, FAIL, REQUIRES_MAINTENANCE
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trigger for updated_at
-- Using the existing function 'set_updated_at_if_changed' defined in foundation migrations
CREATE TRIGGER trg_vehicle_performance_tests_updated_at
    BEFORE UPDATE ON vehicle_performance_tests
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at_if_changed();
