-- Add poll_name column to poll_ai_insights table
ALTER TABLE poll_ai_insights ADD COLUMN IF NOT EXISTS poll_name TEXT;
