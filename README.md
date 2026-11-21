# USeP ROTC QR Attendance System

A web-based attendance system for the **USeP ROTC Unit (Tagum-Mabini Campus)**.
Each cadet has a personal QR code (encoding their student ID number). Officers scan it
with a phone or laptop camera, and attendance is recorded per formation session
(morning / afternoon) with time-in / time-out and `present`, `late`, or `absent` status.
Attendance is then converted into points for the **LE 1: Attendance (30%)** grade sheet.

> **Stack:** Laravel 12 · Inertia.js 2 · React 18 · Tailwind CSS 4 · Vite 7
> **Database / Auth:** Supabase (PostgreSQL + Supabase Auth REST API)
> **QR:** `html5-qrcode` (camera scanning) · `qrcode.react` / qrserver.com (QR images)

---

## Project status

| Phase | Scope | Status |
| --- | --- | --- |
| 1 | Database migrations + Eloquent models | ✅ Done |
| 2 | Controllers, routes, validation, QR assignment | ✅ Done |
| 3 | Frontend wired to real data (all pages) | ✅ Done |
| 4 | Camera QR scanning + cadet QR display/download | ✅ Done |
| 5 | Role-based access | 🟡 Partial (see [known limitations](#known-limitations)) |
| 6 | Auth polish (token refresh, profile), tests, deployment | ❌ Not started |

> See **[docs/TODO.md](docs/TODO.md)** for the full, prioritized list of what is left.

---

## How it works

1. **Login** with a `@usep.edu.ph` account (Supabase Auth).
2. **Role-based access** — the `role` middleware decides which pages a user sees
   (cadet portal, scanner/attendance, or admin management).
3. **Admin setup** — officers/admins add cadets (with student ID number) and create
   formation events with morning/afternoon sessions.
4. **Cadets** open the **Cadet Portal** to view/download their personal QR code and see
   upcoming events.
5. **Scanning** — on `/qr-scanner`, choose a session and **In** or **Out**, then scan.
   Time-in after the session's `late_time` is marked `late`.
6. **Reporting** — `/reports` shows the attendance points grid (10 pts present,
   5 pts late, `A` absent) and exports a color-coded Excel sheet.

---

## Features

### Working
- Supabase Auth login / registration / logout (USeP email domain enforced)
- Session-based auth guard for all protected pages and API routes
- **Dashboard** with live stats, recent activity, upcoming events, and the user's QR code
- **Cadets** — add, edit, search, **drop / re-enroll** (`active` / `dropped` status)
- **Events** — create / edit / delete formation events with sessions
- **QR Scanner** — camera scanning (`html5-qrcode`, rear camera), time-in **and** time-out,
  present/late detection, recent scans list, manual fallback
- **Attendance** — per-session roster with present/late/absent counts, search and
  status filter, flags cadets with 3+ absences
- **Cadet Portal** (`/cadet/portal`) — personal QR code (download as PNG) and upcoming events
- **Reports** — LE 1 attendance points matrix + **Excel export** (`.xls`)
- **Settings** page (profile + default start / end / late times)

### Partially working / known gaps
- **Settings save** — the page submits `PUT /settings`, but no such route is registered,
  so saving default times currently fails.
- **Role enforcement** is permissive (fails open). See [known limitations](#known-limitations).
- **Reports** assume a 19-session semester in places (see known limitations).

### Not built yet
- Supabase token refresh
- Working `/profile` page under Supabase auth
- Automated tests and real reference-data seeders
- Deployment setup

---

## Quick start

### Requirements
- PHP **8.2+** with the **`pdo_pgsql`** extension enabled
- Composer
- Node.js **18+** and npm
- Access to the Supabase project (database + auth)

### 1. Install dependencies

```bash
composer install
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` (if missing) and set:

```env
APP_URL=http://127.0.0.1:8000
APP_KEY=base64:...           # php artisan key:generate

DB_CONNECTION=pgsql
DB_HOST=db.<project-ref>.supabase.co
DB_PORT=5432
DB_DATABASE=postgres
DB_USERNAME=postgres
DB_PASSWORD=<your-password>

SESSION_DRIVER=database

SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
```

### 3. Prepare the database

```bash
php artisan migrate
php artisan optimize:clear
```

> The tables must match `rotcu_usep.sql` (custom primary keys such as `campus_id`,
> `info_id`, `session_id`, and foreign keys to `auth.users`).
> The app also expects `user_info.student_id_number`, `user_info.status`
> (`active` / `dropped`), and **no** foreign key on `user_info.user_id` (so cadets can
> be added before they have a Supabase account). The FK is dropped by a migration, but
> the `add_student_id_to_user_info_table` migration is **empty** — those columns
> currently exist only in the Supabase database.
> See **[docs/GUIDE.md](docs/GUIDE.md#4-database)** for details.

### 4. Run the app

```bash
# terminal 1
php artisan serve

# terminal 2
npm run dev
```

Open <http://127.0.0.1:8000> and sign in with a **@usep.edu.ph** account.

> Camera scanning needs a **secure context**: `localhost`/`127.0.0.1` works, but
> testing from a phone on your LAN requires HTTPS (e.g. a tunnel).

---

## Main routes

All pages below require login (`supabase.auth`) and are grouped by the `role` middleware.

| Route | Roles | Description |
| --- | --- | --- |
| `/` | public | Landing page |
| `/login`, `/register` | guest | Supabase Auth |
| `/dashboard` | any logged-in user | Dashboard + own QR |
| `/cadet/portal` | cadet, aspirant, officer, admin | Personal QR + upcoming events |
| `/qr-scanner` | aspirant, officer, scanner, admin | Camera QR scanner |
| `/attendance` | aspirant, officer, scanner, admin | Session roster |
| `/cadets` (GET/POST), `/cadets/{id}` (PUT/DELETE) | admin, officer, system admin | Cadet management |
| `/events` (GET/POST), `/events/{id}` (PUT/DELETE) | admin, officer, system admin | Formation events |
| `/reports` | admin, officer, system admin | Points grid |
| `/reports/export-excel` | admin, officer, system admin | Download `.xls` sheet |
| `/settings` | admin, officer, system admin | Settings |

JSON endpoints (used by the scanner via axios) live under `/api` and require a session:

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/events` | Events + sessions for the scanner dropdown |
| POST | `/api/attendance/scan` | Record a time-in / time-out scan |
| GET/POST | `/api/attendance` | List / create attendance records |

> The `test` role is also allowed on every group — remove it before production.

---

## Project structure

```text
app/
├── Http/
│   ├── Controllers/
│   │   ├── Attendance/            # Attendance, QR scan, reports + Excel export
│   │   ├── AuthController.php     # Supabase login / register / logout
│   │   ├── CadetPortalController.php
│   │   └── ...                    # Cadet, Event, Dashboard, Settings
│   ├── Middleware/
│   │   ├── SupabaseAuth.php       # Session guard
│   │   ├── EnsureUserRole.php     # `role:` middleware
│   │   └── HandleInertiaRequests.php
│   └── Requests/                  # Validation
├── Models/                        # Eloquent models (custom PKs)
database/
├── migrations/                    # Mirrors rotcu_usep.sql (+ student_id changes)
└── seeders/                       # DatabaseSeeder, DemoSeeder
resources/
├── css/app.css                    # Design system (maroon & gold)
└── js/
    ├── Layouts/                   # AuthenticatedLayout (role-aware nav), GuestLayout
    └── Pages/                     # Inertia pages (incl. CadetPortal)
routes/
├── web.php                        # Inertia pages + role groups
├── api.php                        # JSON endpoints for the scanner
└── auth.php                       # Supabase auth routes
```

---

## Documentation

- **[docs/GUIDE.md](docs/GUIDE.md)** — setup, architecture, auth flow, routes, and
  how to test the QR flow
- **[docs/TODO.md](docs/TODO.md)** — what is not done yet
- **[CHANGELOG.md](CHANGELOG.md)** — what changed and when

---

## Known limitations

- **Role middleware fails open.** `EnsureUserRole` lets a user through if no
  `user_info` row matches, if their role is empty, or if the role is anything other
  than `cadet`. It also matches users by a loose `LIKE %email-prefix%` query, which can
  match the wrong person.
- **Reports use hardcoded sizes.** The points view falls back to 19 sessions when none
  exist, and the Excel export always writes 19 session columns with a fixed 190-point
  total, regardless of how many sessions there really are.
- **QR images are generated by an external service** (`api.qrserver.com`) on the
  Dashboard and Cadet Portal, so each cadet's QR value is sent to a third party.
- **Scanner cadet lookup is loose** — besides the exact student ID, it matches
  `email LIKE %scanned-value%`, so a short or partial value can record attendance for
  the wrong cadet.
- **Settings save is broken** — there is no `PUT /settings` route.
- The Supabase **access token expires after ~1 hour** and is not refreshed yet.
- `/profile` still uses Laravel's `$request->user()`, which is `null` under
  Supabase auth — that page is not usable yet.
- `SESSION_DRIVER=database` requires the `sessions` table (created by migration).
