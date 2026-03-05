-- Responses table
create table if not exists public.responses (
  id uuid default gen_random_uuid() primary key,
  form_id uuid not null references public.forms(id) on delete cascade,
  answers jsonb not null default '{}'::jsonb,
  submitted_at timestamptz default now(),
  metadata jsonb
);

-- Enable RLS
alter table public.responses enable row level security;

-- Anyone can submit to published forms
create policy "Anyone can submit to published forms"
  on public.responses for insert
  to anon, authenticated
  with check (
    exists (
      select 1 from forms
      where forms.id = responses.form_id
      and forms.is_published = true
    )
  );

-- Form owners can view responses
create policy "Form owners can view responses"
  on public.responses for select
  to authenticated
  using (
    exists (
      select 1 from forms
      where forms.id = responses.form_id
      and forms.user_id = auth.uid()
    )
  );

-- Indexes
create index if not exists idx_responses_form_id on public.responses(form_id);
create index if not exists idx_responses_submitted_at on public.responses(submitted_at desc);
