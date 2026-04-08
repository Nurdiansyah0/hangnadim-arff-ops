-- =========================================================
-- OPERATIONAL FOUNDATION (SHIFTS & AVIATION)
-- =========================================================

CREATE TABLE shifts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(10) UNIQUE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL
);

CREATE TABLE flight_routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flight_number VARCHAR(20) NOT NULL,
    origin VARCHAR(100),
    destination VARCHAR(100),
    runway runway_enum NOT NULL,
    actual_time TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_flight_number ON flight_routes(flight_number);
CREATE INDEX idx_flight_time ON flight_routes(actual_time);
