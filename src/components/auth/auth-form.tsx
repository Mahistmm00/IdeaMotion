"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import {
  confirmEmail,
  requestRecovery,
  resendConfirmation,
  signIn,
  signUp,
  updatePassword,
} from "../../lib/auth/actions";
import type { AuthFormState } from "../../lib/auth/validation";

const modes = {
  "sign-in": {
    title: "Welcome back.",
    description: "Sign in to your creative space.",
    button: "Sign in",
    action: signIn,
  },
  "sign-up": {
    title: "Start with an idea.",
    description: "Create your account. Live creation requires owner approval.",
    button: "Create account",
    action: signUp,
  },
  "forgot-password": {
    title: "Forgot your password?",
    description: "We’ll help you find your way back.",
    button: "Send reset email",
    action: requestRecovery,
  },
  "verify-email": {
    title: "Check your inbox.",
    description:
      "If your address is eligible, open the confirmation email. You can request another below.",
    button: "Resend confirmation",
    action: resendConfirmation,
  },
  "reset-password": {
    title: "A fresh start.",
    description: "Choose a new password for your account.",
    button: "Update password",
    action: updatePassword,
  },
  confirm: {
    title: "One more step.",
    description:
      "Confirm this email link to continue securely. Links can be used only once.",
    button: "Continue securely",
    action: confirmEmail,
  },
};
export type AuthMode = keyof typeof modes;

export function AuthForm({
  mode,
  enabled,
  emailEnabled,
  tokenHash = "",
  confirmationType = "email",
  code = "",
  flowId = "",
}: {
  mode: AuthMode;
  enabled: boolean;
  emailEnabled: boolean;
  tokenHash?: string;
  confirmationType?: string;
  code?: string;
  flowId?: string;
}) {
  const content = modes[mode];
  const [state, action, pending] = useActionState<AuthFormState, FormData>(
    content.action,
    { message: "" },
  );
  const [remaining, setRemaining] = useState(0);
  const sendsEmail = ["forgot-password", "verify-email", "sign-up"].includes(
    mode,
  );
  const hasEmail = !["reset-password", "confirm"].includes(mode);
  const hasPassword = ["sign-in", "sign-up", "reset-password"].includes(mode);
  const confirmation = ["sign-up", "reset-password"].includes(mode);
  useEffect(() => {
    if (state.success && sendsEmail) setRemaining(60);
  }, [state, sendsEmail]);
  useEffect(() => {
    if (!remaining) return;
    const timer = setTimeout(() => setRemaining(remaining - 1), 1000);
    return () => clearTimeout(timer);
  }, [remaining]);
  const disabled = !enabled || (sendsEmail && !emailEnabled);
  return (
    <section className="auth-card">
      <p className="eyebrow">YOUR EXPLAINER STUDIO</p>
      <h1>{content.title}</h1>
      <p className="auth-description">{content.description}</p>
      {disabled && (
        <p className="auth-notice" role="status">
          {!enabled
            ? "Sign-in is not available yet. You can still explore the preview."
            : "Email access is not enabled for this demo yet."}
        </p>
      )}
      <form action={action} className="auth-form">
        {hasEmail && (
          <div>
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              defaultValue={state.email}
              aria-invalid={Boolean(state.fieldErrors?.email)}
              aria-describedby={
                state.fieldErrors?.email ? "email-error" : undefined
              }
            />
            <p id="email-error" className="field-error">
              {state.fieldErrors?.email?.[0]}
            </p>
          </div>
        )}
        {hasPassword && (
          <div>
            <label htmlFor="password">
              {mode === "reset-password" ? "New password" : "Password"}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={mode === "sign-in" ? 1 : 12}
              maxLength={mode === "sign-in" ? 128 : 72}
              autoComplete={
                mode === "sign-in" ? "current-password" : "new-password"
              }
              aria-invalid={Boolean(state.fieldErrors?.password)}
              aria-describedby={
                mode === "sign-in"
                  ? "password-error"
                  : "password-help password-error"
              }
            />
            {mode !== "sign-in" && (
              <p id="password-help" className="field-help">
                At least 12 characters; no more than 72 UTF-8 bytes.
              </p>
            )}
            <p id="password-error" className="field-error">
              {state.fieldErrors?.password?.[0]}
            </p>
          </div>
        )}
        {confirmation && (
          <div>
            <label htmlFor="confirmPassword">Confirm password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              minLength={12}
              maxLength={72}
              autoComplete="new-password"
              aria-invalid={Boolean(state.fieldErrors?.confirmPassword)}
              aria-describedby="confirmation-error"
            />
            <p id="confirmation-error" className="field-error">
              {state.fieldErrors?.confirmPassword?.[0]}
            </p>
          </div>
        )}
        {mode === "confirm" &&
          (code ? (
            <>
              <input type="hidden" name="code" value={code} />
              {flowId && <input type="hidden" name="flowId" value={flowId} />}
            </>
          ) : (
            <>
              <input type="hidden" name="tokenHash" value={tokenHash} />
              <input type="hidden" name="type" value={confirmationType} />
            </>
          ))}
        {state.message && (
          <p
            className={state.success ? "auth-notice" : "auth-error"}
            role="status"
            aria-live="polite"
          >
            {state.message}
          </p>
        )}
        <button
          className="primary-link"
          type="submit"
          disabled={disabled || pending || remaining > 0}
        >
          {pending
            ? "Please wait…"
            : remaining
              ? `Try again in ${remaining}s`
              : content.button}
        </button>
      </form>
      <nav className="auth-links" aria-label="Account options">
        {mode === "sign-in" ? (
          <>
            <Link href="/forgot-password">Forgot password?</Link>
            <span>
              New here? <Link href="/sign-up">Create an account</Link>
            </span>
          </>
        ) : (
          <>
            <Link href="/sign-in">Back to sign in</Link>
            {mode === "confirm" && (
              <Link href="/forgot-password">Request a reset email</Link>
            )}
          </>
        )}
      </nav>
    </section>
  );
}
