import fs from "fs";
import path from "path";

/**
 * Each SKILL.md is a system prompt for the Claude API.
 * Skills live at the repo root /skills (one level above client/).
 * Read once and cached for the process lifetime.
 */
let cached: string | null = null;

export function getMasterSkill(): string {
  if (cached) return cached;
  // cwd is the client/ directory when running `next dev` / `next start`.
  const skillPath = path.resolve(
    process.cwd(),
    "..",
    "skills",
    "english-master",
    "SKILL.md"
  );
  cached = fs.readFileSync(skillPath, "utf-8");
  return cached;
}
