"use server";

import { redirect } from "next/navigation";
import { createClient, emailEnabled, getAuthConfig } from "../supabase/server";
import {
  type AuthFormState,
  confirmationSchema,
  emailSchema,
  passwordSchema,
  signInSchema,
  signUpSchema,
  validationState,
} from "./validation";

const unavailable = {
  message: "Sign-in is temporarily unavailable. Please try again later.",
};
const emailUnavailable = {
  message:
    "Email access is not enabled for this demo yet. You can return to the preview.",
};
const neutral = {
  message:
    "If this address is eligible, an email will arrive when delivery is available. Check spam and wait before trying again.",
  success: true,
};

export async function signIn(
  _previous: AuthFormState,
  form: FormData,
): Promise<AuthFormState> {
  const input = signInSchema.safeParse({
    email: form.get("email"),
    password: form.get("password"),
  });
  if (!input.success) return validationState(input.error);
  try {
    const client = await createClient();
    if (!client) return unavailable;
    const { error } = await client.auth.signInWithPassword(input.data);
    if (error)
      return {
        message:
          "Unable to sign in. Check your details and confirm your email, or try again later.",
        email: input.data.email,
      };
  } catch {
    return unavailable;
  }
  redirect("/account");
}

export async function signUp(
  _previous: AuthFormState,
  form: FormData,
): Promise<AuthFormState> {
  const input = signUpSchema.safeParse({
    email: form.get("email"),
    password: form.get("password"),
    confirmPassword: form.get("confirmPassword"),
  });
  if (!input.success) return validationState(input.error);
  if (!emailEnabled()) return emailUnavailable;
  try {
    const client = await createClient();
    const config = getAuthConfig();
    if (!client || !config) return unavailable;
    // Do not forward form metadata: signup can never grant approval.
    const { error, data } = await client.auth.signUp({
      email: input.data.email,
      password: input.data.password,
      options: { emailRedirectTo: `${config.siteUrl}/auth/confirm` },
    });
    if (error) return neutral;
    if (data.session) await client.auth.signOut({ scope: "local" });
  } catch {
    return unavailable;
  }
  redirect("/verify-email");
}

export async function requestRecovery(
  _previous: AuthFormState,
  form: FormData,
): Promise<AuthFormState> {
  const input = emailSchema.safeParse({ email: form.get("email") });
  if (!input.success) return validationState(input.error);
  if (!emailEnabled()) return emailUnavailable;
  try {
    const client = await createClient();
    const config = getAuthConfig();
    if (!client || !config) return unavailable;
    await client.auth.resetPasswordForEmail(input.data.email, {
      redirectTo: `${config.siteUrl}/auth/confirm`,
    });
  } catch {
    /* Same result for unavailable, unknown, or ineligible addresses. */
  }
  return neutral;
}

export async function resendConfirmation(
  _previous: AuthFormState,
  form: FormData,
): Promise<AuthFormState> {
  const input = emailSchema.safeParse({ email: form.get("email") });
  if (!input.success) return validationState(input.error);
  if (!emailEnabled()) return emailUnavailable;
  try {
    const client = await createClient();
    const config = getAuthConfig();
    if (!client || !config) return unavailable;
    await client.auth.resend({
      type: "signup",
      email: input.data.email,
      options: { emailRedirectTo: `${config.siteUrl}/auth/confirm` },
    });
  } catch {
    /* Avoid exposing account eligibility or raw provider errors. */
  }
  return neutral;
}

export async function updatePassword(
  _previous: AuthFormState,
  form: FormData,
): Promise<AuthFormState> {
  const input = passwordSchema.safeParse({
    password: form.get("password"),
    confirmPassword: form.get("confirmPassword"),
  });
  if (!input.success) return validationState(input.error);
  try {
    const client = await createClient();
    if (!client) return unavailable;
    const { data, error: identityError } = await client.auth.getUser();
    if (identityError || !data.user)
      return {
        message:
          "This recovery session is unavailable. Request a new reset email.",
      };
    const { error } = await client.auth.updateUser({
      password: input.data.password,
    });
    if (error)
      return {
        message:
          "The password could not be changed. Try a different password or request a fresh reset email.",
      };
    const { error: logoutError } = await client.auth.signOut({
      scope: "global",
    });
    if (logoutError)
      return {
        message:
          "Password changed, but all sessions could not be closed. Sign out and review your account sessions.",
        success: true,
      };
  } catch {
    return unavailable;
  }
  redirect("/password-updated");
}

export async function confirmEmail(
  _previous: AuthFormState,
  form: FormData,
): Promise<AuthFormState> {
  const input = confirmationSchema.safeParse({
    tokenHash: form.get("tokenHash"),
    type: form.get("type"),
  });
  if (!input.success)
    return {
      message:
        "This link is invalid. Request a new confirmation or recovery email.",
    };
  try {
    const client = await createClient();
    if (!client) return unavailable;
    const { error } = await client.auth.verifyOtp({
      token_hash: input.data.tokenHash,
      type: input.data.type,
    });
    if (error)
      return {
        message:
          "This link is expired, already used, or invalid. Request a new email.",
      };
  } catch {
    return unavailable;
  }
  // Fixed destinations: never trust a next/redirect parameter from an email link.
  redirect(input.data.type === "recovery" ? "/reset-password" : "/account");
}

export async function signOut(): Promise<void> {
  let failed = false;
  try {
    const client = await createClient();
    if (client) {
      const { error } = await client.auth.signOut({ scope: "local" });
      failed = Boolean(error);
    }
  } catch {
    failed = true;
  }
  redirect(failed ? "/account?logout=failed" : "/sign-in");
}
