CREATE EXTENSION IF NOT EXISTS pgcrypto; 
UPDATE users SET password_hash = crypt('admin123', gen_salt('bf', 12)) WHERE nik = 'admin123';
