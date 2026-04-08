-- KPI Definitions Table
CREATE TABLE IF NOT EXISTS kpi_definitions (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    unit VARCHAR(20) NOT NULL, -- seconds, percent, count, liters
    threshold_green DECIMAL(12,2) NOT NULL,
    threshold_yellow DECIMAL(12,2) NOT NULL,
    threshold_red DECIMAL(12,2) NOT NULL,
    regulation_ref VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Initial KPIs (ICAO Annex 14 / PR 30/2022)
INSERT INTO kpi_definitions (code, name, unit, threshold_green, threshold_yellow, threshold_red, regulation_ref) 
VALUES 
('RESPONSE_TIME', 'Average Response Time', 'seconds', 180.00, 240.00, 240.01, 'PR 30 Tahun 2022'),
('VEHICLE_READINESS', 'Vehicle Serviceability Rate', 'percent', 95.00, 80.00, 79.99, 'PR 30 Tahun 2022'),
('FOAM_STOCK_RATIO', 'Foam Concentrate Stock Level', 'percent', 100.00, 80.00, 79.99, 'PR 30 Tahun 2022'),
('CERT_COMPLIANCE', 'Personnel Certification Compliance', 'percent', 95.00, 80.00, 79.99, 'PR 30 Tahun 2022'),
('INSPECTION_COMPLETION', 'Daily Inspection Completion Rate', 'percent', 95.00, 80.00, 79.99, 'PR 30 Tahun 2022'),
('APAR_EXPIRY_COMPLIANCE', 'Fire Extinguisher Validity Rate', 'percent', 95.00, 80.00, 79.99, 'PR 30 Tahun 2022')
ON CONFLICT (code) DO NOTHING;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trg_kpi_definitions_updated_at ON kpi_definitions;
CREATE TRIGGER trg_kpi_definitions_updated_at BEFORE UPDATE ON kpi_definitions FOR EACH ROW EXECUTE FUNCTION set_updated_at_if_changed();
