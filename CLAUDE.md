# Management Panel: working rules

React + TypeScript (Vite) frontend, Supabase backend (Postgres + RLS, Storage, Edge Functions).
Supabase project: `hietxqbfpjbbavupspvd` (Mumbai).

## Structure rules (keep these)

- **No file over 150 lines** (blank lines and comments not counted). `npm run lint` enforces this with
  `eslint/max-lines`. When a file grows, split it by responsibility; never raise the limit.
- **One component per file**, named after the file. Hooks in `useX.ts`, pure logic in plain `.ts`.
- **Feature folders.** Everything for a screen lives in `src/features/<feature>/` (department screens under `features/<module>/`, e.g. `features/ca/filings/`). Larger features get
  sub-folders (e.g. `filings/details/`, `filings/generate/`).
- **Data access only through `src/api/`**, one file per table or topic, re-exported from `src/api/index.ts`.
  Components never call `supabase.from(...)` directly.
- **Shared UI** goes in `src/components/ui/` (generic, with no knowledge of features). Feature components that are
  reused across features stay in their feature folder and are imported from there.
- **Styles** live in `src/styles/`, one file per concern (tokens, base, layout, surfaces, controls, feedback,
  details). Colours only via the CSS variables in `tokens.css`.
- **Permissions are enforced in the database** (RLS). UI checks (`can(key, level)`, `isAdmin`) only hide buttons.
  Any new table needs RLS policies in its migration.

## Access model

- People hold any number of **roles** (`user_roles`). A role grants **access levels** per permission key
  (`role_permissions`): `own` < `view` < `edit` < `manage`. Effective access = highest level across roles.
  The built-in **Admin** role (`is_superuser`) has everything, including People and Roles pages.
- Permission keys are `<module>.<feature>` (e.g. `ca.filings`) and live in the `permissions` table, grouped by
  module (`ca`, `hr`, `legal`). `supports_own` marks features where "own records only" applies (HR).
- RLS uses `has_perm(key, level)`; the UI uses `can(key, level)` from `useAuth()`.
- **Adding a feature:** insert its key into `permissions` (migration), protect its tables with `has_perm`, add a
  `NAV_SECTIONS` entry in `src/app/navigation.ts`, and a route wrapped in `RequirePerm`.
- Documents carry `module` + `feature`; their `perm_key` decides who sees them. Storage paths are `<module>/<file>`.
- Requests: `module` = department handling it, `from_module` = department asking. The requester and anyone with
  edit on `from_module.requests` can follow it, add files and comment (`can_see_request`). Request files are stored
  under `requests/<request id>/`.
- "Own only": HR rows link to an employee; `employees.profile_id` ties an employee to a login. RLS helpers
  `is_own_employee(id)` and `can_see_employee_item(key, employee_id)` implement it. HR documents set `employee_id`.

## Layout

```
src/
  main.tsx              entry: providers + router
  app/                  App (routes), Layout, Sidebar, navigation.ts (department menu), RequirePerm, lazy pages
  api/                  data layer: queries + writes per table, useWrite, adminUsers (Edge Function)
  components/ui/        Modal, Tabs, Icon, badges, Tag, TextField/SelectField, ErrorBox/Empty/Loading
  features/
    auth/               AuthContext (useAuth, can), AuthProvider, LoginPage
    dashboard/          page + one file per card + useDashboardStats
    ca/filings/         page, table, form, modal, details/, generate/, compliance calendar logic + tests
    ca/requests/        CA document requests page (uses the shared requests board)
    ca/records/         CA documents page
    hr/team/            team list + employee form (JobFields, PersonalFields)
    hr/employee/        employee page with tabs: overview, salary & payroll, documents, equipment, ESOPs
    hr/equipment/       asset register, give / return equipment
    hr/esop/            grants, vesting maths (vesting.ts + tests), ESOP overview
    hr/documents/       all HR documents by team member
    hr/requests/        HR requests page (shared requests board)
    legal/contracts/    contract register, expiry / renewal alerts (contractAlerts.ts + tests)
    legal/matters/      notices, disputes, IP and regulatory matters with next dates
    legal/requests/     Legal requests page (shared requests board)
    requests/           shared requests board, table, modal, form (To / On behalf of), AllRequestsPage
    documents/          shared document table/row + upload modal (used by every module)
    comments/           comment thread used by filings and requests
    activity/  account/
    admin/people/       people table, add/edit modals, role picker, password reset
    admin/roles/        roles list, role modal, permission grid
  lib/                  supabase client, types (+ hrTypes, legalTypes), labels, options, access levels, dates, format
  styles/               CSS split by concern
supabase/
  migrations/           append-only; file names match the versions recorded in Supabase
  functions/admin-users/  index.ts routes to actions/*; admin.ts (service client + admin check), validate.ts
```

## Backend rules

- **Migrations are append-only.** Never edit or split an applied migration. Add a new, small migration for each
  change, apply it via Supabase, then save the same SQL here using the version Supabase recorded.
- After DDL changes, run the Supabase security and performance advisors.
- Edge Functions verify the caller themselves (`verify_jwt = false` in `supabase/config.toml`). Every
  non-bootstrap action must go through `requireAdmin`.

## Checks before pushing

```bash
npx tsc -b && npm run lint && npm test && npm run build
```
