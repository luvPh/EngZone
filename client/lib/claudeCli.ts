import { spawn } from "node:child_process";
import os from "node:os";
import type Anthropic from "@anthropic-ai/sdk";

export const CLI_BIN = process.env.CLAUDE_BIN || "claude";
export const CLI_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";

/**
 * Stream a completion via the local Claude Code CLI (subscription auth, no API
 * key). The CLI intercepts any stdin starting with "/" as its own slash
 * command, so we send the user turn as stream-json with a single leading space
 * — the CLI passes it through verbatim and the english-master skill still
 * parses "/quiz ..." as a command.
 *
 * Runs in os.tmpdir() so the CLI doesn't auto-discover this repo's CLAUDE.md,
 * and uses --system-prompt to replace Claude Code's default prompt with the
 * skill. Does NOT use --bare (that would disable subscription/OAuth auth).
 */
export function streamChatCLI(opts: {
  system: string;
  messages: Anthropic.MessageParam[];
}): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  // App sends a single user turn; take the last user message as the command.
  const lastUser = [...opts.messages].reverse().find((m) => m.role === "user");
  const command =
    typeof lastUser?.content === "string"
      ? lastUser.content
      : (lastUser?.content ?? [])
          .map((b) => ("text" in b ? b.text : ""))
          .join("");

  const args = [
    "-p",
    "--input-format",
    "stream-json",
    "--output-format",
    "stream-json",
    "--include-partial-messages",
    "--verbose",
    "--model",
    CLI_MODEL,
    "--no-session-persistence",
    "--system-prompt",
    opts.system,
  ];

  return new ReadableStream({
    start(controller) {
      let child;
      try {
        child = spawn(CLI_BIN, args, {
          cwd: os.tmpdir(),
          env: process.env,
          stdio: ["pipe", "pipe", "pipe"],
        });
      } catch (err) {
        controller.enqueue(
          encoder.encode(`[error] cannot launch Claude CLI: ${String(err)}`)
        );
        controller.close();
        return;
      }

      let streamedAny = false;
      let stderr = "";
      let buf = "";

      const handleLine = (line: string) => {
        const trimmed = line.trim();
        if (!trimmed) return;
        let d: any;
        try {
          d = JSON.parse(trimmed);
        } catch {
          return; // non-JSON noise
        }
        if (d.type === "stream_event") {
          const e = d.event;
          if (
            e?.type === "content_block_delta" &&
            e?.delta?.type === "text_delta" &&
            typeof e.delta.text === "string"
          ) {
            streamedAny = true;
            controller.enqueue(encoder.encode(e.delta.text));
          }
        } else if (d.type === "result") {
          if (d.is_error && d.result) {
            controller.enqueue(encoder.encode(`\n\n[error] ${d.result}`));
          } else if (!streamedAny && typeof d.result === "string") {
            // Fallback: no partial deltas arrived — emit the final text.
            controller.enqueue(encoder.encode(d.result));
          }
        }
      };

      child.stdout.on("data", (chunk: Buffer) => {
        buf += chunk.toString("utf-8");
        let nl: number;
        while ((nl = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, nl);
          buf = buf.slice(nl + 1);
          handleLine(line);
        }
      });

      child.stderr.on("data", (chunk: Buffer) => {
        stderr += chunk.toString("utf-8");
      });

      child.on("error", (err) => {
        const hint =
          (err as NodeJS.ErrnoException).code === "ENOENT"
            ? `Claude CLI not found ("${CLI_BIN}"). Cài bằng: npm i -g @anthropic-ai/claude-code, rồi: claude login`
            : String(err);
        controller.enqueue(encoder.encode(`[error] ${hint}`));
        controller.close();
      });

      child.on("close", (code) => {
        if (buf.trim()) handleLine(buf); // flush any trailing line
        if (code !== 0 && !streamedAny) {
          const msg = stderr.trim() || `Claude CLI exited with code ${code}`;
          controller.enqueue(encoder.encode(`[error] ${msg}`));
        }
        controller.close();
      });

      // Send the single user turn (leading space dodges CLI slash parsing).
      const payload =
        JSON.stringify({
          type: "user",
          message: { role: "user", content: [{ type: "text", text: " " + command }] },
        }) + "\n";
      child.stdin.write(payload);
      child.stdin.end();
    },
  });
}
