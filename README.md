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

1. **Register** (`/register`): name, USeP email, password.
2. **Verify email**: type the 6-digit code from the email **or** click the link in it.
3. **Cadet details** (`/setup`): student ID, campus, course (filtered by campus),
   platoon, specialization. The role is always **Cadet**. The profile and a private
   QR token are created and the user lands on the **Dashboard**.
4. **Officers/admins** create events (formation sessions) and scan cadets on
   `/qr-scanner` (camera or typed student ID).
5. **Late** = scanned in after the session's late time.
   **Absent** = marked automatically every 5 minutes for sessions that have ended
   (Supabase `pg_cron` job → `mark_absent_cadets()`).
6. Scanning someone again for the same session asks the scanner whether to change the
   status (Present / Late / Excused / Absent) or keep it.
7. **Reports** show the points matrix and export a color-coded Excel sheet.

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
| Set platoon & specialization | ✅ | ✅ | — | — |
| Events, Reports + Excel export | ✅ | ✅ | — | — |
| Change roles, delete profiles, default session times | ✅ | — | — | — |

Cadets choose their platoon and specialization during sign-up; after that only
officers/admins can change them. Users without a profile are sent to `/setup`;
unknown roles get nothing (deny by default).

**First admin:** register normally, then run
```bash
php artisan rotc:make-admin someone@usep.edu.ph
```

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
- **Site URL** = your app URL
- **Email templates** for *Confirm signup* and *Reset password* (code + link)
- **Custom SMTP**: Supabase's built-in mailer is heavily rate-limited and not meant
  for real users

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
- The Excel export layout follows the current on-screen grid; it will be matched to
  the official sample sheet once provided.
- An event has one session (morning or afternoon by start time); whole-day events
  with separate morning/afternoon sessions aren't in the UI yet.
- Only the Cadet role is auto-marked absent (see `mark_absent_cadets()`).
