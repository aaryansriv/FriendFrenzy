-- Create polls table
CREATE TABLE polls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP DEFAULT now(),
  expires_at TIMESTAMP DEFAULT (now() + interval '7 days'),
  creator_ip TEXT NOT NULL,
  question_set TEXT[] DEFAULT ARRAY['Who will get married first?', 'Who is most likely to drunk-text their ex?', 'Who would survive longest in a zombie apocalypse?', 'Who has the biggest secret?'],
  custom_question TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'expired')),
  CONSTRAINT expires_in_future CHECK (expires_at > created_at)
);

-- Create friends table
CREATE TABLE friends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  CONSTRAINT unique_friend_per_poll UNIQUE (poll_id, name)
);

-- Create votes table
CREATE TABLE votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES friends(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  voter_ip TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  CONSTRAINT one_vote_per_question UNIQUE (poll_id, question, voter_ip),
  CONSTRAINT ensures_friend_in_poll CHECK (
    EXISTS (
      SELECT 1 FROM friends 
      WHERE friends.id = friend_id AND friends.poll_id = poll_id
    )
  )
);

-- Create results table (denormalized for fast queries)
CREATE TABLE results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  friend_id UUID REFERENCES friends(id) ON DELETE CASCADE,
  vote_count INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT now(),
  CONSTRAINT unique_result_per_question_friend UNIQUE (poll_id, question, friend_id)
);

-- Create indexes for performance
CREATE INDEX idx_polls_created_at ON polls(created_at);
CREATE INDEX idx_polls_status ON polls(status);
CREATE INDEX idx_friends_poll_id ON friends(poll_id);
CREATE INDEX idx_votes_poll_id ON votes(poll_id);
CREATE INDEX idx_votes_voter_ip ON votes(voter_ip);
CREATE INDEX idx_results_poll_id ON results(poll_id);
CREATE INDEX idx_results_question ON results(question);

-- Function to clean up expired polls
CREATE OR REPLACE FUNCTION cleanup_expired_polls()
RETURNS void AS $$
BEGIN
  UPDATE polls
  SET status = 'expired'
  WHERE status = 'active' AND expires_at < now();
END;
$$ LANGUAGE plpgsql;
