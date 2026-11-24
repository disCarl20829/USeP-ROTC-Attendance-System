# Developer Guide

This guide explains how the system works, how to run it, and — most importantly —
the auth flow, Supabase setup, routes and automatic absences.

---

## 1. Architecture

```text
Browser (React / Inertia)
        │  page visit (HTML + JSON props)
        ▼
Laravel routes/web.php  ──►  Controllers  ──►  Eloquent models  ──►  Supabase Postgres
        │                                              │
        │  axios calls (/api/...)                      │
        ▼                                              │
routes/api.php  ──►  Controllers  ─────────────────────┘
        │
        └──►  Supabase Auth (login / register / logout)
```

- **Inertia** lets React pages act like server-rendered pages: Laravel sends a page
  component name + props, and React renders it. There is no separate REST client for
  page navigation.
- **API routes** (`routes/api.php`) are only used by the QR scanner; everything else
  (cadets, events, reports, settings) goes through Inertia web routes.
- **Supabase** owns users/passwords (`auth.users`); Postgres stores ROTC data.
- Laravel does **not** use its own `Auth::login()` — the Supabase session is stored
  in the Laravel session instead.

---

## 2. Setup

### Requirements
- PHP 8.2+ with `pdo_pgsql`
- Composer, Node.js 18+, npm
- Supabase project (database + auth enabled)

### Commands

```bash
composer install
npm install

# .env must contain DB_* and SUPABASE_* values (see README)

php artisan key:generate      # only if APP_KEY is empty
php artisan migrate           # creates tables + the sessions table
php artisan optimize:clear    # clear config/route/view caches

# development
php artisan serve             # http://127.0.0.1:8000
npm run dev                   # Vite dev server
```

Production build:

```bash
npm run build
```

---

### Sharing the app with VS Code port forwarding

Use this to open the app on phones (camera scanning needs HTTPS, which the tunnel provides).

1. Build the frontend once (no Vite dev server needed): stop `npm run dev`, delete
   `public/hot` if it exists, then run `npm run build`.
2. Start Laravel: `php artisan serve` (port 8000).
3. VS Code → **Ports** tab (next to Terminal) → **Forward a Port** → `8000`
   → sign in with GitHub if asked.
4. Right-click the port → **Port Visibility → Public** (otherwise visitors must sign in
   to GitHub). Copy the **Forwarded Address**, e.g. `https://abc123-8000.asse.devtunnels.ms`.
5. In `.env`:
   ```env
   APP_URL=https://abc123-8000.asse.devtunnels.ms
   TRUSTED_PROXIES=*
   ```
   then `php artisan config:clear` and restart `php artisan serve`.
6. Supabase → Authentication → URL Configuration → **Redirect URLs**: add
   `https://abc123-8000.asse.devtunnels.ms/auth/callback`.
7. Open the forwarded address on any device.

Set the port back to **Private** (or stop forwarding) when you're done: a public port
lets anyone with the link reach the app. Use `TRUSTED_PROXIES=*` only behind a tunnel
or proxy, never when the app is exposed directly.

---

## 2. Authentication

All auth goes through Supabase Auth's REST API (`app/Services/Supabase.php`). Laravel
never stores passwords; it keeps the Supabase tokens in the Laravel session.

| Step | Route | What happens |
| --- | --- | --- |
| Register | `POST /register` | `signup` with first/last name as user metadata → `/register/verify` |
| Verify (code) | `POST /register/verify` | `verify` (type `email`) → session stored → `/setup` |
| Verify (default email link) | Supabase → `GET /auth/callback#access_token=…` | page posts the tokens to `POST /auth/callback`, which checks them with `GET /auth/v1/user` → `/setup` |
| Verify (custom template link) | `GET /auth/confirm?token_hash=…&type=email` | same, for templates that use `{{ .TokenHash }}` |
| Resend | `POST /register/resend` | `resend` (type `signup`) |
| Setup | `POST /setup` | creates `user_info` (role Cadet) + QR token → `/dashboard` |
| Login | `POST /login` | password grant; unverified emails are sent to the verify page |
| Forgot password | `POST /forgot-password` | `recover` → `/reset-password` (code) or link → new password |
| Logout | `POST /logout` | revokes the Supabase session |

**Token renewal:** `SupabaseAuth` middleware refreshes the access token (1 hour) with
the refresh token when less than 60 s remain. If the refresh fails, the user is logged
out with "Your session has expired".

**Profile check:** `profile.complete` sends logged-in users without a `user_info` row
to `/setup`. **Permissions:** `permission:<name>` (see `config/rotc.php`).

### Supabase Auth setup

In the Supabase dashboard for **master-db**:

1. **Authentication → URL Configuration → Redirect URLs**: add
   `http://127.0.0.1:8000/auth/callback` (local) and later `https://<your domain>/auth/callback`.
   Email links only return to the app if this URL is listed; otherwise Supabase falls
   back to the Site URL.
2. **Custom SMTP with Gmail** (the built-in mailer sends only a couple of emails an hour):
   1. Create a dedicated Gmail account for the unit (e.g. a "USeP ROTC Attendance" address).
   2. Google Account → **Security** → turn on **2-Step Verification**.
   3. Google Account → **App passwords** (myaccount.google.com/apppasswords) → create one
      named "Supabase" → copy the 16-character password.
   4. Supabase → **Authentication → Emails → SMTP Settings** → enable custom SMTP:
      - Sender email: the Gmail address · Sender name: `USeP ROTC Attendance`
      - Host: `smtp.gmail.com` · Port: `465` · Username: the Gmail address
      - Password: the app password (type it here only; never commit or share it)
   5. **Authentication → Rate Limits**: raise "emails sent per hour" (Gmail allows ~500/day).
3. **Authentication → URL Configuration → Site URL**: the app URL (when deploying).
4. **Authentication → Providers → Email**: keep *Confirm email* **on**.

**Email templates:** branded maroon & gold templates with both a 6-digit code and a
button link are in **[docs/email-templates/](email-templates/README.md)**. Paste them into
Supabase → Authentication → Emails → Templates (*Confirm signup* and *Reset password*).

---

## 3. Database

Source of truth: Supabase. Reference SQL: `database/schema/rotcu_usep.sql`.
Laravel migrations in `database/migrations/` mirror it.

| Table | Primary key | Notes |
| --- | --- | --- |
| `campus_list` | `campus_id` | |
| `course_list` | `course_id` | |
| `platoon_list` | `platoon_id` | letter platoons (Alpha, Golf, …) |
| `platoon_units` | `unit_id` | numbered platoons per platoon: unique `(platoon_id, number)`, 1–20 (Golf 1st, Golf 2nd…) |
| `role_list` | `role_id` | organizational rank, not auth role |
| `permission_list` | `permission_id` | |
| `role_permissions` | `(role_id, permission_id)` | composite |
| `user_info` | `info_id` | `user_id` UUID (FK dropped); `student_id` (unique), `middle_name`, `status` (active/dropped), `dropped_at`, `active_since`, `specialization_id`, `platoon_id` + `platoon_unit_id` (optional), `school_year_id` (cadets/aspirants only), `archived_at` |
| `school_years` | `school_year_id` | `name`, `enrollment_year` (first-year ID prefix), `starts_on`/`ends_on`, `status` active/archived/purged; only one active |
| `audit_logs` | `audit_id` | who did what: backups, archives, restores, purges, platoon numbers |
| `login_deletions` | `user_id` | logins scheduled for deletion (1 year after archiving) |
| `formations_event` | `formation_id` | `location`, `school_year_id`, `archived_at` |
| `formation_sessions` | `session_id` | unique `(formation_id, session_type)` |
| `attendance_qr` | `qr_id` | one private `qr_token` per cadet; this is what the QR encodes |
| `attendance_records` | `record_id` | unique `(user_id, session_id)`; status present/late/excused/absent |
| `specialization_list` | `specialization_id` | includes "Unspecified" |
| `utilities` | `id` (always `1`) | default times, `welcome_video_url` |
| `sessions` | `id` | Laravel session store (added by migration) |

> **Archived rows are hidden by global scopes** on `UserInfo`, `FormationEvent`,
> `FormationSession` and `AttendanceRecord`. Use `UserInfo::withArchived()` (or
> `withoutGlobalScope('notArchived')`) when you really need them.

> **Important:** Eloquent defaults to a primary key named `id`. Every model with a
> custom PK must declare `protected $primaryKey = '...';`. Otherwise `find()` and
> relationships break with `column "id" does not exist`.

### Foreign keys
All user references point to `auth.users(id)` (UUID), **not** the stock Laravel
`users` table — except `user_info.user_id`, whose FK was dropped so admins can add
cadets who have no Supabase account yet.

---

## 5. Routes reference

Run `php artisan route:list --except-vendor` for the full list. Summary:

| Route | Permission |
| --- | --- |
| `/dashboard`, `/cadet/portal`, `/settings`, `PUT /settings/profile` | any user with a profile |
| `PUT /settings/system` | `settings.system` (Admin) |
| `/qr-scanner`, `/api/events`, `/api/attendance/recent`, `POST /api/attendance/scan`, `PATCH /api/attendance/{id}/status` | `scan` |
| `/attendance` | `attendance.view` |
| `/cadets` (GET/POST/PUT/DELETE) | `cadets.manage` (+ `cadets.assign`, `roles.assign`, `cadets.delete` for those fields/actions) |
| `/events` (GET/POST/PUT/DELETE) | `events.manage` |
| `/reports`, `/reports/export-excel` | `reports.view` |
| `POST /cadets/archive`, `POST /cadets/{id}/restore`, `DELETE /cadets/{id}` (= archive) | `cadets.delete` (Admin) |
| `/settings/school-year/*` (start, edit, backup, close, restore) | `school_year.manage` (Admin) |
| `POST /settings/platoons/{platoon}/units`, `DELETE /settings/platoon-units/{unit}` | `platoons.manage` (Admin) |

### Scan API

```http
POST /api/attendance/scan
{ "code": "<QR token or student ID>", "session_id": 1, "scan_type": "in" | "out" }
```

- `200` recorded (`present` or `late` from the session's late time)
- `409` already recorded → the scanner shows the change-status prompt, which calls
  `PATCH /api/attendance/{record_id}/status { "status": "present|late|excused|absent" }`
- `403` dropped cadet · `404` no exact match

---

## 6. Automatic absences

`public.mark_absent_cadets()` inserts an `absent` record for every **active, non-archived
Cadet or Aspirant** with no record for a session whose end time (Asia/Manila) has passed. Cadets added
after a session ended are skipped. `pg_cron` runs it every 5 minutes
(job `mark-absent-cadets`); `php artisan rotc:mark-absent` runs it on demand. A scanner
can still change an automatic absence to present/late/excused.

### All scheduled database jobs (pg_cron on master-db)

| Job | When (Manila) | Function | What it does |
| --- | --- | --- | --- |
| `mark-absent-cadets` | every 5 min | `mark_absent_cadets()` | absent for ended sessions without a scan |
| `purge-archived-records` | daily 03:17 | `purge_archived_records()` | deletes archives older than 30 days; logins 1 year after archiving |
| `ensure-school-year` | daily 00:05 | `ensure_school_year()` | starts the next school year on its start date when none is active |

---

## 6a. Who can sign up

- **Cadets (self sign-up):** student ID `YYYY-NNNNN` where `YYYY` is the active school
  year's `enrollment_year`, and the number must match the USeP email
  (`caupepito00107@usep.edu.ph` ↔ `xxxx-00107`). See `App\Support\Enrollment`.
- **Officers / Admins (upper years):** an admin pre-adds them on Cadets → Add Cadet with
  that role (or `rotc:make-admin`). When they register with that email the account is
  linked to the profile: no first-year check, platoon/specialization optional, and they
  are not tagged to a school year (never archived with a batch).
- `php artisan rotc:make-admin <email> [--first= --last= --student-id=]` promotes an
  existing profile, creates one linked to an existing login, or pre-creates one.

## 6b. School years and archiving

- Admin: **Settings → School year**. Closing a year requires downloading the backup
  (.xlsx: attendance sheets + Profiles / Events / Records) within 15 minutes and typing
  `ARCHIVE <name>`. It archives that year's cadets/aspirants, events and attendance.
- Restore within 30 days (only when no other year is active). After 30 days the daily
  job deletes the data; login accounts are deleted 1 year after archiving.
- Single / bulk archive on the Cadets page (bulk needs `ARCHIVE <count>`); archived users
  are logged out and can't be scanned.
- The next year starts automatically; admins see a banner 2 weeks before the end date.

## 6c. Platoon numbers

Admins manage numbers per platoon in **Settings → Platoon numbers** (add the next free
number; remove only when nobody is assigned). Sign-up, Settings and Cadets show a number
picker filtered by the chosen platoon; it is required when that platoon has numbers.
Labels read "Golf 1st" everywhere and the Excel export has one sheet per numbered platoon.

## 6d. Welcome page video

Admins paste a YouTube link in **Settings → System settings → Welcome page video**
(`utilities.welcome_video_url`). `App\Support\YouTube::videoId()` accepts watch,
`youtu.be`, Shorts, live and embed links; the page embeds it via youtube-nocookie.com.

---

## 7. Frontend

- **Layouts:** `AuthenticatedLayout` (permission-driven sidebar, flash messages),
  `GuestLayout`
- **Shared components:** `CadetQrCode` (qrcode.react + PNG download), `MyAttendance`,
  `StatusBadge`, `FormField` / `SelectField` / `toOptions`, `RegisterSteps`, `StatusMessage`
- **Design system:** `resources/css/app.css` (`btn-primary`, `card`, `input-field`, …)

---

## 8. Troubleshooting

| Error | Cause | Fix |
| --- | --- | --- |
| `could not find driver (Connection: pgsql)` | `pdo_pgsql` disabled | enable it in `php.ini` |
| `relation "sessions" does not exist` | `SESSION_DRIVER=database` but no table | run the sessions migration |
| Login succeeds, then redirects back to `/login` | expiry key mismatch in session | use `supabase_token_expires_at` in both places |
| `column "id" does not exist` | model missing `$primaryKey` | declare the real PK name |
| `/api/api/...` 404 | double prefix | do not add `->prefix('api')` inside `routes/api.php` |
| `Session store not set on request` | API route without `web` middleware | use `['web', 'supabase.auth']` |
| `relation "users" does not exist` in migrations | FKs pointed to stock `users` | reference `auth.users` |
| `utilities` missing | table dropped but migration recorded as run | delete the migration row and re-run it |
| Vite build fails on CSS | non-CSS content in `app.css` | keep only Tailwind/CSS in that file |

---

## 9. Useful commands

```bash
# see routes
php artisan route:list
php artisan route:list --path=api

# check migrations
php artisan migrate:status

# clear caches after .env / route changes
php artisan optimize:clear

# rebuild frontend
npm run build

# seed demo data for QR testing
php artisan db:seed --class=DemoSeeder
```

---

## 10. What to work on next

See **[TODO.md](TODO.md)**.
