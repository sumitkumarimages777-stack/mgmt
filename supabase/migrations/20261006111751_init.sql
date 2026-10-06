-- =====================================================================
-- Management Panel — initial schema
--
-- Concepts
--   profiles      one row per login (admin / staff / external advisor)
--   areas         a "workspace" of work, e.g. "Accounts & Tax", "Legal".
--                 Access is granted per area, so a CA sees only CA areas,
--                 a lawyer only Legal, etc.
--   area_members  who can see an area, and whether they can edit in it
--   filings       statutory filings / compliance items with due dates
--   document_requests  documents someone (usually the CA) has asked for
--   documents     files / links shared inside an area
--   comments      discussion on a filing or a request
--   activity_log  audit trail, written by triggers only
-- =====================================================================

-- ---------- enums ----------
create type public.user_role as enum ('admin', 'staff', 'external');
create type public.area_permission as enum ('view', 'edit');
create type public.filing_status as enum ('pending', 'in_progress', 'filed', 'not_applicable');
create type public.request_status as enum ('open', 'submitted', 'accepted', 'rejected', 'cancelled');

-- ---------- tables ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null default '',
  organization text,
  role public.user_role not null default 'external',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.areas (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  color text not null default '#4f46e5',
  created_at timestamptz not null default now()
);

create table public.area_members (
  area_id uuid not null references public.areas (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  permission public.area_permission not null default 'view',
  created_at timestamptz not null default now(),
  primary key (area_id, user_id)
);
create index area_members_user_idx on public.area_members (user_id);

create table public.filings (
  id uuid primary key default gen_random_uuid(),
  area_id uuid not null references public.areas (id) on delete restrict,
  title text not null,
  form_code text,
  period text not null default '',
  due_date date not null,
  status public.filing_status not null default 'pending',
  filed_on date,
  ack_number text,
  notes text,
  assignee_id uuid references public.profiles (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (area_id, title, period)
);
create index filings_area_due_idx on public.filings (area_id, due_date);
create index filings_assignee_idx on public.filings (assignee_id);
create index filings_created_by_idx on public.filings (created_by);

create table public.document_requests (
  id uuid primary key default gen_random_uuid(),
  area_id uuid not null references public.areas (id) on delete restrict,
  title text not null,
  description text,
  filing_id uuid references public.filings (id) on delete set null,
  status public.request_status not null default 'open',
  due_date date,
  requested_by uuid references public.profiles (id) on delete set null default auth.uid(),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index document_requests_area_idx on public.document_requests (area_id, status);
create index document_requests_filing_idx on public.document_requests (filing_id);
create index document_requests_requested_by_idx on public.document_requests (requested_by);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  area_id uuid not null references public.areas (id) on delete restrict,
  title text not null,
  description text,
  category text,
  storage_path text unique,
  file_name text,
  file_size bigint,
  mime_type text,
  external_url text,
  request_id uuid references public.document_requests (id) on delete set null,
  filing_id uuid references public.filings (id) on delete set null,
  uploaded_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  check (storage_path is not null or external_url is not null)
);
create index documents_area_idx on public.documents (area_id, created_at desc);
create index documents_request_idx on public.documents (request_id);
create index documents_filing_idx on public.documents (filing_id);
create index documents_uploaded_by_idx on public.documents (uploaded_by);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  area_id uuid not null references public.areas (id) on delete cascade,
  request_id uuid references public.document_requests (id) on delete cascade,
  filing_id uuid references public.filings (id) on delete cascade,
  body text not null check (length(trim(body)) > 0),
  author_id uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  check (num_nonnulls(request_id, filing_id) = 1)
);
create index comments_request_idx on public.comments (request_id);
create index comments_filing_idx on public.comments (filing_id);
create index comments_area_idx on public.comments (area_id);
create index comments_author_idx on public.comments (author_id);

create table public.activity_log (
  id bigint generated always as identity primary key,
  area_id uuid references public.areas (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  summary text not null,
  created_at timestamptz not null default now()
);
create index activity_log_area_idx on public.activity_log (area_id, created_at desc);
create index activity_log_actor_idx on public.activity_log (actor_id);

-- ---------- access helpers ----------
-- SECURITY DEFINER so they can read profiles/area_members without
-- recursing into those tables' own RLS policies.
create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin' and is_active
  );
$$;

create function public.can_view_area(p_area uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.is_admin() or exists (
    select 1
    from public.area_members m
    join public.profiles p on p.id = m.user_id
    where m.area_id = p_area and m.user_id = (select auth.uid()) and p.is_active
  );
$$;

create function public.can_edit_area(p_area uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.is_admin() or exists (
    select 1
    from public.area_members m
    join public.profiles p on p.id = m.user_id
    where m.area_id = p_area and m.user_id = (select auth.uid())
      and m.permission = 'edit' and p.is_active
  );
$$;

-- Can the current user see this other person's name? (they share an area)
create function public.shares_area_with(p_user uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.area_members mine
    join public.area_members theirs on theirs.area_id = mine.area_id
    where mine.user_id = (select auth.uid()) and theirs.user_id = p_user
  ) or exists (
    -- everyone may see admins (they create most items)
    select 1 from public.profiles where id = p_user and role = 'admin'
  );
$$;

-- Storage object path is "<area_id>/<file>"; returns null for anything else.
create function public.area_from_path(p_name text) returns uuid
language plpgsql immutable set search_path = '' as $$
begin
  return split_part(p_name, '/', 1)::uuid;
exception when others then
  return null;
end;
$$;

-- ---------- triggers ----------
create function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger filings_updated_at before update on public.filings
  for each row execute function public.set_updated_at();
create trigger document_requests_updated_at before update on public.document_requests
  for each row execute function public.set_updated_at();

-- New auth user -> profile. The very first user becomes admin.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    case when exists (select 1 from public.profiles where role = 'admin')
      then 'external'::public.user_role
      else 'admin'::public.user_role end
  );
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Non-admins may only change their own name.
create function public.guard_profile_update() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.role()) = 'authenticated' and not public.is_admin() then
    if new.role is distinct from old.role
      or new.is_active is distinct from old.is_active
      or new.email is distinct from old.email
      or new.organization is distinct from old.organization then
      raise exception 'Only an admin can change role, status, email or organization';
    end if;
  end if;
  -- never leave the system without an active admin
  if old.role = 'admin' and old.is_active
     and (new.role <> 'admin' or not new.is_active)
     and not exists (
       select 1 from public.profiles
       where role = 'admin' and is_active and id <> old.id
     ) then
    raise exception 'At least one active admin is required';
  end if;
  return new;
end;
$$;

create trigger profiles_guard before update on public.profiles
  for each row execute function public.guard_profile_update();

-- Comments inherit their area from the parent item.
create function public.set_comment_area() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.request_id is not null then
    select area_id into new.area_id from public.document_requests where id = new.request_id;
  else
    select area_id into new.area_id from public.filings where id = new.filing_id;
  end if;
  return new;
end;
$$;

create trigger comments_set_area before insert on public.comments
  for each row execute function public.set_comment_area();

-- Request status bookkeeping.
create function public.request_status_bookkeeping() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.status in ('accepted', 'rejected', 'cancelled') then
    if tg_op = 'INSERT' or old.status is distinct from new.status then
      new.resolved_at := now();
    end if;
  else
    new.resolved_at := null;
  end if;
  return new;
end;
$$;

create trigger document_requests_status before insert or update on public.document_requests
  for each row execute function public.request_status_bookkeeping();

-- Uploading a document against an open/rejected request marks it submitted.
create function public.document_submits_request() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.request_id is not null then
    update public.document_requests
    set status = 'submitted'
    where id = new.request_id and status in ('open', 'rejected');
  end if;
  return new;
end;
$$;

create trigger documents_submit_request after insert on public.documents
  for each row execute function public.document_submits_request();

-- Audit trail.
create function public.log_activity() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  r record;
  v_type text := tg_argv[0];
  v_action text;
  v_summary text;
  v_label text;
begin
  if tg_op = 'DELETE' then r := old; else r := new; end if;

  if v_type = 'filing' then
    v_label := r.title || case when r.period <> '' then ' (' || r.period || ')' else '' end;
  else
    v_label := r.title;
  end if;

  if tg_op = 'INSERT' then
    v_action := 'created';
    v_summary := case v_type
      when 'filing' then 'Added filing ' || v_label
      when 'request' then 'Requested document: ' || v_label
      else 'Shared document: ' || v_label end;
  elsif tg_op = 'DELETE' then
    v_action := 'deleted';
    v_summary := 'Deleted ' || v_type || ': ' || v_label;
  else
    if v_type = 'filing' and old.status is distinct from new.status then
      v_action := 'status';
      v_summary := v_label || ' marked ' || replace(new.status::text, '_', ' ');
    elsif v_type = 'request' and old.status is distinct from new.status then
      v_action := 'status';
      v_summary := 'Request "' || v_label || '" ' || new.status::text;
    else
      v_action := 'updated';
      v_summary := 'Updated ' || v_type || ': ' || v_label;
    end if;
  end if;

  insert into public.activity_log (area_id, actor_id, entity_type, entity_id, action, summary)
  values (r.area_id, (select auth.uid()), v_type, r.id, v_action, v_summary);
  return null;
end;
$$;

create trigger filings_activity after insert or update or delete on public.filings
  for each row execute function public.log_activity('filing');
create trigger document_requests_activity after insert or update or delete on public.document_requests
  for each row execute function public.log_activity('request');
create trigger documents_activity after insert or delete on public.documents
  for each row execute function public.log_activity('document');

-- ---------- row level security ----------
alter table public.profiles enable row level security;
alter table public.areas enable row level security;
alter table public.area_members enable row level security;
alter table public.filings enable row level security;
alter table public.document_requests enable row level security;
alter table public.documents enable row level security;
alter table public.comments enable row level security;
alter table public.activity_log enable row level security;

-- profiles
create policy "profiles: read self, shared-area people, or admin" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or public.is_admin() or public.shares_area_with(id));
create policy "profiles: update self or admin" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) or public.is_admin())
  with check (id = (select auth.uid()) or public.is_admin());

-- areas
create policy "areas: read if member" on public.areas
  for select to authenticated using (public.can_view_area(id));
create policy "areas: admin insert" on public.areas
  for insert to authenticated with check (public.is_admin());
create policy "areas: admin update" on public.areas
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "areas: admin delete" on public.areas
  for delete to authenticated using (public.is_admin());

-- area_members
create policy "area_members: read own or admin" on public.area_members
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());
create policy "area_members: admin insert" on public.area_members
  for insert to authenticated with check (public.is_admin());
create policy "area_members: admin update" on public.area_members
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "area_members: admin delete" on public.area_members
  for delete to authenticated using (public.is_admin());

-- filings
create policy "filings: read" on public.filings
  for select to authenticated using (public.can_view_area(area_id));
create policy "filings: insert" on public.filings
  for insert to authenticated with check (public.can_edit_area(area_id));
create policy "filings: update" on public.filings
  for update to authenticated
  using (public.can_edit_area(area_id)) with check (public.can_edit_area(area_id));
create policy "filings: delete" on public.filings
  for delete to authenticated using (public.is_admin());

-- document_requests
create policy "requests: read" on public.document_requests
  for select to authenticated using (public.can_view_area(area_id));
create policy "requests: insert" on public.document_requests
  for insert to authenticated
  with check (public.can_edit_area(area_id) and requested_by = (select auth.uid()));
create policy "requests: update" on public.document_requests
  for update to authenticated
  using (public.can_edit_area(area_id)) with check (public.can_edit_area(area_id));
create policy "requests: delete" on public.document_requests
  for delete to authenticated
  using (public.is_admin() or (requested_by = (select auth.uid()) and public.can_edit_area(area_id)));

-- documents
create policy "documents: read" on public.documents
  for select to authenticated using (public.can_view_area(area_id));
create policy "documents: insert" on public.documents
  for insert to authenticated
  with check (public.can_edit_area(area_id) and uploaded_by = (select auth.uid()));
create policy "documents: update" on public.documents
  for update to authenticated
  using (public.can_edit_area(area_id)) with check (public.can_edit_area(area_id));
create policy "documents: delete" on public.documents
  for delete to authenticated
  using (public.is_admin() or (uploaded_by = (select auth.uid()) and public.can_edit_area(area_id)));

-- comments (view access is enough to discuss)
create policy "comments: read" on public.comments
  for select to authenticated using (public.can_view_area(area_id));
create policy "comments: insert" on public.comments
  for insert to authenticated
  with check (public.can_view_area(area_id) and author_id = (select auth.uid()));
create policy "comments: delete own or admin" on public.comments
  for delete to authenticated
  using (author_id = (select auth.uid()) or public.is_admin());

-- activity_log (read-only for clients; triggers write it)
create policy "activity: read" on public.activity_log
  for select to authenticated
  using (case when area_id is null then public.is_admin() else public.can_view_area(area_id) end);

-- ---------- storage ----------
insert into storage.buckets (id, name, public, file_size_limit)
values ('documents', 'documents', false, 52428800)
on conflict (id) do nothing;

create policy "documents bucket: read" on storage.objects
  for select to authenticated
  using (bucket_id = 'documents' and public.can_view_area(public.area_from_path(name)));
create policy "documents bucket: upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'documents' and public.can_edit_area(public.area_from_path(name)));
create policy "documents bucket: delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'documents'
    and (public.is_admin() or (owner_id = (select auth.uid())::text
         and public.can_edit_area(public.area_from_path(name))))
  );

-- ---------- starter areas ----------
insert into public.areas (name, description, color) values
  ('Accounts & Tax', 'GST, TDS, Income Tax, advance tax, tax audit — handled with the CA', '#2563eb'),
  ('ROC / MCA', 'Company-law filings with the Registrar of Companies', '#7c3aed'),
  ('Payroll & Labour', 'PF, ESI, professional tax', '#0891b2'),
  ('Legal', 'Contracts, notices, agreements, disputes — for the lawyer', '#b45309');
