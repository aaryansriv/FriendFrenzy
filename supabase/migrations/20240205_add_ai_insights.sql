-- Table to store AI-generated insights for polls
CREATE TABLE IF NOT EXISTS poll_ai_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    insights JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(poll_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_poll_ai_insights_poll_id ON poll_ai_insights(poll_id);
