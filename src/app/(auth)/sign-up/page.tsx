import { AuthForm } from "../../../components/auth/auth-form";
import { emailEnabled, getAuthConfig } from "../../../lib/supabase/server";
export const dynamic = "force-dynamic";
export const metadata = { title: "Create an account" };
export default function SignUpPage() {
  return (
    <AuthForm
      mode="sign-up"
      enabled={Boolean(getAuthConfig())}
      emailEnabled={emailEnabled()}
    />
  );
}
