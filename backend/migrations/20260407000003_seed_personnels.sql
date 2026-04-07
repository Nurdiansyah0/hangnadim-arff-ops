-- =========================================================
-- MIGRATION: SEED PERSONNEL DATA FROM CSV
-- =========================================================

CREATE TYPE employment_status_enum AS ENUM ('PNS', 'PKWT');
CREATE TYPE shift_enum AS ENUM ('Alpha', 'Bravo', 'Charlie', 'Normal');
CREATE TYPE position_enum AS ENUM (
  'RFF Performance Standard Team Leader',
  'RFF OperationTeam Leader',
  'RFF Maintenance Team Leader',
  'RFF Squad Leader',
  'RFF Officer',
  'Airport Rescue & Fire Fighting Manager'
);
ALTER TABLE personnels ADD COLUMN IF NOT EXISTS employment_status employment_status_enum;
ALTER TABLE personnels ADD COLUMN IF NOT EXISTS shift shift_enum;

-- Ensure positions exist
INSERT INTO positions (name) VALUES 
('RFF Performance Standard Team Leader'),
('RFF OperationTeam Leader'),
('RFF Maintenance Team Leader'),
('RFF Squad Leader'),
('RFF Officer'),
('Airport Rescue & Fire Fighting Manager')
ON CONFLICT (name) DO NOTHING;

-- Clear existing personnels to avoid conflicts
DELETE FROM personnels WHERE nip_nik != '12345678';

-- Insert personnels from CSV data with shifts
INSERT INTO personnels (id, nip_nik, full_name, position_id, employment_status, shift, status) VALUES
(uuid_generate_v4(), 'PNS137-1721', 'Jefri DH Sinaga', (SELECT id FROM positions WHERE name = 'RFF Officer'), 'PNS', 'Alpha', 'ACTIVE'),
(uuid_generate_v4(), 'PNS145-1721', 'Setiyono', (SELECT id FROM positions WHERE name = 'RFF Officer'), 'PNS', 'Alpha', 'ACTIVE'),
(uuid_generate_v4(), 'PNS013-1722', 'Taufik', (SELECT id FROM positions WHERE name = 'RFF Officer'), 'PNS', 'Alpha', 'ACTIVE'),
(uuid_generate_v4(), 'PNS060-1722', 'Agusta Slamet Sriyanto', (SELECT id FROM positions WHERE name = 'RFF Officer'), 'PNS', 'Alpha', 'ACTIVE'),
(uuid_generate_v4(), 'PNS144-1722', 'Saipul Anuar', (SELECT id FROM positions WHERE name = 'RFF Officer'), 'PNS', 'Alpha', 'ACTIVE'),
(uuid_generate_v4(), 'PNS146-1722', 'Suriyadi', (SELECT id FROM positions WHERE name = 'RFF Officer'), 'PNS', 'Alpha', 'ACTIVE'),
(uuid_generate_v4(), 'PNS132-1722', 'Budi Priyanto', (SELECT id FROM positions WHERE name = 'RFF Officer'), 'PNS', 'Alpha', 'ACTIVE'),
(uuid_generate_v4(), 'PNS135-1722', 'Indra Agus Susanto', (SELECT id FROM positions WHERE name = 'RFF Officer'), 'PNS', 'Alpha', 'ACTIVE'),
(uuid_generate_v4(), 'PNS102-1722', 'Namli', (SELECT id FROM positions WHERE name = 'RFF Officer'), 'PNS', 'Alpha', 'ACTIVE'),
(uuid_generate_v4(), 'CE069-1722', 'M.Iqbal Fauzi', (SELECT id FROM positions WHERE name = 'RFF Officer'), 'PKWT', 'Alpha', 'ACTIVE'),
(uuid_generate_v4(), 'CE081-1722', 'M.Azhari Lazuardi', (SELECT id FROM positions WHERE name = 'RFF Officer'), 'PKWT', 'Alpha', 'ACTIVE'),
(uuid_generate_v4(), 'CE161-1722', 'Rocky Pasaribu', (SELECT id FROM positions WHERE name = 'RFF Officer'), 'PKWT', 'Alpha', 'ACTIVE'),
(uuid_generate_v4(), 'CE078-1722', 'Diki Darmawan', (SELECT id FROM positions WHERE name = 'RFF Officer'), 'PKWT', 'Alpha', 'ACTIVE'),
(uuid_generate_v4(), 'CE158-1722', 'Nurdiansyah', (SELECT id FROM positions WHERE name = 'RFF Officer'), 'PKWT', 'Alpha', 'ACTIVE'),
(uuid_generate_v4(), 'CE075-1722', 'Angga Pratama', (SELECT id FROM positions WHERE name = 'RFF Officer'), 'PKWT', 'Alpha', 'ACTIVE'),
(uuid_generate_v4(), 'CE074-1722', 'Munawir Mafildan M', (SELECT id FROM positions WHERE name = 'RFF Officer'), 'PKWT', 'Alpha', 'ACTIVE'),
(uuid_generate_v4(), 'CE162-1722', 'Ryan Bastia Defrizal', (SELECT id FROM positions WHERE name = 'RFF Officer'), 'PKWT', 'Alpha', 'ACTIVE'),
(uuid_generate_v4(), 'CE164-1722', 'Sufridanto Sitanggang', (SELECT id FROM positions WHERE name = 'RFF Officer'), 'PKWT', 'Alpha', 'ACTIVE'),
(uuid_generate_v4(), 'CE154-1722', 'Juhalidi Deskandar', (SELECT id FROM positions WHERE name = 'RFF Officer'), 'PKWT', 'Alpha', 'ACTIVE'),
(uuid_generate_v4(), 'CE169-1722', 'Zeni Aris Setiawan', (SELECT id FROM positions WHERE name = 'RFF Officer'), 'PKWT', 'Alpha', 'ACTIVE'),
(uuid_generate_v4(), 'PNS126-1722', 'Agung Wijayanto', (SELECT id FROM positions WHERE name = 'RFF Officer'), 'PNS', 'Bravo', 'ACTIVE'),
(uuid_generate_v4(), 'PNS136-1722', 'Jansen Nababan', (SELECT id FROM positions WHERE name = 'RFF Officer'), 'PNS', 'Bravo', 'ACTIVE'),
(uuid_generate_v4(), 'PNS130-1722', 'Asrul Hadi', (SELECT id FROM positions WHERE name = 'RFF Officer'), 'PNS', 'Bravo', 'ACTIVE'),
(uuid_generate_v4(), 'PNS143-1722', 'Rayusman', (SELECT id FROM positions WHERE name = 'RFF Officer'), 'PNS', 'Bravo', 'ACTIVE'),
(uuid_generate_v4(), 'PNS147-1722', 'Syaibir', (SELECT id FROM positions WHERE name = 'RFF Officer'), 'PNS', 'Bravo', 'ACTIVE'),
(uuid_generate_v4(), 'PNS128-1722', 'Ansyori Fauzi', (SELECT id FROM positions WHERE name = 'RFF Officer'), 'PNS', 'Bravo', 'ACTIVE'),
(uuid_generate_v4(), 'PNS138-1722', 'Junaidi', (SELECT id FROM positions WHERE name = 'RFF Officer'), 'PNS', 'Bravo', 'ACTIVE'),
(uuid_generate_v4(), 'PNS103-1722', 'Pelita Wandri Sihaloho', (SELECT id FROM positions WHERE name = 'RFF Officer'), 'PNS', 'Bravo', 'ACTIVE'),
(uuid_generate_v4(), 'CE149-1722', 'Daniel Firmansyah', (SELECT id FROM positions WHERE name = 'RFF Officer'), 'PKWT', 'Bravo', 'ACTIVE'),
(uuid_generate_v4(), 'CE079-1722', 'Sigit Gunadi', (SELECT id FROM positions WHERE name = 'RFF Officer'), 'PKWT', 'Bravo', 'ACTIVE'),
(uuid_generate_v4(), 'CE071-1722', 'Ari Ardian Syaputra', (SELECT id FROM positions WHERE name = 'RFF Officer'), 'PKWT', 'Bravo', 'ACTIVE'),
(uuid_generate_v4(), 'CE070-1722', 'Mahfutzhi', (SELECT id FROM positions WHERE name = 'RFF Officer'), 'PKWT', 'Bravo', 'ACTIVE'),
(uuid_generate_v4(), 'CE163-1722', 'Siktus Fendi Silaban', (SELECT id FROM positions WHERE name = 'RFF Officer'), 'PKWT', 'Bravo', 'ACTIVE'),
(uuid_generate_v4(), 'CE080-1722', 'Hari Kusuma Atmaja', (SELECT id FROM positions WHERE name = 'RFF Officer'), 'PKWT', 'Bravo', 'ACTIVE'),
(uuid_generate_v4(), 'CE168-1722', 'Try Rezki Arya', (SELECT id FROM positions WHERE name = 'RFF Officer'), 'PKWT', 'Bravo', 'ACTIVE'),
(uuid_generate_v4(), 'CE157-1722', 'M.Ricky Setiawan', (SELECT id FROM positions WHERE name = 'RFF Officer'), 'PKWT', 'Bravo', 'ACTIVE'),
(uuid_generate_v4(), 'CE152-1722', 'Igif Pranata', (SELECT id FROM positions WHERE name = 'RFF Officer'), 'PKWT', 'Bravo', 'ACTIVE'),
(uuid_generate_v4(), 'CE076-1722', 'Clement Sirait', (SELECT id FROM positions WHERE name = 'RFF Officer'), 'PKWT', 'Bravo', 'ACTIVE'),
(uuid_generate_v4(), 'CE151-1722', 'Guntur Febrian agan', (SELECT id FROM positions WHERE name = 'RFF Officer'), 'PKWT', 'Bravo', 'ACTIVE'),
(uuid_generate_v4(), 'PNS142-1722', 'Muhammad azhar', (SELECT id FROM positions WHERE name = 'RFF Officer'), 'PNS', 'Charlie', 'ACTIVE'),
(uuid_generate_v4(), 'PNS125-1722', 'Abdul Rohim', (SELECT id FROM positions WHERE name = 'RFF Officer'), 'PNS', 'Charlie', 'ACTIVE'),
(uuid_generate_v4(), 'PNS011-1724', 'Maizar', (SELECT id FROM positions WHERE name = 'RFF Officer'), 'PNS', 'Charlie', 'ACTIVE'),
(uuid_generate_v4(), 'PNS148-1722', 'Wahyu Sugandi', (SELECT id FROM positions WHERE name = 'RFF Officer'), 'PNS', 'Charlie', 'ACTIVE'),
(uuid_generate_v4(), 'PNS127-1722', 'Agus Agustus', (SELECT id FROM positions WHERE name = 'RFF Officer'), 'PNS', 'Charlie', 'ACTIVE'),
(uuid_generate_v4(), 'PNS129-1722', 'Ansyory Al Fath', (SELECT id FROM positions WHERE name = 'RFF Officer'), 'PNS', 'Charlie', 'ACTIVE'),
(uuid_generate_v4(), 'PNS140-1722', 'M.Agus Chalim', (SELECT id FROM positions WHERE name = 'RFF Officer'), 'PNS', 'Charlie', 'ACTIVE'),
(uuid_generate_v4(), 'CE073-1722', 'Langgeng Argiansyah', (SELECT id FROM positions WHERE name = 'RFF Officer'), 'PKWT', 'Charlie', 'ACTIVE'),
(uuid_generate_v4(), 'CE147-1722', 'Ahmad Fajar Shodiq', (SELECT id FROM positions WHERE name = 'RFF Officer'), 'PKWT', 'Charlie', 'ACTIVE'),
(uuid_generate_v4(), 'CE077-1722', 'Krismanto V Nababan', (SELECT id FROM positions WHERE name = 'RFF Officer'), 'PKWT', 'Charlie', 'ACTIVE'),
(uuid_generate_v4(), 'CE150-1722', 'Febri Harianto', (SELECT id FROM positions WHERE name = 'RFF Officer'), 'PKWT', 'Charlie', 'ACTIVE'),
(uuid_generate_v4(), 'CE167-1722', 'Syahrul Ramadhan', (SELECT id FROM positions WHERE name = 'RFF Officer'), 'PKWT', 'Charlie', 'ACTIVE'),
(uuid_generate_v4(), 'CE166-1722', 'Suwartoyo', (SELECT id FROM positions WHERE name = 'RFF Officer'), 'PKWT', 'Charlie', 'ACTIVE'),
(uuid_generate_v4(), 'CE153-1722', 'Ilham Prasetyo', (SELECT id FROM positions WHERE name = 'RFF Officer'), 'PKWT', 'Charlie', 'ACTIVE'),
(uuid_generate_v4(), 'CE165-1722', 'Suhendra', (SELECT id FROM positions WHERE name = 'RFF Officer'), 'PKWT', 'Charlie', 'ACTIVE'),
(uuid_generate_v4(), 'CE160-1722', 'Reza Fetrik', (SELECT id FROM positions WHERE name = 'RFF Officer'), 'PKWT', 'Charlie', 'ACTIVE'),
(uuid_generate_v4(), 'CE155-1722', 'Mediyanto Saputra', (SELECT id FROM positions WHERE name = 'RFF Officer'), 'PKWT', 'Charlie', 'ACTIVE'),
(uuid_generate_v4(), 'CE159-1722', 'Rahmat tri Jayanto', (SELECT id FROM positions WHERE name = 'RFF Officer'), 'PKWT', 'Charlie', 'ACTIVE'),
(uuid_generate_v4(), 'CE148-1722', 'Ansori Nurbuat', (SELECT id FROM positions WHERE name = 'RFF Officer'), 'PKWT', 'Charlie', 'ACTIVE'),
(uuid_generate_v4(), 'PNS005-1721', 'Zulkarnain', (SELECT id FROM positions WHERE name = 'RFF Officer'), 'PNS', 'Normal', 'ACTIVE'),
(uuid_generate_v4(), 'PNS052-1722', 'Khairul Bahri', (SELECT id FROM positions WHERE name = 'RFF Officer'), 'PNS', 'Normal', 'ACTIVE'),
(uuid_generate_v4(), 'PNS053-1722', 'Esra Purba', (SELECT id FROM positions WHERE name = 'RFF Officer'), 'PNS', 'Normal', 'ACTIVE'),
(uuid_generate_v4(), 'PNS015-1722', 'Heru Laksana', (SELECT id FROM positions WHERE name = 'RFF Officer'), 'PNS', 'Normal', 'ACTIVE'),
(uuid_generate_v4(), 'PNS014-1722', 'B Ranuh Maryudha', (SELECT id FROM positions WHERE name = 'RFF Officer'), 'PNS', 'Normal', 'ACTIVE'),
(uuid_generate_v4(), 'PNS134-1722', 'Imam Hari Sumbodo', (SELECT id FROM positions WHERE name = 'RFF Officer'), 'PNS', 'Normal', 'ACTIVE'),
(uuid_generate_v4(), 'PNS141-1722', 'M.Ali Anafiah', (SELECT id FROM positions WHERE name = 'RFF Officer'), 'PNS', 'Normal', 'ACTIVE');