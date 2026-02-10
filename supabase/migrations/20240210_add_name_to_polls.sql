-- Add poll_name column to polls table
ALTER TABLE polls ADD COLUMN IF NOT EXISTS poll_name TEXT;

-- Backfill existing polls with creator names if possible
UPDATE polls p
SET poll_name = c.name
FROM creators c
WHERE p.creator_id = c.id AND p.poll_name IS NULL;

-- If still null, use a placeholder
UPDATE polls SET poll_name = 'Unnamed Frenzy' WHERE poll_name IS NULL;

-- Make it NOT NULL for future
ALTER TABLE polls ALTER COLUMN poll_name SET NOT NULL;
