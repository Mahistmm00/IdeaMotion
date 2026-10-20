import Link from "next/link";
export const metadata = { title: "Password updated" };
export default function PasswordUpdatedPage() {
  return (
    <section className="auth-card">
      <p className="eyebrow">YOU’RE READY</p>
      <h1>Sign in with your new password.</h1>
      <p className="auth-description">
        If you just completed a password reset, use your new password below.
      </p>
      <Link className="primary-link" href="/sign-in">
        Go to sign in
      </Link>
    </section>
  );
}
