# Supabase authentication setup — T03

**State:** Code and local policy tests are prepared. No hosted Supabase project, migration, real email, authenticated browser session, or hosted Storage access was configured or verified. The user requested code/setup preparation only. T03 remains open until the hosted checks below pass.

## What is implemented

- `/sign-in`, `/sign-up`, `/forgot-password`, `/verify-email`, `/auth/confirm`, `/reset-password`, `/password-updated`, and protected `/account`.
- Cookie-based SSR with `@supabase/ssr` and Next.js `proxy.ts`. Protected pages and password changes validate identity using Auth `getUser`; cookie contents alone do not grant access. No client-side Supabase Auth SDK is instantiated. Session cookies are HttpOnly, SameSite=Lax and Secure on an HTTPS application origin. A future browser-SDK integration must revisit this choice explicitly.
- Auth pages are uncached. Email links are not consumed by GET: a confirmation button submits a Server Action. Tokens are opaque, bounded values; authenticity/expiry is established by Supabase `verifyOtp`. Redirect destinations are fixed, and no `next` value is trusted. Next.js Server Actions supply their built-in same-origin protections; there is no custom cross-origin mutation endpoint.
- Generic recovery responses avoid revealing account existence. Password changes require a verified session and matching 12-character minimum passwords (maximum 72 UTF-8 bytes). Successful resets request global sign-out; existing access-token revocation still follows provider behavior. Resends have a 60-second UX cooldown, while actual enforcement is the provider's configured rate limit, not the browser timer.
- Versioned migration for profiles, projects and immutable approved versions; composite parent/owner constraints, RLS and restricted column grants. Signup metadata cannot self-approve. These tables do not expose browser project/status writes. There are no CRUD endpoints or live-generation handlers yet.
- Private `creator-media` bucket. Direct anon/authenticated object operations are denied, including when another permissive policy exists. Future server-authorized signed access is deliberately deferred to T05 and must be tested through the real Storage API. No privileged Supabase key is required by this app slice.

## The $0 email decision

Checked 20 October 2026 against [Supabase SMTP documentation](https://supabase.com/docs/guides/auth/auth-smtp): the built-in sender is restricted to organization-team addresses and currently two messages per hour. It has no delivery guarantee. This supports a limited owner/team demonstration, not unrestricted public signup. Keep `AUTH_EMAIL_ENABLED=false` until an eligible owner address and delivery path are tested. Do not purchase SMTP, disable confirmation to hide this limitation, or claim recovery emails work for arbitrary visitors. Public unrestricted delivery remains a release gate; the public preview requires no authentication.

The [Free plan](https://supabase.com/pricing) currently includes 500 MB database, 1 GB Storage, 5 GB egress, a 50 MB upload cap, and inactivity pausing. The migration limits individual media objects to 50 MiB; enforce the account's actual lower cap if units/settings differ during T05. No Storage bytes are uploaded in this step. Use one Free project, no paid add-ons, no billing activation, and inspect actual account limits before configuring anything.

## 1. Create one Free development project

Use your own Supabase account and choose **Free**. Do not enable paid infrastructure. Use a new dedicated IdeaMotion project, not a project with unrelated tables/data. Save its database password privately; the web app does not need that password or a secret/service-role key at T03.

## 2. Apply the reviewed migration

Review `supabase/migrations/202610200001_auth_ownership.sql`. In the SQL Editor of the selected **new development project**, run that file once. It adds three public tables/functions/policies and a private bucket; it does not reset/drop existing tables. If any named object already exists, stop and inspect rather than deleting it or repeatedly rerunning the migration. `supabase/seed.sql` intentionally creates no accounts or privileged users.

Confirm RLS is enabled for all three public tables, `creator-media` is private, and signup cannot edit the `approved` column. Optional tables for jobs, assets and publications are not part of this migration yet. The approved-version immutability trigger also blocks deletion; later retention/deletion must introduce an explicitly authorized cleanup path rather than disabling this protection casually.

## 3. Configure Auth URLs and email templates

- Enable the email/password provider and **keep email confirmation enabled**.
- Set the Site URL to `http://localhost:3000` for local testing and allow exactly `http://localhost:3000/auth/confirm`. Do not add wildcard public redirects. Later deployment must use the actual HTTPS app origin in both Supabase and `APP_URL`.
- Use the same email address that belongs to your Supabase organization for the built-in sender. Do not give portfolio reviewers organization access just to bypass mail restrictions.
- In the **Confirm signup** template, set the link to:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&amp;type=email">Confirm your email</a>
```

- In the **Reset password** template, set the link to:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&amp;type=recovery">Reset your password</a>
```

The custom token-hash templates above are supported and recommended for the explicit confirmation flow. Standard Supabase email links that redirect back with an authorization code are also supported through exchangeCodeForSession; they require the PKCE verifier cookie from the browser and site address used to request the email. An optional sb_flow_id is validated and preserved. Both formats show the confirmation button first and are consumed only by its Server Action. Confirm the preview links target your own application before sending test emails. Never paste real email tokens, codes or signed links into public issues, commits, screenshots or chat.

## 4. Configure ignored local environment

Copy `.env.example` to `.env.local` in `D:\IdeaMotion`. From the project Connect dialog, fill:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
APP_URL=http://localhost:3000
AUTH_EMAIL_ENABLED=false
```

Use the modern **publishable** key (`sb_publishable_…`), never a secret/service-role key. This implementation intentionally rejects other key types. Do not paste credentials in chat. Restart `npm run dev` after editing environment variables. Valid configuration enables password sign-in. Set `AUTH_EMAIL_ENABLED=true` only after the owner/team test path and templates are ready; it is a server-side availability flag, not a substitute for Supabase rate limits. Never commit `.env.local`.

## 5. Hosted checks to finish T03

Do these deliberately within the actual mail allowance; signup plus recovery can consume the whole hourly allowance.

1. Sign up with an eligible owner address; open the email and click Continue securely. Confirm `/account` shows awaiting approval. Refresh the page to check session continuity; sign out and confirm private access redirects to `/sign-in`.
2. Sign in again; request recovery when allowance permits. Confirm the link, change the password, and verify the old password fails and the new one succeeds. Test expired/reused links and never store test passwords in the repository.
3. To approve only your verified owner identity, obtain its UUID from Auth → Users. In trusted SQL administration, update that exact profile; never approve based on a public form, email query string, or signup metadata. Example to adapt privately:

```sql
update public.profiles set approved = true where id = 'REPLACE_WITH_VERIFIED_OWNER_UUID';
```

4. Check two ordinary authenticated identities cannot read each other's profiles/projects/versions, cannot self-approve, and cannot forge a child owner/project relationship. Use a dedicated second authorized test identity when available; do not broaden access to production data.
5. Verify through the real Storage API that creator media is not public and direct browser reads/uploads fail. Signed, scoped media delivery is still T05 work; do not loosen the bucket to make a test pass.
6. Record actual project plan, configured redirects, mail success/failure, policy checks and dates in `docs/PROGRESS.md` without secrets. Only then mark T03 verified.

## Local verification and its limits

`npm run check` runs lint, type checks, deterministic tests and build without Supabase configuration. `src/lib/auth/database.test.ts` executes the actual migration and RLS queries in in-memory PostgreSQL using PGlite. It uses actual PostgreSQL roles, grants, constraints and policy evaluation, with small simulated platform tables and an `auth.uid()` stand-in. This is meaningful SQL policy evidence, but **does not** verify Supabase GoTrue, JWT issuance, PostgREST, SMTP, Storage endpoints, dashboard settings, cookie refresh in a hosted deployment, or email delivery. Action tests mock the SDK and never send mail. Docker Desktop was installed but its engine was not running; no Docker images or hosted resources were started.

UI checks without credentials verify disabled states, navigation, missing-session guards and responsive layout only. Live generation remains unavailable even to an approved profile; later endpoints must recheck approval immediately before external work.

Official integration references: [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/nextjs), [password auth](https://supabase.com/docs/guides/auth/passwords), [Storage access control](https://supabase.com/docs/guides/storage/security/access-control), [PGlite](https://pglite.dev/docs/).

## Callback troubleshooting

A link containing `code` is a standard PKCE callback; it is not automatically invalid because it lacks `token_hash`. The page now supports either format and rejects ambiguous mixed/duplicate fields. On explicit confirmation, codes use the official `exchangeCodeForSession` API. Recovery uses validated verifier-derived SDK metadata; URL-supplied `type` or `next` cannot select a recovery redirect for a code. The installed SDK 2.118.0 returns this metadata at runtime although its public response type omits it; the app validates it and defaults to account status if absent/unknown.

For code-based links, use the same browser and origin that requested the email; `localhost` and `127.0.0.1` have different cookie stores. If the original link already confirmed the email at Supabase but the app callback failed, first try normal sign-in. Otherwise request a fresh confirmation from `/verify-email` when the free email allowance permits. Missing verifier/expired/reused codes show recovery guidance rather than claiming success. Do not create another account solely because an old callback failed.

Regression checks cover both formats, flow IDs, recovery routing, malformed/mixed inputs, missing-verifier/expired results and absent sessions. The browser proof uses a fabricated code and does not submit it; it proves recognition only, not real session exchange. Reference: https://supabase.com/docs/reference/javascript/auth-exchangecodeforsession.
