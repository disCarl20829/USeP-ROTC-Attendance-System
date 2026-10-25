# TODO — What's Not Done Yet

Updated: **2026-10-25**

Legend: `P0` = blocking testing · `P1` = next up · `P2` = important · `P3` = polish

---

## P0 — Unblock QR testing

- [x] Backend: auto-generate `attendance_qr` when a cadet is created
- [x] Backend: `POST /api/attendance/scan` (present/late, upsert record)
- [x] Backend: manual-token scan flow on `/qr-scanner`
- [x] `DemoSeeder` to create test data quickly
- [ ] **Camera scanning** on `/qr-scanner`
  - Option A: `html5-qrcode` / `@zxing/browser` (npm package)
  - Option B: native `BarcodeDetector` + `getUserMedia` (no dependency, Chrome/Edge only)
  - Add a graceful fallback to the manual token input
- [ ] **QR code image generation** (so a cadet can actually be scanned)
  - Client-side: `qrcode.react` (SVG/Canvas)
  - Server-side: `simplesoftwareio/simple-qrcode` (needs `imagick` or GD)
  - Show/download/print QR per cadet, e.g. `GET /api/cadets/{id}/qr`
- [ ] **Cadet creation UI** — the "Add Cadet" button is currently decorative

---

## P1 — Dynamic wiring (React pages → API)

Only `/qr-scanner` currently talks to the backend. Everything else is mock data.

### Dashboard (`resources/js/Pages/Dashboard.jsx`)
- [ ] Accept the `stats` prop sent by `DashboardController@index`
      (`totalCadets`, `activeEvents`, `todayRecords`, `presentToday`)
- [ ] Replace hardcoded `stats`, `recentActivity`, `upcomingEvents`
- [ ] Add API data for recent activity + upcoming events
      (e.g. extend `DashboardController` or use `/api/attendance` + `/api/events`)
- [ ] Remove fake trend numbers (`+12%`, etc.) or compute real ones

### Cadets (`resources/js/Pages/Cadets.jsx`)
- [ ] `GET /api/cadets` on mount (replace static array)
- [ ] Add Cadet modal → `POST /api/cadets`
- [ ] Edit → `PUT /api/cadets/{info_id}`
- [ ] Delete with confirmation → `DELETE /api/cadets/{info_id}`
- [ ] Search / filter by name, course, platoon (client or server-side)
- [ ] Show QR token + QR image per cadet
- [ ] Loading / empty / error states

### Events (`resources/js/Pages/Events.jsx`)
- [ ] `GET /api/events`
- [ ] Create event form (name, date, type) + morning/afternoon sessions
- [ ] `POST /api/events`, `PUT /api/events/{formation_id}`, `DELETE`
- [ ] Session editor (`start_time`, `end_time`, `late_time`)

### Attendance (`resources/js/Pages/Attendance.jsx`)
- [ ] `GET /api/attendance`
- [ ] Filters: date, session, status, platoon
- [ ] Manual add / override → `POST /api/attendance`
- [ ] Time-out support (endpoint currently only sets `time_in`)

### Reports (`resources/js/Pages/Reports.jsx`)
- [ ] `GET /api/reports` (`records` + `summary`)
- [ ] Replace `monthlyData` / `topCadets` mocks
- [ ] Attendance-rate calculation per cadet / session
- [ ] CSV / print export

### Settings (`resources/js/Pages/Settings.jsx`)
- [ ] `GET /api/settings` → populate form
- [ ] `PUT /api/settings` (start / end / late defaults)
- [ ] Success / error feedback

### Shared
- [ ] Reusable `useApi` hook or data-fetching helper (loading/error/retry)
- [ ] Toast notifications
- [ ] Pagination for large lists
- [ ] Confirm dialogs for destructive actions

---

## P2 — Authentication & authorization

- [ ] **Token refresh** — access tokens expire after ~1 hour; call
      `POST /auth/v1/token?grant_type=refresh_token` and update the session
- [ ] **`/profile` page is broken** — `ProfileController` uses `$request->user()`,
      which is `null` under Supabase auth. Either adapt it to the Supabase session
      or remove the route/page
- [ ] Password reset (Supabase `recover` flow) — UI exists, routes are missing
- [ ] Email confirmation handling after signup
- [ ] Logout should also clear any client-side state
- [ ] **Role / permission enforcement** (`role_list`, `permission_list`,
      `role_permissions`, `user_info.is_system_admin`) via policies/middleware
- [ ] Decide whether to keep the stock Breeze controllers/routes
      (`app/Http/Controllers/Auth/*`) and the `users` table

---

## P2 — Backend quality

- [ ] Use `scanned_by` / `time_out_scanned_by` consistently (time-out not implemented)
- [ ] Validate that the scanned cadet belongs to the selected session/event
- [ ] Prevent duplicate scans within a short window (debounce / grace period)
- [ ] Add `date_added` / `updated_at` handling consistency
- [ ] Return consistent JSON envelopes and HTTP codes
- [ ] Handle Supabase request failures with user-friendly messages
- [ ] Add pagination and filtering to list endpoints
- [ ] Add DB transactions for multi-table writes (event + sessions)
- [ ] Seeders for real reference data (campuses, courses, platoons, roles)
- [ ] Feature tests for auth, cadet CRUD, and the scan endpoint

---

## P2 — Data cleanup

- [ ] Fix `rotcu_usep.sql`:
  - last line is incomplete: `insert into public.utilities (id)`
  - it creates `public.attendance_records` **twice**
  - align defaults with the Laravel migrations (`utilities`: 08:00 / 17:00 / 08:15)
- [ ] Remove `database/redacted-migrations/` (unused copy) or document why it exists
- [ ] Decide on the leftover stock `users` table + seeded "Test User"
- [ ] Delete `database/database.sqlite` if it is not used

---

## P3 — Polish & delivery

- [ ] Add `.env.example` (currently missing/stock)
- [ ] Add a `DemoSeeder` call to `DatabaseSeeder` or document it clearly
- [ ] Add loading skeletons and empty states to every page
- [ ] Mobile/responsive QA
- [ ] Accessibility pass (labels, focus states, contrast)
- [ ] Print-friendly views (attendance sheet, QR IDs)
- [ ] CI (lint + build) and deployment notes (Vercel/Forge/VPS + `npm run build`)
- [ ] Screenshots for the README

---

## Known issues (tracked)

| # | Issue | Severity | Status |
| --- | --- | --- | --- |
| 1 | Login redirected back to `/login` (expiry key mismatch) | Critical | ✅ Fixed 2026-10-25 |
| 2 | `auth.user` was always `null` (layout crash) | Critical | ✅ Fixed 2026-10-25 |
| 3 | API routes were `/api/api/...` and had no session | Critical | ✅ Fixed 2026-10-25 |
| 4 | Models used default `id` PK (column errors) | Critical | ✅ Fixed 2026-10-25 |
| 5 | `sessions` table missing | Critical | ✅ Fixed 2026-10-25 |
| 6 | `utilities` table missing | High | ✅ Fixed 2026-10-25 |
| 7 | No camera scanning / QR image | High | ❌ Open |
| 8 | Pages still use mock data | High | ❌ Open |
| 9 | No Supabase token refresh | Medium | ❌ Open |
| 10 | `/profile` page crashes (`$request->user()` null) | Medium | ❌ Open |
| 11 | No role/permission enforcement | Medium | ❌ Open |
| 12 | `rotcu_usep.sql` is malformed at the end | Medium | ❌ Open |

---

## Suggested next session order

1. Run `php artisan db:seed --class=DemoSeeder` and confirm the QR scan works.
2. Wire **Dashboard** (it already receives `stats`).
3. Wire **Cadets** + add the create/edit modal (this is the main data entry point).
4. Wire **Events** (needed to create sessions).
5. Add QR image display + camera scanning.
6. Wire Attendance / Reports / Settings.
7. Auth polish (token refresh, profile).
8. Tests + cleanup.
