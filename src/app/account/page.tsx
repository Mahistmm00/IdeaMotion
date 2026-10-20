import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthFrame } from "../../components/auth/auth-frame";
import { signOut } from "../../lib/auth/actions";
import { type SafeProfile, safeProfileSchema } from "../../lib/auth/validation";
import { createClient } from "../../lib/supabase/server";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Your account",
  robots: { index: false, follow: false },
};
export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ logout?: string }>;
}) {
  const client = await createClient();
  if (!client) redirect("/sign-in");
  let user: { id: string; email?: string } | null = null;
  try {
    const result = await client.auth.getUser();
    if (!result.error) user = result.data.user;
  } catch {
    /* Fail closed. */
  }
  if (!user) redirect("/sign-in");
  let profile: SafeProfile | null = null;
  try {
    const result = await client
      .from("profiles")
      .select("approved, preferred_timezone")
      .eq("id", user.id)
      .maybeSingle();
    const parsed = safeProfileSchema.safeParse(result.data);
    if (!result.error && parsed.success) profile = parsed.data;
  } catch {
    /* A missing/unavailable profile never grants approval. */
  }
  const params = await searchParams;
  return (
    <AuthFrame>
      <section className="auth-card">
        <p className="eyebrow">YOUR ACCOUNT</p>
        <h1>You’re signed in.</h1>
        <p className="auth-description">{user.email}</p>
        {params.logout === "failed" && (
          <p className="auth-error" role="status">
            Sign-out could not be confirmed. Please try again.
          </p>
        )}
        {!profile ? (
          <p className="auth-error">
            Account access is temporarily unavailable. No live generation is
            enabled.
          </p>
        ) : (
          <>
            <span className="status-pill">
              {profile.approved
                ? "Owner-approved account"
                : "Awaiting owner approval"}
            </span>
            <p className="auth-description">
              {profile.approved
                ? "Your account is approved. Video creation is still in development and is not enabled yet."
                : "Live creation is limited to approved testers. Approval is managed by the project owner; signing up does not grant access."}
            </p>
          </>
        )}
        <form action={signOut}>
          <button type="submit" className="primary-link">
            Sign out
          </button>
        </form>
        <Link href="/" className="auth-back">
          Explore the preview
        </Link>
      </section>
    </AuthFrame>
  );
}
