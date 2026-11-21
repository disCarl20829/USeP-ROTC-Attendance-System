# TODO — What's Not Done Yet

Updated: **2026-11-21**

Legend: `P0` = broken / security · `P1` = next up · `P2` = important · `P3` = polish

---

## Done since the last update (Oct 25 → Nov 12)

- [x] Camera scanning on `/qr-scanner` (`html5-qrcode`) with manual ID fallback
- [x] Time-in **and** time-out scans (`scan_type` In / Out)
- [x] QR image display + PNG download (Dashboard, Cadet Portal)
- [x] Cadet creation / edit UI, search, drop / re-enroll
- [x] Events create / edit / delete with sessions
- [x] Dashboard, Attendance, Reports, Settings pages use real data
- [x] Reports points matrix + Excel export
- [x] Role-grouped routes (`role:` middleware) and role-aware sidebar

---

## P0 — Broken or security-relevant

- [ ] **Settings save fails** — `Settings.jsx` calls `PUT /settings`, but
      `routes/web.php` has no such route (`SettingsController@update` exists).
      Add `Route::put('/settings', [SettingsController::class, 'update'])`.
- [ ] **Role middleware fails open** (`app/Http/Middleware/EnsureUserRole.php`):
  - lets the request through when no `user_info` row matches
  - lets through any role that is not exactly `cadet` (e.g. `scanner` can open `/cadets`)
  - lets through users with an empty role
  - finds the user with `email LIKE %prefix%`, which can match the wrong person
  - `HandleInertiaRequests` also treats a user **without a profile as admin** in the UI
  - Fix: match only on `user_id` / exact email, deny when profile or role is missing,
    and only allow roles listed on the route
- [ ] **Scanner lookup is too loose** (`QrScanController@scan`): it matches
      `student_id_number`, `serial_number`, `email`, and `email LIKE %input%`, so a
      partial value can hit the wrong cadet. Match the student ID exactly.
- [ ] Remove the **`test` role** from every route group before production
- [ ] **Stop sending QR values to `api.qrserver.com`** — `qrcode.react` is already a
      dependency; render the QR locally on Dashboard and Cadet Portal
- [ ] `StoreEventRequest` validates `created_by` against `users,id` (stock table),
      and `EventController@store` falls back to `UserInfo::first()` or `1` as creator

---

## P1 — Reports correctness

- [ ] `ReportController@index` falls back to **19 sessions** when none exist
- [ ] `ReportController@exportExcel` always writes **19 session columns** and a
      fixed **190-point** total — derive both from the real session list
- [ ] Column lookups use fallbacks like `user_id ?? info_id` and
      `formation_session_id ?? session_id`; confirm the real column names against
      the Supabase schema and remove the guesses
- [ ] Decide whether dropped cadets should appear in reports / exports
- [ ] Test the export against real data (open in Excel and Google Sheets)

---

## P2 — Authentication

- [ ] **Token refresh** — access tokens expire after ~1 hour; call
      `POST /auth/v1/token?grant_type=refresh_token` and update the session
- [ ] **`/profile` page is broken** — `ProfileController` uses `$request->user()`,
      which is `null` under Supabase auth. Adapt it or remove the route/page
- [ ] `/logout` is registered twice (`web.php` → Breeze controller, `auth.php` →
      `AuthController`); keep one
- [ ] Password reset (Supabase `recover` flow) — UI exists, routes are missing
- [ ] Email confirmation handling after signup
- [ ] Link cadets created by admins (random `user_id`) to their real Supabase account
      on first login
- [ ] Decide whether to keep the stock Breeze controllers (`app/Http/Controllers/Auth/*`)
      and the `users` table

---

## P2 — Backend quality

- [ ] Validate that the scanned cadet is `active` (not dropped)
- [ ] Prevent duplicate scans within a short window
- [ ] Mark cadets with no scan as `absent` when a session closes
- [ ] DB transactions for multi-table writes (event + sessions)
- [ ] Pagination for cadets / attendance lists
- [ ] Seeders for real reference data (campuses, courses, platoons, roles)
- [ ] Feature tests for auth, role access, cadet CRUD, scan, and report export

---

## P2 — Data cleanup

- [ ] Fix `rotcu_usep.sql`:
  - last line is incomplete: `insert into public.utilities (id)`
  - it creates `public.attendance_records` **twice**
  - add the `student_id_number` / `status` columns used by the app
- [ ] Fill in `add_student_id_to_user_info_table` migration — it is **empty**;
      `student_id_number` / `status` were added to Supabase by hand, so a fresh
      `php artisan migrate` produces a schema the app cannot use
- [ ] Remove `database/redacted-migrations/` (unused copy) or document why it exists
- [ ] Update `DemoSeeder` — it still prints a UUID `qr_token`, but scanning now
      uses the cadet's student ID number

---

## P3 — Polish & delivery

- [ ] Add `.env.example`
- [ ] Loading skeletons and empty states on every page
- [ ] Mobile QA of the scanner (camera permission, HTTPS requirement)
- [ ] Accessibility pass (labels, focus states, contrast)
- [ ] Print-friendly attendance sheet and QR ID cards
- [ ] CI (lint + build) and deployment notes
- [ ] Screenshots for the README

---

## Known issues (tracked)

| # | Issue | Severity | Status |
| --- | --- | --- | --- |
| 1–6 | Auth / API / model / table fixes from October | Critical | ✅ Fixed 2026-10-25 |
| 7 | No camera scanning / QR image | High | ✅ Fixed 2026-11 |
| 8 | Pages still use mock data | High | ✅ Fixed 2026-11 |
| 9 | No Supabase token refresh | Medium | ❌ Open |
| 10 | `/profile` page crashes (`$request->user()` null) | Medium | ❌ Open |
| 11 | Role enforcement fails open / loose email match | High | ❌ Open |
| 12 | `rotcu_usep.sql` is malformed at the end | Medium | ❌ Open |
| 13 | Settings save — missing `PUT /settings` route | High | ❌ Open |
| 14 | Reports / export hardcode 19 sessions, 190 pts | Medium | ❌ Open |
| 15 | QR values sent to `api.qrserver.com` | Medium | ❌ Open |
| 16 | Scanner matches cadets by partial email | High | ❌ Open |
| 17 | `student_id` migration is empty | Medium | ❌ Open |

---

## Suggested next session order

1. Add the `PUT /settings` route (one line).
2. Tighten `EnsureUserRole` and remove the `test` role.
3. Render QR codes locally with `qrcode.react`.
4. Make Reports / export use the real session count; test against real data.
5. Auth polish (token refresh, profile, single logout route).
6. Tests + cleanup.
