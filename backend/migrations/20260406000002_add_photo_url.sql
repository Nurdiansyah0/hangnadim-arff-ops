-- Add photo_url to incidents for visual reporting
ALTER TABLE incidents ADD COLUMN photo_url TEXT;

-- Also add to watchroom_logs just in case we need photos there
ALTER TABLE watchroom_logs ADD COLUMN photo_url TEXT;
