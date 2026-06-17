"use client";

// Per-feature abort controllers so re-running cancels the previous request.
const controllers: Record<string, AbortController> = {};

export interface RunHandlers {
  onText: (full: string) => void; // called with the accumulated text so far
  onDone: (full: string) => void;
  onError: (message: string) => void;
}

/**
 * POST a single command to /api/chat and stream the text back. Updates are
 * delivered via handlers (which typically write into the persistent store),
 * so streaming survives navigation away from the originating page.
 */
export async function runCommand(
  key: string,
  command: string,
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
        messages: [{ role: "user", content: command }],
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

export function abortCommand(key: string) {
  controllers[key]?.abort();
}
