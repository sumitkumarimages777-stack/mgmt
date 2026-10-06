-- =====================================================================
-- Switch access from areas to roles + permissions (Phase 1).
-- Run once in Supabase → SQL Editor. Everything runs in one transaction:
-- if any statement fails, nothing changes.
-- =====================================================================
begin;

-- ---------- 1. old area-based access rules ----------
drop policy "activity: read" on public.activity_log;
drop policy "comments: delete own or admin" on public.comments;
drop policy "comments: insert" on public.comments;
drop policy "comments: read" on public.comments;
drop policy "requests: delete" on public.document_requests;
drop policy "requests: insert" on public.document_requests;
drop policy "requests: read" on public.document_requests;
drop policy "requests: update" on public.document_requests;
drop policy "documents: delete" on public.documents;
drop policy "documents: insert" on public.documents;
drop policy "documents: read" on public.documents;
drop policy "documents: update" on public.documents;
drop policy "filings: delete" on public.filings;
drop policy "filings: insert" on public.filings;
drop policy "filings: read" on public.filings;
drop policy "filings: update" on public.filings;
drop policy "profiles: read self, shared-area people, or admin" on public.profiles;
drop policy "documents bucket: delete" on storage.objects;
drop policy "documents bucket: read" on storage.objects;
drop policy "documents bucket: upload" on storage.objects;

-- ---------- 2. tables: area - module / category / permission key ----------
alter table public.filings add column category text not null default 'Other';
alter table public.filings drop constraint filings_area_id_title_period_key;
alter table public.filings drop column area_id;
alter table public.filings add constraint filings_title_period_key unique (title, period);
create index filings_due_idx on public.filings (due_date);

alter table public.document_requests add column module text not null default 'ca'
  check (module in ('ca', 'hr', 'legal'));
alter table public.document_requests drop column area_id;
create index document_requests_module_idx on public.document_requests (module, status);

alter table public.documents add column module text not null default 'ca';
alter table public.documents add column feature text not null default 'documents';
update public.documents set feature = case
  when request_id is not null then 'requests' when filing_id is not null then 'filings' else 'documents' end;
alter table public.documents add column perm_key text generated always as (module || '.' || feature) stored
  references public.permissions (key);
alter table public.documents drop column area_id;
create index documents_perm_key_idx on public.documents (perm_key, created_at desc);

alter table public.comments add column perm_key text references public.permissions (key);
update public.comments set perm_key = case when request_id is not null then 'ca.requests' else 'ca.filings' end;
alter table public.comments alter column perm_key set not null;
alter table public.comments drop column area_id;
create index comments_perm_key_idx on public.comments (perm_key);

alter table public.activity_log add column perm_key text references public.permissions (key) on delete cascade;
update public.activity_log set perm_key = case entity_type
  when 'filing' then 'ca.filings' when 'request' then 'ca.requests' else 'ca.documents' end;
alter table public.activity_log drop column area_id;
create index activity_log_perm_key_idx on public.activity_log (perm_key, created_at desc);

drop table public.area_members;
drop table public.areas;
drop function public.can_view_area(uuid);
drop function public.can_edit_area(uuid);
drop function public.shares_area_with(uuid);
drop function public.area_from_path(text);

-- ---------- 3. triggers ----------
drop trigger comments_set_area on public.comments;
drop function public.set_comment_area();

create function public.set_comment_perm_key() returns trigger
language plpgsql security definer set search_path = '' as $fn$
begin
  if new.request_id is not null then
    select module || '.requests' into new.perm_key from public.document_requests where id = new.request_id;
  else
    new.perm_key := 'ca.filings';
  end if;
  return new;
end;
$fn$;
create trigger comments_set_perm_key before insert on public.comments
  for each row execute function public.set_comment_perm_key();

create or replace function public.log_activity() returns trigger
language plpgsql security definer set search_path = '' as $fn$
declare
  r record;
  v_type text := tg_argv[0];
  v_key text;
  v_label text;
  v_action text;
  v_summary text;
begin
  if tg_op = 'DELETE' then r := old; else r := new; end if;
  -- (if/else, not CASE: PL/pgSQL would resolve r.module even for a filing row)
  if v_type = 'filing' then
    v_key := 'ca.filings';
    v_label := r.title || case when r.period <> '' then ' (' || r.period || ')' else '' end;
  elsif v_type = 'request' then
    v_key := r.module || '.requests';
    v_label := r.title;
  else
    v_key := r.perm_key;
    v_label := r.title;
  end if;

  if tg_op = 'INSERT' then
    v_action := 'created';
    v_summary := case v_type when 'filing' then 'Added filing ' when 'request' then 'Requested document: '
      else 'Shared document: ' end || v_label;
  elsif tg_op = 'DELETE' then
    v_action := 'deleted';
    v_summary := 'Deleted ' || v_type || ': ' || v_label;
  elsif v_type = 'filing' and old.status is distinct from new.status then
    v_action := 'status';
    v_summary := v_label || ' marked ' || replace(new.status::text, '_', ' ');
  elsif v_type = 'request' and old.status is distinct from new.status then
    v_action := 'status';
    v_summary := 'Request ' || v_label || ': ' || new.status::text;
  else
    v_action := 'updated';
    v_summary := 'Updated ' || v_type || ': ' || v_label;
  end if;

  insert into public.activity_log (perm_key, actor_id, entity_type, entity_id, action, summary)
  values (v_key, (select auth.uid()), v_type, r.id, v_action, v_summary);
  return null;
end;
$fn$;

-- ---------- 4. people: profile role column - roles ----------
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $fn$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  -- The very first person becomes Admin.
  if not exists (select 1 from public.user_roles ur join public.roles r on r.id = ur.role_id where r.is_superuser) then
    insert into public.user_roles (user_id, role_id) select new.id, id from public.roles where is_superuser;
  end if;
  return new;
end;
$fn$;

create function public.active_admin_count_excluding(p_user uuid) returns int
language sql stable security definer set search_path = '' as $fn$
  select count(distinct p.id)::int from public.profiles p
  join public.user_roles ur on ur.user_id = p.id
  join public.roles r on r.id = ur.role_id
  where r.is_superuser and p.is_active and p.id <> p_user;
$fn$;

create or replace function public.guard_profile_update() returns trigger
language plpgsql security definer set search_path = '' as $fn$
begin
  if (select auth.role()) = 'authenticated' and not public.is_admin() then
    if new.is_active is distinct from old.is_active
      or new.email is distinct from old.email
      or new.organization is distinct from old.organization then
      raise exception 'Only an admin can change status, email or organization';
    end if;
  end if;
  if old.is_active and not new.is_active
     and exists (select 1 from public.user_roles ur join public.roles r on r.id = ur.role_id
                 where ur.user_id = old.id and r.is_superuser)
     and public.active_admin_count_excluding(old.id) = 0 then
    raise exception 'At least one active admin is required';
  end if;
  return new;
end;
$fn$;

create function public.guard_last_admin_role() returns trigger
language plpgsql security definer set search_path = '' as $fn$
begin
  if exists (select 1 from public.roles where id = old.role_id and is_superuser)
     and exists (select 1 from public.profiles where id = old.user_id and is_active)
     and public.active_admin_count_excluding(old.user_id) = 0 then
    raise exception 'At least one active admin is required';
  end if;
  return old;
end;
$fn$;
create trigger user_roles_guard_last_admin before delete on public.user_roles
  for each row execute function public.guard_last_admin_role();

create or replace function public.setup_required() returns boolean
language sql stable security definer set search_path = '' as $fn$
  select not exists (select 1 from public.user_roles ur join public.roles r on r.id = ur.role_id where r.is_superuser);
$fn$;

alter table public.profiles drop column role;
drop type public.user_role;

-- ---------- 5. new access rules (permission based) ----------
create function public.has_any_role() returns boolean
language sql stable security definer set search_path = '' as $fn$
  select exists (
    select 1 from public.user_roles ur join public.profiles p on p.id = ur.user_id
    where ur.user_id = (select auth.uid()) and p.is_active
  );
$fn$;

create policy "profiles: read" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.has_any_role());

create policy "filings: read" on public.filings for select to authenticated
  using (public.has_perm('ca.filings', 'view'));
create policy "filings: insert" on public.filings for insert to authenticated
  with check (public.has_perm('ca.filings', 'edit'));
create policy "filings: update" on public.filings for update to authenticated
  using (public.has_perm('ca.filings', 'edit')) with check (public.has_perm('ca.filings', 'edit'));
create policy "filings: delete" on public.filings for delete to authenticated
  using (public.has_perm('ca.filings', 'manage'));

create policy "requests: read" on public.document_requests for select to authenticated
  using (public.has_perm(module || '.requests', 'view'));
create policy "requests: insert" on public.document_requests for insert to authenticated
  with check (public.has_perm(module || '.requests', 'edit') and requested_by = (select auth.uid()));
create policy "requests: update" on public.document_requests for update to authenticated
  using (public.has_perm(module || '.requests', 'edit')) with check (public.has_perm(module || '.requests', 'edit'));
create policy "requests: delete" on public.document_requests for delete to authenticated
  using (public.has_perm(module || '.requests', 'manage')
         or (requested_by = (select auth.uid()) and public.has_perm(module || '.requests', 'edit')));

create policy "documents: read" on public.documents for select to authenticated
  using (public.has_perm(perm_key, 'view'));
create policy "documents: insert" on public.documents for insert to authenticated
  with check (public.has_perm(perm_key, 'edit') and uploaded_by = (select auth.uid()));
create policy "documents: update" on public.documents for update to authenticated
  using (public.has_perm(perm_key, 'edit')) with check (public.has_perm(perm_key, 'edit'));
create policy "documents: delete" on public.documents for delete to authenticated
  using (public.has_perm(perm_key, 'manage') or (uploaded_by = (select auth.uid()) and public.has_perm(perm_key, 'edit')));

create policy "comments: read" on public.comments for select to authenticated
  using (public.has_perm(perm_key, 'view'));
create policy "comments: insert" on public.comments for insert to authenticated
  with check (public.has_perm(perm_key, 'view') and author_id = (select auth.uid()));
create policy "comments: delete own or admin" on public.comments for delete to authenticated
  using (author_id = (select auth.uid()) or public.is_admin());

create policy "activity: read" on public.activity_log for select to authenticated
  using (case when perm_key is null then public.is_admin() else public.has_perm(perm_key, 'view') end);

-- Files: readable if the matching document row is, uploads go under module/.
create function public.can_read_object(p_name text) returns boolean
language sql stable security definer set search_path = '' as $fn$
  select exists (select 1 from public.documents d where d.storage_path = p_name and public.has_perm(d.perm_key, 'view'));
$fn$;
create function public.can_upload_object(p_name text) returns boolean
language sql stable security definer set search_path = '' as $fn$
  select exists (
    select 1 from public.permissions p
    where p.module = split_part(p_name, '/', 1) and public.has_perm(p.key, 'edit')
  );
$fn$;

create policy "documents bucket: read" on storage.objects for select to authenticated
  using (bucket_id = 'documents' and public.can_read_object(name));
create policy "documents bucket: upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'documents' and public.can_upload_object(name));
create policy "documents bucket: delete" on storage.objects for delete to authenticated
  using (bucket_id = 'documents'
         and (public.is_admin() or (owner_id = (select auth.uid())::text and public.can_upload_object(name))));

-- ---------- 6. function permissions ----------
revoke execute on function public.set_comment_perm_key() from public, anon, authenticated;
revoke execute on function public.log_activity() from public, anon, authenticated;
revoke execute on function public.active_admin_count_excluding(uuid) from public, anon, authenticated;
revoke execute on function public.guard_last_admin_role() from public, anon, authenticated;
revoke execute on function public.has_any_role() from public, anon;
revoke execute on function public.can_read_object(text) from public, anon;
revoke execute on function public.can_upload_object(text) from public, anon;
grant execute on function public.has_any_role() to authenticated;
grant execute on function public.can_read_object(text) to authenticated;
grant execute on function public.can_upload_object(text) to authenticated;

-- Record this migration so the history matches the repo.
insert into supabase_migrations.schema_migrations (version, name)
values ('20261006130000', 'access_by_roles');

commit;
