-- =====================================================================
-- CA: monthly TDS register and TDS rules
-- Rules say which salaries attract TDS under which section. Each month
-- the CA prepares the register from current salaries, then records the
-- amount, challan and payment date.
-- =====================================================================

insert into public.permissions (key, module, label, description, supports_own, sort) values
  ('ca.tds', 'ca', 'TDS', 'Monthly TDS register: who TDS is deducted for, amounts, challans and payments', false, 12),
  ('ca.tds_rules', 'ca', 'TDS rules', 'Salary thresholds that make a team member eligible for TDS, by section', false, 14);

-- ---------- tables ----------
create table public.tds_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  section text not null,                       -- e.g. 192 (salary), 194J (professional fees)
  basis text not null default 'annual' check (basis in ('annual', 'monthly')),
  threshold numeric(14, 2) not null default 0 check (threshold >= 0), -- salary above this is eligible
  rate_percent numeric(5, 2) check (rate_percent between 0 and 100), -- optional default to estimate TDS
  employment_types text[],                     -- null = every employment type
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tds_payments (
  id uuid primary key default gen_random_uuid(),
  month date not null check (extract(day from month) = 1), -- month the TDS was deducted
  employee_id uuid references public.employees (id) on delete set null,
  employee_name text not null,                 -- kept as it was that month
  pan text,
  section text not null,
  salary_amount numeric(14, 2) check (salary_amount >= 0),
  tds_amount numeric(14, 2) not null default 0 check (tds_amount >= 0),
  status text not null default 'pending' check (status in ('pending', 'paid')),
  paid_on date,
  challan_number text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (month, employee_id, section)
);
create index tds_payments_month_idx on public.tds_payments (month desc);
create index tds_payments_employee_idx on public.tds_payments (employee_id);

create trigger tds_rules_updated_at before update on public.tds_rules
  for each row execute function public.set_updated_at();
create trigger tds_payments_updated_at before update on public.tds_payments
  for each row execute function public.set_updated_at();
create trigger tds_rules_activity after insert or update or delete on public.tds_rules
  for each row execute function public.log_record_activity('tds_rule', 'ca.tds_rules', 'name');
create trigger tds_payments_activity after insert or update or delete on public.tds_payments
  for each row execute function public.log_record_activity('tds_payment', 'ca.tds', 'employee_name');

-- ---------- salary lookup for the CA ----------
-- Team members working in the given month with the salary in force then.
-- Lets TDS users see just what TDS needs without HR salary access.
create function public.tds_salary_snapshot(p_month date)
returns table (employee_id uuid, full_name text, employee_code text, employment_type text, pan text,
               annual_ctc numeric, monthly_gross numeric)
language plpgsql stable security definer set search_path = '' as $fn$
declare
  v_start date := date_trunc('month', p_month)::date;
  v_end date := (date_trunc('month', p_month) + interval '1 month - 1 day')::date;
begin
  if not public.has_perm('ca.tds', 'view') then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  return query
  select e.id, e.full_name, e.employee_code, e.employment_type, p.pan, s.annual_ctc,
         coalesce(s.monthly_gross, round(s.annual_ctc / 12, 2))
  from public.employees e
  left join public.employee_payroll p on p.employee_id = e.id
  join lateral (
    select r.annual_ctc, r.monthly_gross from public.salary_revisions r
    where r.employee_id = e.id and r.effective_from <= v_end
    order by r.effective_from desc limit 1
  ) s on true
  where (e.date_of_joining is null or e.date_of_joining <= v_end)
    and (e.date_of_exit is null or e.date_of_exit >= v_start)
    and (e.status <> 'exited' or e.date_of_exit is not null)
  order by e.full_name;
end;
$fn$;
revoke execute on function public.tds_salary_snapshot(date) from public, anon;
grant execute on function public.tds_salary_snapshot(date) to authenticated;

-- ---------- row level security ----------
alter table public.tds_rules enable row level security;
alter table public.tds_payments enable row level security;

create policy "tds rules: read" on public.tds_rules for select to authenticated
  using (public.has_perm('ca.tds_rules', 'view') or public.has_perm('ca.tds', 'view'));
create policy "tds rules: insert" on public.tds_rules for insert to authenticated
  with check (public.has_perm('ca.tds_rules', 'edit'));
create policy "tds rules: update" on public.tds_rules for update to authenticated
  using (public.has_perm('ca.tds_rules', 'edit')) with check (public.has_perm('ca.tds_rules', 'edit'));
create policy "tds rules: delete" on public.tds_rules for delete to authenticated
  using (public.has_perm('ca.tds_rules', 'manage'));

create policy "tds payments: read" on public.tds_payments for select to authenticated
  using (public.has_perm('ca.tds', 'view'));
create policy "tds payments: insert" on public.tds_payments for insert to authenticated
  with check (public.has_perm('ca.tds', 'edit'));
create policy "tds payments: update" on public.tds_payments for update to authenticated
  using (public.has_perm('ca.tds', 'edit')) with check (public.has_perm('ca.tds', 'edit'));
create policy "tds payments: delete" on public.tds_payments for delete to authenticated
  using (public.has_perm('ca.tds', 'manage'));

-- ---------- starter access and rule ----------
insert into public.role_permissions (role_id, permission_key, level)
select r.id, g.key, g.level::public.access_level
from public.roles r
join (values
  ('CA', 'ca.tds', 'edit'), ('CA', 'ca.tds_rules', 'edit'),
  ('CA Assistant', 'ca.tds', 'view'), ('CA Assistant', 'ca.tds_rules', 'view')
) as g(role_name, key, level) on g.role_name = r.name
on conflict (role_id, permission_key) do nothing;

insert into public.tds_rules (name, section, basis, threshold, employment_types, notes) values
  ('Salary TDS', '192', 'annual', 1275000, array['full_time', 'part_time'],
   'Set the threshold to the salary above which you deduct TDS.');
