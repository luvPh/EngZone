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
  const [activeLoop, setActiveLoop] = useState(0); // loop index (0..3N-1) at centre
  const scroller = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const centerRef = useRef(0); // same as activeLoop, readable synchronously
  const idleTimer = useRef<number | null>(null);

  useEffect(() => setThemes(getCategories()), []);

  const N = themes.length;
  // Triple the themes so the carousel can loop seamlessly in both directions.
  const loop = N ? [...themes, ...themes, ...themes] : [];

  const scrollToCard = (loopIdx: number, smooth = true) => {
    const sc = scroller.current;
    const el = cardRefs.current[loopIdx];
    if (!sc || !el) return;
    const r = el.getBoundingClientRect();
    const s = sc.getBoundingClientRect();
    sc.scrollBy({
      left: r.left + r.width / 2 - (s.left + s.width / 2),
      behavior: smooth ? "smooth" : "auto",
    });
  };

  // Start centred on the first card of the MIDDLE copy (and mark it active up
  // front so there's no unhighlighted flash before the scroll settles).
  useEffect(() => {
    if (!N) return;
    centerRef.current = N;
    setActiveLoop(N);
    const id = requestAnimationFrame(() => scrollToCard(N, false));
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [N]);

  // Track centre card; when scrolling settles inside a clone copy, jump by one
  // set to the equivalent middle-copy card (instant) → seamless infinite loop.
  useEffect(() => {
    const sc = scroller.current;
    if (!sc || !N) return;
    let raf = 0;
    const recompute = () => {
      const s = sc.getBoundingClientRect();
      const c = s.left + s.width / 2;
      let best = 0;
      let bestD = Infinity;
      cardRefs.current.forEach((el, i) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        const d = Math.abs(r.left + r.width / 2 - c);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      centerRef.current = best;
      setActiveLoop(best);
    };
    const settle = () => {
      const i = centerRef.current;
      if (i < N) scrollToCard(i + N, false);
      else if (i >= 2 * N) scrollToCard(i - N, false);
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(recompute);
      if (idleTimer.current) window.clearTimeout(idleTimer.current);
      idleTimer.current = window.setTimeout(settle, 140);
    };
    sc.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", recompute);
    recompute();
    return () => {
      sc.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", recompute);
      cancelAnimationFrame(raf);
      if (idleTimer.current) window.clearTimeout(idleTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [N]);

  const go = (dir: number) => scrollToCard(centerRef.current + dir, true);
  // Centre the copy of theme `real` nearest the current position.
  const goToReal = (real: number) => {
    const cands = [real, real + N, real + 2 * N];
    let best = cands[0];
    let bestD = Infinity;
    for (const ci of cands) {
      const d = Math.abs(ci - centerRef.current);
      if (d < bestD) {
        bestD = d;
        best = ci;
      }
    }
    scrollToCard(best, true);
  };

  return (
    <div className="animate-fade-up">
      <div className="flex items-center justify-center gap-3 mb-1">
        <button
          type="button"
          aria-label="Trước"
          onClick={() => go(-1)}
          className="glass-input rounded-full p-2 text-slate-200 hover:text-white"
        >
          <ChevronLeft size={18} />
        </button>
        <p className="text-sm text-muted">Chọn chủ đề ngữ pháp</p>
        <button
          type="button"
          aria-label="Sau"
          onClick={() => go(1)}
          className="glass-input rounded-full p-2 text-slate-200 hover:text-white"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div
        ref={scroller}
        className="flex items-start gap-5 overflow-x-auto snap-x snap-mandatory px-[19%] sm:px-[30%] py-14 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {loop.map((t, i) => {
          const real = i % N;
          const p = PALETTES[real % PALETTES.length];
          const pct = t.total > 0 ? Math.round((t.learned / t.total) * 100) : 0;
          const isActive = i === activeLoop;
          return (
            <button
              key={i}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              type="button"
              onClick={() => (isActive ? onOpen(t.category) : scrollToCard(i))}
              className={`flex-none w-[min(360px,74vw)] aspect-[2/3] snap-center flex flex-col text-left rounded-[28px] p-5 transition-all duration-300 ease-out ${
                isActive
                  ? "theme-glow scale-100 opacity-100"
                  : "scale-[0.85] opacity-55 brightness-[0.55] saturate-[0.8]"
              }`}
              style={{
                background: p.grad,
                ["--glow" as string]: p.glow,
                boxShadow: `inset 0 0 0 1px rgba(255,255,255,${isActive ? 0.4 : 0.12})`,
              }}
            >
              <div
                className="text-xs font-bold tracking-widest uppercase"
                style={{ color: p.ink, opacity: 0.6 }}
              >
                Chủ đề · {t.total} bài
              </div>
              <h3
                className="font-serif font-bold text-3xl leading-[1.1] mt-2"
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
            onClick={() => goToReal(i)}
            className={`h-[7px] rounded-full transition-all ${
              i === activeLoop % N ? "w-6 bg-accent" : "w-[7px] bg-white/25"
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
