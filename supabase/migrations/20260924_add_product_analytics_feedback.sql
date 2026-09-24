create table if not exists public.product_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null check (
    event_name in (
      'landing_view',
      'quick_started',
      'quick_completed',
      'detailed_opened',
      'detailed_completed',
      'save_clicked',
      'result_saved',
      'ask_prism_used',
      'share_card_created',
      'upgrade_detailed',
      'feedback_submitted'
    )
  ),
  session_id uuid not null,
  user_id uuid null references auth.users(id) on delete set null,
  analysis_type text null check (analysis_type in ('quick','detailed')),
  source text not null default 'web',
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists product_events_created_at_idx
  on public.product_events(created_at desc);
create index if not exists product_events_event_name_created_at_idx
  on public.product_events(event_name, created_at desc);
create index if not exists product_events_session_id_idx
  on public.product_events(session_id);
create index if not exists product_events_user_id_idx
  on public.product_events(user_id)
  where user_id is not null;

alter table public.product_events enable row level security;

revoke all on table public.product_events from anon, authenticated;
grant insert on table public.product_events to anon, authenticated;

drop policy if exists product_events_insert_anon on public.product_events;
create policy product_events_insert_anon
on public.product_events
for insert
to anon
with check (user_id is null);

drop policy if exists product_events_insert_authenticated on public.product_events;
create policy product_events_insert_authenticated
on public.product_events
for insert
to authenticated
with check (user_id = (select auth.uid()));

create table if not exists public.product_feedback (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  user_id uuid null references auth.users(id) on delete set null,
  report_id uuid null references public.analysis_results(id) on delete set null,
  analysis_type text null check (analysis_type in ('quick','detailed')),
  helpful boolean not null,
  reason text null check (char_length(reason) <= 500),
  created_at timestamptz not null default now()
);

create index if not exists product_feedback_created_at_idx
  on public.product_feedback(created_at desc);
create index if not exists product_feedback_report_id_idx
  on public.product_feedback(report_id)
  where report_id is not null;
create index if not exists product_feedback_user_id_idx
  on public.product_feedback(user_id)
  where user_id is not null;

alter table public.product_feedback enable row level security;

revoke all on table public.product_feedback from anon, authenticated;
grant insert on table public.product_feedback to anon, authenticated;

drop policy if exists product_feedback_insert_anon on public.product_feedback;
create policy product_feedback_insert_anon
on public.product_feedback
for insert
to anon
with check (user_id is null and report_id is null);

drop policy if exists product_feedback_insert_authenticated on public.product_feedback;
create policy product_feedback_insert_authenticated
on public.product_feedback
for insert
to authenticated
with check (user_id = (select auth.uid()));
