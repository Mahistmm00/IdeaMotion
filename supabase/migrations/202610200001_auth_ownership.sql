-- T03 foundation only. Run once on a new selected development project.
begin;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  approved boolean not null default false,
  preferred_timezone text not null default 'UTC' check (length(preferred_timezone) between 1 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create function public.create_profile() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  -- Never copy approval or roles from user-controlled auth metadata.
  insert into public.profiles(id) values (new.id);
  return new;
end;
$$;
revoke all on function public.create_profile() from public, anon, authenticated;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.create_profile();

-- Existing identities are not automatically approved.
insert into public.profiles(id) select id from auth.users on conflict (id) do nothing;

create function public.validate_profile_update() returns trigger language plpgsql set search_path = '' as $$
begin
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = new.preferred_timezone) then
    raise exception 'Invalid time zone' using errcode = '23514';
  end if;
  new.updated_at = now();
  return new;
end;
$$;
revoke all on function public.validate_profile_update() from public, anon, authenticated;
create trigger validate_profile_update before update on public.profiles for each row execute function public.validate_profile_update();

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id),
  title text not null check (length(btrim(title)) between 1 and 120),
  brief jsonb not null check (jsonb_typeof(brief) = 'object' and octet_length(brief::text) <= 16384),
  draft_plan jsonb check (draft_plan is null or (jsonb_typeof(draft_plan) = 'object' and octet_length(draft_plan::text) <= 131072)),
  draft_revision integer not null default 0 check (draft_revision >= 0),
  approved_version_id uuid,
  last_stage text not null default 'idea' check (last_stage in ('idea','plan','video','publish')),
  deletion_requested_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, owner_id)
);
create index projects_owner_updated_idx on public.projects(owner_id, updated_at desc);

create table public.project_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null,
  owner_id uuid not null,
  version_number integer not null check (version_number > 0),
  schema_version integer not null check (schema_version = 1),
  content jsonb not null check (jsonb_typeof(content) = 'object' and octet_length(content::text) <= 131072),
  content_hash text not null check (content_hash ~ '^[a-f0-9]{64}$'),
  approved_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(project_id, version_number),
  unique(id, project_id, owner_id),
  foreign key (project_id, owner_id) references public.projects(id, owner_id)
);
create index project_versions_project_owner_idx on public.project_versions(project_id, owner_id);
alter table public.projects add constraint projects_approved_version_fk foreign key (approved_version_id, id, owner_id) references public.project_versions(id, project_id, owner_id);

create function public.reject_approved_version_change() returns trigger language plpgsql set search_path = '' as $$
begin
  raise exception 'Approved content is immutable' using errcode = '23514';
end;
$$;
revoke all on function public.reject_approved_version_change() from public, anon, authenticated;
create trigger immutable_approved_version before update or delete on public.project_versions for each row execute function public.reject_approved_version_change();

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_versions enable row level security;
revoke all on public.profiles, public.projects, public.project_versions from public, anon, authenticated;
grant select on public.profiles, public.projects, public.project_versions to authenticated;
grant update(preferred_timezone) on public.profiles to authenticated;
grant all on public.profiles, public.projects, public.project_versions to service_role;
create policy profiles_read_own on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy profiles_timezone_own on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy projects_read_own on public.projects for select to authenticated using (owner_id = (select auth.uid()) and deletion_requested_at is null);
create policy versions_read_own on public.project_versions for select to authenticated using (
  owner_id = (select auth.uid()) and exists (select 1 from public.projects p where p.id = project_versions.project_id and p.owner_id = project_versions.owner_id and p.deletion_requested_at is null)
);
-- Browser writes to authoritative project/version state are intentionally absent.

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('creator-media', 'creator-media', false, 52428800, array['video/mp4','audio/mpeg','audio/wav','application/json','image/png']);
-- Restrictive defense applies even if a permissive policy is later added by mistake.
-- No direct browser Storage operations are needed yet. T05 adds scoped signed access.
create policy creator_media_browser_deny on storage.objects as restrictive for all to anon, authenticated
using (bucket_id <> 'creator-media') with check (bucket_id <> 'creator-media');

commit;
