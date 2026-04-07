-- =========================================================
-- Migration: 20260408000005_add_inspection_approval_fields.sql
-- Description: Add approval traceability fields to inspections table
-- =========================================================

ALTER TABLE inspections ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id);
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();