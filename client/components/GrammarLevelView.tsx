"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { ProgressBar, TextInput } from "@/components/ui";
import {
  getLevelLessons,
  lessonStatus,
  type StoredLesson,
  type LessonStatus,
} from "@/lib/grammarLibrary";

const STATUS_ICON: Record<LessonStatus, { icon: string; cls: string }> = {
  new: { icon: "○", cls: "text-muted" },
  loaded: { icon: "◐", cls: "text-[#fbbf24]" },
  learned: { icon: "✓", cls: "text-ok" },
};

const LEVEL_NAME: Record<string, string> = {
  "A1-A2": "Sơ cấp",
  "B1-B2": "Trung cấp",
  "C1-C2": "Cao cấp",
};

type Filter = "all" | "todo" | "done";

export default function GrammarLevelView({
  level,
  onBack,
}: {
  level: string;
  onBack: () => void;
}) {
  const [lessons, setLessons] = useState<StoredLesson[]>([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => setLessons(getLevelLessons(level)), [level]);

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

  // Categories in first-appearance order within the (filtered) set.
  const cats: string[] = [];
  for (const l of visible) if (!cats.includes(l.category)) cats.push(l.category);

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
        <ArrowLeft size={16} /> Tất cả cấp độ
      </button>

      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-accent/20 text-accent-soft">
          {level}
        </span>
        <h2 className="text-lg font-bold text-white">{LEVEL_NAME[level] ?? level}</h2>
      </div>

      <div className="glass rounded-2xl p-3.5 mb-4">
        <div className="flex justify-between text-xs mb-2">
          <span className="text-slate-300">Tiến độ cấp độ</span>
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

      {cats.length === 0 && (
        <p className="text-muted text-sm text-center py-8">Không có bài nào khớp bộ lọc.</p>
      )}

      <div className="space-y-5">
        {cats.map((cat) => (
          <div key={cat}>
            <h3 className="text-[12px] font-semibold text-muted uppercase tracking-wide mb-2">
              {cat}
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {visible
                .filter((l) => l.category === cat)
                .map((l) => {
                  const st = STATUS_ICON[lessonStatus(l)];
                  return (
                    <Link key={l.id} href={`/grammar/${l.slug}`}>
                      <div className="glass rounded-2xl p-3 hover:border-accent/70 transition h-full">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`${st.cls} text-sm`}>{st.icon}</span>
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

      <p className="mt-5 text-xs text-muted text-center">
        ○ chưa mở · <span className="text-[#fbbf24]">◐</span> đã tải nội dung ·{" "}
        <span className="text-ok">✓</span> đã học
      </p>
    </div>
  );
}
