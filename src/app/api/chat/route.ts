import { NextRequest } from "next/server";
import { streamChat } from "@/lib/claude";
import { MASTER_SKILL } from "@/lib/skills";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { messages } = (await req.json()) as {
    messages: { role: "user" | "assistant"; content: string }[];
  };

  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response("messages required", { status: 400 });
  }

  const stream = streamChat({
    system: MASTER_SKILL,
    messages,
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
