-- =========================================================
-- 0037_ADD_LEAVE_QUOTA: Add leave tracking to personnel
-- =========================================================

ALTER TABLE personnels 
    ADD COLUMN IF NOT EXISTS remaining_leave INTEGER DEFAULT 12,
    ADD COLUMN IF NOT EXISTS annual_leave_quota INTEGER DEFAULT 12;

COMMENT ON COLUMN personnels.remaining_leave IS 'Current available leave balance';
COMMENT ON COLUMN personnels.annual_leave_quota IS 'Total yearly leave entitlement';
