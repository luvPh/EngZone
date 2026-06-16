import fs from "fs";
import path from "path";

/**
 * Each SKILL.md under /skills is a system prompt for the Claude API.
 * Loaded once at module init and cached for the process lifetime.
 */
function loadSkill(name: string): string {
  const skillPath = path.join(process.cwd(), "skills", name, "SKILL.md");
  return fs.readFileSync(skillPath, "utf-8");
}

// english-master drives every feature — see CLAUDE.md.
export const MASTER_SKILL = loadSkill("english-master");
