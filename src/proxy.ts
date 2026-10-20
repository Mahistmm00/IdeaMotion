import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { authConfigSchema } from "./lib/auth/validation";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const config = authConfigSchema.safeParse({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    siteUrl: process.env.APP_URL ?? "http://localhost:3000",
  });
  if (config.success) {
    const supabase = createServerClient(
      config.data.url,
      config.data.publishableKey,
      {
        cookieOptions: {
          httpOnly: true,
          sameSite: "lax",
          secure: new URL(config.data.siteUrl).protocol === "https:",
          path: "/",
        },
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll(values, headers) {
            for (const { name, value } of values)
              request.cookies.set(name, value);
            response = NextResponse.next({ request });
            for (const { name, value, options } of values)
              response.cookies.set(name, value, options);
            for (const [name, value] of Object.entries(headers ?? {}))
              response.headers.set(name, value);
          },
        },
      },
    );
    try {
      await supabase.auth.getClaims();
    } catch {
      /* Protected pages/actions verify with Auth again and fail closed. */
    }
  }
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
export const config = {
  matcher: [
    "/account/:path*",
    "/sign-in",
    "/sign-up",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
    "/password-updated",
    "/auth/:path*",
  ],
};
