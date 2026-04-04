-- Add up migration script here
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

INSERt INTO roles (name) VALUES 
('Manager ARFF'),
('Team Leader Shift'),
('Team Leader Performance'),
('Team Leader Maintenance'),
('Watchroom'),
('Firefighter'),
('Admin');

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    nik VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT NOT NULL REFERENCES roles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Menambahkan akun Admin default (password: admin123, tapi pastikan ini bcrypt hash di production)
-- Kita akan menggunakan hash bcrypt untuk 'admin123'
-- Hash bcrypt untuk 'admin123' adalah $2b$12$N9u3Pj5T8H8s6ZJ1C6W4POnT.h/F6N0q05iBxDqJ5gXJ2O8N73V9u
-- Role Admin memiliki ID 7
INSERT INTO users (id, name, nik, email, password_hash, role_id)
VALUES (
    uuid_generate_v4(),
    'Super Admin',
    'admin123',
    'admin@arff.hangnadim.id',
    '$2b$12$N9u3Pj5T8H8s6ZJ1C6W4POnT.h/F6N0q05iBxDqJ5gXJ2O8N73V9u',
    7
);
