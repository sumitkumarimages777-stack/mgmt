-- =====================================================================
-- Phase 2: HR module
-- Team members, payroll and salary history, equipment, ESOP grants and
-- HR documents. Every HR feature supports the "own" level, so an
-- Employee role can see only their own record.
-- =====================================================================

insert into public.permissions (key, module, label, description, supports_own, sort) values
  ('hr.team', 'hr', 'Team members', 'Employee details: designation, department, contact, joining and exit', true, 10),
  ('hr.compensation', 'hr', 'Salary & payroll', 'Salary history, PAN, UAN and bank details', true, 20),
  ('hr.documents', 'hr', 'Contracts & documents', 'Offer letters, contracts, ID proofs and other HR documents', true, 30),
  ('hr.equipment', 'hr', 'Equipment', 'Company equipment and who has it', true, 40),
  ('hr.esop', 'hr', 'ESOPs', 'Option grants and vesting', true, 50);

-- ---------- tables ----------
create table public.employees (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles (id) on delete set null, -- their login, if any
  employee_code text unique,
  full_name text not null,
  work_email text,
  personal_email text,
  phone text,
  designation text,
  department text,
  employment_type text not null default 'full_time'
    check (employment_type in ('full_time', 'part_time', 'intern', 'contractor', 'consultant')),
  status text not null default 'active' check (status in ('active', 'on_notice', 'exited')),
  date_of_joining date,
  date_of_exit date,
  manager_id uuid references public.employees (id) on delete set null,
  date_of_birth date,
  address text,
  emergency_contact text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index employees_manager_idx on public.employees (manager_id);
create index employees_status_idx on public.employees (status);

create table public.employee_payroll (
  employee_id uuid primary key references public.employees (id) on delete cascade,
  pan text,
  uan text,
  bank_name text,
  bank_account text,
  ifsc text,
  updated_at timestamptz not null default now()
);

create table public.salary_revisions (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  effective_from date not null,
  annual_ctc numeric(14, 2) not null check (annual_ctc >= 0),
  monthly_gross numeric(14, 2) check (monthly_gross >= 0),
  notes text,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create index salary_revisions_employee_idx on public.salary_revisions (employee_id, effective_from desc);
create index salary_revisions_created_by_idx on public.salary_revisions (created_by);

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'Laptop',
  serial_number text,
  purchase_date date,
  cost numeric(14, 2) check (cost >= 0),
  status text not null default 'available' check (status in ('available', 'assigned', 'repair', 'retired')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.asset_assignments (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.assets (id) on delete cascade,
  employee_id uuid not null references public.employees (id) on delete cascade,
  assigned_on date not null default current_date,
  returned_on date,
  condition_out text,
  condition_in text,
  notes text,
  created_at timestamptz not null default now(),
  check (returned_on is null or returned_on >= assigned_on)
);
create unique index asset_assignments_one_open on public.asset_assignments (asset_id) where returned_on is null;
create index asset_assignments_employee_idx on public.asset_assignments (employee_id);

create table public.esop_grants (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  grant_date date not null,
  options integer not null check (options > 0),
  exercise_price numeric(14, 4) not null default 0 check (exercise_price >= 0),
  vesting_start date not null,
  vesting_months integer not null default 48 check (vesting_months > 0),
  cliff_months integer not null default 12 check (cliff_months >= 0 and cliff_months <= vesting_months),
  vesting_frequency text not null default 'monthly' check (vesting_frequency in ('monthly', 'quarterly', 'yearly')),
  status text not null default 'active' check (status in ('active', 'cancelled')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index esop_grants_employee_idx on public.esop_grants (employee_id);

alter table public.documents add column employee_id uuid references public.employees (id) on delete set null;
create index documents_employee_idx on public.documents (employee_id);

-- ---------- helpers ----------
-- Is this employee record the signed-in person?
create function public.is_own_employee(p_employee uuid) returns boolean
language sql stable security definer set search_path = '' as $fn$
  select exists (select 1 from public.employees where id = p_employee and profile_id = (select auth.uid()));
$fn$;

-- Full access to the feature, or "own" access and the row is about yourself.
create function public.can_see_employee_item(p_key text, p_employee uuid) returns boolean
language sql stable security definer set search_path = '' as $fn$
  select public.has_perm(p_key, 'view') or (public.has_perm(p_key, 'own') and public.is_own_employee(p_employee));
$fn$;

-- Any HR feature at this level (lets e.g. equipment managers see employee names).
create function public.has_module_perm(p_module text, p_min public.access_level) returns boolean
language sql stable security definer set search_path = '' as $fn$
  select exists (select 1 from public.permissions p where p.module = p_module and public.has_perm(p.key, p_min));
$fn$;

-- ---------- triggers ----------
create trigger employees_updated_at before update on public.employees
  for each row execute function public.set_updated_at();
create trigger assets_updated_at before update on public.assets
  for each row execute function public.set_updated_at();
create trigger esop_grants_updated_at before update on public.esop_grants
  for each row execute function public.set_updated_at();

create function public.touch_payroll_updated_at() returns trigger
language plpgsql set search_path = '' as $fn$
begin
  new.updated_at := now();
  return new;
end;
$fn$;
create trigger employee_payroll_updated_at before update on public.employee_payroll
  for each row execute function public.touch_payroll_updated_at();

-- Keep the asset status in step with its assignments.
create function public.sync_asset_status() returns trigger
language plpgsql security definer set search_path = '' as $fn$
begin
  update public.assets a set status = case
    when exists (select 1 from public.asset_assignments x where x.asset_id = a.id and x.returned_on is null) then 'assigned'
    when a.status = 'assigned' then 'available'
    else a.status end
  where a.id = coalesce(new.asset_id, old.asset_id);
  return null;
end;
$fn$;
create trigger asset_assignments_sync after insert or update or delete on public.asset_assignments
  for each row execute function public.sync_asset_status();

-- Generic audit entry. Arguments: entity type, permission key, label column.
create function public.log_record_activity() returns trigger
language plpgsql security definer set search_path = '' as $fn$
declare
  r jsonb;
  v_label text;
  v_name text;
  v_action text;
begin
  if tg_op = 'DELETE' then r := to_jsonb(old); else r := to_jsonb(new); end if;
  v_label := coalesce(r ->> tg_argv[2], '');
  if r ? 'employee_id' then
    select full_name into v_name from public.employees where id = (r ->> 'employee_id')::uuid;
    if v_name is not null then v_label := trim(v_label || ' for ' || v_name); end if;
  end if;
  v_action := case tg_op when 'INSERT' then 'created' when 'DELETE' then 'deleted' else 'updated' end;
  insert into public.activity_log (perm_key, actor_id, entity_type, entity_id, action, summary)
  values (tg_argv[1], (select auth.uid()), tg_argv[0], (r ->> 'id')::uuid, v_action,
          initcap(v_action) || ' ' || replace(tg_argv[0], '_', ' ') || ': ' || v_label);
  return null;
end;
$fn$;

create trigger employees_activity after insert or update or delete on public.employees
  for each row execute function public.log_record_activity('employee', 'hr.team', 'full_name');
create trigger salary_revisions_activity after insert or update or delete on public.salary_revisions
  for each row execute function public.log_record_activity('salary_revision', 'hr.compensation', 'effective_from');
create trigger assets_activity after insert or delete on public.assets
  for each row execute function public.log_record_activity('asset', 'hr.equipment', 'name');
create trigger asset_assignments_activity after insert or update on public.asset_assignments
  for each row execute function public.log_record_activity('equipment_assignment', 'hr.equipment', 'assigned_on');
create trigger esop_grants_activity after insert or update or delete on public.esop_grants
  for each row execute function public.log_record_activity('esop_grant', 'hr.esop', 'options');

-- ---------- row level security ----------
alter table public.employees enable row level security;
alter table public.employee_payroll enable row level security;
alter table public.salary_revisions enable row level security;
alter table public.assets enable row level security;
alter table public.asset_assignments enable row level security;
alter table public.esop_grants enable row level security;

create policy "employees: read" on public.employees for select to authenticated
  using (public.has_module_perm('hr', 'view') or (public.has_perm('hr.team', 'own') and profile_id = (select auth.uid())));
create policy "employees: insert" on public.employees for insert to authenticated
  with check (public.has_perm('hr.team', 'edit'));
create policy "employees: update" on public.employees for update to authenticated
  using (public.has_perm('hr.team', 'edit')) with check (public.has_perm('hr.team', 'edit'));
create policy "employees: delete" on public.employees for delete to authenticated
  using (public.has_perm('hr.team', 'manage'));

create policy "payroll: read" on public.employee_payroll for select to authenticated
  using (public.can_see_employee_item('hr.compensation', employee_id));
create policy "payroll: insert" on public.employee_payroll for insert to authenticated
  with check (public.has_perm('hr.compensation', 'edit'));
create policy "payroll: update" on public.employee_payroll for update to authenticated
  using (public.has_perm('hr.compensation', 'edit')) with check (public.has_perm('hr.compensation', 'edit'));
create policy "payroll: delete" on public.employee_payroll for delete to authenticated
  using (public.has_perm('hr.compensation', 'manage'));

create policy "salary: read" on public.salary_revisions for select to authenticated
  using (public.can_see_employee_item('hr.compensation', employee_id));
create policy "salary: insert" on public.salary_revisions for insert to authenticated
  with check (public.has_perm('hr.compensation', 'edit'));
create policy "salary: update" on public.salary_revisions for update to authenticated
  using (public.has_perm('hr.compensation', 'edit')) with check (public.has_perm('hr.compensation', 'edit'));
create policy "salary: delete" on public.salary_revisions for delete to authenticated
  using (public.has_perm('hr.compensation', 'manage'));

create policy "assets: read" on public.assets for select to authenticated
  using (public.has_perm('hr.equipment', 'view') or (public.has_perm('hr.equipment', 'own') and exists (
    select 1 from public.asset_assignments x where x.asset_id = assets.id and public.is_own_employee(x.employee_id))));
create policy "assets: insert" on public.assets for insert to authenticated
  with check (public.has_perm('hr.equipment', 'edit'));
create policy "assets: update" on public.assets for update to authenticated
  using (public.has_perm('hr.equipment', 'edit')) with check (public.has_perm('hr.equipment', 'edit'));
create policy "assets: delete" on public.assets for delete to authenticated
  using (public.has_perm('hr.equipment', 'manage'));

create policy "assignments: read" on public.asset_assignments for select to authenticated
  using (public.can_see_employee_item('hr.equipment', employee_id));
create policy "assignments: insert" on public.asset_assignments for insert to authenticated
  with check (public.has_perm('hr.equipment', 'edit'));
create policy "assignments: update" on public.asset_assignments for update to authenticated
  using (public.has_perm('hr.equipment', 'edit')) with check (public.has_perm('hr.equipment', 'edit'));
create policy "assignments: delete" on public.asset_assignments for delete to authenticated
  using (public.has_perm('hr.equipment', 'manage'));

create policy "esop: read" on public.esop_grants for select to authenticated
  using (public.can_see_employee_item('hr.esop', employee_id));
create policy "esop: insert" on public.esop_grants for insert to authenticated
  with check (public.has_perm('hr.esop', 'edit'));
create policy "esop: update" on public.esop_grants for update to authenticated
  using (public.has_perm('hr.esop', 'edit')) with check (public.has_perm('hr.esop', 'edit'));
create policy "esop: delete" on public.esop_grants for delete to authenticated
  using (public.has_perm('hr.esop', 'manage'));

-- Documents about an employee are visible to that employee with "own" access.
alter policy "documents: read" on public.documents
  using (public.has_perm(perm_key, 'view')
         or (employee_id is not null and public.has_perm(perm_key, 'own') and public.is_own_employee(employee_id)));

create or replace function public.can_read_object(p_name text) returns boolean
language sql stable security definer set search_path = '' as $fn$
  select exists (
    select 1 from public.documents d
    where d.storage_path = p_name
      and (public.has_perm(d.perm_key, 'view')
           or (d.employee_id is not null and public.has_perm(d.perm_key, 'own') and public.is_own_employee(d.employee_id)))
  );
$fn$;

-- ---------- function permissions ----------
revoke execute on function public.is_own_employee(uuid) from public, anon;
revoke execute on function public.can_see_employee_item(text, uuid) from public, anon;
revoke execute on function public.has_module_perm(text, public.access_level) from public, anon;
grant execute on function public.is_own_employee(uuid) to authenticated;
grant execute on function public.can_see_employee_item(text, uuid) to authenticated;
grant execute on function public.has_module_perm(text, public.access_level) to authenticated;
revoke execute on function public.touch_payroll_updated_at() from public, anon, authenticated;
revoke execute on function public.sync_asset_status() from public, anon, authenticated;
revoke execute on function public.log_record_activity() from public, anon, authenticated;

-- ---------- starter HR roles ----------
insert into public.roles (name, description) values
  ('HR Manager', 'Runs HR: team, salaries, documents, equipment and ESOPs'),
  ('HR Intern', 'Helps HR: sees team details, documents and equipment, no salaries or ESOPs'),
  ('Employee', 'Every team member: sees only their own record, documents, equipment and ESOPs');

insert into public.role_permissions (role_id, permission_key, level)
select r.id, g.key, g.level::public.access_level
from public.roles r
join (values
  ('HR Manager', 'hr.team', 'manage'), ('HR Manager', 'hr.compensation', 'manage'), ('HR Manager', 'hr.documents', 'manage'),
  ('HR Manager', 'hr.equipment', 'manage'), ('HR Manager', 'hr.esop', 'manage'),
  ('HR Intern', 'hr.team', 'view'), ('HR Intern', 'hr.documents', 'view'), ('HR Intern', 'hr.equipment', 'view'),
  ('Employee', 'hr.team', 'own'), ('Employee', 'hr.compensation', 'own'), ('Employee', 'hr.documents', 'own'),
  ('Employee', 'hr.equipment', 'own'), ('Employee', 'hr.esop', 'own')
) as g(role_name, key, level) on g.role_name = r.name;
