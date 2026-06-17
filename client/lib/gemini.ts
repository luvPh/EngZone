// Free-tier provider: Google Gemini (streaming via SSE). Same output shape as
// the Claude streamers — a ReadableStream of UTF-8 text deltas.

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash";

export function hasGemini(): boolean {
  return !!process.env.GEMINI_API_KEY;
}

export function streamGemini(opts: {
  system: string;
  messages: { role: "user" | "assistant"; content: string }[];
  maxTokens?: number;
  model?: string;
}): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        const key = process.env.GEMINI_API_KEY;
        const model = opts.model || GEMINI_MODEL;
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${key}`;
        const contents = opts.messages.map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        }));
        const body = {
          systemInstruction: { parts: [{ text: opts.system }] },
          contents,
          generationConfig: { maxOutputTokens: opts.maxTokens ?? 2000 },
        };

        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok || !res.body) {
          const t = await res.text().catch(() => "");
          controller.enqueue(
            encoder.encode(`[lỗi Gemini ${res.status}] ${t.slice(0, 200)}`)
          );
          controller.close();
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          let nl: number;
          while ((nl = buf.indexOf("\n")) >= 0) {
            const line = buf.slice(0, nl).trim();
            buf = buf.slice(nl + 1);
            if (!line.startsWith("data:")) continue;
            const json = line.slice(5).trim();
            if (!json || json === "[DONE]") continue;
            try {
              const d = JSON.parse(json);
              const parts = d?.candidates?.[0]?.content?.parts ?? [];
              for (const p of parts) {
                if (typeof p.text === "string") {
                  controller.enqueue(encoder.encode(p.text));
                }
              }
            } catch {
              /* skip partial/non-JSON line */
            }
          }
        }
      } catch (err) {
        controller.enqueue(encoder.encode(`[lỗi Gemini] ${String(err)}`));
      } finally {
        controller.close();
      }
    },
  });
}
