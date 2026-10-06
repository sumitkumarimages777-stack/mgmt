-- Named roles with per-feature access levels. A person can hold several
-- roles; their access to a feature is the highest level any role gives.

create type public.access_level as enum ('own', 'view', 'edit', 'manage');

-- Catalogue of everything a role can be granted, grouped by module.
create table public.permissions (
  key text primary key,
  module text not null check (module in ('ca', 'hr', 'legal')),
  label text not null,
  description text,
  supports_own boolean not null default false, -- "own records only" makes sense (e.g. HR)
  sort int not null default 0
);

insert into public.permissions (key, module, label, description, sort) values
  ('ca.filings', 'ca', 'Filings', 'Statutory filings and compliance deadlines', 10),
  ('ca.requests', 'ca', 'Document requests', 'Documents the CA asks for and what was sent', 20),
  ('ca.documents', 'ca', 'Records', 'Documents shared with the CA', 30);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  is_superuser boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index roles_single_superuser on public.roles (is_superuser) where is_superuser;

create table public.role_permissions (
  role_id uuid not null references public.roles (id) on delete cascade,
  permission_key text not null references public.permissions (key) on delete cascade,
  level public.access_level not null,
  primary key (role_id, permission_key)
);
create index role_permissions_key_idx on public.role_permissions (permission_key);

create table public.user_roles (
  user_id uuid not null references public.profiles (id) on delete cascade,
  role_id uuid not null references public.roles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, role_id)
);
create index user_roles_role_idx on public.user_roles (role_id);

-- Starter roles (editable in the app).
insert into public.roles (name, description, is_superuser) values
  ('Admin', 'Full access to everything, including people and roles', true),
  ('CA', 'Chartered accountant: full compliance work', false),
  ('CA Assistant', 'Helps the CA: sees filings, handles document requests', false);

insert into public.role_permissions (role_id, permission_key, level)
select r.id, p.key, p.level::public.access_level
from public.roles r
join (values
  ('CA', 'ca.filings', 'edit'), ('CA', 'ca.requests', 'edit'), ('CA', 'ca.documents', 'edit'),
  ('CA Assistant', 'ca.filings', 'view'), ('CA Assistant', 'ca.requests', 'edit'), ('CA Assistant', 'ca.documents', 'view')
) as p(role_name, key, level) on p.role_name = r.name;

-- Existing admins get the Admin role.
insert into public.user_roles (user_id, role_id)
select p.id, r.id from public.profiles p cross join public.roles r
where r.is_superuser and p.role = 'admin';

-- ---------- access functions ----------
create function public.level_rank(p_level public.access_level) returns int
language sql immutable set search_path = '' as $$
  select case p_level when 'own' then 1 when 'view' then 2 when 'edit' then 3 when 'manage' then 4 end;
$$;

-- Highest rank (0 = none, 1 own, 2 view, 3 edit, 4 manage) a user has on a permission.
create function public.perm_rank_for(p_user uuid, p_key text) returns int
language sql stable security definer set search_path = '' as $$
  select case
    when not exists (select 1 from public.profiles where id = p_user and is_active) then 0
    when exists (
      select 1 from public.user_roles ur join public.roles r on r.id = ur.role_id
      where ur.user_id = p_user and r.is_superuser
    ) then 4
    else coalesce((
      select max(public.level_rank(rp.level))
      from public.user_roles ur join public.role_permissions rp on rp.role_id = ur.role_id
      where ur.user_id = p_user and rp.permission_key = p_key
    ), 0)
  end;
$$;

create function public.has_perm(p_key text, p_min public.access_level) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.perm_rank_for((select auth.uid()), p_key) >= public.level_rank(p_min);
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    join public.user_roles ur on ur.user_id = p.id
    join public.roles r on r.id = ur.role_id
    where p.id = (select auth.uid()) and p.is_active and r.is_superuser
  );
$$;

-- The signed-in user's effective level for every permission they have.
create function public.my_permissions() returns table (permission_key text, level public.access_level)
language sql stable security definer set search_path = '' as $$
  select p.key,
    (array['own', 'view', 'edit', 'manage'])[public.perm_rank_for((select auth.uid()), p.key)]::public.access_level
  from public.permissions p
  where public.perm_rank_for((select auth.uid()), p.key) > 0;
$$;

revoke execute on function public.perm_rank_for(uuid, text) from public, anon, authenticated;
revoke execute on function public.has_perm(text, public.access_level) from public, anon;
revoke execute on function public.my_permissions() from public, anon;
grant execute on function public.has_perm(text, public.access_level) to authenticated;
grant execute on function public.my_permissions() to authenticated;

-- ---------- RLS ----------
alter table public.permissions enable row level security;
alter table public.roles enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_roles enable row level security;

create policy "permissions: read" on public.permissions for select to authenticated using (true);

create policy "roles: read" on public.roles for select to authenticated using (true);
create policy "roles: admin insert" on public.roles for insert to authenticated
  with check (public.is_admin() and not is_superuser);
create policy "roles: admin update" on public.roles for update to authenticated
  using (public.is_admin() and not is_superuser) with check (public.is_admin() and not is_superuser);
create policy "roles: admin delete" on public.roles for delete to authenticated
  using (public.is_admin() and not is_superuser);

create policy "role_permissions: read" on public.role_permissions for select to authenticated using (true);
create policy "role_permissions: admin insert" on public.role_permissions for insert to authenticated
  with check (public.is_admin());
create policy "role_permissions: admin update" on public.role_permissions for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "role_permissions: admin delete" on public.role_permissions for delete to authenticated
  using (public.is_admin());

create policy "user_roles: read own or admin" on public.user_roles for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());
create policy "user_roles: admin insert" on public.user_roles for insert to authenticated
  with check (public.is_admin());
create policy "user_roles: admin delete" on public.user_roles for delete to authenticated
  using (public.is_admin());
