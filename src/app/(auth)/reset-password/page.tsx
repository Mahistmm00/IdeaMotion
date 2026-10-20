import Link from "next/link";
import { AuthForm } from "../../../components/auth/auth-form";
import { createClient } from "../../../lib/supabase/server";
export const dynamic = "force-dynamic";
export const metadata = { title: "Choose a new password" };
export default async function ResetPasswordPage() {
  const client = await createClient();
  let authenticated = false;
  if (client) {
    try {
      const { data, error } = await client.auth.getUser();
      authenticated = !error && Boolean(data.user);
    } catch {
      /* Do not show a false authenticated state. */
    }
  }
  if (!authenticated)
    return (
      <section className="auth-card">
        <p className="eyebrow">RECOVER YOUR ACCOUNT</p>
        <h1>Let’s get a fresh link.</h1>
        <p className="auth-description">
          Open a valid password-reset email and confirm the link before changing
          your password.
        </p>
        <Link className="primary-link" href="/forgot-password">
          Request a reset email
        </Link>
      </section>
    );
  return <AuthForm mode="reset-password" enabled emailEnabled={false} />;
}
