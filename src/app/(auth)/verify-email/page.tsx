import { AuthForm } from "../../../components/auth/auth-form";
import { emailEnabled, getAuthConfig } from "../../../lib/supabase/server";
export const dynamic = "force-dynamic";
export const metadata = { title: "Verify your email" };
export default function VerifyEmailPage() {
  return (
    <AuthForm
      mode="verify-email"
      enabled={Boolean(getAuthConfig())}
      emailEnabled={emailEnabled()}
    />
  );
}
