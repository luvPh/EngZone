import { MASTER_SKILL } from "./masterSkill";

/**
 * The english-master SKILL.md is the system prompt for the chat model.
 * It's embedded as a string (lib/masterSkill.ts) rather than read from disk,
 * so it bundles into serverless functions (Vercel). To update it, edit the
 * repo-root /skills/english-master/SKILL.md then run:
 *   node scripts/embed-skill.js
 */
export function getMasterSkill(): string {
  return MASTER_SKILL;
}
