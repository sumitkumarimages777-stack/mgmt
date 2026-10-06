# Management Panel

One place to run company compliance with your CA, lawyer and team:

- **Filings**: upcoming, overdue and completed statutory filings (GST, TDS, ITR, ROC, PF/ESI…), with filed date, acknowledgement number and attached proof. One click generates a full financial year's compliance calendar.
- **Document requests**: what the CA or lawyer has asked for, when it's needed, and whether it has been sent, accepted or needs re-uploading.
- **Shared documents**: every file or link shared, by whom and when, kept in private storage.
- **HR**: team members with full details, salary history and payroll details, contracts and documents, equipment given to each person (with handover history), and ESOP grants with automatic vesting (cliff, monthly/quarterly/yearly, stops at exit).
- **Activity log**: an automatic audit trail of who did what.
- **Roles & permissions**: create roles by name ("CA", "CA Assistant", "Lawyer", "HR Intern") and set each feature to *None / Own only / View / Edit / Manage*. A person can hold several roles and gets the highest level any of them gives.
- **Department menu**: the left menu is grouped by department (CA & Compliance and HR now; Legal and Company Meetings next) and only shows what the person's roles allow.

Stack: React + TypeScript (Vite) frontend, Supabase backend (Postgres + Row Level Security, Storage, Edge Function).

## How access is enforced

Permissions live in the database, not just the UI. Every table and the file bucket have Row Level Security policies, so even someone calling the API directly with their login only gets what their roles allow.

| Level | Means |
| --- | --- |
| None | Can't see the feature at all |
| Own only | Sees only records about themselves (for HR features) |
| View | Sees everything in the feature and can comment |
| Edit | Can also add and update (file, request, upload, change status) |
| Manage | Can also delete |

The built-in **Admin** role has everything, including the People and Roles pages.

Deactivating a person blocks their sign-in and all data access immediately.

## First-time setup

1. Open the deployed app and click **"First time? Set up the admin account"**. This works only once: after an admin exists the option disappears.
2. Check **Admin → Roles & permissions**: starter roles *CA*, *CA Assistant*, *HR Manager*, *HR Intern* and *Employee* are there. Adjust them or add your own.
3. Go to **Admin → People → Add person** to create logins for your CA, lawyer or team. Tick their roles, then send them the temporary password shown. They can change it under *My account*.
4. Go to **CA & Compliance → Filings → Generate compliance calendar**, pick the financial year and the filings that apply to you.
5. Add your team under **HR → Team members**. To let someone see their own record, give them a login with the *Employee* role and pick that login in their HR record ("Panel login").

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

## Code structure

Feature-based and kept small: no file over 150 lines (enforced by `npm run lint`). See [`CLAUDE.md`](CLAUDE.md)
for the full layout and conventions.

```
src/app/          routes, layout, sidebar
src/api/          all database access, one file per table/topic
src/features/     one folder per screen (filings, requests, documents, dashboard, admin, …)
src/components/ui shared building blocks (modal, tabs, badges, icons)
src/lib/          types, labels, date + format helpers, Supabase client
src/styles/       CSS split by concern
supabase/         migrations (already applied) and the admin-users Edge Function
```


Compliance due dates are the regular statutory dates. When the government extends a deadline, edit that filing's due date.
