import { getMode, MODEL } from "@/lib/claude";
import { hasGemini } from "@/lib/gemini";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    status: "ok",
    mode: getMode(),
    model: MODEL,
    providers: {
      claude: true, // CLI mode always available; SDK if key present
      gemini: hasGemini(),
    },
  });
}
