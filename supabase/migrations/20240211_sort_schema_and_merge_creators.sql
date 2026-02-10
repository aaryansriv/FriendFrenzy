
-- 1. Ensure poll_ai_reports is linked to polls
-- First, let's make sure all records in poll_ai_reports have a valid poll_id
DELETE FROM public.poll_ai_reports WHERE poll_id NOT IN (SELECT id FROM public.polls);

ALTER TABLE public.poll_ai_reports
ADD CONSTRAINT poll_ai_reports_poll_id_fkey 
FOREIGN KEY (poll_id) REFERENCES public.polls(id) ON DELETE CASCADE;

-- 2. Ensure poll_ai_insights is properly connected (should be already, but for safety)
-- ALTER TABLE public.poll_ai_insights 
-- ADD CONSTRAINT poll_ai_insights_poll_id_fkey 
-- FOREIGN KEY (poll_id) REFERENCES public.polls(id) ON DELETE CASCADE;

-- 3. Connect creators to users table safely
-- A hard Foreign Key (FK) fails if the creator record exists but the user hasn't 
-- completed the sync to the 'users' table yet (common with auth providers).
-- Instead, we ensure creators are linked via logic, but keep the clerk_id field.

-- Let's make sure clerk_id is indexed for fast lookups
CREATE INDEX IF NOT EXISTS creators_clerk_id_idx ON public.creators(clerk_id);

-- 4. Sync name/email from users table to creators table when a user profile is updated
-- This is a better way to "connect" them without breaking creation flow
CREATE OR REPLACE FUNCTION public.sync_creator_from_user()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.creators 
    SET name = COALESCE(NEW.full_name, name),
        email = COALESCE(NEW.email, email)
    WHERE clerk_id = NEW.clerk_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_user_profile_update ON public.users;
CREATE TRIGGER on_user_profile_update
AFTER INSERT OR UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.sync_creator_from_user();

-- 4. Connect creators to polls more strongly (already has FK but we can add cascading delete)
-- ALTER TABLE public.polls 
-- DROP CONSTRAINT IF EXISTS polls_creator_id_fkey,
-- ADD CONSTRAINT polls_creator_id_fkey 
-- FOREIGN KEY (creator_id) REFERENCES public.creators(id) ON DELETE SET NULL;

-- 5. Data Cleanup: Merge duplicate creator records for the same email
-- We want to move all polls from unlinked duplicate creators to the one that has a clerk_id
DO $$
DECLARE
    rec RECORD;
    primary_id UUID;
BEGIN
    FOR rec IN (
        SELECT email, COUNT(*) 
        FROM creators 
        GROUP BY email 
        HAVING COUNT(*) > 1
    ) LOOP
        -- Find the "Primary" creator record for this email (one with a clerk_id)
        SELECT id INTO primary_id 
        FROM creators 
        WHERE email = rec.email AND clerk_id IS NOT NULL 
        LIMIT 1;

        -- If we found a linked record, move all polls from other records with SAME email to this one
        IF primary_id IS NOT NULL THEN
            UPDATE polls 
            SET creator_id = primary_id 
            WHERE creator_id IN (
                SELECT id FROM creators 
                WHERE email = rec.email AND id != primary_id
            );

            -- Delete the now unneeded duplicate creator records
            DELETE FROM creators 
            WHERE email = rec.email AND id != primary_id;
        END IF;
    END LOOP;
END $$;
