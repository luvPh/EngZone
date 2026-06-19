// Re-embed the repo-root SKILL.md into client/lib/masterSkill.ts as a string,
// so the system prompt bundles into serverless functions (no fs at runtime).
// Run from client/: node scripts/embed-skill.js
const fs = require("fs");
const path = require("path");
const src = fs.readFileSync(
  path.resolve(__dirname, "..", "..", "skills", "english-master", "SKILL.md"),
  "utf-8"
);
const out = `// AUTO-EMBEDDED copy of /skills/english-master/SKILL.md (repo root).
// Embedded as a string so it bundles into serverless functions (Vercel) — the
// app no longer reads it from disk at runtime. Source of truth is the repo-root
// file; after editing it re-run: node scripts/embed-skill.js
/* eslint-disable */
export const MASTER_SKILL = ${JSON.stringify(src)};
`;
fs.writeFileSync(path.resolve(__dirname, "..", "lib", "masterSkill.ts"), out);
console.log("Embedded", src.length, "chars → lib/masterSkill.ts");
