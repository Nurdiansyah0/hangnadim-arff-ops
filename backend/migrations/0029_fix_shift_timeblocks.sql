-- Refactor Shifts from Team Names to Time Blocks
-- Previous names (Alpha, Bravo, Charlie) were confusing teams with timeslots.

-- 1. Create temporary table to hold data if needed (if duty_assignments existed, we'd need to map them)
-- Since 0026 seeded duty_assignments using SELECT id FROM shifts WHERE name = '...', 
-- we should handle the transition carefully.

-- Clear old shifts that use team names
TRUNCATE TABLE shifts CASCADE;

-- Insert proper Time Blocks
INSERT INTO shifts (name, start_time, end_time) VALUES 
('Morning', '08:00:00', '20:00:00'), 
('Night', '20:00:00', '08:00:00'),
('Normal', '08:00:00', '16:00:00')
ON CONFLICT (name) DO NOTHING;

-- Note: The personnels table 'shift' column (shift_enum) still contains 'Alpha', 'Bravo', 'Charlie', 'Normal'.
-- Those remain as the "Team" identifiers for each personnel.
