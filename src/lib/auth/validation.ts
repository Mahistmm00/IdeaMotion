import { z } from "zod";

const email = z.email().trim().max(254);
const password = z
  .string()
  .min(12, "Use at least 12 characters.")
  .max(72)
  .refine(
    (value) => new TextEncoder().encode(value).length <= 72,
    "Use no more than 72 UTF-8 bytes.",
  );
export const signInSchema = z.strictObject({
  email,
  password: z.string().min(1).max(128),
});
export const emailSchema = z.strictObject({ email });
export const passwordSchema = z
  .strictObject({ password, confirmPassword: z.string().max(128) })
  .refine((input) => input.password === input.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords must match.",
  });
export const signUpSchema = z
  .strictObject({ email, password, confirmPassword: z.string().max(128) })
  .refine((input) => input.password === input.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords must match.",
  });
// Supabase can prefix a hash for a PKCE flow. Treat it as a bounded opaque token;
// only verifyOtp establishes whether the token is authentic or still usable.
export const confirmationSchema = z.strictObject({
  tokenHash: z.string().regex(/^[A-Za-z0-9_-]{40,160}$/),
  type: z.enum(["email", "recovery"]),
});
const origin = z
  .url()
  .refine((value) => {
    const url = new URL(value);
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    return (
      (url.protocol === "https:" || (local && url.protocol === "http:")) &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash &&
      url.pathname === "/"
    );
  }, "Use an HTTPS origin or a local development origin without a path.")
  .transform((value) => new URL(value).origin);
export const authConfigSchema = z.strictObject({
  url: origin,
  publishableKey: z.string().regex(/^sb_publishable_[A-Za-z0-9_-]{16,}$/),
  siteUrl: origin,
});
export const safeProfileSchema = z.strictObject({
  approved: z.boolean(),
  preferred_timezone: z.string().min(1).max(100),
});
export type SafeProfile = z.infer<typeof safeProfileSchema>;
export type AuthFormState = {
  message: string;
  email?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  success?: boolean;
};

export function validationState(error: z.ZodError): AuthFormState {
  return {
    message: "Please check the highlighted fields.",
    fieldErrors: z.flattenError(error).fieldErrors,
  };
}

const confirmationLinkSchema = z.discriminatedUnion("kind", [
  z.strictObject({
    kind: z.literal("pkce"),
    code: z.string().regex(/^[A-Za-z0-9_-]{20,512}$/),
    flowId: z
      .string()
      .regex(/^[A-Za-z0-9_-]{8,64}$/)
      .optional(),
  }),
  z.strictObject({
    kind: z.literal("token"),
    tokenHash: confirmationSchema.shape.tokenHash,
    type: confirmationSchema.shape.type,
  }),
]);

// Accept either format, reject ambiguous/array inputs, and never interpret a next
// destination or an untrusted URL type as the purpose of a PKCE session.
export function parseConfirmationLink(params: Record<string, unknown>) {
  if (params.code !== undefined) {
    return confirmationLinkSchema.safeParse({
      kind: "pkce",
      code: params.token_hash !== undefined ? null : params.code,
      flowId: params.sb_flow_id,
    });
  }
  return confirmationLinkSchema.safeParse({
    kind: "token",
    tokenHash: params.token_hash,
    type: params.type,
  });
}

// The pinned SDK returns this verifier-derived metadata at runtime, although
// its public response type omits it. Validate it; absence/unknown values must
// never make an untrusted URL parameter determine recovery behavior.
export function isRecoveryExchange(data: unknown) {
  return z.object({ redirectType: z.literal("recovery") }).safeParse(data)
    .success;
}
