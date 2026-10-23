-- Run before deploying delete-content. The queue is committed in the same
-- transaction as a prompt deletion, including deletions caused by folder CASCADE.
begin;

create table if not exists public.prompt_image_cleanup (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  owner_id uuid,
  created_at timestamptz not null default now(),
  attempts integer not null default 0,
  last_error text
);

alter table public.prompt_image_cleanup enable row level security;
revoke all on public.prompt_image_cleanup from public, anon, authenticated;
grant all on public.prompt_image_cleanup to service_role;
create index if not exists prompt_image_cleanup_owner_idx
  on public.prompt_image_cleanup (owner_id, created_at);

create or replace function public.queue_deleted_prompt_image()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Base64 images disappear with the row; they have no separate file to delete.
  if old.image like 'https://%' then
    insert into public.prompt_image_cleanup (image_url, owner_id)
    values (old.image, old.user_id);
  end if;
  return old;
end;
$$;

revoke all on function public.queue_deleted_prompt_image() from public, anon, authenticated;
drop trigger if exists queue_deleted_prompt_image on public.prompts;
create trigger queue_deleted_prompt_image
  after delete on public.prompts
  for each row execute function public.queue_deleted_prompt_image();

commit;
