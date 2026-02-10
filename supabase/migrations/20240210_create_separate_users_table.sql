-- Create a new users table specifically for authenticated users
-- This does not replace or modify the existing 'creators' table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Basic RLS for the users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" 
ON users FOR SELECT 
USING (auth.uid()::text = clerk_id OR clerk_id = (select current_setting('request.jwt.claims', true)::json->>'sub'));

CREATE POLICY "Users can update their own profile" 
ON users FOR UPDATE 
USING (auth.uid()::text = clerk_id OR clerk_id = (select current_setting('request.jwt.claims', true)::json->>'sub'));
