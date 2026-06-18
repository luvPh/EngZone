"use client";

import type { FamilyEntry } from "@/lib/wordFamily";

// Radial "mindmap" of one word family: root in the centre, members around it
// with connector lines. Pure CSS positioning (%) + an SVG line layer behind.
export default function FamilyMindmap({ family }: { family: FamilyEntry }) {
  const members = family.members;
  const n = Math.max(members.length, 1);
  const R = 36; // radius in viewBox (0–100) units
  const pos = members.map((_, i) => {
    const a = (i / n) * 2 * Math.PI - Math.PI / 2;
    return { x: 50 + R * Math.cos(a), y: 50 + R * Math.sin(a) };
  });

  return (
    <div className="relative w-full aspect-[4/3] max-w-sm mx-auto">
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full"
      >
        {pos.map((p, i) => (
          <line
            key={i}
            x1="50"
            y1="50"
            x2={p.x}
            y2={p.y}
            stroke="rgba(167,139,250,0.45)"
            strokeWidth="0.5"
          />
        ))}
      </svg>

      {/* root */}
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-gradient-to-br from-accent to-accent-soft text-white text-sm font-bold shadow-glow-accent whitespace-nowrap"
        style={{ left: "50%", top: "50%" }}
      >
        {family.root}
      </div>

      {/* members */}
      {members.map((m, i) => (
        <div
          key={m.word}
          className="absolute -translate-x-1/2 -translate-y-1/2 glass rounded-lg px-2.5 py-1 text-center whitespace-nowrap"
          style={{ left: `${pos[i].x}%`, top: `${pos[i].y}%` }}
        >
          <div className="text-sm font-semibold text-white leading-tight">{m.word}</div>
          {m.pos && <div className="text-[10px] text-accent-soft leading-tight">{m.pos}</div>}
        </div>
      ))}
    </div>
  );
}
