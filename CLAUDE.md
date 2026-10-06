# Management Panel: working rules

React + TypeScript (Vite) frontend, Supabase backend (Postgres + RLS, Storage, Edge Functions).
Supabase project: `hietxqbfpjbbavupspvd` (Mumbai).

## Structure rules (keep these)

- **No file over 150 lines** (blank lines and comments not counted). `npm run lint` enforces this with
  `eslint/max-lines`. When a file grows, split it by responsibility; never raise the limit.
- **One component per file**, named after the file. Hooks in `useX.ts`, pure logic in plain `.ts`.
- **Feature folders.** Everything for a screen lives in `src/features/<feature>/`. Larger features get
  sub-folders (e.g. `filings/details/`, `filings/generate/`).
- **Data access only through `src/api/`**, one file per table or topic, re-exported from `src/api/index.ts`.
  Components never call `supabase.from(...)` directly.
- **Shared UI** goes in `src/components/ui/` (generic, with no knowledge of features). Feature components that are
  reused across features stay in their feature folder and are imported from there.
- **Styles** live in `src/styles/`, one file per concern (tokens, base, layout, surfaces, controls, feedback,
  details). Colours only via the CSS variables in `tokens.css`.
- **Permissions are enforced in the database** (RLS). UI checks (`canEdit`, `isAdmin`) only hide buttons. Any new
  table needs RLS policies in its migration.

## Layout

```
src/
  main.tsx              entry: providers + router
  app/                  App (routes), Layout, Sidebar, lazy page registry
  api/                  data layer: queries + writes per table, useWrite, adminUsers (Edge Function)
  components/ui/        Modal, Tabs, Icon, badges, ErrorBox/Empty/Loading, AreaTag
  features/
    auth/               AuthContext (useAuth), AuthProvider, LoginPage
    dashboard/          page + one file per card + useDashboardStats
    filings/            page, table, form, modal, details/, generate/, compliance calendar logic + tests
    requests/           page, table, modal, footer actions, form, reject form
    documents/          page, table/row, upload modal
    comments/           comment thread used by filings and requests
    activity/  account/
    admin/users/        people table, add/edit modals, access editor, password reset
    admin/areas/        areas list + modal
  lib/                  supabase client, types, labels, dates, format
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
