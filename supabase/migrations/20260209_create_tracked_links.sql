-- Tracked links table for parameterized survey URLs
create table if not exists public.tracked_links (
  id uuid default gen_random_uuid() primary key,
  short_code text not null,
  form_id uuid not null references public.forms(id) on delete cascade,
  params jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.tracked_links enable row level security;

-- Public can read tracked links (needed for resolving short codes)
create policy "Public can read tracked links"
  on public.tracked_links for select
  using (true);

-- Form owners can create tracked links
create policy "Form owners can create tracked links"
  on public.tracked_links for insert
  with check (
    exists (
      select 1 from forms
      where forms.id = tracked_links.form_id
      and forms.user_id = auth.uid()
    )
  );

-- Indexes
create unique index if not exists idx_tracked_links_short_code on public.tracked_links(short_code);
create index if not exists idx_tracked_links_form_id on public.tracked_links(form_id);
