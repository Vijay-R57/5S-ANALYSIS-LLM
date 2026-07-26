-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Fix RLS permissions for analysis_logs (History page fix)
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Grant SELECT and INSERT privileges on analysis_logs table to anon and authenticated roles
GRANT SELECT, INSERT, UPDATE ON public.analysis_logs TO anon, authenticated, service_role;

-- 2. Ensure RLS is enabled
ALTER TABLE public.analysis_logs ENABLE ROW LEVEL SECURITY;

-- 3. Drop restricted policies that block reading
DROP POLICY IF EXISTS "Anyone can read analysis logs" ON public.analysis_logs;
DROP POLICY IF EXISTS "Supervisors and Admins can read all analysis logs" ON public.analysis_logs;
DROP POLICY IF EXISTS "Workers can read own analysis logs" ON public.analysis_logs;
DROP POLICY IF EXISTS "Anon can read analysis logs" ON public.analysis_logs;
DROP POLICY IF EXISTS "Authenticated can read analysis logs" ON public.analysis_logs;

-- 4. Create clear SELECT policy allowing read access to analysis_logs
CREATE POLICY "Anyone can read analysis logs"
ON public.analysis_logs
FOR SELECT
USING (true);

-- 5. Create clear INSERT policy allowing log saving
DROP POLICY IF EXISTS "Anyone can insert analysis logs" ON public.analysis_logs;
CREATE POLICY "Anyone can insert analysis logs"
ON public.analysis_logs
FOR INSERT
WITH CHECK (true);
