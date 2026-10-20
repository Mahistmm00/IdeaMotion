import "server-only";
import { z } from "zod";
import { timingResponseSchema } from "./alignment";

export class NarrationError extends Error {
  constructor(
    public readonly code:
      | "CONFIG_REQUIRED"
      | "DISABLED"
      | "FREE_PLAN_REQUIRED"
      | "QUOTA_EXHAUSTED"
      | "VOICE_UNAVAILABLE"
      | "MODEL_UNAVAILABLE"
      | "PROVIDER_REJECTED"
      | "PROVIDER_UNCERTAIN"
      | "INVALID_RESPONSE",
  ) {
    super(code);
    this.name = "NarrationError";
  }
}
export const narrationConfigSchema = z.strictObject({
  apiKey: z
    .string()
    .min(10)
    .max(256)
    .regex(/^[!-~]+$/),
  voiceId: z.string().regex(/^[a-zA-Z0-9_-]{8,100}$/),
  modelId: z.literal("eleven_multilingual_v2"),
  enabled: z.boolean(),
});
export type NarrationConfig = z.infer<typeof narrationConfigSchema>;
export function narrationConfig(
  env: Record<string, string | undefined>,
): NarrationConfig {
  const result = narrationConfigSchema.safeParse({
    apiKey: env.ELEVENLABS_API_KEY,
    voiceId: env.ELEVENLABS_VOICE_ID,
    modelId: env.ELEVENLABS_MODEL_ID ?? "eleven_multilingual_v2",
    enabled: env.ELEVENLABS_ENABLED === "true",
  });
  if (!result.success) throw new NarrationError("CONFIG_REQUIRED");
  return result.data;
}

async function request(
  config: NarrationConfig,
  route: string,
  init: RequestInit,
  fetcher: typeof fetch,
) {
  const synthesis = init.method === "POST";
  try {
    const response = await fetcher(`https://api.elevenlabs.io${route}`, {
      ...init,
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(30000),
      headers: {
        "xi-api-key": config.apiKey,
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      await response.body?.cancel();
      if (response.status === 429) throw new NarrationError("QUOTA_EXHAUSTED");
      throw new NarrationError(
        synthesis && response.status >= 500
          ? "PROVIDER_UNCERTAIN"
          : "PROVIDER_REJECTED",
      );
    }
    if (!response.body) throw new NarrationError("INVALID_RESPONSE");
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let bytes = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 8000000) {
        await reader.cancel();
        throw new NarrationError("INVALID_RESPONSE");
      }
      chunks.push(value);
    }
    try {
      return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
    } catch {
      throw new NarrationError("INVALID_RESPONSE");
    }
  } catch (error) {
    if (error instanceof NarrationError) throw error;
    throw new NarrationError(
      synthesis ? "PROVIDER_UNCERTAIN" : "PROVIDER_REJECTED",
    );
  }
}

const subscriptionSchema = z.object({
  tier: z.literal("free"),
  character_count: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  character_limit: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  can_extend_character_limit: z.literal(false),
  allowed_to_extend_character_limit: z.literal(false),
});
const modelsSchema = z
  .array(
    z.object({
      model_id: z.string(),
      can_do_text_to_speech: z.boolean(),
      maximum_text_length_per_request: z.number().int().positive(),
    }),
  )
  .max(200);
const voiceSchema = z.object({
  voice_id: z.string(),
  category: z.literal("premade"),
  available_for_tiers: z.array(z.string()).optional(),
});

/** Read-only account checks; never generates speech or changes a plan. */
export async function checkNarrationAccess(
  configInput: NarrationConfig,
  characters: number,
  fetcher: typeof fetch = fetch,
) {
  const config = narrationConfigSchema.parse(configInput);
  z.number().int().min(1).max(400).parse(characters);
  const subscription = subscriptionSchema.safeParse(
    await request(config, "/v1/user/subscription", { method: "GET" }, fetcher),
  );
  if (!subscription.success) throw new NarrationError("FREE_PLAN_REQUIRED");
  const remaining =
    subscription.data.character_limit - subscription.data.character_count;
  if (remaining < characters) throw new NarrationError("QUOTA_EXHAUSTED");
  const models = modelsSchema.safeParse(
    await request(config, "/v1/models", { method: "GET" }, fetcher),
  );
  if (
    !models.success ||
    !models.data.some(
      (model) =>
        model.model_id === config.modelId &&
        model.can_do_text_to_speech &&
        model.maximum_text_length_per_request >= characters,
    )
  )
    throw new NarrationError("MODEL_UNAVAILABLE");
  const voice = voiceSchema.safeParse(
    await request(
      config,
      `/v1/voices/${config.voiceId}`,
      { method: "GET" },
      fetcher,
    ),
  );
  if (
    !voice.success ||
    voice.data.voice_id !== config.voiceId ||
    (voice.data.available_for_tiers?.length &&
      !voice.data.available_for_tiers.includes("free"))
  )
    throw new NarrationError("VOICE_UNAVAILABLE");
  return {
    tier: "free" as const,
    remainingCharacters: remaining,
    modelId: config.modelId,
    voiceId: config.voiceId,
  };
}

/** Local proof only: caller must hold a durable spend reservation before calling. No retries. */
export async function synthesizeNarration(
  configInput: NarrationConfig,
  text: string,
  fetcher: typeof fetch = fetch,
) {
  const config = narrationConfigSchema.parse(configInput);
  if (!config.enabled) throw new NarrationError("DISABLED");
  const approved = z.string().trim().min(1).max(400).parse(text);
  const access = await checkNarrationAccess(config, approved.length, fetcher);
  const raw = await request(
    config,
    "/v1/text-to-speech/" +
      config.voiceId +
      "/with-timestamps?output_format=mp3_44100_128",
    {
      method: "POST",
      body: JSON.stringify({
        text: approved,
        model_id: config.modelId,
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    },
    fetcher,
  );
  const parsed = timingResponseSchema.safeParse(raw);
  if (!parsed.success) throw new NarrationError("INVALID_RESPONSE");
  const encoded = parsed.data.audio_base64;
  if (
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
      encoded,
    )
  )
    throw new NarrationError("INVALID_RESPONSE");
  const audio = Buffer.from(encoded, "base64");
  const header =
    audio.subarray(0, 3).toString("ascii") === "ID3" ||
    (audio.length > 2 && audio[0] === 255 && (audio[1] & 224) === 224);
  if (
    !header ||
    audio.length < 32 ||
    audio.length > 4000000 ||
    audio.toString("base64") !== encoded
  )
    throw new NarrationError("INVALID_RESPONSE");
  return { audio, response: parsed.data, access };
}
