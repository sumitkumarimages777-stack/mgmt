-- =====================================================================
-- Phase 3: Legal module + requests between departments
--
-- A request belongs to the department that handles it (module) and may
-- come from another department (from_module). The person who asked and
-- their department can follow it, see delivered files and comment, even
-- without access to the handling department.
-- =====================================================================

insert into public.permissions (key, module, label, description, supports_own, sort) values
  ('hr.requests', 'hr', 'HR requests', 'Requests to HR, e.g. letters, certificates, onboarding', true, 60),
  ('legal.requests', 'legal', 'Legal requests', 'Requests to Legal, e.g. draft a contract or review an agreement', true, 10),
  ('legal.contracts', 'legal', 'Contracts & agreements', 'Contract register with dates, renewals and signed copies', false, 20),
  ('legal.matters', 'legal', 'Notices & matters', 'Legal notices, disputes, IP and regulatory matters', false, 30);
-- "Own" on requests = may raise requests and follow your own.
update public.permissions set supports_own = true where key = 'ca.requests';

alter table public.document_requests add column from_module text check (from_module in ('ca', 'hr', 'legal'));

-- ---------- legal tables ----------
create table public.contracts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  contract_type text not null default 'Other',
  counterparty text,
  status text not null default 'draft' check (status in ('draft', 'in_review', 'signed', 'expired', 'terminated')),
  start_date date,
  end_date date,
  renewal_notice_days integer check (renewal_notice_days >= 0),
  value numeric(16, 2) check (value >= 0),
  owner_id uuid references public.profiles (id) on delete set null,
  notes text,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date is null or start_date is null or end_date >= start_date)
);
create index contracts_end_date_idx on public.contracts (end_date);
create index contracts_owner_idx on public.contracts (owner_id);
create index contracts_created_by_idx on public.contracts (created_by);

create table public.legal_matters (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  matter_type text not null default 'other'
    check (matter_type in ('notice_received', 'notice_sent', 'litigation', 'ip', 'regulatory', 'other')),
  counterparty text,
  status text not null default 'open' check (status in ('open', 'closed')),
  opened_on date not null default current_date,
  closed_on date,
  next_date date,
  next_action text,
  description text,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index legal_matters_next_date_idx on public.legal_matters (next_date);
create index legal_matters_created_by_idx on public.legal_matters (created_by);

alter table public.documents add column contract_id uuid references public.contracts (id) on delete set null;
alter table public.documents add column matter_id uuid references public.legal_matters (id) on delete set null;
create index documents_contract_idx on public.documents (contract_id);
create index documents_matter_idx on public.documents (matter_id);

-- ---------- helpers ----------
create function public.try_uuid(p text) returns uuid
language plpgsql immutable set search_path = '' as $fn$
begin
  return p::uuid;
exception when others then
  return null;
end;
$fn$;

-- Handler department, the person who asked, or someone who can act for the
-- asking department (edit or above: an intern with view-only doesn't see
-- their department's outgoing requests).
create function public.can_see_request(p_request uuid) returns boolean
language sql stable security definer set search_path = '' as $fn$
  select exists (
    select 1 from public.document_requests r
    where r.id = p_request
      and (public.has_perm(r.module || '.requests', 'view')
           or (r.requested_by = (select auth.uid()) and public.has_any_role())
           or (r.from_module is not null and public.has_perm(r.from_module || '.requests', 'edit')))
  );
$fn$;

-- ---------- request access ----------
alter policy "requests: read" on public.document_requests
  using (public.has_perm(module || '.requests', 'view')
         or (requested_by = (select auth.uid()) and public.has_any_role())
         or (from_module is not null and public.has_perm(from_module || '.requests', 'edit')));
alter policy "requests: insert" on public.document_requests
  with check (requested_by = (select auth.uid())
              and (public.has_perm(module || '.requests', 'own')
                   or (from_module is not null and public.has_perm(from_module || '.requests', 'edit'))));
alter policy "requests: update" on public.document_requests
  using (public.has_perm(module || '.requests', 'edit')
         or (requested_by = (select auth.uid()) and public.has_any_role())
         or (from_module is not null and public.has_perm(from_module || '.requests', 'edit')))
  with check (public.has_perm(module || '.requests', 'edit')
              or (requested_by = (select auth.uid()) and public.has_any_role())
              or (from_module is not null and public.has_perm(from_module || '.requests', 'edit')));

-- Files and comments on a request follow the request.
alter policy "documents: read" on public.documents
  using (public.has_perm(perm_key, 'view')
         or (employee_id is not null and public.has_perm(perm_key, 'own') and public.is_own_employee(employee_id))
         or (request_id is not null and public.can_see_request(request_id)));
alter policy "documents: insert" on public.documents
  with check (uploaded_by = (select auth.uid())
              and (public.has_perm(perm_key, 'edit') or (request_id is not null and public.can_see_request(request_id))));
alter policy "comments: read" on public.comments
  using (public.has_perm(perm_key, 'view') or (request_id is not null and public.can_see_request(request_id)));
alter policy "comments: insert" on public.comments
  with check (author_id = (select auth.uid())
              and (public.has_perm(perm_key, 'view') or (request_id is not null and public.can_see_request(request_id))));

-- Storage: request files live under "requests/<request id>/".
create or replace function public.can_read_object(p_name text) returns boolean
language sql stable security definer set search_path = '' as $fn$
  select exists (
    select 1 from public.documents d
    where d.storage_path = p_name
      and (public.has_perm(d.perm_key, 'view')
           or (d.employee_id is not null and public.has_perm(d.perm_key, 'own') and public.is_own_employee(d.employee_id))
           or (d.request_id is not null and public.can_see_request(d.request_id)))
  );
$fn$;

create or replace function public.can_upload_object(p_name text) returns boolean
language sql stable security definer set search_path = '' as $fn$
  select case
    when split_part(p_name, '/', 1) = 'requests' then
      coalesce(public.can_see_request(public.try_uuid(split_part(p_name, '/', 2))), false)
    else exists (
      select 1 from public.permissions p
      where p.module = split_part(p_name, '/', 1) and public.has_perm(p.key, 'edit')
    )
  end;
$fn$;

-- ---------- legal tables: triggers + RLS ----------
create trigger contracts_updated_at before update on public.contracts
  for each row execute function public.set_updated_at();
create trigger legal_matters_updated_at before update on public.legal_matters
  for each row execute function public.set_updated_at();
create trigger contracts_activity after insert or update or delete on public.contracts
  for each row execute function public.log_record_activity('contract', 'legal.contracts', 'title');
create trigger legal_matters_activity after insert or update or delete on public.legal_matters
  for each row execute function public.log_record_activity('legal_matter', 'legal.matters', 'title');

alter table public.contracts enable row level security;
alter table public.legal_matters enable row level security;

create policy "contracts: read" on public.contracts for select to authenticated
  using (public.has_perm('legal.contracts', 'view'));
create policy "contracts: insert" on public.contracts for insert to authenticated
  with check (public.has_perm('legal.contracts', 'edit'));
create policy "contracts: update" on public.contracts for update to authenticated
  using (public.has_perm('legal.contracts', 'edit')) with check (public.has_perm('legal.contracts', 'edit'));
create policy "contracts: delete" on public.contracts for delete to authenticated
  using (public.has_perm('legal.contracts', 'manage'));

create policy "matters: read" on public.legal_matters for select to authenticated
  using (public.has_perm('legal.matters', 'view'));
create policy "matters: insert" on public.legal_matters for insert to authenticated
  with check (public.has_perm('legal.matters', 'edit'));
create policy "matters: update" on public.legal_matters for update to authenticated
  using (public.has_perm('legal.matters', 'edit')) with check (public.has_perm('legal.matters', 'edit'));
create policy "matters: delete" on public.legal_matters for delete to authenticated
  using (public.has_perm('legal.matters', 'manage'));

-- ---------- function permissions ----------
revoke execute on function public.can_see_request(uuid) from public, anon;
grant execute on function public.can_see_request(uuid) to authenticated;
revoke execute on function public.try_uuid(text) from public, anon;
grant execute on function public.try_uuid(text) to authenticated;

-- ---------- starter roles ----------
insert into public.roles (name, description) values
  ('Lawyer', 'Company lawyer: legal requests, contracts and notices');

insert into public.role_permissions (role_id, permission_key, level)
select r.id, g.key, g.level::public.access_level
from public.roles r
join (values
  ('Lawyer', 'legal.requests', 'edit'), ('Lawyer', 'legal.contracts', 'edit'), ('Lawyer', 'legal.matters', 'edit'),
  ('HR Manager', 'hr.requests', 'manage'), ('HR Manager', 'legal.requests', 'own'),
  ('HR Intern', 'hr.requests', 'view'),
  ('Employee', 'hr.requests', 'own')
) as g(role_name, key, level) on g.role_name = r.name
on conflict (role_id, permission_key) do nothing;
