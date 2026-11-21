# Changelog

All notable changes to the **USeP ROTC QR Attendance System** are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased]

## [0.5.0] — 2026-11-21

### Added
- **3-step registration:** account info → email verification (6-digit code **or**
  link, with resend) → cadet details (student ID, campus, course filtered by campus,
  platoon, specialization). Role is always Cadet; profile + QR token are created and
  the user is logged in to the dashboard.
- Hand-added cadets are **linked** when they register with the same email; their
  attendance history moves to the new account.
- **Forgot password** via email (code or link) → set a new password. Also used for
  "Change password" from Settings.
- **Automatic token renewal:** the 1-hour Supabase access token is refreshed with the
  refresh token before it expires; if renewal fails the user is logged out with a message.
- **RBAC:** permission map in `config/rotc.php`, `permission:` middleware, deny by
  default, permission-driven sidebar. `rotc:make-admin` artisan command.
- **Auto-absent:** `mark_absent_cadets()` + `pg_cron` job every 5 minutes
  (`rotc:mark-absent` to run it by hand).
- **Excused** status; points Present 10 / Late 5 / Excused 8 / Absent 0 across
  Reports, Excel export, Attendance and Dashboard.
- **Re-scan prompt:** scanning a cadet twice asks whether to change the status.
- **Dashboard: my attendance** (counts, points, rate, recent sessions) for every user.
- Events store a location; event forms use the default times from Settings.
- Named, per-email rate limits (shared campus Wi-Fi no longer locks everyone out).

### Changed
- QR codes are drawn locally with `qrcode.react` and encode a private QR token
  (no more `api.qrserver.com`). Typed student IDs still work in the scanner.
- Scanner matches **only** an exact QR token or exact student ID (no partial email match).
- Dropped cadets cannot be scanned or have their status changed.
- Reports / Excel export use the real session count and max points (no hardcoded 19 / 190).
- Settings: own profile (name, student ID, campus, course) saves correctly; platoon /
  specialization locked for cadets; default times (admin) save correctly.
- All controllers rewritten against the real `master-db` columns (`student_id`, etc.).

### Fixed
- Missing `PUT /settings` route; `/profile` crash (Breeze profile removed, Settings
  replaces it); duplicate `/logout` route.
- **Timestamps were saved 8 hours off** (Manila times stored as UTC): the DB
  connection now uses `Asia/Manila`.
- `create_user_info_table` migration syntax error; empty `add_student_id` migration;
  `course_list.campus_name` missing from migrations. `php artisan migrate` now works
  on an empty database.

### Database (master-db)
- Removed the 1–3 specialization limit; `platoon_id` optional; `status` NOT NULL with
  check (`active`/`dropped`); unique student ID and email; attendance status check;
  `ON UPDATE CASCADE` on attendance/QR foreign keys; `formations_event.location`.
- Deleted the 7 unlinked test profiles (and their 3 records / 2 QR rows).

### Removed
- Breeze auth/profile controllers, pages and tests; `EnsureUserRole`; unused models
  and form requests.

---

## [0.4.0] — 2026-11-12

Mostly contributed by Jeeyan11 (Oct 30 – Nov 7), merged on Nov 12.

### Added
- **Camera QR scanning** on `/qr-scanner` with `html5-qrcode` (rear camera),
  **In / Out** scan types (time-in and time-out), recent scans list, and manual
  cadet-ID entry as a fallback. QR codes now encode the cadet's **student ID number**
  instead of an `attendance_qr` UUID token.
- **Cadet Portal** (`/cadet/portal`, `CadetPortalController`, `CadetPortal.jsx`) —
  personal QR code with PNG download and upcoming events.
- **Reports** rebuilt as the *LE 1: Attendance (30%)* points matrix
  (10 present / 5 late / `A` absent) with **color-coded Excel export**
  (`/reports/export-excel`, HTML-table `.xls`).
- **Cadet management**: add / edit modals, search, **drop and re-enroll**
  (`user_info.status`: `active` / `dropped`).
- **Events** page revamp: create / edit / delete formation events with sessions.
- **`EnsureUserRole` middleware** (`role:` alias) and role-grouped routes in
  `routes/web.php`; sidebar navigation now hides links by role.
- Migrations: `drop_user_id_foreign_from_user_info_table` (cadets can exist before
  they have a Supabase account) and an empty `add_student_id_to_user_info_table` stub.
- npm dependencies: `html5-qrcode`, `qrcode.react`.

### Changed
- **All pages use real data** — Dashboard (stats, recent activity, upcoming events,
  own QR), Cadets, Events, Attendance (session roster, filters, 3+ absence flag),
  Reports, Settings.
- Cadet, event, and report CRUD moved from `/api/*` JSON routes to Inertia web routes
  (`/cadets`, `/events`, `/reports`). `routes/api.php` now only serves the scanner
  (`/api/events`, `/api/attendance`, `/api/attendance/scan`).
- `HandleInertiaRequests` shares the user's role / scanner flags.

### Known issues introduced
- `PUT /settings` is called by the Settings page but no route exists.
- Role middleware fails open and matches users by loose email prefix.
- Scanner cadet lookup also matches `email LIKE %input%`.
- `add_student_id_to_user_info_table` migration is empty (columns added in Supabase by hand).
- Reports / Excel export hardcode 19 sessions and a 190-point total.
- Dashboard and Cadet Portal generate QR images via `api.qrserver.com`.

---

## [0.3.1] — 2026-10-25

### Added
- Documentation set: `README.md`, `docs/GUIDE.md`, `docs/TODO.md`, `CHANGELOG.md`
- `DemoSeeder` for quick QR-flow testing

---

## [0.3.0] — 2026-10-25

### Fixed — authentication
- **Login no longer bounces back to the login page.**
  `SupabaseAuth` read `supabase_expires_at`, but `AuthController@login` wrote
  `supabase_token_expires_at`. The guard now reads the correct key (and clears both).
- **`auth.user` is no longer `null`.**
  `HandleInertiaRequests` now builds the shared user from the Supabase session
  (`id`, `name`, `email`, `is_system_admin`) instead of `$request->user()`, which is
  always `null` under Supabase auth. This also prevents the sidebar crash on
  `user.name.charAt(0)`.
- **`sessions` table recreated** with a foreign key to `auth.users`.
  `SESSION_DRIVER=database` requires it; the old migration failed on an FK to the
  missing stock `users` table.

### Fixed — API
- **Removed the double `/api` prefix.** `routes/api.php` is already mounted under
  `/api` by `bootstrap/app.php`; the extra `->prefix('api')` produced `/api/api/...`.
- **API routes now use the `web` middleware group** (`['web', 'supabase.auth']`) so
  the Laravel session is available. Previously the guard would fail with
  *"Session store not set on request"*.
- **QR scan lookup fixed:** `UserInfo::find($qr->user_id)` used the primary key
  (`info_id`) with a UUID. Changed to `where('user_id', $uuid)`.

### Fixed — models / database
- Added the correct `$primaryKey` to every model:
  `campus_id`, `course_id`, `platoon_id`, `role_id`, `permission_id`, `info_id`,
  `formation_id`, `session_id`, `qr_id`, `record_id`.
- Fixed relationship keys:
  - `AttendanceRecord::user()` → `belongsTo(UserInfo, 'user_id', 'user_id')`
  - `AttendanceQr::user()` → same owner key
  - `UserInfo::attendanceQr()` → `hasOne(AttendanceQr, 'user_id', 'user_id')`
  - `RolePermission` marked non-incrementing (composite PK)
- **Migrations now mirror `rotcu_usep.sql`:**
  - `$table->id('campus_id')`, `id('info_id')`, `id('session_id')`, etc.
  - all auth foreign keys now reference **`auth.users`** instead of `users`
- **Recreated the missing `public.utilities` table** and aligned its defaults with
  the SQL (`08:00` / `17:00` / `08:15`).

### Added — frontend
- Modernized the design system in `resources/css/app.css` (rounded cards, softer
  shadows, larger buttons, focus rings, modern sidebar links and tables).
- **QR Scanner page wired to the API:**
  - `GET /api/events` → session dropdown
  - `GET /api/attendance` → recent scans
  - `POST /api/attendance/scan` → scan execution with result feedback
  - Modern scanner card, status badges, result panel

### Changed
- Vite production build validated (`npm run build` passes).
- `php artisan migrate:status` now reports all migrations as run.

---

## [0.2.0] — 2026-10-24

### Added — backend
- **Controllers:** `DashboardController`, `CadetController`, `EventController`,
  `SettingsController`, `Attendance\AttendanceController`,
  `Attendance\QrScanController`, `Attendance\ReportController`
- **Routes:** `routes/api.php` (full JSON API) and Inertia page routes in
  `routes/web.php` (`/dashboard`, `/cadets`, `/events`, `/attendance`,
  `/qr-scanner`, `/reports`, `/settings`)
- **Form Requests:** `StoreCadetRequest`, `UpdateCadetRequest`,
  `StoreEventRequest`, `StoreAttendanceRequest`, `ScanAttendanceRequest`,
  `UpdateUtilityRequest`
- **Supabase auth:** `AuthController` (login / register / logout via Supabase REST),
  `SupabaseAuth` middleware, `routes/auth.php`
- **QR auto-assignment:** creating a cadet generates an `attendance_qr` row with a
  fresh UUID token (`CadetController@store`)
- Supabase Postgres connection (`config/services.php`, `.env`)
- Enabled `pdo_pgsql`

### Added — database
- 12 migrations mirroring `rotcu_usep.sql`:
  `campus_list`, `course_list`, `platoon_list`, `role_list`, `permission_list`,
  `role_permissions`, `user_info`, `formations_event`, `formation_sessions`,
  `attendance_qr`, `attendance_records`, `utilities`
- 12 Eloquent models with relationships
- Check constraints via `DB::statement()` (placement, email domain, status,
  session type, time order)

---

## [0.1.0] — 2026-10-24

### Added
- Laravel 12 + Breeze scaffolding
- Inertia 2 + React 18 frontend
- Initial UI prototype (maroon/gold USeP ROTC theme)
- Placeholder pages: Dashboard, Cadets, Events, Attendance, QR Scanner, Reports,
  Settings

### Repository history
- `69b8506` — Structure set-up with Breeze (Laravel, React.js)
- `a084725` — Improper prototype installation using Opencode

---

## Notes for the next release

See **[docs/TODO.md](docs/TODO.md)**.
