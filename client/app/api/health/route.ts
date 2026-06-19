import { getMode, MODEL, claudeUsable } from "@/lib/claude";
import { hasGemini } from "@/lib/gemini";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    status: "ok",
    mode: getMode(),
    model: MODEL,
    providers: {
      // Claude only when an API key is set OR the local CLI is available
      // (false on Vercel) — the model picker disables it accordingly.
      claude: claudeUsable(),
      gemini: hasGemini(),
    },
  });
}
