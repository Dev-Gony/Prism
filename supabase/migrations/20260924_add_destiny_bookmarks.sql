create table if not exists public.destiny_bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  birth_date date not null,
  as_of_date date not null,
  label text not null check (char_length(label) <= 80),
  timing jsonb not null,
  source text not null default 'timeline',
  created_at timestamptz not null default now()
);

create index if not exists destiny_bookmarks_user_created_idx
  on public.destiny_bookmarks(user_id, created_at desc);

create index if not exists destiny_bookmarks_user_birth_idx
  on public.destiny_bookmarks(user_id, birth_date, as_of_date);

alter table public.destiny_bookmarks enable row level security;

revoke all on table public.destiny_bookmarks from anon;
revoke all on table public.destiny_bookmarks from authenticated;
grant select, insert, delete on table public.destiny_bookmarks to authenticated;

drop policy if exists destiny_bookmarks_select_own on public.destiny_bookmarks;
create policy destiny_bookmarks_select_own
on public.destiny_bookmarks
for select
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists destiny_bookmarks_insert_own on public.destiny_bookmarks;
create policy destiny_bookmarks_insert_own
on public.destiny_bookmarks
for insert
to authenticated
with check (user_id = (select auth.uid()));

drop policy if exists destiny_bookmarks_delete_own on public.destiny_bookmarks;
create policy destiny_bookmarks_delete_own
on public.destiny_bookmarks
for delete
to authenticated
using (user_id = (select auth.uid()));
