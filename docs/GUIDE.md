# Developer Guide

This guide explains how the system works, how to run it, and — most importantly —
**how to test the QR attendance flow today**.

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
- **API routes** are used for dynamic actions (fetching lists, scanning QR codes).
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
| `user_info` | `info_id` | `user_id` UUID → `auth.users.id` |
| `formations_event` | `formation_id` | |
| `formation_sessions` | `session_id` | unique `(formation_id, session_type)` |
| `attendance_qr` | `qr_id` | one row per cadet, `qr_token` UUID |
| `attendance_records` | `record_id` | unique `(user_id, session_id)` |
| `utilities` | `id` (always `1`) | default times |
| `sessions` | `id` | Laravel session store (added by migration) |

> **Important:** Eloquent defaults to a primary key named `id`. Every model with a
> custom PK must declare `protected $primaryKey = '...';`. Otherwise `find()` and
> relationships break with `column "id" does not exist`.

### Foreign keys
All user references point to `auth.users(id)` (UUID), **not** the stock Laravel
`users` table.

---

## 5. API reference

All routes are in `routes/api.php`, prefixed with `/api`, and protected by
`['web', 'supabase.auth']` (session + CSRF).

> Because they use the `web` group, requests must include the session cookie.
> In the browser, `axios` does this automatically.

### Cadets
```http
GET    /api/cadets
POST   /api/cadets
PUT    /api/cadets/{info_id}
DELETE /api/cadets/{info_id}
```

Create payload:
```json
{
  "user_id": "<supabase uuid>",
  "first_name": "Juan",
  "last_name": "Dela Cruz",
  "email": "juan@usep.edu.ph",
  "campus_id": 1,
  "course_id": 1,
  "role_id": 1,
  "platoon_id": 1,
  "placement": 1,
  "is_system_admin": false
}
```

Creating a cadet **automatically creates** an `attendance_qr` row with a fresh UUID
token (see `CadetController@store`).

### Events
```http
GET    /api/events
POST   /api/events
PUT    /api/events/{formation_id}
DELETE /api/events/{formation_id}
```

Create payload (sessions are optional but needed for scanning):
```json
{
  "formation_name": "Morning Formation",
  "formation_date": "2026-10-26",
  "formation_type": "whole_day",
  "created_by": "<supabase uuid>",
  "sessions": [
    {
      "session_type": "morning",
      "start_time": "06:00",
      "end_time": "08:00",
      "late_time": "06:15"
    }
  ]
}
```

### Attendance
```http
GET  /api/attendance
POST /api/attendance
POST /api/attendance/scan
```

Scan payload:
```json
{
  "qr_token": "<uuid from attendance_qr>",
  "session_id": 1,
  "scanned_by": "<supabase uuid>"
}
```

The endpoint:
1. Finds an **active** QR token.
2. Loads the cadet (`user_info`) and the session.
3. Marks `late` if the current time is past `late_time`, otherwise `present`.
4. `updateOrCreate`s `attendance_records` on `(user_id, session_id)`.

### Reports / Settings
```http
GET /api/reports
GET /api/settings
PUT /api/settings
```

---

## 6. Testing the QR flow today

The QR **backend works**, but the frontend currently has:
- ❌ no camera scanning
- ❌ no QR image generation
- ❌ no cadet creation UI
- ✅ a **manual QR-token input** on `/qr-scanner`

So you test it with a token copied from the database.

### Fast path (recommended)

The `DemoSeeder` creates the minimum data using **your own Supabase account**
(the first row in `auth.users`):

```bash
php artisan db:seed --class=DemoSeeder
```

It will:
- create campus / course / platoon / role lookups if missing
- create a `user_info` row for that account (if missing) — named **"Demo Cadet"**,
  which is what the sidebar will display
- create an `attendance_qr` token
- create a demo formation + morning session
- **print the QR token and session ID** to the console

> Re-running the seeder is safe (it uses `firstOrCreate`) and prints the same token.
>
> To use your real name instead of "Demo Cadet":
> ```sql
> update user_info
>    set first_name = 'Your', last_name = 'Name'
>  where email = 'you@usep.edu.ph';
> ```

Then:
1. Open `/qr-scanner`
2. Select the demo session in the dropdown
3. Paste the printed QR token
4. Click **Start Scanning**
5. The result card should show **Present** (or **Late**), and the record appears under
   *Recent Scans*.

### Manual path (SQL)

```sql
-- 1. reference data
insert into campus_list (campus_name) values ('Tagum-Mabini Campus') returning campus_id;
insert into course_list (course_name) values ('BSIT') returning course_id;
insert into platoon_list (platoon_name) values ('Alpha') returning platoon_id;
insert into role_list (role_name) values ('Cadet') returning role_id;

-- 2. a cadet profile (user_id must exist in auth.users)
insert into user_info
  (user_id, first_name, last_name, email, campus_id, course_id, role_id, platoon_id, placement)
values
  ('<cadet-uuid>', 'Juan', 'Dela Cruz', 'juan@usep.edu.ph', 1, 1, 1, 1, 1)
returning info_id;

-- 3. QR token
insert into attendance_qr (user_id, qr_token)
values ('<cadet-uuid>', gen_random_uuid())
returning qr_token;

-- 4. formation + session
insert into formations_event
  (formation_name, formation_date, formation_type, created_by)
values
  ('Morning Formation', current_date, 'whole_day', '<your-uuid>')
returning formation_id;

insert into formation_sessions
  (formation_id, session_type, start_time, end_time, late_time)
values
  (<formation_id>, 'morning', '06:00', '08:00', '06:15')
returning session_id;
```

### Quick API test from the browser console

While logged in, open DevTools on any page:

```js
await axios.get('/api/events');
await axios.get('/api/attendance');

await axios.post('/api/attendance/scan', {
  qr_token: '<paste token>',
  session_id: 1,
  scanned_by: '<your supabase uuid>',
});
```

> Tip: your Supabase UUID is available in the page props (`auth.user.id`).

---

## 7. Frontend

- **Layout:** `resources/js/Layouts/AuthenticatedLayout.jsx` (sidebar, header)
- **Design system:** `resources/css/app.css`
  - `btn-primary`, `btn-secondary`, `btn-danger`
  - `card`, `stat-card`
  - `input-field`, `label-text`
  - `sidebar-link`, `sidebar-link-active`
  - `table-header`, `table-cell`
  - Brand colors: `#7B1E1E` (maroon), `#5C1515` (dark), `#D4A843` (gold)
- **Pages:** `resources/js/Pages/*.jsx`
- **Ziggy** provides the global `route()` helper (`@routes` in `app.blade.php`).

### Page wiring status

| Page | Data source | Status |
| --- | --- | --- |
| Dashboard | `stats` prop + mock arrays | 🟡 stats prop ignored |
| Cadets | static array | ❌ not wired |
| Events | static array | ❌ not wired |
| Attendance | static array | ❌ not wired |
| QR Scanner | `/api/events`, `/api/attendance`, `/api/attendance/scan` | 🟡 wired (manual token) |
| Reports | static arrays | ❌ not wired |
| Settings | none | ❌ not wired |

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

1. Wire the remaining pages to the API (Dashboard first).
2. Add a cadet creation/edit UI.
3. Add QR image generation + camera scanning.
4. Implement Supabase token refresh.
5. Add role/permission enforcement and tests.
