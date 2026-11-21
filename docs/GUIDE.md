# Developer Guide

This guide explains how the system works, how to run it, and — most importantly —
**how to test the QR attendance flow**.

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

### Login
1. `POST /login` → `App\Http\Controllers\AuthController@login`
2. Laravel calls Supabase:
   `POST /auth/v1/token?grant_type=password`
3. The token is verified with `GET /auth/v1/user` (server-side).
4. Only `@usep.edu.ph` emails are accepted.
5. Laravel stores these **session keys**:

| Key | Meaning |
| --- | --- |
| `supabase_access_token` | Bearer token for Supabase API calls |
| `supabase_refresh_token` | Refresh token (not used yet) |
| `supabase_user_id` | Supabase `auth.users.id` (UUID) |
| `supabase_email` | Verified email |
| `supabase_token_expires_at` | Unix timestamp of expiry |

6. Redirect → `/dashboard`.

### Guard

`App\Http\Middleware\SupabaseAuth` runs on every protected page and API route.
It checks the token exists and the expiry is in the future; otherwise it clears the
session and redirects to `/login`.

> ⚠️ **Critical:** `AuthController` writes `supabase_token_expires_at`.
> The middleware must read the **same** key. A mismatch here causes the classic
> "login succeeds but I get bounced back to the login page" bug.

### Shared user (Inertia)

`HandleInertiaRequests` builds `auth.user` from the session (Laravel's own guard is
unused, so `$request->user()` is `null`):

```php
[
  'id' => '<uuid>',
  'name' => 'First Last',      // from user_info, or email prefix
  'email' => 'user@usep.edu.ph',
  'is_system_admin' => false,
]
```

### Token lifetime

Supabase access tokens expire after ~1 hour. **Refresh is not implemented yet**, so
after about an hour you will be redirected to log in again. See TODO.

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
| `user_info` | `info_id` | `user_id` UUID (FK dropped); also `student_id_number`, `status` |
| `formations_event` | `formation_id` | |
| `formation_sessions` | `session_id` | unique `(formation_id, session_type)` |
| `attendance_qr` | `qr_id` | legacy UUID token; QR now encodes `student_id_number` |
| `attendance_records` | `record_id` | unique `(user_id, session_id)` |
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

Most data now flows through **Inertia web routes** (`routes/web.php`): controllers
render a page with props, and forms submit with Inertia's `useForm` / `router`.
Only the QR scanner uses JSON endpoints in `routes/api.php`.

### Role groups (`routes/web.php`)

Every group sits inside `supabase.auth`, and the `role:` middleware
(`EnsureUserRole`) checks `user_info.role.role_name`. System admins
(`is_system_admin`) bypass all checks.

| Group | Roles | Routes |
| --- | --- | --- |
| Any user | — | `GET /dashboard`, `/profile` |
| Cadet portal | cadet, aspirant, officer, admin, test | `GET /cadet/portal` |
| Scanner | aspirant, officer, scanner, admin, test | `GET /attendance`, `GET /qr-scanner` |
| Management | admin, officer, system admin, test | `/cadets`, `/events`, `/reports`, `/reports/export-excel`, `GET /settings` |

> ⚠️ `EnsureUserRole` currently **fails open** (missing profile, empty role, or any
> role other than `cadet` is allowed through). See [TODO](TODO.md#p0--broken-or-security-relevant).

### Cadets
```http
GET    /cadets
POST   /cadets
PUT    /cadets/{info_id}
DELETE /cadets/{info_id}
```

Create payload (`CadetController@store`):
```json
{
  "first_name": "Juan",
  "last_name": "Dela Cruz",
  "email": "juan@usep.edu.ph",
  "student_id_number": "2023-00123",
  "course_id": 1,
  "campus_id": 1,
  "platoon_id": 1,
  "role_id": 4
}
```

- A random `user_id` UUID is generated (the cadet does not need a Supabase account yet).
- `campus_id` defaults to `1`, `role_id` to `4` (Cadet), `status` to `active`.
- Update also accepts `status: active | dropped` (drop / re-enroll).

### Events
```http
GET    /events
POST   /events
PUT    /events/{formation_id}
DELETE /events/{formation_id}
```

Create payload (`EventController@store`):
```json
{
  "formation_name": "Morning Formation",
  "formation_date": "2026-11-22",
  "formation_type": "whole_day",
  "location": "Grandstand",
  "start_time": "06:00",
  "end_time": "08:00"
}
```

### Reports
```http
GET /reports                 # LE 1 attendance points matrix
GET /reports/export-excel    # color-coded .xls download
```

Scoring: **present = 10**, **late = `points` or 5**, **absent = `A`**.

### Settings
```http
GET /settings
PUT /settings   # ⚠️ called by the page, but the route is not registered yet
```

### Scanner JSON API (`routes/api.php`)

Prefixed with `/api`, protected by `['web', 'supabase.auth']` (session + CSRF). In the
browser, `axios` sends the session cookie automatically.

```http
GET  /api/events            # events + sessions for the dropdown
GET  /api/attendance
POST /api/attendance
POST /api/attendance/scan
```

Scan payload:
```json
{
  "student_id_number": "2023-00123",
  "session_id": 1,
  "scan_type": "In",
  "scanned_by": "<supabase uuid>"
}
```

The endpoint:
1. Finds the cadet by student ID number (the value encoded in their QR).
2. Loads the session.
3. **In:** sets `time_in`; marks `late` if now (Asia/Manila) is past `late_time`,
   otherwise `present`.
4. **Out:** sets `time_out` / `time_out_scanned_by`; rejects a second time-out.

---

## 6. Testing the QR flow

1. Log in as an admin/officer.
2. **Cadets → Add Cadet** with a student ID number.
3. **Events → Create** an event for today with a session.
4. Get the cadet's QR: log in as that cadet and open the **Cadet Portal** /
   **Dashboard**, or just type the student ID number into the scanner.
5. Open **QR Scanner**, pick the session and **In**, start the camera and scan
   (or type the ID and press Enter).
6. The result card shows **Present** / **Late**; the scan appears under *Recent Scans*
   and on **Attendance** and **Reports**.

> Camera access needs a secure context: `http://localhost` / `127.0.0.1` works; a phone
> on the LAN needs HTTPS.

### DemoSeeder

```bash
php artisan db:seed --class=DemoSeeder
```

Creates lookup data, a "Demo Cadet" profile for the first `auth.users` row, and a demo
formation + morning session. ⚠️ It still prints a UUID **QR token** from the old flow;
scanning now uses the student ID number, so set `user_info.student_id_number` for the demo
cadet and scan/type that instead.

### Quick API test from the browser console

```js
await axios.get('/api/events');
await axios.post('/api/attendance/scan', {
  student_id_number: '2023-00123',
  session_id: 1,
  scan_type: 'In',
  scanned_by: '<your supabase uuid>',
});
```

> Tip: your Supabase UUID is available in the page props (`auth.user.id`).

---

## 7. Frontend

- **Layout:** `resources/js/Layouts/AuthenticatedLayout.jsx` (sidebar hides links by
  role: cadets see Dashboard only, scanners/aspirants see Attendance + QR Scanner)
- **Design system:** `resources/css/app.css`
  - `btn-primary`, `btn-secondary`, `btn-danger`
  - `card`, `stat-card`
  - `input-field`, `label-text`
  - `sidebar-link`, `sidebar-link-active`
  - `table-header`, `table-cell`
  - Brand colors: `#7B1E1E` (maroon), `#5C1515` (dark), `#D4A843` (gold)
- **Pages:** `resources/js/Pages/*.jsx`
- **Ziggy** provides the global `route()` helper (`@routes` in `app.blade.php`).
- **QR libraries:** `html5-qrcode` (scanner), `qrcode.react` (installed). Dashboard and
  Cadet Portal currently use `api.qrserver.com` for the QR image.

### Page wiring status

| Page | Data source | Status |
| --- | --- | --- |
| Dashboard | Inertia props (stats, activity, events) | ✅ wired |
| Cadet Portal | Inertia props (cadet, events) | ✅ wired |
| Cadets | Inertia props + `/cadets` routes | ✅ wired |
| Events | Inertia props + `/events` routes | ✅ wired |
| Attendance | Inertia props (session roster) | ✅ wired |
| QR Scanner | `/api/events`, `/api/attendance`, `/api/attendance/scan` | ✅ camera + manual |
| Reports | Inertia props + `/reports/export-excel` | ✅ wired (hardcoded 19 sessions) |
| Settings | Inertia props + `PUT /settings` | 🟡 loads; save route missing |

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

See **[TODO.md](TODO.md)**. The short version:

1. Add the missing `PUT /settings` route.
2. Tighten role enforcement and the scanner's cadet lookup.
3. Render QR codes locally with `qrcode.react`.
4. Make Reports / Excel export use the real session count.
5. Supabase token refresh, `/profile`, and tests.
