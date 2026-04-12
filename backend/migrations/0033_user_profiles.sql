-- =========================================================
-- 0033_USER_PROFILES: Extend Personnel Table for Profiles
-- =========================================================

ALTER TABLE personnels 
    ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20),
    ADD COLUMN IF NOT EXISTS corporate_level VARCHAR(50),
    ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

-- Update comments
COMMENT ON COLUMN personnels.phone_number IS 'Personal contact number for operations';
COMMENT ON COLUMN personnels.corporate_level IS 'Corporate or structural grading (e.g. Grade A, Supervisor, dll)';
COMMENT ON COLUMN personnels.profile_picture_url IS 'Absolute or relative path to the uploaded profile picture chunked chunks';
