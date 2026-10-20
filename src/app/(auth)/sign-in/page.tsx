import { AuthForm } from "../../../components/auth/auth-form";
import { emailEnabled, getAuthConfig } from "../../../lib/supabase/server";
export const dynamic = "force-dynamic";
export const metadata = { title: "Sign in" };
export default function SignInPage() {
  return (
    <AuthForm
      mode="sign-in"
      enabled={Boolean(getAuthConfig())}
      emailEnabled={emailEnabled()}
    />
  );
}
