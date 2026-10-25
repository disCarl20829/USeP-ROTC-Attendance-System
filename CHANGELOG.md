# Changelog

All notable changes to the **USeP ROTC QR Attendance System** are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased]

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

See **[docs/TODO.md](docs/TODO.md)**. Priorities:

1. QR camera scanning + QR image generation
2. Dynamic wiring of Dashboard, Cadets, Events, Attendance, Reports, Settings
3. Supabase token refresh
4. Role/permission enforcement
5. Tests and deployment
