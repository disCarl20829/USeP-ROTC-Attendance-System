# Developer Guide

This guide explains how the system works, how to run it, and — most importantly —
the auth flow, Supabase setup, routes and automatic absences.

---

## 1. How the pieces fit together

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

## 3. Authentication flow

All auth goes through Supabase Auth's REST API (`app/Services/Supabase.php`). Laravel
never stores passwords; it keeps the Supabase tokens in the Laravel session.

| Step | Route | What happens |
| --- | --- | --- |
| Register | `POST /register` | `signup` with first/last name as user metadata → `/register/verify` |
| Verify (code) | `POST /register/verify` | `verify` (type `email`) → session stored → `/setup` |
| Verify (link) | `GET /auth/confirm?token_hash=…&type=email` | same, from the email link |
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

1. **Authentication → URL Configuration → Site URL**: the app URL
   (e.g. `https://rotc.example.com`, or `http://127.0.0.1:8000` locally).
2. **Authentication → Emails → Templates**
   - *Confirm signup*:
     ```html
     <h2>Confirm your USeP ROTC account</h2>
     <p>Your verification code is:</p>
     <p style="font-size:28px;font-weight:bold;letter-spacing:6px">{{ .Token }}</p>
     <p>Or click: <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Confirm my email</a></p>
     ```
   - *Reset password*:
     ```html
     <h2>Reset your USeP ROTC password</h2>
     <p>Your reset code is:</p>
     <p style="font-size:28px;font-weight:bold;letter-spacing:6px">{{ .Token }}</p>
     <p>Or click: <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery">Reset my password</a></p>
     ```
3. **Authentication → Emails → SMTP Settings**: set up custom SMTP (e.g. a Gmail
   app password, Resend, Brevo). The built-in mailer sends only a few emails per hour.
4. **Authentication → Providers → Email**: keep *Confirm email* **on**.

---

## 4. Database

The source of truth is `rotcu_usep.sql` (applied in the Supabase SQL Editor). The
Laravel migrations mirror it.

### Tables and primary keys

| Table | Primary key | Notes |
| --- | --- | --- |
| `campus_list` | `campus_id` | |
| `course_list` | `course_id` | |
| `platoon_list` | `platoon_id` | |
| `role_list` | `role_id` | organizational rank, not auth role |
| `permission_list` | `permission_id` | |
| `role_permissions` | `(role_id, permission_id)` | composite |
| `user_info` | `info_id` | `user_id` UUID (FK dropped); `student_id` (unique), `status` (active/dropped), `specialization_id`, `platoon_id` (optional) |
| `formations_event` | `formation_id` | |
| `formation_sessions` | `session_id` | unique `(formation_id, session_type)` |
| `attendance_qr` | `qr_id` | one private `qr_token` per cadet; this is what the QR encodes |
| `attendance_records` | `record_id` | unique `(user_id, session_id)`; status present/late/excused/absent |
| `specialization_list` | `specialization_id` | includes "Unspecified" |
| `utilities` | `id` (always `1`) | default times |
| `sessions` | `id` | Laravel session store (added by migration) |

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

`public.mark_absent_cadets()` inserts an `absent` record for every **active Cadet**
with no record for a session whose end time (Asia/Manila) has passed. Cadets added
after a session ended are skipped. `pg_cron` runs it every 5 minutes
(job `mark-absent-cadets`); `php artisan rotc:mark-absent` runs it on demand. A scanner
can still change an automatic absence to present/late/excused.

---

## 7. Frontend

- **Layouts:** `AuthenticatedLayout` (permission-driven sidebar, flash messages),
  `GuestLayout`
- **Shared components:** `CadetQrCode` (qrcode.react + PNG download), `MyAttendance`,
  `StatusBadge`, `FormField` / `SelectField` / `toOptions`, `RegisterSteps`, `StatusMessage`
- **Design system:** `resources/css/app.css` (`btn-primary`, `card`, `input-field`, …)

---

## 8. Common errors and fixes

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
