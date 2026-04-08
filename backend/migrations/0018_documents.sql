-- Migration: 0018_documents.sql
-- Description: Create documents table for SOPs and Regulations

CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    file_path TEXT,
    category VARCHAR(100) NOT NULL, -- e.g. SOP, REGULATION, MANUAL
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Initial SOPs (PR 30 Tahun 2022 context)
INSERT INTO documents (title, version, file_path, category) VALUES
('SOP Penanggulangan Kebakaran Pesawat Udara', '2022.1', '/uploads/sops/pkp-pu-2022.pdf', 'SOP'),
('Prosedur Tetap Komunikasi Gawat Darurat', '2023.0', '/uploads/sops/comms-emergency.pdf', 'SOP'),
('Pedoman Pemeliharaan Kendaraan Utama PKP-PU', '2021.2', '/uploads/sops/maint-main-vehicle.pdf', 'MANUAL'),
('PR 30 Tahun 2022 tentang Standar Pelayanan ARFF', 'FINAL', '/uploads/regs/pr30_2022.pdf', 'REGULATION');

-- Trigger for updated_at
CREATE TRIGGER trg_documents_updated_at
BEFORE UPDATE ON documents
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_if_changed();
