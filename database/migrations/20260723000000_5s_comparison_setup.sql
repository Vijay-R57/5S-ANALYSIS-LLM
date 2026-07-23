-- ─────────────────────────────────────────────────────────────────────────────
-- ARCOLAB 5S Comparison & Lean Maintenance — Database Migration
-- ─────────────────────────────────────────────────────────────────────────────
-- Idempotent, non-destructive migration ensuring analysis_logs table has all
-- required columns, indexes, and defaults for 5S Comparison audit records.

ALTER TABLE public.analysis_logs 
  ADD COLUMN IF NOT EXISTS overall_score_before INTEGER,
  ADD COLUMN IF NOT EXISTS overall_score_after INTEGER,
  ADD COLUMN IF NOT EXISTS lean_maintenance_score INTEGER,
  ADD COLUMN IF NOT EXISTS scoring_method TEXT DEFAULT 'Gemini Vision';

ALTER TABLE public.analysis_logs 
  ALTER COLUMN scoring_method SET DEFAULT 'Gemini Vision';

-- Performance indexes for querying audit logs by date and employee
CREATE INDEX IF NOT EXISTS idx_analysis_logs_date ON public.analysis_logs (analysis_date DESC);
CREATE INDEX IF NOT EXISTS idx_analysis_logs_emp ON public.analysis_logs (employee_id);

COMMENT ON TABLE public.analysis_logs IS 'Stores 5S Audit and 5S Comparison audit records.';
