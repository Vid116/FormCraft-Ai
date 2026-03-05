-- Forms table
create table if not exists public.forms (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  fields jsonb not null default '[]'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  is_published boolean not null default false,
  response_count integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.forms enable row level security;

-- Authenticated users can view their own forms
create policy "Users can view own forms"
  on public.forms for select
  to authenticated
  using (auth.uid() = user_id);

-- Anonymous users can view published forms
create policy "Anyone can view published forms"
  on public.forms for select
  to anon
  using (is_published = true);

-- Users can create their own forms
create policy "Users can create own forms"
  on public.forms for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Users can update their own forms
create policy "Users can update own forms"
  on public.forms for update
  to authenticated
  using (auth.uid() = user_id);

-- Users can delete their own forms
create policy "Users can delete own forms"
  on public.forms for delete
  to authenticated
  using (auth.uid() = user_id);

-- Indexes
create index if not exists idx_forms_user_id on public.forms(user_id);
create index if not exists idx_forms_is_published on public.forms(is_published);
