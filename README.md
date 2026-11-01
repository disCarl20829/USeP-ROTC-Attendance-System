# USeP ROTC QR Attendance System

A web-based attendance system for the **USeP ROTC Unit (Tagum-Mabini Campus)**.
Cadets are identified by a QR code, and attendance is recorded per formation session
(morning / afternoon) with `present`, `late`, or `absent` status.

> **Stack:** Laravel 12 · Inertia.js 2 · React 18 · Tailwind CSS 4 · Vite 7
> **Database / Auth:** Supabase (PostgreSQL + Supabase Auth REST API)

---

## Project status

| Phase | Scope | Status |
| --- | --- | --- |
| 1 | Database migrations + Eloquent models | ✅ Done |
| 2 | Controllers, routes, Form Requests, QR auto-assignment | ✅ Done |
| 3 | Frontend wiring (React ↔ API) + modern UI | 🟡 Partial |
| 4 | QR camera scanning / QR image generation | ❌ Not started |
| 5 | Auth polish (token refresh, profile), tests, deployment | ❌ Not started |

> See **[docs/TODO.md](docs/TODO.md)** for the full, prioritized list of what is left.

---

## Features

### Working
- Supabase Auth login / registration / logout (USeP email domain enforced)
- Session-based auth guard for all protected pages and API routes
- Cadet CRUD API with **automatic QR token generation**
- Formation events + morning/afternoon sessions
- QR scan endpoint (marks `present` / `late` based on `late_time`)
- Attendance records + reports summary API
- Settings (default start / end / late times) API
- Modernized Inertia/React UI with the USeP maroon & gold theme

### Partially working
- **QR Scanner page** — the API flow is wired, but input is a **manual token field**.
  There is no camera scanning and no QR image display yet.
- **Frontend pages** — only the QR Scanner uses the API. Dashboard, Cadets, Events,
  Attendance, Reports and Settings still render **static mock data**.

### Not built yet
- QR code image generation / printable cadet IDs
- Camera-based scanning
- Cadet creation/edit UI (the "Add Cadet" button does nothing yet)
- Role / permission enforcement
- Automated tests and seeders for real data

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
> See **[docs/GUIDE.md](docs/GUIDE.md#database)** for details.

### 4. Run the app

```bash
# terminal 1
php artisan serve

# terminal 2
npm run dev
```

Open <http://127.0.0.1:8000> and sign in with a **@usep.edu.ph** account.

---

## Main routes

| Route | Type | Description |
| --- | --- | --- |
| `/` | Page | Public landing page |
| `/login`, `/register` | Page | Supabase Auth |
| `/dashboard` | Page | Dashboard |
| `/cadets` | Page | Cadet management |
| `/events` | Page | Formation events |
| `/attendance` | Page | Attendance records |
| `/qr-scanner` | Page | QR scanner |
| `/reports` | Page | Reports |
| `/settings` | Page | Default time settings |

All API endpoints live under `/api` and require a logged-in session:

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/dashboard` | Dashboard stats |
| GET/POST | `/api/cadets` | List / create cadets |
| PUT/DELETE | `/api/cadets/{id}` | Update / delete cadet |
| GET/POST | `/api/events` | List / create events (with sessions) |
| PUT/DELETE | `/api/events/{id}` | Update / delete event |
| GET/POST | `/api/attendance` | List / create attendance records |
| POST | `/api/attendance/scan` | Scan a QR token |
| GET | `/api/reports` | Records + summary |
| GET/PUT | `/api/settings` | Default times |

---

## Project structure

```text
app/
├── Http/
│   ├── Controllers/            # Page + API controllers
│   │   ├── Attendance/         # Attendance, QR scan, reports
│   │   ├── AuthController.php  # Supabase login / register / logout
│   │   └── ...
│   ├── Middleware/
│   │   ├── SupabaseAuth.php        # Session guard
│   │   └── HandleInertiaRequests.php
│   └── Requests/               # Validation
├── Models/                     # Eloquent models (custom PKs)
database/
├── migrations/                 # Mirrors rotcu_usep.sql
└── seeders/
resources/
├── css/app.css                 # Design system (maroon & gold)
└── js/
    ├── Layouts/                # AuthenticatedLayout, GuestLayout
    └── Pages/                  # Inertia pages
routes/
├── web.php                     # Inertia pages
├── api.php                     # JSON API
└── auth.php                    # Supabase auth routes
```

---

## Documentation

- **[docs/GUIDE.md](docs/GUIDE.md)** — setup, architecture, auth flow, API details,
  and **how to test the QR flow today**
- **[docs/TODO.md](docs/TODO.md)** — what is not done yet (dynamic wiring checklist)
- **[CHANGELOG.md](CHANGELOG.md)** — what changed and when

---

## Known limitations

- The Supabase **access token expires after ~1 hour** and is not refreshed yet.
- `SESSION_DRIVER=database` requires the `sessions` table (created by migration).
- The scan flow needs existing reference data (campus, course, role, platoon).
- `/profile` still uses Laravel's `$request->user()`, which is `null` under
  Supabase auth — that page is not usable yet.
