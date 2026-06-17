"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Flame,
  Dumbbell,
  ListChecks,
  FileText,
  BookOpen,
  Layers,
  SpellCheck,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui";
import { getActivity, currentStreak, last7Days, countsByFeature } from "@/lib/storage";

const FEATURES: {
  href: string;
  label: string;
  icon: LucideIcon;
  desc: string;
  key: string;
}[] = [
  { href: "/quiz", label: "Quiz", icon: ListChecks, desc: "Trắc nghiệm tương tác", key: "quiz" },
  { href: "/essay", label: "Essay", icon: FileText, desc: "Essay mẫu + từ vựng", key: "essay" },
  { href: "/grammar", label: "Grammar", icon: BookOpen, desc: "Giải thích ngữ pháp", key: "grammar" },
  { href: "/flashcard", label: "Flashcard", icon: Layers, desc: "Học từ vựng theo thẻ", key: "flash" },
  { href: "/check", label: "Check", icon: SpellCheck, desc: "Sửa lỗi tiếng Anh", key: "check" },
];

const DOW = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const streak = mounted ? currentStreak() : 0;
  const total = mounted ? getActivity().length : 0;
  const counts = mounted ? countsByFeature() : {};
  const week = mounted ? last7Days() : [];

  return (
    <div className="animate-fade-up">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Eng<span className="text-accent">Zone</span>
        </h1>
        <p className="text-muted mt-1">Học tiếng Anh mỗi ngày với Claude AI</p>
      </header>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <Card>
          <div className="flex items-center gap-2 text-muted text-sm">
            <Flame size={16} className="text-accent" /> Chuỗi ngày
          </div>
          <div className="text-3xl font-bold mt-1">{streak}</div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-muted text-sm">
            <Dumbbell size={16} className="text-accent" /> Lượt luyện tập
          </div>
          <div className="text-3xl font-bold mt-1">{total}</div>
        </Card>
      </div>

      <Card className="mb-6">
        <div className="text-sm text-muted mb-3">7 ngày gần đây</div>
        <div className="flex justify-between gap-1.5">
          {week.map((d, i) => (
            <div key={d.date} className="flex flex-col items-center gap-1.5 flex-1">
              <div
                className={`w-full aspect-square rounded-lg ${
                  d.active
                    ? "bg-gradient-to-br from-accent to-accent-soft"
                    : "bg-white/5 border border-border"
                }`}
                title={d.date}
              />
              <span className="text-[10px] text-muted">
                {mounted ? DOW[new Date(d.date).getDay()] : DOW[i]}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <h2 className="text-lg font-semibold mb-3">Tính năng</h2>
      <div className="grid sm:grid-cols-2 gap-3">
        {FEATURES.map((f) => {
          const Icon = f.icon;
          const n = counts[f.key] || 0;
          return (
            <Link key={f.href} href={f.href}>
              <Card className="hover:border-accent/70 transition group h-full">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-accent/15 text-accent grid place-items-center shrink-0">
                    <Icon size={20} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-white flex items-center gap-2">
                      {f.label}
                      {n > 0 && (
                        <span className="text-[11px] text-muted font-normal">
                          {n} lượt
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted truncate">{f.desc}</div>
                  </div>
                  <ChevronRight
                    size={18}
                    className="ml-auto text-muted group-hover:text-accent transition"
                  />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
