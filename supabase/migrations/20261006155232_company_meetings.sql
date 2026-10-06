-- =====================================================================
-- Phase 4: Company meetings
-- Board meetings, AGMs, EGMs and committee meetings with attendees,
-- resolutions, action items, minutes and files.
-- =====================================================================

-- New "company" department.
alter table public.permissions drop constraint permissions_module_check;
alter table public.permissions add constraint permissions_module_check
  check (module in ('ca', 'hr', 'legal', 'company'));

insert into public.permissions (key, module, label, description, supports_own, sort) values
  ('company.meetings', 'company', 'Meetings', 'Board meetings, AGMs and EGMs: agenda, minutes, resolutions and actions', false, 10);

-- ---------- tables ----------
create table public.meetings (
  id uuid primary key default gen_random_uuid(),
  meeting_type text not null default 'board' check (meeting_type in ('board', 'agm', 'egm', 'committee', 'other')),
  title text not null,
  meeting_number text,
  financial_year text, -- for AGMs: the year whose accounts are adopted, e.g. "FY 2025-26"
  meeting_date date not null,
  start_time text,
  mode text not null default 'in_person' check (mode in ('in_person', 'online', 'hybrid')),
  venue text,
  status text not null default 'scheduled' check (status in ('scheduled', 'held', 'cancelled')),
  notice_sent_on date,
  chairperson text,
  quorum_met boolean,
  agenda text,
  minutes text,
  minutes_signed_on date,
  notes text,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index meetings_date_idx on public.meetings (meeting_date desc);
create index meetings_created_by_idx on public.meetings (created_by);

create table public.meeting_attendees (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings (id) on delete cascade,
  name text not null,
  capacity text, -- Director, Shareholder, Auditor, Invitee…
  present boolean not null default true,
  created_at timestamptz not null default now()
);
create index meeting_attendees_meeting_idx on public.meeting_attendees (meeting_id);

create table public.meeting_resolutions (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings (id) on delete cascade,
  resolution_number text,
  title text not null,
  resolution_type text not null default 'board' check (resolution_type in ('board', 'ordinary', 'special')),
  status text not null default 'passed' check (status in ('passed', 'rejected', 'deferred')),
  requires_filing boolean not null default false, -- e.g. MGT-14 with the ROC
  filing_id uuid references public.filings (id) on delete set null,
  details text,
  created_at timestamptz not null default now()
);
create index meeting_resolutions_meeting_idx on public.meeting_resolutions (meeting_id);
create index meeting_resolutions_filing_idx on public.meeting_resolutions (filing_id);

create table public.meeting_actions (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings (id) on delete cascade,
  description text not null,
  owner_id uuid references public.profiles (id) on delete set null,
  due_date date,
  status text not null default 'open' check (status in ('open', 'done')),
  done_on date,
  created_at timestamptz not null default now()
);
create index meeting_actions_meeting_idx on public.meeting_actions (meeting_id);
create index meeting_actions_owner_idx on public.meeting_actions (owner_id);

alter table public.documents add column meeting_id uuid references public.meetings (id) on delete set null;
create index documents_meeting_idx on public.documents (meeting_id);

-- ---------- triggers ----------
create trigger meetings_updated_at before update on public.meetings
  for each row execute function public.set_updated_at();
create trigger meetings_activity after insert or update or delete on public.meetings
  for each row execute function public.log_record_activity('meeting', 'company.meetings', 'title');
create trigger meeting_resolutions_activity after insert or update or delete on public.meeting_resolutions
  for each row execute function public.log_record_activity('resolution', 'company.meetings', 'title');

-- ---------- row level security ----------
alter table public.meetings enable row level security;
alter table public.meeting_attendees enable row level security;
alter table public.meeting_resolutions enable row level security;
alter table public.meeting_actions enable row level security;

create policy "meetings: read" on public.meetings for select to authenticated
  using (public.has_perm('company.meetings', 'view'));
create policy "meetings: insert" on public.meetings for insert to authenticated
  with check (public.has_perm('company.meetings', 'edit'));
create policy "meetings: update" on public.meetings for update to authenticated
  using (public.has_perm('company.meetings', 'edit')) with check (public.has_perm('company.meetings', 'edit'));
create policy "meetings: delete" on public.meetings for delete to authenticated
  using (public.has_perm('company.meetings', 'manage'));

create policy "attendees: read" on public.meeting_attendees for select to authenticated
  using (public.has_perm('company.meetings', 'view'));
create policy "attendees: insert" on public.meeting_attendees for insert to authenticated
  with check (public.has_perm('company.meetings', 'edit'));
create policy "attendees: update" on public.meeting_attendees for update to authenticated
  using (public.has_perm('company.meetings', 'edit')) with check (public.has_perm('company.meetings', 'edit'));
create policy "attendees: delete" on public.meeting_attendees for delete to authenticated
  using (public.has_perm('company.meetings', 'edit'));

create policy "resolutions: read" on public.meeting_resolutions for select to authenticated
  using (public.has_perm('company.meetings', 'view'));
create policy "resolutions: insert" on public.meeting_resolutions for insert to authenticated
  with check (public.has_perm('company.meetings', 'edit'));
create policy "resolutions: update" on public.meeting_resolutions for update to authenticated
  using (public.has_perm('company.meetings', 'edit')) with check (public.has_perm('company.meetings', 'edit'));
create policy "resolutions: delete" on public.meeting_resolutions for delete to authenticated
  using (public.has_perm('company.meetings', 'manage'));

create policy "actions: read" on public.meeting_actions for select to authenticated
  using (public.has_perm('company.meetings', 'view'));
create policy "actions: insert" on public.meeting_actions for insert to authenticated
  with check (public.has_perm('company.meetings', 'edit'));
create policy "actions: update" on public.meeting_actions for update to authenticated
  using (public.has_perm('company.meetings', 'edit')) with check (public.has_perm('company.meetings', 'edit'));
create policy "actions: delete" on public.meeting_actions for delete to authenticated
  using (public.has_perm('company.meetings', 'edit'));

-- ---------- starter roles ----------
insert into public.roles (name, description) values
  ('Director', 'Board member: sees meetings, minutes and resolutions, and the compliance calendar'),
  ('Company Secretary', 'Runs board and general meetings and the ROC filings that follow');

insert into public.role_permissions (role_id, permission_key, level)
select r.id, g.key, g.level::public.access_level
from public.roles r
join (values
  ('Director', 'company.meetings', 'view'), ('Director', 'ca.filings', 'view'),
  ('Company Secretary', 'company.meetings', 'manage'), ('Company Secretary', 'ca.filings', 'edit'),
  ('Company Secretary', 'ca.documents', 'view')
) as g(role_name, key, level) on g.role_name = r.name
on conflict (role_id, permission_key) do nothing;
