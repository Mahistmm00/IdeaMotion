import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  checkNarrationAccess,
  narrationConfig,
  synthesizeNarration,
} from "./elevenlabs";

const config = {
  apiKey: "test-key-placeholder",
  voiceId: "testvoice123",
  modelId: "eleven_multilingual_v2" as const,
  enabled: true,
};
const subscription = {
  tier: "free",
  character_count: 10,
  character_limit: 10000,
  can_extend_character_limit: false,
  allowed_to_extend_character_limit: false,
};
const models = [
  {
    model_id: config.modelId,
    can_do_text_to_speech: true,
    maximum_text_length_per_request: 10000,
  },
];
const voice = {
  voice_id: config.voiceId,
  category: "premade",
  available_for_tiers: ["free"],
};
function transport(values: unknown[]) {
  return vi
    .fn<typeof fetch>()
    .mockImplementation(
      async () => new Response(JSON.stringify(values.shift()), { status: 200 }),
    );
}
describe("bounded ElevenLabs adapter", () => {
  it("requires configured secrets and defaults synthesis off", () => {
    expect(() => narrationConfig({})).toThrow("CONFIG_REQUIRED");
    expect(
      narrationConfig({
        ELEVENLABS_API_KEY: config.apiKey,
        ELEVENLABS_VOICE_ID: config.voiceId,
      }).enabled,
    ).toBe(false);
  });
  it("does not contact a provider when synthesis is disabled", async () => {
    const fetcher = transport([]);
    await expect(
      synthesizeNarration({ ...config, enabled: false }, "Hi", fetcher),
    ).rejects.toThrow("DISABLED");
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("preflights with read-only calls and reports quota without generation", async () => {
    const fetcher = transport([subscription, models, voice]);
    expect(
      (await checkNarrationAccess(config, 20, fetcher)).remainingCharacters,
    ).toBe(9990);
    expect(fetcher.mock.calls.every((call) => call[1]?.method === "GET")).toBe(
      true,
    );
  });
  it.each([
    { ...subscription, tier: "starter" },
    { ...subscription, can_extend_character_limit: true },
    { ...subscription, allowed_to_extend_character_limit: true },
  ])("rejects a paid or extendable account before synthesis", async (sub) => {
    const fetcher = transport([sub]);
    await expect(synthesizeNarration(config, "Hi", fetcher)).rejects.toThrow(
      "FREE_PLAN_REQUIRED",
    );
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("stops at quota exhaustion", async () => {
    const fetcher = transport([{ ...subscription, character_count: 9999 }]);
    await expect(synthesizeNarration(config, "Hello", fetcher)).rejects.toThrow(
      "QUOTA_EXHAUSTED",
    );
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("requires a supported model and free premade voice", async () => {
    await expect(
      checkNarrationAccess(config, 5, transport([subscription, []])),
    ).rejects.toThrow("MODEL_UNAVAILABLE");
    await expect(
      checkNarrationAccess(
        config,
        5,
        transport([
          subscription,
          models,
          { ...voice, category: "professional" },
        ]),
      ),
    ).rejects.toThrow("VOICE_UNAVAILABLE");
  });
  it("sends the timing endpoint once and returns undecoded bytes for media verification", async () => {
    // Synthetic header-only bytes: CLI decoding is still mandatory before Ready.
    const audio = Buffer.concat([Buffer.from("ID3"), Buffer.alloc(50)]);
    const fetcher = transport([
      subscription,
      models,
      voice,
      { audio_base64: audio.toString("base64"), alignment: null },
    ]);
    const output = await synthesizeNarration(config, "Hello", fetcher);
    expect(output.audio).toEqual(audio);
    expect(fetcher).toHaveBeenCalledTimes(4);
    expect(fetcher.mock.calls[3][0]).toBe(
      "https://api.elevenlabs.io/v1/text-to-speech/testvoice123/with-timestamps?output_format=mp3_44100_128",
    );
    expect(JSON.parse(fetcher.mock.calls[3][1]?.body as string).text).toBe(
      "Hello",
    );
  });
  it("rejects malformed base64 instead of accepting a forgiving decode", async () => {
    await expect(
      synthesizeNarration(
        config,
        "Hi",
        transport([
          subscription,
          models,
          voice,
          { audio_base64: "ID3!!!!!!", alignment: null },
        ]),
      ),
    ).rejects.toThrow("INVALID_RESPONSE");
  });
  it("never retries an uncertain synthesis response or exposes provider error text", async () => {
    const fetcher = transport([subscription, models, voice]);
    fetcher
      .mockImplementationOnce(
        async () => new Response(JSON.stringify(subscription)),
      )
      .mockImplementationOnce(async () => new Response(JSON.stringify(models)))
      .mockImplementationOnce(async () => new Response(JSON.stringify(voice)))
      .mockImplementationOnce(
        async () => new Response("private text and key", { status: 503 }),
      );
    await expect(synthesizeNarration(config, "Hi", fetcher)).rejects.toThrow(
      /^PROVIDER_UNCERTAIN$/,
    );
    expect(fetcher).toHaveBeenCalledTimes(4);
  });
});
