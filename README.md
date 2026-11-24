# USeP ROTC QR Attendance System

A web-based attendance system for the **USeP ROTC Unit (Tagum-Mabini Campus)**.
Each cadet registers, gets a personal QR code, and is scanned at formation.
Attendance is recorded per formation session with time-in / time-out and a status
(`present`, `late`, `excused`, `absent`) that becomes points for the
**LE 1: Attendance (30%)** grade sheet.

> **Stack:** Laravel 12 · Inertia.js 2 · React 18 · Tailwind CSS 4 · Vite 7
> **Database / Auth:** Supabase (PostgreSQL + Supabase Auth REST API)
> **QR:** `qrcode.react` (drawn in the browser) · `html5-qrcode` (camera scanning)

---

## How it works

1. **Register** (`/register`): first / middle (optional) / last name, USeP email, password.
2. **Verify email**: click the link in the email (Supabase's default email). If the email
   template is later changed to include a 6-digit code, the code can be typed instead.
3. **Cadet details** (`/setup`): student ID, campus, course (filtered by campus),
   platoon, specialization. The role is always **Cadet**. The profile and a private
   QR token are created and the user lands on the **Dashboard**.
4. **Officers/admins** create events and scan on `/qr-scanner` (camera or typed student
   ID). A **whole-day** event has a morning and an afternoon session (2 sheet columns);
   a **half-day** event has one.
5. **Late** = scanned in after the session's late time.
   **Absent** = marked automatically every 5 minutes for sessions that have ended
   (Supabase `pg_cron` job → `mark_absent_cadets()`).
6. Scanning someone again for the same session asks the scanner whether to change the
   status (Present / Late / Excused / Absent) or keep it.
7. **Reports** show the points matrix and export a color-coded **.xlsx**: an "All" sheet
   plus one sheet per platoon, columns NR · SURNAME · FIRSTNAME · MI · 1–15 · TOTAL.
   Dropped cadets are shown in red, with sessions after the drop left blank.

### Points

| Status  | Points | Shown as |
| ------- | ------ | -------- |
| Present | 10     | 10       |
| Late    | 5      | 5        |
| Excused | 8      | 8        |
| Absent  | 0      | A        |

Configured in `config/rotc.php` (`points`).

### Roles (RBAC)

Roles come from `role_list` (Admin, Officer, Aspirant, Cadet). What each role can do
is defined in **`config/rotc.php` → `permissions`**; the server checks it on every
page and API call (`permission:` middleware), and the sidebar hides links you can't open.

| Can… | Admin | Officer | Aspirant | Cadet |
| --- | :-: | :-: | :-: | :-: |
| Dashboard, own QR & attendance, own Settings | ✅ | ✅ | ✅ | ✅ |
| QR scanner + change a scanned status | ✅ | ✅ | ✅ | — |
| Attendance roster | ✅ | ✅ | ✅ | — |
| Cadets: add / edit / drop / re-enroll | ✅ | ✅ | — | — |
| Set platoon & specialization of others | ✅ | ✅ | — | — |
| Events, Reports + Excel export | ✅ | ✅ | — | — |
| Change roles, delete profiles, default session times | ✅ | — | — | — |

Attendance is taken for **Cadets and Aspirants** (`config/rotc.php` →
`attendance_roles`); Officers and Admins are not on the roster.

Cadets choose their platoon and specialization during sign-up and can change them
later in Settings (`config/rotc.php` → `self_assign_platoon`; set it to `false` to let
only officers/admins change them). Users without a profile are sent to `/setup`;
unknown roles get nothing (deny by default).

**First admin:** register normally, then run
```bash
php artisan rotc:make-admin someone@usep.edu.ph
```

---

### School years & who can sign up

- Only **first years of the active school year** can register as cadets: the student ID
  must be `YYYY-NNNNN` with `YYYY` = the year's **enrollment year** (e.g. `2026-00107`),
  and the number must match the USeP email (`caupepito00107@usep.edu.ph`).
- Admins manage school years in **Settings → School year** (default August–May).
- **Close school year**: download the backup (Excel), type `ARCHIVE <year>`. Its cadets,
  aspirants, events and attendance are **archived**: hidden, not scannable, can't log in.
  Officers and admins are never archived.
- Archived data can be **restored for 30 days**; then a daily job deletes it. Login
  accounts are deleted **one year** after archiving.
- Admins can also archive single cadets or **bulk-archive** (typed confirmation) from the
  Cadets page. Every archive / restore / purge is in the **activity log**.

---

## 7. Quick start

### Requirements
- PHP **8.2+** with `pdo_pgsql`, Composer, Node.js **18+**
- A Supabase project (database + auth)

### 1. Install
```bash
composer install          # like npm install, for PHP
npm install
```

### 2. Configure `.env`
```env
APP_URL=http://127.0.0.1:8000
APP_KEY=base64:...            # php artisan key:generate
APP_TIMEZONE=Asia/Manila

DB_CONNECTION=pgsql
DB_HOST=<supabase pooler host>
DB_PORT=5432
DB_DATABASE=postgres
DB_USERNAME=postgres.<project-ref>
DB_PASSWORD=<password>
# DB_TIMEZONE=Asia/Manila     # default; must match the app timezone

SESSION_DRIVER=database
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=<anon key>
```

### 3. Database
```bash
php artisan migrate
```
Migrations now build the full schema from scratch (including `specialization_list`,
`student_id`, statuses and the auto-absent job when `pg_cron` is available).
`master-db` already has all of them applied.

### 4. Supabase Auth settings (one time, in the Supabase dashboard)
See **[docs/GUIDE.md → Supabase Auth setup](docs/GUIDE.md#supabase-auth-setup)**:
- **Redirect URLs**: add `<APP_URL>/auth/callback` (needed now, even before the Site URL)
- **Custom SMTP** (Gmail app password): Supabase's built-in mailer is heavily rate-limited
- **Site URL** = your app URL (when deploying)
- Optional later: custom email templates with a 6-digit code

### 5. Run
```bash
php artisan serve
npm run dev
```
Camera scanning needs HTTPS (or `localhost`).

---

## Useful commands
```bash
php artisan rotc:make-admin <email>   # promote a registered user to Admin
php artisan rotc:mark-absent          # run the automatic absent marking now
php artisan route:list --except-vendor
npm run build
```

---

## Documentation
- **[docs/GUIDE.md](docs/GUIDE.md)**: architecture, auth flow, Supabase setup, routes
- **[docs/TODO.md](docs/TODO.md)**: what is left
- **[CHANGELOG.md](CHANGELOG.md)**: what changed and when

## Known limitations
- The "ODDRM" special-event column from the official sheet is not supported yet.
- Removing a session from an event is blocked once it has attendance records.
