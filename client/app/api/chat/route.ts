import { NextRequest } from "next/server";
import { streamChat, getMode, cliAvailable } from "@/lib/claude";
import { streamChatCLI } from "@/lib/claudeCli";
import { streamGemini, hasGemini } from "@/lib/gemini";
import { getMasterSkill } from "@/lib/skills";

// Provider choice → actual Gemini model id.
const GEMINI_MODELS: Record<string, string> = {
  "gemini-flash": "gemini-3.5-flash",
  "gemini-flash-lite": "gemini-3.1-flash-lite",
};
const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Long generations (essays / 40-question exams) stream for a while; allow up to
// Vercel's Hobby ceiling so they don't get cut off mid-stream.
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  let body: {
    messages?: { role: "user" | "assistant"; content: string }[];
    maxTokens?: number;
    provider?: string;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const messages = body.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: "messages required" }, { status: 400 });
  }

  const maxTokens = Math.min(Math.max(body.maxTokens ?? 2000, 512), 8000);
  const system = getMasterSkill();

  // Provider routing, in priority order:
  //  1. Gemini if explicitly chosen + configured (free tier).
  //  2. Claude SDK if an API key is set.
  //  3. Claude CLI if available (local dev w/ subscription) — never on Vercel.
  //  4. Fallback: Gemini if configured (e.g. Vercel where "Claude" was picked
  //     but no CLI/key exists), so the request still succeeds.
  // If none can serve, return a clear error instead of crashing.
  const geminiModel = body.provider ? GEMINI_MODELS[body.provider] : undefined;
  let stream: ReadableStream<Uint8Array>;
  if (geminiModel && hasGemini()) {
    stream = streamGemini({ system, messages, maxTokens, model: geminiModel });
  } else if (getMode() === "api-key") {
    stream = streamChat({ system, messages, maxTokens });
  } else if (cliAvailable()) {
    stream = streamChatCLI({ system, messages });
  } else if (hasGemini()) {
    stream = streamGemini({ system, messages, maxTokens, model: DEFAULT_GEMINI_MODEL });
  } else {
    return Response.json(
      { error: "No AI provider configured. Set GEMINI_API_KEY or ANTHROPIC_API_KEY." },
      { status: 503 }
    );
  }

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
