/**
 * Tolerant JSON extraction from an LLM response that may wrap the object in
 * ```json fences or add a stray sentence. Returns the parsed object or null.
 */
export function extractJson<T = unknown>(text: string): T | null {
  if (!text) return null;

  // 1. Strip code fences if present.
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;

  // 2. Try direct parse.
  try {
    return JSON.parse(candidate.trim()) as T;
  } catch {
    /* fall through */
  }

  // 3. Grab the outermost {...} span and parse that.
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start >= 0 && end > start) {
    const span = candidate.slice(start, end + 1);
    try {
      return JSON.parse(span) as T;
    } catch {
      // 4. Tolerate trailing commas (e.g. `... },]` or `..., }`).
      try {
        return JSON.parse(span.replace(/,(\s*[}\]])/g, "$1")) as T;
      } catch {
        /* give up */
      }
    }
  }
  return null;
}
