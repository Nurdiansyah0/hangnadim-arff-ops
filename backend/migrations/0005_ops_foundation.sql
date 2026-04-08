-- =========================================================
-- OPERATIONAL FOUNDATION (SHIFTS & AVIATION)
-- =========================================================

CREATE TABLE IF NOT EXISTS shifts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(10) UNIQUE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL
);

CREATE TABLE IF NOT EXISTS flight_routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flight_number VARCHAR(20) NOT NULL,
    origin VARCHAR(100),
    destination VARCHAR(100),
    runway runway_enum NOT NULL,
    actual_time TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_flight_number ON flight_routes(flight_number);
CREATE INDEX IF NOT EXISTS idx_flight_time ON flight_routes(actual_time);
