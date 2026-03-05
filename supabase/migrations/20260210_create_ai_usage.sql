-- AI usage tracking table for quota enforcement
create table if not exists public.ai_usage (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('summary', 'generation')),
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.ai_usage enable row level security;

-- Users can read their own usage
create policy "Users can view own ai usage"
  on public.ai_usage for select
  using (auth.uid() = user_id);

-- Users can insert their own usage (tracked on each AI call)
create policy "Users can insert own ai usage"
  on public.ai_usage for insert
  with check (auth.uid() = user_id);

-- Index for fast monthly lookups
create index if not exists idx_ai_usage_user_month
  on public.ai_usage(user_id, type, created_at);
