import Link from "next/link";
import { AuthForm } from "../../../components/auth/auth-form";
import { AuthFrame } from "../../../components/auth/auth-frame";
import { parseConfirmationLink } from "../../../lib/auth/validation";
import { getAuthConfig } from "../../../lib/supabase/server";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Confirm your email link",
  robots: { index: false, follow: false },
  referrer: "no-referrer" as const,
};
export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const input = parseConfirmationLink(params);
  return (
    <AuthFrame>
      {input.success ? (
        <AuthForm
          mode="confirm"
          enabled={Boolean(getAuthConfig())}
          emailEnabled={false}
          tokenHash={
            input.data.kind === "token" ? input.data.tokenHash : undefined
          }
          confirmationType={
            input.data.kind === "token" ? input.data.type : undefined
          }
          code={input.data.kind === "pkce" ? input.data.code : undefined}
          flowId={input.data.kind === "pkce" ? input.data.flowId : undefined}
        />
      ) : (
        <section className="auth-card">
          <h1>This link isn’t valid.</h1>
          <p className="auth-description">
            Request a fresh confirmation or password-reset email. Your password
            has not changed.
          </p>
          <Link className="primary-link" href="/sign-in">
            Back to sign in
          </Link>
          <Link className="auth-back" href="/forgot-password">
            Request a reset email
          </Link>
        </section>
      )}
    </AuthFrame>
  );
}
