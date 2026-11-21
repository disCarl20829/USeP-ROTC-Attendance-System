# Supabase email templates

Branded (maroon & gold) templates for **Supabase → Authentication → Emails → Templates**.
Each email has both a **6-digit code** and a **button link**; the app accepts either.

| Supabase template | Subject | Body (paste the whole file) |
| --- | --- | --- |
| **Confirm signup** | `Your USeP ROTC verification code: {{ .Token }}` | `confirm-signup.html` |
| **Reset password** | `Reset your USeP ROTC password` | `reset-password.html` |

How to apply:
1. Open the template in Supabase, switch the editor to **Source** (HTML).
2. Replace the subject and body with the ones above, then **Save**.
3. Send yourself a test (register a test account / use "Forgot password").

Notes:
- `{{ .Token }}` = the code, `{{ .ConfirmationURL }}` = the link, `{{ .Email }}` = the address.
  Keep them exactly as written.
- The link returns to `<APP_URL>/auth/callback`, so that URL must be listed under
  **Authentication → URL Configuration → Redirect URLs**.
- Built with tables and inline styles so it renders in Gmail, Outlook and phone mail apps.
