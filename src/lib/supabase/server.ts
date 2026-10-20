import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { authConfigSchema } from "../auth/validation";

export function getAuthConfig() {
  const config = authConfigSchema.safeParse({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    siteUrl: process.env.APP_URL ?? "http://localhost:3000",
  });
  return config.success ? config.data : null;
}

export function emailEnabled() {
  return process.env.AUTH_EMAIL_ENABLED === "true";
}

export async function createClient() {
  const config = getAuthConfig();
  if (!config) return null;
  const store = await cookies();
  return createServerClient(config.url, config.publishableKey, {
    // This slice uses Server Actions only; no browser SDK reads session cookies.
    cookieOptions: {
      httpOnly: true,
      sameSite: "lax",
      secure: new URL(config.siteUrl).protocol === "https:",
      path: "/",
    },
    cookies: {
      getAll: () => store.getAll(),
      setAll(values) {
        try {
          for (const { name, value, options } of values)
            store.set(name, value, options);
        } catch {
          /* Server Components cannot write; the proxy refreshes their cookies. */
        }
      },
    },
  });
}
