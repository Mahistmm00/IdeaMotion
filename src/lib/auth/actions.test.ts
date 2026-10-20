import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  emailEnabled: vi.fn(),
  getAuthConfig: vi.fn(),
  redirect: vi.fn(),
}));
vi.mock("../supabase/server", () => ({
  createClient: mocks.createClient,
  emailEnabled: mocks.emailEnabled,
  getAuthConfig: mocks.getAuthConfig,
}));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

import {
  confirmEmail,
  requestRecovery,
  signIn,
  signUp,
  updatePassword,
} from "./actions";

const initial = { message: "" };
const form = (values: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
};
const credentials = {
  email: "tester@example.test",
  password: "long correct horse",
  confirmPassword: "long correct horse",
};
let auth: {
  signInWithPassword: ReturnType<typeof vi.fn>;
  signUp: ReturnType<typeof vi.fn>;
  signOut: ReturnType<typeof vi.fn>;
  getUser: ReturnType<typeof vi.fn>;
  updateUser: ReturnType<typeof vi.fn>;
  verifyOtp: ReturnType<typeof vi.fn>;
  resetPasswordForEmail: ReturnType<typeof vi.fn>;
};
beforeEach(() => {
  vi.resetAllMocks();
  auth = {
    signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
    signUp: vi.fn().mockResolvedValue({ error: null, data: { session: null } }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    getUser: vi
      .fn()
      .mockResolvedValue({ error: null, data: { user: { id: "user" } } }),
    updateUser: vi.fn().mockResolvedValue({ error: null }),
    verifyOtp: vi.fn().mockResolvedValue({ error: null }),
    resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
  };
  mocks.createClient.mockResolvedValue({ auth });
  mocks.emailEnabled.mockReturnValue(true);
  mocks.getAuthConfig.mockReturnValue({
    siteUrl: "https://ideamotion.example",
  });
  mocks.redirect.mockImplementation((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  });
});

describe("auth actions without live provider calls", () => {
  it("never calls Auth for malformed input or disabled email flows", async () => {
    await signIn(initial, form({ email: "bad", password: "" }));
    expect(mocks.createClient).not.toHaveBeenCalled();
    mocks.emailEnabled.mockReturnValue(false);
    const result = await signUp(initial, form(credentials));
    expect(result.message).toMatch(/not enabled/);
    expect(mocks.createClient).not.toHaveBeenCalled();
  });
  it("sends a signed-in user to access status, not a live creation endpoint", async () => {
    await expect(signIn(initial, form(credentials))).rejects.toThrow(
      "REDIRECT:/account",
    );
  });
  it("does not expose provider payloads or passwords on failed sign-in", async () => {
    auth.signInWithPassword.mockResolvedValue({
      error: { message: "private-provider-debug-secret" },
    });
    const result = await signIn(initial, form(credentials));
    expect(JSON.stringify(result)).not.toContain("private-provider");
    expect(JSON.stringify(result)).not.toContain(credentials.password);
  });
  it("never forwards user-controlled approval metadata at signup", async () => {
    await expect(
      signUp(
        initial,
        form({ ...credentials, approved: "true", role: "admin" }),
      ),
    ).rejects.toThrow("REDIRECT:/verify-email");
    expect(auth.signUp).toHaveBeenCalledWith({
      email: credentials.email,
      password: credentials.password,
      options: { emailRedirectTo: "https://ideamotion.example/auth/confirm" },
    });
  });
  it("uses the same recovery result for known, unknown and delivery-limited accounts", async () => {
    const known = await requestRecovery(
      initial,
      form({ email: credentials.email }),
    );
    auth.resetPasswordForEmail.mockResolvedValue({
      error: { message: "not authorized team email" },
    });
    const unknown = await requestRecovery(
      initial,
      form({ email: "unknown@example.test" }),
    );
    expect(known).toEqual(unknown);
  });
  it("requires a verified server identity before password updates", async () => {
    auth.getUser.mockResolvedValue({ error: null, data: { user: null } });
    expect((await updatePassword(initial, form(credentials))).message).toMatch(
      /session/,
    );
    expect(auth.updateUser).not.toHaveBeenCalled();
  });
  it("only reports reset success after update and global sign-out succeed", async () => {
    await expect(updatePassword(initial, form(credentials))).rejects.toThrow(
      "REDIRECT:/password-updated",
    );
    expect(auth.signOut).toHaveBeenCalledWith({ scope: "global" });
  });
  it("does not falsely report a rejected password change as successful", async () => {
    auth.updateUser.mockResolvedValue({ error: { message: "weak password" } });
    expect((await updatePassword(initial, form(credentials))).success).not.toBe(
      true,
    );
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
  it("distinguishes a changed password from a failed global session revocation", async () => {
    auth.signOut.mockResolvedValue({ error: { message: "offline" } });
    const result = await updatePassword(initial, form(credentials));
    expect(result.message).toMatch(/Password changed, but/);
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
  it("consumes recovery links only on explicit action and ignores attacker destinations", async () => {
    const tokenHash = "a".repeat(64);
    await expect(
      confirmEmail(
        initial,
        form({ tokenHash, type: "recovery", next: "https://attacker.test" }),
      ),
    ).rejects.toThrow("REDIRECT:/reset-password");
    expect(auth.verifyOtp).toHaveBeenCalledWith({
      token_hash: tokenHash,
      type: "recovery",
    });
  });
  it("handles expired links and missing configuration without claiming success", async () => {
    auth.verifyOtp.mockResolvedValue({ error: { message: "expired" } });
    expect(
      (
        await confirmEmail(
          initial,
          form({ tokenHash: "a".repeat(64), type: "email" }),
        )
      ).message,
    ).toMatch(/expired/);
    mocks.createClient.mockResolvedValue(null);
    expect((await signIn(initial, form(credentials))).message).toMatch(
      /unavailable/,
    );
  });
});
