"use client";

import { useEffect, useState } from "react";
import { LEVELS } from "@/lib/grammar";
import { getAllLessons } from "@/lib/grammarLibrary";
import { ProgressBar } from "@/components/ui";

// Abstract gradient "art" per level: a base diagonal gradient + two blurred
// orbs, no emoji/icon (per design direction).
const META: Record<
  string,
  { name: string; grad: string; orb1: string; orb2: string }
> = {
  "A1-A2": {
    name: "Sơ cấp",
    grad: "from-[#7c5cff] via-[#a78bfa] to-[#f0abfc]",
    orb1: "radial-gradient(circle, #c084fc, transparent 70%)",
    orb2: "radial-gradient(circle, #f0abfc, transparent 70%)",
  },
  "B1-B2": {
    name: "Trung cấp",
    grad: "from-[#4f46e5] via-[#7c5cff] to-[#22d3ee]",
    orb1: "radial-gradient(circle, #818cf8, transparent 70%)",
    orb2: "radial-gradient(circle, #22d3ee, transparent 70%)",
  },
  "C1-C2": {
    name: "Cao cấp",
    grad: "from-[#0ea5e9] via-[#6366f1] to-[#a855f7]",
    orb1: "radial-gradient(circle, #38bdf8, transparent 70%)",
    orb2: "radial-gradient(circle, #a855f7, transparent 70%)",
  },
};

export default function GrammarCoverflow({
  onOpen,
}: {
  onOpen: (level: string) => void;
}) {
  const [counts, setCounts] = useState<Record<string, { total: number; learned: number }>>({});
  const [center, setCenter] = useState(1); // default focus = Trung cấp

  useEffect(() => {
    const all = getAllLessons();
    const c: Record<string, { total: number; learned: number }> = {};
    for (const lvl of LEVELS) {
      const items = all.filter((l) => l.level === lvl);
      c[lvl] = { total: items.length, learned: items.filter((l) => l.learned).length };
    }
    setCounts(c);
  }, []);

  const totalAll = Object.values(counts).reduce((a, b) => a + b.total, 0);
  const learnedAll = Object.values(counts).reduce((a, b) => a + b.learned, 0);

  return (
    <div className="animate-fade-up">
      <p className="text-center text-sm text-muted mb-4">Chọn cấp độ để bắt đầu</p>

      <div className="flex items-center justify-center gap-0 py-2">
        {LEVELS.map((lvl, i) => {
          const m = META[lvl];
          const c = counts[lvl] ?? { total: 0, learned: 0 };
          const isCenter = i === center;
          const base =
            "flex-none rounded-3xl overflow-hidden glass cursor-pointer transition-all duration-300 ease-out";
          const size = isCenter
            ? "w-52 z-10 scale-100 shadow-glow-accent"
            : "w-36 scale-[0.86] opacity-55 hover:opacity-80";
          const overlap = i < center ? "mr-[-22px]" : i > center ? "ml-[-22px]" : "";
          return (
            <div
              key={lvl}
              className={`${base} ${size} ${overlap}`}
              onClick={() => (isCenter ? onOpen(lvl) : setCenter(i))}
            >
              <div
                className={`relative overflow-hidden ${isCenter ? "h-44" : "h-32"}`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${m.grad}`} />
                <div
                  className="absolute -top-8 -left-6 w-28 h-28 rounded-full blur-2xl"
                  style={{ background: m.orb1 }}
                />
                <div
                  className="absolute -bottom-10 -right-4 w-32 h-32 rounded-full blur-2xl opacity-80"
                  style={{ background: m.orb2 }}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "radial-gradient(130% 80% at 50% 125%, rgba(0,0,0,0.4), transparent 60%)",
                  }}
                />
              </div>
              <div className="p-3.5">
                <div className={`font-extrabold text-white ${isCenter ? "text-xl" : "text-base"}`}>
                  {m.name}
                </div>
                <div className="text-xs text-muted mb-2">
                  {lvl} · {c.total} bài
                </div>
                {isCenter && (
                  <div className="flex items-center gap-2">
                    <ProgressBar value={c.learned} max={c.total} className="flex-1" />
                    <span className="text-xs text-ok font-bold">
                      ✓ {c.learned}/{c.total}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* dots */}
      <div className="flex justify-center gap-2 mt-3">
        {LEVELS.map((lvl, i) => (
          <button
            key={lvl}
            aria-label={`Cấp ${lvl}`}
            onClick={() => setCenter(i)}
            className={`h-[7px] rounded-full transition-all ${
              i === center ? "w-5 bg-accent" : "w-[7px] bg-white/25"
            }`}
          />
        ))}
      </div>

      <div className="glass rounded-2xl p-3.5 mt-5">
        <div className="flex justify-between text-xs mb-2">
          <span className="text-slate-300">Tổng tiến độ</span>
          <span className="text-accent-soft font-bold">
            {learnedAll} / {totalAll} bài
          </span>
        </div>
        <ProgressBar value={learnedAll} max={totalAll} />
      </div>
    </div>
  );
}
