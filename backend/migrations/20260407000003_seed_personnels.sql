-- =========================================================
-- MIGRATION: SEED PERSONNEL DATA FROM CSV
-- =========================================================

CREATE TYPE employment_status_enum AS ENUM ('PNS', 'PKWT');
CREATE TYPE shift_enum AS ENUM ('Alpha', 'Bravo', 'Charlie', 'Normal');
ALTER TABLE personnels ADD COLUMN IF NOT EXISTS employment_status employment_status_enum;
ALTER TABLE personnels ADD COLUMN IF NOT EXISTS shift shift_enum;

-- Ensure positions exist
INSERT INTO positions (name) VALUES 
('RFF Performance Standard Team Leader'),
('RFF OperationTeam Leader'),
('RFF Maintenance Team Leader'),
('Rescue and Fire Fighting Squad Leader'),
('Fire Fighting and Rescue Officer'),
('Rescue and Fire Fighting Officer'),
('Airport Rescue & Fire Fighting Manager')
ON CONFLICT (name) DO NOTHING;

-- Clear existing personnels to avoid conflicts
DELETE FROM personnels WHERE nip_nik != '12345678';

-- Insert personnels from CSV data
INSERT INTO personnels (id, nip_nik, full_name, position_id, employment_status, shift, status) VALUES
('a72d3006-b773-4a6b-ab27-0e7ca27c0e3a', 'PNS005-1722', 'ZULKARNAIN,S.Kom', (SELECT id FROM positions WHERE name = 'Airport Rescue & Fire Fighting Manager'), 'PNS'),
('8c9d3ab3-3c27-48fd-a47b-a01779774c83', 'PNS053-1722', 'ESRA PURBA', (SELECT id FROM positions WHERE name = 'RFF Performance Standard Team Leader'), 'PNS'),
('45c61f43-4474-45b0-9c4b-e0de7eb5d43f', 'PNS052-1722', 'KHAIRUL BAHRI,ST', (SELECT id FROM positions WHERE name = 'RFF OperationTeam Leader'), 'PNS'),
('cfc1319f-e9f7-42a1-84ac-b92f3a8eb55d', 'PNS015-1722', 'HERU LAKSANA', (SELECT id FROM positions WHERE name = 'RFF Maintenance Team Leader'), 'PNS'),
('8adb3731-2629-4caf-8db0-36d571cd48b6', 'PNS014-1722', 'B.RANUH MARYUDHA,A.Md', (SELECT id FROM positions WHERE name = 'RFF Performance Standard Team Leader'), 'PNS'),
('4d660f40-b887-470c-a340-08c941f1c1c6', 'PNS137-1722', 'JEFRI DEBOS H SINAGA', (SELECT id FROM positions WHERE name = 'RFF OperationTeam Leader'), 'PNS'),
('ee521367-44f6-469d-aeec-fd70835006bf', 'PNS126-1722', 'AGUNG WIJAYANTO', (SELECT id FROM positions WHERE name = 'RFF OperationTeam Leader'), 'PNS'),
('6ba19cdc-ae84-43ba-afc4-9e6cc101bcba', 'PNS142-1T22', 'MUHAMMAD AZHAR', (SELECT id FROM positions WHERE name = 'RFF OperationTeam Leader'), 'PNS'),
('48a662a2-1cf8-4395-a614-ae94c08f8ba0', 'PNS011-1722', 'MAIZAR,S.Kom', (SELECT id FROM positions WHERE name = 'Rescue and Fire Fighting Squad Leader'), 'PNS'),
('cb6928f5-3639-42db-905a-80851c3c45ea', 'PNS013-1722', 'TAUFIK,SE', (SELECT id FROM positions WHERE name = 'Rescue and Fire Fighting Squad Leader'), 'PNS'),
('ec5bc470-ac2d-402f-8c18-c3a9151a83d6', 'PNS144-1722', 'SAIPUL ANUAR', (SELECT id FROM positions WHERE name = 'Rescue and Fire Fighting Squad Leader'), 'PNS'),
('64c145df-84b0-4cae-9d5a-d4822d7ee097', 'PNS145-1722', 'SETIYONO', (SELECT id FROM positions WHERE name = 'Rescue and Fire Fighting Squad Leader'), 'PNS'),
('8dd0474c-c31d-4842-84c9-22e9754d1024', 'PNS135-1722', 'INDRA AGUS SUSANTO', (SELECT id FROM positions WHERE name = 'Rescue and Fire Fighting Squad Leader'), 'PNS'),
('763ca748-bd8c-4732-8587-ea10ee5f35f5', 'PNS136-1722', 'JANSEN NABABAN', (SELECT id FROM positions WHERE name = 'Rescue and Fire Fighting Squad Leader'), 'PNS'),
('5a042867-16a5-416a-87e0-7a4df7dcebff', 'PNS143-1722', 'RAYUSMAN', (SELECT id FROM positions WHERE name = 'Rescue and Fire Fighting Squad Leader'), 'PNS'),
('d5779737-a934-455e-8553-b044a94c9129', 'PNS128-1722', 'ANSYORI FAUZI', (SELECT id FROM positions WHERE name = 'Rescue and Fire Fighting Squad Leader'), 'PNS'),
('1d3ddfb6-c527-44ef-8e82-b1a81bb4a425', 'PNS147-1722', 'SYAIBIR', (SELECT id FROM positions WHERE name = 'Rescue and Fire Fighting Squad Leader'), 'PNS'),
('3b0d60c6-52cb-4439-9406-6fec267fa405', 'PNS125-1722', 'ABDUL ROHIM', (SELECT id FROM positions WHERE name = 'Rescue and Fire Fighting Squad Leader'), 'PNS'),
('fa867f35-3d16-46ff-a45b-dbbc161cfa4c', 'PNS148-1722', 'WAHYU SUGANDI', (SELECT id FROM positions WHERE name = 'Rescue and Fire Fighting Squad Leader'), 'PNS'),
('596b0c5b-d1b1-4a3c-8990-f55a1aeec81f', 'PNS127-1722', 'AGUS AGUSTUS', (SELECT id FROM positions WHERE name = 'Rescue and Fire Fighting Squad Leader'), 'PNS'),
('150d728a-c0f5-4b7d-ac00-06edbf20a2e6', 'PNS129-1722', 'ANSYORY AL FATH', (SELECT id FROM positions WHERE name = 'Rescue and Fire Fighting Squad Leader'), 'PNS'),
('f2ff0d6e-2e36-4e79-b650-1e93b7aaeb4c', 'PNS134-1722', 'IMAM HARI SUMBODO', (SELECT id FROM positions WHERE name = 'Rescue and Fire Fighting Squad Leader'), 'PNS'),
('d4d3c147-e88a-4c10-a604-c7cd542ad493', 'PNS060-1722', 'AGUSTA SLAMET SRIYANTO,ST', (SELECT id FROM positions WHERE name = 'Fire Fighting and Rescue Officer'), 'PNS'),
('ec3aa1b1-2c27-4c88-9241-69b5c1c3cb77', 'PNS130-1722', 'ASRUL HADI', (SELECT id FROM positions WHERE name = 'Fire Fighting and Rescue Officer'), 'PNS'),
('c2e12f29-dad2-46f4-80d5-cd1442bfc6d9', 'PNS132-1722', 'BUDI PRIYANTO', (SELECT id FROM positions WHERE name = 'Fire Fighting and Rescue Officer'), 'PNS'),
('f6371d5f-d994-41f9-b32d-203ca847f92f', 'PNS141-1722', 'M.ALI ANAFIAH', (SELECT id FROM positions WHERE name = 'Fire Fighting and Rescue Officer'), 'PNS'),
('929c9964-e905-474b-82db-de483ffd481d', 'PNS140-1722', 'MUH.AGUS CHALIM', (SELECT id FROM positions WHERE name = 'Fire Fighting and Rescue Officer'), 'PNS'),
('d29ea2a9-bdea-4440-b392-52375b987355', 'PNS138-1722', 'JUNAIDI', (SELECT id FROM positions WHERE name = 'Rescue and Fire Fighting Officer'), 'PNS'),
('3e3bc80f-4e69-49b2-a6f3-1f86162cf971', 'PNS146-1722', 'SURIYADI', (SELECT id FROM positions WHERE name = 'Rescue and Fire Fighting Officer'), 'PNS'),
('b96533d0-aa40-4904-9007-6a906f97f1f0', 'PNS103-1722', 'PELITA WANDRI SIHALOHO', (SELECT id FROM positions WHERE name = 'Fire Fighting and Rescue Officer'), 'PNS'),
('da41a16d-c49c-40c1-b316-5d45ce7782ca', 'PNS102-1722', 'NAMLI', (SELECT id FROM positions WHERE name = 'Rescue and Fire Fighting Officer'), 'PNS'),
('e2017f94-4ecc-4fcd-9ff2-f05db0360e19', 'CE073-1722', 'LANGGENG ARGIANSAH', (SELECT id FROM positions WHERE name = 'Rescue and Fire Fighting Officer'), 'PKWT'),
('e01186f7-8c7c-44e0-b343-2cd2e3ac20d8', 'CE074-1722', 'MUNAWIR M MANURUNG', (SELECT id FROM positions WHERE name = 'Rescue and Fire Fighting Officer'), 'PKWT'),
('87dcb9af-b5e0-493f-904b-20ccbc52dd51', 'CE077-1722', 'KRISMANTO VIADE NABABAN', (SELECT id FROM positions WHERE name = 'Rescue and Fire Fighting Officer'), 'PKWT'),
('a2e2e724-6bc0-4d2d-af53-e30de555b50f', 'CE076-1722', 'CLEMENT SIRAIT', (SELECT id FROM positions WHERE name = 'Rescue and Fire Fighting Officer'), 'PKWT'),
('6dda2549-8716-4ff4-9494-09502d8552fd', 'CE079-1722', 'SIGIT GUNADI', (SELECT id FROM positions WHERE name = 'Rescue and Fire Fighting Officer'), 'PKWT'),
('07fd8248-a07e-4072-95cb-9ea330f70e0e', 'CE075-1722', 'ANGGA PRATAMA', (SELECT id FROM positions WHERE name = 'Rescue and Fire Fighting Officer'), 'PKWT'),
('485ce038-197c-4ebf-b27a-91876cdbf167', 'CE078-1722', 'DIKI DARMAWAN', (SELECT id FROM positions WHERE name = 'Rescue and Fire Fighting Officer'), 'PKWT'),
('2cbe1005-37d3-4214-924d-57fa4fb42492', 'CE081-1722', 'M.AZHARI LAZUARDI', (SELECT id FROM positions WHERE name = 'Rescue and Fire Fighting Officer'), 'PKWT'),
('93051f76-9959-4f62-b8ee-ff1ddbecccd6', 'CE070-1722', 'MAHFUTZHI', (SELECT id FROM positions WHERE name = 'Rescue and Fire Fighting Officer'), 'PKWT'),
('22ec0604-c381-4a60-974b-b32e69a0b643', 'CEO80-1722', 'HARI KUSUMA ATMAJA', (SELECT id FROM positions WHERE name = 'Rescue and Fire Fighting Officer'), 'PKWT'),
('c4b85776-c0b4-4862-aefd-5df98d4f92c6', 'CE069-1722', 'M.IQBAL FAUZI', (SELECT id FROM positions WHERE name = 'Rescue and Fire Fighting Officer'), 'PKWT'),
('2f83d9ae-f61c-42ac-b07e-8cceb6d8dcaf', 'CE071-1722', 'ARI ARDIAN SAHPUTRA', (SELECT id FROM positions WHERE name = 'Rescue and Fire Fighting Officer'), 'PKWT'),
('7626df99-84be-40cf-b14a-ba4608ea30dc', 'CE168-1722', 'TRY REZKI ARYA', (SELECT id FROM positions WHERE name = 'Rescue and Fire Fighting Officer'), 'PKWT'),
('2bf3e156-8ed6-473a-87e1-185cb1da80ff', 'CE150-1722', 'FEBRI HARIANTO', (SELECT id FROM positions WHERE name = 'Rescue and Fire Fighting Officer'), 'PKWT'),
('29565268-b75c-458d-a6b8-83c67458e2a4', 'CE167-1722', 'SYAHRUL RAMADHAN', (SELECT id FROM positions WHERE name = 'Rescue and Fire Fighting Officer'), 'PKWT'),
('10fc8b86-09ce-46dd-be23-a74dbfb5ca5d', 'CE159-1722', 'RAHMAT TRI JAYANTO', (SELECT id FROM positions WHERE name = 'Rescue and Fire Fighting Officer'), 'PKWT'),
('70468428-5854-4871-92c8-9d5274443fac', 'CE149-1722', 'DANIEL FIRMANSYAH', (SELECT id FROM positions WHERE name = 'Rescue and Fire Fighting Officer'), 'PKWT'),
('6fc84928-b22a-4222-a2a8-8a61ee88d94f', 'CE157-1722', 'M.RICKY SETIAWAN', (SELECT id FROM positions WHERE name = 'Rescue and Fire Fighting Officer'), 'PKWT'),
('d7dca122-7f78-4a0e-a58d-8720aedac950', 'CE160-1722', 'REZA FETRIK', (SELECT id FROM positions WHERE name = 'Rescue and Fire Fighting Officer'), 'PKWT'),
('66bcc41b-0077-4d8a-b0b0-ba7345c30ce6', 'CE153-1722', 'ILHAM PRASETYO', (SELECT id FROM positions WHERE name = 'Rescue and Fire Fighting Officer'), 'PKWT'),
('db4a33da-d42d-47a7-9d89-b654ff19a067', 'CE158-1722', 'NURDIANSYAH', (SELECT id FROM positions WHERE name = 'Rescue and Fire Fighting Officer'), 'PKWT'),
('4525cec1-315b-4c1a-b09f-ba6124c7228d', 'CE147-1722', 'AHMAD FAJAR SHODIQ', (SELECT id FROM positions WHERE name = 'Rescue and Fire Fighting Officer'), 'PKWT'),
('117051b8-6550-45a6-973d-d80d077a5003', 'CE148-1722', 'ANSORI NURBUAT', (SELECT id FROM positions WHERE name = 'Rescue and Fire Fighting Officer'), 'PKWT'),
('c8ff0421-6ab3-4f7b-a503-3e0eea5b77d9', 'CE162-1722', 'RYAN BASTIA DEFRIZAL', (SELECT id FROM positions WHERE name = 'Rescue and Fire Fighting Officer'), 'PKWT'),
('0bbe4f34-7957-4a50-b30e-081b2b320112', 'CE165-1722', 'SUHENDRA', (SELECT id FROM positions WHERE name = 'Rescue and Fire Fighting Officer'), 'PKWT'),
('0212c850-cc61-444a-b2b5-9aa19dc38d93', 'CE166-1722', 'SUWARTOYO', (SELECT id FROM positions WHERE name = 'Rescue and Fire Fighting Officer'), 'PKWT'),
('ec4926c0-2375-4f05-a8dc-f9b156b10700', 'CE152-1722', 'IGIF PRANATA', (SELECT id FROM positions WHERE name = 'Rescue and Fire Fighting Officer'), 'PKWT'),
('0c811097-6086-465d-87a6-5139ea374f29', 'CE163-1722', 'SIKTUS FENDI SILABAN', (SELECT id FROM positions WHERE name = 'Rescue and Fire Fighting Officer'), 'PKWT'),
('bf9ec426-c3cd-46d0-b286-cd0859d17b0b', 'CE169-1722', 'ZENI ARIS SETIAWAN', (SELECT id FROM positions WHERE name = 'Rescue and Fire Fighting Officer'), 'PKWT'),
('b0135bab-3e78-4096-8b89-7c31b2a2c17a', 'CE151-1722', 'GUNTUR FEBIAN AGAN', (SELECT id FROM positions WHERE name = 'Rescue and Fire Fighting Officer'), 'PKWT'),
('469c67e7-5bbf-4b77-a6b4-c9c84c77e649', 'CE161-1722', 'ROCKY PASARIBU', (SELECT id FROM positions WHERE name = 'Rescue and Fire Fighting Officer'), 'PKWT'),
('da5bc89f-394a-49fc-9d8d-13bc3f912c27', 'CE154-1722', 'JUHALIDI DESKANDAR', (SELECT id FROM positions WHERE name = 'Rescue and Fire Fighting Officer'), 'PKWT'),
('454bc25c-2290-428d-85be-c253f124fe3a', 'CE164-1722', 'SUFRIDANTO SITANGGANG', (SELECT id FROM positions WHERE name = 'Rescue and Fire Fighting Officer'), 'PKWT'),
('5197fda5-8cea-4eaa-8031-7a40c0b95233', 'CE155-1722', 'MEDIYANTO SAFUTRA', (SELECT id FROM positions WHERE name = 'Rescue and Fire Fighting Officer'), 'PKWT');