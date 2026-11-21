# TODO — What's Not Done Yet

Updated: **2026-11-21**

Legend: `P0` = needed before real use · `P1` = next up · `P2` = important · `P3` = polish

---

## Done in 0.5.0

- [x] Settings save (profile + default times)
- [x] RBAC: permission map, deny by default, no `test` role, exact user matching
- [x] Scanner: exact QR token / student ID only; dropped cadets blocked
- [x] Re-scan prompt to change status; Excused status; points 10 / 5 / 8 / 0
- [x] Automatic absent marking (pg_cron, every 5 min)
- [x] QR drawn locally with `qrcode.react` (private token)
- [x] Supabase token renewal; forgot password (code or link)
- [x] 3-step registration with email verification and cadet details
- [x] Dashboard shows each user's own attendance
- [x] Reports / export use the real session count
- [x] Migrations work on an empty database; DB timezone bug fixed

---

## P0 — Before real users

- [ ] **Supabase dashboard:** Redirect URL `<APP_URL>/auth/callback`, **Gmail SMTP**
      (see GUIDE → Supabase Auth setup); Site URL when deploying
- [ ] Deploy over **HTTPS** (camera scanning needs it)
- [ ] `composer update` — `composer audit` reports 9 advisories in laravel/framework
      and symfony packages (existing dependencies)

## P1 — Next up

- [ ] "ODDRM" special-event column on the sheet (on hold)
- [ ] Optional: custom email templates with a 6-digit code (the code input already works)
- [ ] Change status from the Attendance roster (currently only from the scanner prompt)
- [ ] Admin page to manage lookup lists (campuses, courses, platoons, specializations)
- [ ] Regenerate a cadet's QR token if it leaks

## P2 — Quality

- [ ] Automated feature tests in the repo (the 0.5.0 flows were checked with a local
      Playwright run against a fake Supabase Auth server, not committed)
- [ ] Pagination for large cadet / attendance lists
- [ ] Fix `rotc_usep.sql` (incomplete last line, duplicate `attendance_records`) or
      drop it in favour of the migrations
- [ ] Remove `database/redacted-migrations/` or document it
- [ ] Old `permission_list` / `role_permissions` migrations create tables that are not
      used (permissions now live in `config/rotc.php`)

## P3 — Polish

- [ ] Print-friendly attendance sheet and QR ID cards
- [ ] CI (lint + build) and deployment notes
- [ ] Accessibility pass; screenshots for the README
