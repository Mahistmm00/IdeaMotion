import { describe, expect, it } from "vitest";
import {
  authConfigSchema,
  confirmationSchema,
  emailSchema,
  passwordSchema,
  safeProfileSchema,
  signUpSchema,
} from "./validation";

describe("auth trust boundaries", () => {
  it("validates confirmation type/hash without accepting open redirects", () => {
    const tokenHash = "a".repeat(64);
    expect(
      confirmationSchema.safeParse({ tokenHash, type: "recovery" }).success,
    ).toBe(true);
    expect(
      confirmationSchema.safeParse({
        tokenHash: `pkce_${"a".repeat(56)}`,
        type: "email",
      }).success,
    ).toBe(true);
    for (const type of [
      "invite",
      "magiclink",
      "signup",
      "https://attacker.test",
    ])
      expect(confirmationSchema.safeParse({ tokenHash, type }).success).toBe(
        false,
      );
    expect(
      confirmationSchema.safeParse({ tokenHash: "<script>", type: "email" })
        .success,
    ).toBe(false);
    expect(
      confirmationSchema.safeParse({
        tokenHash,
        type: "email",
        next: "//attacker.test",
      }).success,
    ).toBe(false);
  });
  it("requires matching passwords and handles UTF-8 byte limits", () => {
    expect(
      passwordSchema.safeParse({
        password: "A long password!",
        confirmPassword: "different",
      }).success,
    ).toBe(false);
    expect(
      passwordSchema.safeParse({ password: "short", confirmPassword: "short" })
        .success,
    ).toBe(false);
    const password = "🚀".repeat(20);
    expect(
      passwordSchema.safeParse({ password, confirmPassword: password }).success,
    ).toBe(false);
    expect(
      passwordSchema.parse({
        password: "long correct horse",
        confirmPassword: "long correct horse",
      }).password,
    ).toBe("long correct horse");
  });
  it("rejects spoofed approval and invalid email input", () => {
    expect(emailSchema.safeParse({ email: "not-an-email" }).success).toBe(
      false,
    );
    expect(
      signUpSchema.safeParse({
        email: "owner@example.test",
        password: "long correct horse",
        confirmPassword: "long correct horse",
        approved: true,
      }).success,
    ).toBe(false);
  });
  it("allows only safe configured origins and publishable keys", () => {
    const config = {
      url: "https://example.supabase.co",
      siteUrl: "http://localhost:3000",
      publishableKey: "sb_publishable_example_for_unit_tests_only",
    };
    expect(authConfigSchema.safeParse(config).success).toBe(true);
    expect(
      authConfigSchema.parse({ ...config, siteUrl: "https://example.test/" })
        .siteUrl,
    ).toBe("https://example.test");
    for (const siteUrl of [
      "http://public.example.test",
      "https://a.test/redirect",
      "https://u:p@a.test",
      "https://a.test?next=evil",
      "javascript:alert(1)",
    ])
      expect(authConfigSchema.safeParse({ ...config, siteUrl }).success).toBe(
        false,
      );
    expect(
      authConfigSchema.safeParse({
        ...config,
        publishableKey: "sb_secret_unit_test_not_a_key",
      }).success,
    ).toBe(false);
  });
  it("does not coerce malformed profile approval into access", () => {
    expect(
      safeProfileSchema.safeParse({
        approved: "true",
        preferred_timezone: "UTC",
      }).success,
    ).toBe(false);
    expect(safeProfileSchema.safeParse(null).success).toBe(false);
  });
});
