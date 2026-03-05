-- Function to increment form response count (called from submit endpoint)
create or replace function public.increment_response_count(form_id_input uuid)
returns void
language plpgsql
security definer
set search_path to ''
as $$
begin
  update public.forms
  set response_count = response_count + 1
  where id = form_id_input;
end;
$$;

-- Trigger function to auto-update updated_at timestamp
create or replace function public.update_updated_at()
returns trigger
language plpgsql
set search_path to ''
as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$;

-- Attach trigger to forms table
create trigger forms_updated_at
  before update on public.forms
  for each row
  execute function public.update_updated_at();
