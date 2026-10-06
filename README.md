# Management Panel

One place to run company compliance with your CA, lawyer and team:

- **Filings**: upcoming, overdue and completed statutory filings (GST, TDS, ITR, ROC, PF/ESI…), with filed date, acknowledgement number and attached proof. One click generates a full financial year's compliance calendar.
- **Document requests**: what the CA or lawyer has asked for, when it's needed, and whether it has been sent, accepted or needs re-uploading.
- **Shared documents**: every file or link shared, by whom and when, kept in private storage.
- **Activity log**: an automatic audit trail of who did what.
- **People & access**: give each person a login and choose which **areas** they can *view* or *edit*. For example, the CA gets "Accounts & Tax" and "ROC / MCA", and a lawyer later gets only "Legal".

Stack: React + TypeScript (Vite) frontend, Supabase backend (Postgres + Row Level Security, Storage, Edge Function).

## How access is enforced

Permissions live in the database, not just the UI. Every table and the file bucket have Row Level Security policies, so even someone calling the API directly with their login only gets rows from areas they were given.

| Role | Can do |
| --- | --- |
| Admin | Everything, including people, areas and deletes |
| Team member / External advisor | Only the areas ticked for them. **View**: see and comment. **Edit**: also add filings, request and upload documents, and change statuses |

Deactivating a person blocks their sign-in and all data access immediately.

## First-time setup

1. Open the deployed app and click **"First time? Set up the admin account"**. This works only once: after an admin exists the option disappears.
2. Go to **People & access → Add person** to create logins for your CA, lawyer or team. Pick their areas, then send them the temporary password shown. They can change it under *My account*.
3. Go to **Filings → Generate compliance calendar**, pick the financial year and the filings that apply to you.

Recommended in the Supabase dashboard: **Authentication → Sign In / Providers → turn off "Allow new users to sign up"**. People are only ever added by the admin. Anyone who signs up on their own gets no access anyway, but turning it off is tidier.

## Development

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests (compliance calendar, date logic)
npm run lint
npm run build
```

The app talks to the Supabase project `hietxqbfpjbbavupspvd` by default. To point it elsewhere, copy `.env.example` to `.env` and set `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY`. The publishable key is meant to be public. Data is protected by RLS.

## Deploy (Vercel)

Import the repo in Vercel. It auto-detects Vite: build `npm run build`, output `dist`. `vercel.json` already handles page refreshes on deep links.

## Backend layout

```
supabase/
  migrations/                 schema, RLS policies, triggers, storage bucket (already applied)
  functions/admin-users/      Edge Function: first-admin setup, create login, reset password, deactivate
  config.toml
```

To add a new kind of work later (e.g. "Trademark & IP"), create an **Area** in the admin and grant people access. No code change is needed.

Compliance due dates are the regular statutory dates. When the government extends a deadline, edit that filing's due date.
