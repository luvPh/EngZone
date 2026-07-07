"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Flame,
  Zap,
  ListChecks,
  FileText,
  BookOpen,
  Layers,
  SpellCheck,
  type LucideIcon,
} from "lucide-react";
import AuthButton from "@/components/AuthButton";
import { getActivity, currentStreak, last7Days, countsByFeature } from "@/lib/storage";

const FEATURES: {
  href: string;
  label: string;
  icon: LucideIcon;
  desc: string;
  key: string;
}[] = [
  { href: "/quiz", label: "Luyện đề", icon: ListChecks, desc: "Đề thi thử đa dạng", key: "quiz" },
  { href: "/essay", label: "Vocab + Essay", icon: FileText, desc: "Essay kèm thẻ từ vựng", key: "essay" },
  { href: "/grammar", label: "Grammar", icon: BookOpen, desc: "Giải thích ngữ pháp", key: "grammar" },
  { href: "/flashcard", label: "Luyện từ", icon: Layers, desc: "Ôn từ vựng bằng thẻ", key: "flash" },
  { href: "/check", label: "Check", icon: SpellCheck, desc: "Sửa lỗi tiếng Anh", key: "check" },
];

const DOW = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

function greeting() {
  const h = new Date().getHours();
  if (h < 11) return "Chào buổi sáng, An";
  if (h < 18) return "Chào buổi chiều, An";
  return "Chào buổi tối, An";
}

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const streak = mounted ? currentStreak() : 0;
  const total = mounted ? getActivity().length : 0;
  const counts = mounted ? countsByFeature() : {};
  const week = mounted ? last7Days() : [];

  return (
    <div className="animate-fade-up">
      {/* Mobile-only sync login (sidebar handles it on desktop) */}
      <div className="md:hidden flex justify-end mb-4 [&_button]:w-full [&>div]:w-full">
        <AuthButton />
      </div>

      <div className="text-[13px] text-accent font-semibold tracking-[.04em] uppercase mb-2.5">
        {mounted ? greeting() : "Chào bạn, An"}
      </div>
      <h1 className="font-display text-[40px] leading-[1.1] font-medium tracking-[-0.02em] text-fg mb-2">
        Hôm nay học gì nào?
      </h1>
      <p className="text-muted text-base mb-8 max-w-[46ch]">
        Mỗi ngày một chút. Luyện đều tay với trợ lý AI bên cạnh bạn.
      </p>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3.5 mb-3.5">
        <div className="glass rounded-card px-[22px] py-5">
          <div className="flex items-center gap-1.5 text-muted text-[13px] font-medium">
            <Flame size={15} className="text-accent" /> Chuỗi ngày
          </div>
          <div className="font-display text-[38px] font-medium mt-1 text-fg">
            {streak}
            <span className="text-base text-muted font-sans font-medium"> ngày</span>
          </div>
        </div>
        <div className="glass rounded-card px-[22px] py-5">
          <div className="flex items-center gap-1.5 text-muted text-[13px] font-medium">
            <Zap size={15} className="text-accent" /> Lượt luyện tập
          </div>
          <div className="font-display text-[38px] font-medium mt-1 text-fg">{total}</div>
        </div>
      </div>

      {/* Weekly calendar */}
      <div className="glass rounded-card px-[22px] py-5 mb-10">
        <div className="text-[13px] text-muted mb-3.5 font-medium">7 ngày gần đây</div>
        <div className="flex gap-2.5">
          {(mounted ? week : DOW.map((_, i) => ({ date: String(i), active: false }))).map(
            (d, i) => (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full h-[38px] rounded-[11px]"
                  style={
                    d.active
                      ? {
                          background:
                            "linear-gradient(155deg, var(--accent-soft), var(--accent))",
                          boxShadow: "0 4px 10px -6px var(--accent)",
                        }
                      : { background: "transparent", border: "1.5px dashed var(--border)" }
                  }
                  title={d.date}
                />
                <span className="text-[11px] text-muted">
                  {mounted ? DOW[new Date(d.date).getDay()] : DOW[i]}
                </span>
              </div>
            )
          )}
        </div>
      </div>

      {/* Feature cards */}
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="font-display text-[22px] font-medium text-fg">Bài luyện</h2>
        <span className="text-[13px] text-muted">5 chế độ</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {FEATURES.map((f) => {
          const Icon = f.icon;
          const n = counts[f.key] || 0;
          return (
            <Link
              key={f.href}
              href={f.href}
              className="glass hover-lift rounded-card p-5 flex gap-[15px] items-start"
            >
              <span
                className="w-[42px] h-[42px] shrink-0 rounded-xl grid place-items-center text-accent"
                style={{ background: "var(--accent-weak)" }}
              >
                <Icon size={20} />
              </span>
              <span className="min-w-0">
                <span className="block font-semibold text-[15.5px] mb-0.5 text-fg">
                  {f.label}
                  {n > 0 && (
                    <span className="text-[11px] font-semibold text-muted ml-2">
                      {n} lượt
                    </span>
                  )}
                </span>
                <span className="block text-[13px] text-muted leading-snug">
                  {f.desc}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
