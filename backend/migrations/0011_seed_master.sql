-- =========================================================
-- MASTER DATA SEED (PERSONNEL & VEHICLES)
-- =========================================================

-- 1. Shifts
INSERT INTO shifts (name, start_time, end_time) VALUES 
('Alpha', '08:00:00', '20:00:00'), 
('Bravo', '20:00:00', '08:00:00'),
('Charlie', '08:00:00', '08:00:00'), -- 24h or similar
('Normal', '08:00:00', '16:00:00')
ON CONFLICT (name) DO NOTHING;

-- 2. Bulk Personnel Seed (Subset for demonstration, usually handled by import script)
-- Note: Mapping positions by name to get foreign keys
INSERT INTO personnels (id, nip_nik, full_name, position_id, employment_status, shift, status) VALUES
(uuid_generate_v4(), 'PNS137-1721', 'Jefri DH Sinaga', (SELECT id FROM positions WHERE name = 'Rescue Officer' LIMIT 1), 'PNS', 'Alpha', 'ACTIVE'),
(uuid_generate_v4(), 'PNS145-1721', 'Setiyono', (SELECT id FROM positions WHERE name = 'Rescue Officer' LIMIT 1), 'PNS', 'Alpha', 'ACTIVE'),
(uuid_generate_v4(), 'PNS013-1722', 'Taufik', (SELECT id FROM positions WHERE name = 'Rescue Officer' LIMIT 1), 'PNS', 'Alpha', 'ACTIVE'),
(uuid_generate_v4(), 'PNS005-1721', 'Zulkarnain', (SELECT id FROM positions WHERE name = 'Airport Rescue & Fire Fighting Manager' LIMIT 1), 'PNS', 'Normal', 'ACTIVE')
ON CONFLICT (nip_nik) DO NOTHING;

-- 3. Vehicles
INSERT INTO vehicles (code, name, vehicle_type, water_capacity_l, foam_capacity_l, powder_capacity_kg) VALUES
('FOAM-1', 'Foam Tender 1', 'ARFF', 12000, 1500, 250),
('FOAM-2', 'Foam Tender 2', 'ARFF', 12000, 1500, 250),
('NUR-1', 'Nurse Tender 1', 'ARFF', 8000, 0, 0),
('RSC-1', 'Rescue Vehicle 1', 'RESCUE', 0, 0, 50)
ON CONFLICT (code) DO NOTHING;

-- 4. Extinguishing Agents
INSERT INTO extinguishing_agents (name, unit, description) VALUES
('Water', 'Liters', 'Main extinguishing agent'),
('Foam AFFF', 'Liters', 'Aqueous Film Forming Foam'),
('Dry Chemical Powder', 'Kg', 'Purple-K or similar')
ON CONFLICT (name) DO NOTHING;
