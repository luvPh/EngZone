"use client";

import { useEffect, useState } from "react";
import { LEVELS } from "@/lib/grammar";
import { getAllLessons } from "@/lib/grammarLibrary";
import { ProgressBar } from "@/components/ui";

const META: Record<string, { name: string; emoji: string; grad: string }> = {
  "A1-A2": { name: "Sơ cấp", emoji: "🌱", grad: "from-[#7c5cff] to-[#f0abfc]" },
  "B1-B2": { name: "Trung cấp", emoji: "🚀", grad: "from-[#4f46e5] via-[#7c5cff] to-[#22d3ee]" },
  "C1-C2": { name: "Cao cấp", emoji: "🏛️", grad: "from-[#0ea5e9] via-[#6366f1] to-[#a855f7]" },
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
    <div>
      <p className="text-center text-sm text-muted mb-4">Chọn cấp độ để bắt đầu</p>

      <div className="flex items-center justify-center gap-0 py-2">
        {LEVELS.map((lvl, i) => {
          const m = META[lvl];
          const c = counts[lvl] ?? { total: 0, learned: 0 };
          const isCenter = i === center;
          const base =
            "flex-none rounded-3xl overflow-hidden glass transition-all duration-300 cursor-pointer";
          const size = isCenter
            ? "w-52 z-10 scale-100 shadow-glow-accent"
            : "w-36 scale-90 opacity-60";
          const overlap = i < center ? "mr-[-22px]" : i > center ? "ml-[-22px]" : "";
          return (
            <div
              key={lvl}
              className={`${base} ${size} ${overlap}`}
              onClick={() => (isCenter ? onOpen(lvl) : setCenter(i))}
            >
              <div
                className={`bg-gradient-to-br ${m.grad} grid place-items-center ${
                  isCenter ? "h-44 text-6xl" : "h-32 text-4xl"
                }`}
              >
                <span style={{ filter: "drop-shadow(0 6px 18px rgba(0,0,0,0.4))" }}>
                  {m.emoji}
                </span>
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
