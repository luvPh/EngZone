"use client";

// Level selector — 3 large pastel cards side by side, each with its own colored
// glow halo; hover scales up + intensifies the glow. Clicking a card opens it.

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { LEVELS } from "@/lib/grammar";
import { getAllLessons } from "@/lib/grammarLibrary";

const META: Record<
  string,
  { name: string; tag: string; desc: string; grad: string; glow: string; ink: string }
> = {
  "A1-A2": {
    name: "Sơ cấp",
    tag: "A1 – A2",
    desc: "Nền tảng: danh từ, đại từ, thì cơ bản, mạo từ, giới từ.",
    grad: "linear-gradient(160deg, #efd7ff 0%, #f9c9e6 55%, #f6d3c4 100%)",
    glow: "rgba(192, 132, 252, 0.55)",
    ink: "#3b1d52",
  },
  "B1-B2": {
    name: "Trung cấp",
    tag: "B1 – B2",
    desc: "Thì hoàn thành, câu bị động, mệnh đề, câu điều kiện.",
    grad: "linear-gradient(160deg, #ffe6c2 0%, #ffd0a8 55%, #ffbfb0 100%)",
    glow: "rgba(251, 146, 60, 0.5)",
    ink: "#5a2e10",
  },
  "C1-C2": {
    name: "Cao cấp",
    tag: "C1 – C2",
    desc: "Đảo ngữ, cấu trúc nâng cao, sắc thái học thuật.",
    grad: "linear-gradient(160deg, #bfe0ff 0%, #a8e6f0 55%, #c4d0ff 100%)",
    glow: "rgba(56, 189, 248, 0.5)",
    ink: "#10324a",
  },
};

export default function GrammarCoverflow({
  onOpen,
}: {
  onOpen: (level: string) => void;
}) {
  const [counts, setCounts] = useState<Record<string, { total: number; learned: number }>>({});

  useEffect(() => {
    const all = getAllLessons();
    const c: Record<string, { total: number; learned: number }> = {};
    for (const lvl of LEVELS) {
      const items = all.filter((l) => l.level === lvl);
      c[lvl] = { total: items.length, learned: items.filter((l) => l.learned).length };
    }
    setCounts(c);
  }, []);

  return (
    <div className="animate-fade-up">
      <p className="text-center text-sm text-muted mb-6">Chọn cấp độ để bắt đầu</p>

      <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-3 -mx-4 px-4 sm:grid sm:grid-cols-3 sm:gap-5 sm:overflow-visible sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {LEVELS.map((lvl) => {
          const m = META[lvl];
          const c = counts[lvl] ?? { total: 0, learned: 0 };
          const pct = c.total > 0 ? Math.round((c.learned / c.total) * 100) : 0;
          return (
            <button
              key={lvl}
              type="button"
              onClick={() => onOpen(lvl)}
              className="level-card group relative flex flex-col text-left rounded-[26px] p-5 min-h-[348px] snap-center shrink-0 w-[82%] sm:w-auto"
              style={{ background: m.grad, ["--glow" as string]: m.glow }}
            >
              <div
                className="text-xs font-bold tracking-widest uppercase"
                style={{ color: m.ink, opacity: 0.65 }}
              >
                {m.tag}
              </div>
              <h3
                className="font-serif font-bold text-[2rem] leading-[1.1] mt-2"
                style={{ color: m.ink }}
              >
                {m.name}
              </h3>
              <p
                className="text-sm mt-3 leading-relaxed"
                style={{ color: m.ink, opacity: 0.82 }}
              >
                {m.desc}
              </p>

              <div className="mt-auto pt-6" style={{ color: m.ink }}>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span>{c.learned}/{c.total} đã học</span>
                  <span style={{ opacity: 0.7 }}>{c.total} bài</span>
                </div>
                <div
                  className="h-1.5 rounded-full overflow-hidden"
                  style={{ background: "rgba(0,0,0,0.14)" }}
                >
                  <div
                    className="h-full rounded-full transition-[width] duration-500"
                    style={{ width: `${pct}%`, background: m.ink }}
                  />
                </div>
                <span className="inline-flex items-center gap-1.5 mt-4 text-sm font-bold">
                  Vào học
                  <ArrowRight
                    size={16}
                    className="transition-transform duration-200 group-hover:translate-x-1"
                  />
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
