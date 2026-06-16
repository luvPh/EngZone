import Anthropic from "@anthropic-ai/sdk";

// Lazily constructed so `next build` doesn't require a key at build time.
// Reads ANTHROPIC_API_KEY from the environment when first used.
let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) client = new Anthropic();
  return client;
}

export const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";

/**
 * Stream a chat completion as a plain text stream of token deltas.
 * The system prompt (a SKILL.md) is passed in by the caller.
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
