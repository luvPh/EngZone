"use client";

// Per-feature abort controllers so re-running cancels the previous request.
const controllers: Record<string, AbortController> = {};

export interface RunHandlers {
  onText: (full: string) => void; // called with the accumulated text so far
  onDone: (full: string) => void;
  onError: (message: string) => void;
}

export type ChatMessage = { role: "user" | "assistant"; content: string };

/** POST a full conversation to /api/chat and stream the assistant reply. */
export async function runChat(
  key: string,
  messages: ChatMessage[],
  h: RunHandlers,
  opts: { maxTokens?: number; provider?: string } = {}
): Promise<void> {
  controllers[key]?.abort();
  const ctrl = new AbortController();
  controllers[key] = ctrl;

  let acc = "";
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages,
        maxTokens: opts.maxTokens,
        provider: opts.provider,
      }),
      signal: ctrl.signal,
    });

    if (!res.ok || !res.body) {
      let msg = `request failed (${res.status})`;
      try {
        const data = await res.json();
        if (data?.error) msg = data.error;
      } catch {
        /* not JSON */
      }
      h.onError(msg);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      acc += decoder.decode(value, { stream: true });
      h.onText(acc);
    }
    h.onDone(acc);
  } catch (err) {
    if ((err as Error)?.name === "AbortError") return;
    h.onError(err instanceof Error ? err.message : String(err));
  }
}

/** Single-message convenience wrapper. */
export async function runCommand(
  key: string,
  command: string,
  h: RunHandlers,
  opts: { maxTokens?: number; provider?: string } = {}
): Promise<void> {
  return runChat(key, [{ role: "user", content: command }], h, opts);
}

export function abortCommand(key: string) {
  controllers[key]?.abort();
}
