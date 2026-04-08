-- Create the interviews table in Supabase
-- Run this in the SQL Editor of your Supabase Dashboard

CREATE TABLE IF NOT EXISTS public.interviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL, -- Links to auth.users if using Supabase Auth
    role_title TEXT NOT NULL,
    job_description TEXT,
    resume_text TEXT,
    status TEXT DEFAULT 'completed',
    performance_score FLOAT,
    feedback_json JSONB, -- Stores full interview report
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (RLS)
-- ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;

-- Note: RLS is disabled for now to allow the backend (using Anon Key) to insert/read data without a user session.
-- If you want to enable RLS, you must implement user session forwarding from Frontend to Backend.

-- Create policy to allow users to see their own interviews
-- CREATE POLICY "Users can view their own interviews"
-- ON public.interviews
-- FOR SELECT
-- USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own interviews
-- CREATE POLICY "Users can insert their own interviews"
-- ON public.interviews
-- FOR INSERT
-- WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_interviews_user_id ON public.interviews(user_id);
