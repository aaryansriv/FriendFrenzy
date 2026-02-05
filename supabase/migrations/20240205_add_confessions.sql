-- Table to store anonymous confessions for a poll
CREATE TABLE IF NOT EXISTS confessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    confession_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_confessions_poll_id ON confessions(poll_id);
