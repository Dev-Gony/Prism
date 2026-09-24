alter table public.analysis_results
  add column if not exists destiny_timing jsonb null;
