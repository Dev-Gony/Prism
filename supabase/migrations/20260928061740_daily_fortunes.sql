create table if not exists public.daily_fortunes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_analysis_id uuid not null references public.analysis_results(id) on delete cascade,
  fortune_date date not null,
  fortune jsonb not null check (jsonb_typeof(fortune) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, fortune_date)
);

create index if not exists daily_fortunes_user_date_idx
  on public.daily_fortunes(user_id, fortune_date desc);

alter table public.daily_fortunes enable row level security;

revoke all on table public.daily_fortunes from anon;
revoke all on table public.daily_fortunes from authenticated;
grant select on table public.daily_fortunes to authenticated;

drop policy if exists daily_fortunes_select_own on public.daily_fortunes;
create policy daily_fortunes_select_own
on public.daily_fortunes
for select
to authenticated
using (user_id = (select auth.uid()));
