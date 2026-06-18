"use client";

// Library = a focus-center carousel of THEME (category) cards. The card nearest
// the viewport centre is active (full color + scale + glow); others dim + darken.
// Active is derived from getBoundingClientRect on scroll (robust). Click active →
// open theme; click a side card / arrow / dot → it scrolls to centre.
// Theme detail = lessons of that category, grouped by level, with search/filter.

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Search,
  ChevronLeft,
  ChevronRight,
  Circle,
  CircleDot,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";
import { ProgressBar, TextInput } from "@/components/ui";
import { useFeatureState } from "@/lib/store";
import { CATEGORY_VI, LEVELS } from "@/lib/grammar";
import {
  getCategories,
  getCategoryLessons,
  lessonStatus,
  type StoredLesson,
  type LessonStatus,
} from "@/lib/grammarLibrary";

const STATUS_ICON: Record<LessonStatus, { Icon: LucideIcon; cls: string }> = {
  new: { Icon: Circle, cls: "text-muted" },
  loaded: { Icon: CircleDot, cls: "text-[#fbbf24]" },
  learned: { Icon: CheckCircle2, cls: "text-ok" },
};

const LEVEL_NAME: Record<string, string> = {
  "A1-A2": "Sơ cấp",
  "B1-B2": "Trung cấp",
  "C1-C2": "Cao cấp",
};

// Pastel palettes cycled across themes.
const PALETTES = [
  { grad: "linear-gradient(160deg,#efd7ff,#f9c9e6 55%,#f6d3c4)", glow: "rgba(192,132,252,0.6)", ink: "#3b1d52" },
  { grad: "linear-gradient(160deg,#ffe6c2,#ffd0a8 55%,#ffbfb0)", glow: "rgba(251,146,60,0.55)", ink: "#5a2e10" },
  { grad: "linear-gradient(160deg,#bfe0ff,#a8e6f0 55%,#c4d0ff)", glow: "rgba(56,189,248,0.55)", ink: "#10324a" },
  { grad: "linear-gradient(160deg,#c8f5e0,#a7e8c4 55%,#bfead0)", glow: "rgba(52,211,153,0.5)", ink: "#0f3d2e" },
  { grad: "linear-gradient(160deg,#ffd9e8,#ffc9d6 55%,#ffd6c4)", glow: "rgba(244,114,182,0.5)", ink: "#5a1030" },
  { grad: "linear-gradient(160deg,#e0e0ff,#c4c9ff 55%,#d8c4ff)", glow: "rgba(129,140,248,0.55)", ink: "#1e1b4b" },
  { grad: "linear-gradient(160deg,#fef3c7,#fde68a 55%,#fcd9b0)", glow: "rgba(234,179,8,0.5)", ink: "#4a3410" },
];

type Filter = "all" | "todo" | "done";

export default function GrammarThemes() {
  const [openCat, setOpenCat] = useFeatureState<string | null>("grammar:openTheme", null);
  if (openCat) return <ThemeDetail category={openCat} onBack={() => setOpenCat(null)} />;
  return <ThemeCarousel onOpen={(c) => setOpenCat(c)} />;
}

function ThemeCarousel({ onOpen }: { onOpen: (c: string) => void }) {
  const [themes, setThemes] = useState<{ category: string; total: number; learned: number }[]>([]);
  const [active, setActive] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => setThemes(getCategories()), []);

  // Active = card whose centre is nearest the scroller's centre (viewport coords).
  useEffect(() => {
    const sc = scroller.current;
    if (!sc) return;
    let raf = 0;
    const recompute = () => {
      const scRect = sc.getBoundingClientRect();
      const center = scRect.left + scRect.width / 2;
      let best = 0;
      let bestD = Infinity;
      cardRefs.current.forEach((el, i) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        const d = Math.abs(r.left + r.width / 2 - center);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      setActive(best);
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(recompute);
    };
    sc.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", recompute);
    recompute();
    return () => {
      sc.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", recompute);
      cancelAnimationFrame(raf);
    };
  }, [themes.length]);

  const centerCard = (i: number) =>
    cardRefs.current[Math.max(0, Math.min(themes.length - 1, i))]?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });

  return (
    <div className="animate-fade-up">
      <div className="flex items-center justify-center gap-3 mb-1">
        <button
          type="button"
          aria-label="Trước"
          onClick={() => centerCard(active - 1)}
          className="glass-input rounded-full p-2 text-slate-200 hover:text-white disabled:opacity-30"
          disabled={active === 0}
        >
          <ChevronLeft size={18} />
        </button>
        <p className="text-sm text-muted">Chọn chủ đề ngữ pháp</p>
        <button
          type="button"
          aria-label="Sau"
          onClick={() => centerCard(active + 1)}
          className="glass-input rounded-full p-2 text-slate-200 hover:text-white disabled:opacity-30"
          disabled={active === themes.length - 1}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div
        ref={scroller}
        className="flex items-start gap-5 overflow-x-auto snap-x snap-mandatory px-[19%] sm:px-[30%] py-14 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {themes.map((t, i) => {
          const p = PALETTES[i % PALETTES.length];
          const pct = t.total > 0 ? Math.round((t.learned / t.total) * 100) : 0;
          const isActive = i === active;
          return (
            <button
              key={t.category}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              type="button"
              onClick={() => (isActive ? onOpen(t.category) : centerCard(i))}
              className={`flex-none w-[min(360px,74vw)] aspect-[2/3] snap-center flex flex-col text-left rounded-[28px] p-5 transition-all duration-300 ease-out ${
                isActive
                  ? "scale-100 opacity-100"
                  : "scale-[0.85] opacity-55 brightness-[0.55] saturate-[0.8]"
              }`}
              style={{
                background: p.grad,
                boxShadow: isActive
                  ? `0 26px 60px -18px ${p.glow}, 0 0 56px -6px ${p.glow}, inset 0 0 0 1px rgba(255,255,255,0.4)`
                  : "inset 0 0 0 1px rgba(255,255,255,0.12)",
              }}
            >
              <div
                className="text-xs font-bold tracking-widest uppercase"
                style={{ color: p.ink, opacity: 0.6 }}
              >
                Chủ đề · {t.total} bài
              </div>
              <h3
                className="font-serif font-bold text-2xl leading-[1.12] mt-2"
                style={{ color: p.ink }}
              >
                {CATEGORY_VI[t.category] ?? t.category}
              </h3>

              <div className="mt-auto" style={{ color: p.ink }}>
                <div className="flex justify-between text-sm font-bold mb-1.5">
                  <span>{t.learned}/{t.total} đã học</span>
                  <span style={{ opacity: 0.7 }}>{pct}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.14)" }}>
                  <div
                    className="h-full rounded-full transition-[width] duration-500"
                    style={{ width: `${pct}%`, background: p.ink }}
                  />
                </div>
                <span className="inline-flex items-center gap-1.5 mt-4 text-sm font-bold">
                  Vào học <ArrowRight size={16} />
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex justify-center gap-1.5 mt-1 flex-wrap max-w-sm mx-auto">
        {themes.map((t, i) => (
          <button
            key={t.category}
            type="button"
            aria-label={CATEGORY_VI[t.category] ?? t.category}
            onClick={() => centerCard(i)}
            className={`h-[7px] rounded-full transition-all ${
              i === active ? "w-6 bg-accent" : "w-[7px] bg-white/25"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function ThemeDetail({ category, onBack }: { category: string; onBack: () => void }) {
  const [lessons, setLessons] = useState<StoredLesson[]>([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => setLessons(getCategoryLessons(category)), [category]);

  const learned = lessons.filter((l) => l.learned).length;

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return lessons.filter((l) => {
      if (filter === "done" && !l.learned) return false;
      if (filter === "todo" && l.learned) return false;
      if (!needle) return true;
      return (
        l.titleVi.toLowerCase().includes(needle) ||
        l.titleEn.toLowerCase().includes(needle)
      );
    });
  }, [lessons, q, filter]);

  const groups = LEVELS.map((lvl) => ({
    level: lvl,
    items: visible.filter((l) => l.level === lvl),
  })).filter((g) => g.items.length > 0);

  const chip = (key: Filter, label: string) => (
    <button
      type="button"
      onClick={() => setFilter(key)}
      className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
        filter === key ? "bg-accent text-white" : "glass-input text-muted hover:text-white"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="animate-fade-up">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-white mb-3"
      >
        <ArrowLeft size={16} /> Tất cả chủ đề
      </button>

      <h2 className="text-lg font-bold text-white mb-3">{CATEGORY_VI[category] ?? category}</h2>

      <div className="glass rounded-2xl p-3.5 mb-4">
        <div className="flex justify-between text-xs mb-2">
          <span className="text-slate-300">Tiến độ chủ đề</span>
          <span className="text-accent-soft font-bold">
            {learned} / {lessons.length} bài
          </span>
        </div>
        <ProgressBar value={learned} max={lessons.length} />
      </div>

      <div className="relative mb-3">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <TextInput
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm bài học…"
          className="pl-9"
        />
      </div>

      <div className="flex gap-2 mb-5">
        {chip("all", "Tất cả")}
        {chip("todo", "Chưa học")}
        {chip("done", "Đã học")}
      </div>

      {groups.length === 0 && (
        <p className="text-muted text-sm text-center py-8">Không có bài nào khớp bộ lọc.</p>
      )}

      <div className="space-y-5">
        {groups.map((g) => (
          <div key={g.level}>
            <h3 className="text-[12px] font-semibold text-muted uppercase tracking-wide mb-2 flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-accent/20 text-accent-soft">{g.level}</span>
              {LEVEL_NAME[g.level]}
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {g.items.map((l) => {
                const st = STATUS_ICON[lessonStatus(l)];
                return (
                  <Link key={l.id} href={`/grammar/${l.slug}`}>
                    <div className="glass hover-lift rounded-2xl p-3 hover:border-accent/70 hover:shadow-glow-accent h-full">
                      <div className="flex items-center gap-2 mb-1">
                        <st.Icon size={15} className={`${st.cls} shrink-0`} />
                        <span className="font-semibold text-white text-sm">{l.titleVi}</span>
                      </div>
                      <div className="text-xs text-accent-soft mb-1">{l.titleEn}</div>
                      <p className="text-xs text-muted leading-snug">{l.description}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
