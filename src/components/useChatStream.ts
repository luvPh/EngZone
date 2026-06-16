"use client";

import { useCallback, useState } from "react";

/**
 * Sends a single command string to /api/chat and streams the text response
 * back incrementally. MVP shape: one user turn, render the markdown as text.
 */
export function useChatStream() {
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const run = useCallback(async (command: string) => {
    setOutput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: command }],
        }),
      });

      if (!res.ok || !res.body) {
        setOutput(`[error] request failed (${res.status})`);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setOutput((prev) => prev + decoder.decode(value, { stream: true }));
      }
    } catch (err) {
      setOutput(`[error] ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  return { output, loading, run };
}
