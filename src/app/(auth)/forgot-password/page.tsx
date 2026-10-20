import { AuthForm } from "../../../components/auth/auth-form";
import { emailEnabled, getAuthConfig } from "../../../lib/supabase/server";
export const dynamic = "force-dynamic";
export const metadata = { title: "Reset your password" };
export default function ForgotPasswordPage() {
  return (
    <AuthForm
      mode="forgot-password"
      enabled={Boolean(getAuthConfig())}
      emailEnabled={emailEnabled()}
    />
  );
}
