import { NextRequest } from "next/server";
import { streamChat, getMode } from "@/lib/claude";
import { streamChatCLI } from "@/lib/claudeCli";
import { streamGemini, hasGemini } from "@/lib/gemini";
import { getMasterSkill } from "@/lib/skills";

// Provider choice → actual Gemini model id.
const GEMINI_MODELS: Record<string, string> = {
  "gemini-flash": "gemini-3.5-flash",
  "gemini-flash-lite": "gemini-3.1-flash-lite",
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  // Provider routing: Gemini (free) if chosen + configured; otherwise Claude
  // (CLI subscription, or SDK when an API key is set).
  const geminiModel = body.provider ? GEMINI_MODELS[body.provider] : undefined;
  let stream: ReadableStream<Uint8Array>;
  if (geminiModel && hasGemini()) {
    stream = streamGemini({ system, messages, maxTokens, model: geminiModel });
  } else if (getMode() === "api-key") {
    stream = streamChat({ system, messages, maxTokens });
  } else {
    stream = streamChatCLI({ system, messages });
  }

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
