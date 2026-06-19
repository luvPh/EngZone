import Anthropic from "@anthropic-ai/sdk";

// Lazily constructed so `next build` doesn't need a key at build time.
let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) client = new Anthropic();
  return client;
}

export const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";

// "api-key" when ANTHROPIC_API_KEY is set, otherwise "cli" (Claude CLI / subscription).
export type Mode = "api-key" | "cli";
export function getMode(): Mode {
  return process.env.ANTHROPIC_API_KEY ? "api-key" : "cli";
}

// The Claude CLI subprocess only exists on a machine where `claude` is installed
// and logged in — never on serverless (Vercel). Treat it as available only when
// NOT running on Vercel and not explicitly disabled. Lets local dev keep using
// the subscription CLI while a Vercel deploy quietly falls back to Gemini.
export function cliAvailable(): boolean {
  return !process.env.VERCEL && process.env.ENGZONE_NO_CLI !== "1";
}

// Whether the "Claude" provider can actually serve a request in this environment.
export function claudeUsable(): boolean {
  return getMode() === "api-key" || cliAvailable();
}

/**
 * Stream a chat completion as a plain-text stream of token deltas.
 * The system prompt (english-master SKILL.md) is passed in by the caller.
 */
export function streamChat(opts: {
  system: string;
  messages: Anthropic.MessageParam[];
  maxTokens?: number;
}): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        const stream = getClient().messages.stream({
          model: MODEL,
          max_tokens: opts.maxTokens ?? 2000,
          system: opts.system,
          messages: opts.messages,
        });

        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        controller.enqueue(encoder.encode(`\n\n[error] ${message}`));
      } finally {
        controller.close();
      }
    },
  });
}
