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
  grad: string;
  glow: string;
  ink: string;
}[] = [
  {
    href: "/quiz", label: "Luyện đề", icon: ListChecks, desc: "Đề thi thử đa dạng", key: "quiz",
    grad: "linear-gradient(150deg,#efd7ff,#f9c9e6)", glow: "rgba(192,132,252,0.5)", ink: "#3b1d52",
  },
  {
    href: "/essay", label: "Vocab + Essay", icon: FileText, desc: "Essay + thẻ từ vựng", key: "essay",
    grad: "linear-gradient(150deg,#ffe6c2,#ffbfb0)", glow: "rgba(251,146,60,0.45)", ink: "#5a2e10",
  },
  {
    href: "/grammar", label: "Grammar", icon: BookOpen, desc: "Giải thích ngữ pháp", key: "grammar",
    grad: "linear-gradient(150deg,#bfe0ff,#c4d0ff)", glow: "rgba(56,189,248,0.45)", ink: "#10324a",
  },
  {
    href: "/flashcard", label: "Luyện từ", icon: Layers, desc: "Ôn từ vựng đã tạo", key: "flash",
    grad: "linear-gradient(150deg,#c8f5e0,#a7e8c4)", glow: "rgba(52,211,153,0.45)", ink: "#0f3d2e",
  },
  {
    href: "/check", label: "Check", icon: SpellCheck, desc: "Sửa lỗi tiếng Anh", key: "check",
    grad: "linear-gradient(150deg,#ffd9e8,#ffc9d6)", glow: "rgba(244,114,182,0.45)", ink: "#5a1030",
  },
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {FEATURES.map((f) => {
          const Icon = f.icon;
          const n = counts[f.key] || 0;
          return (
            <Link key={f.href} href={f.href}>
              <div
                className="level-card group h-full rounded-3xl p-4"
                style={{ background: f.grad, ["--glow" as string]: f.glow }}
              >
                <div className="flex items-center gap-3" style={{ color: f.ink }}>
                  <div
                    className="w-11 h-11 rounded-2xl grid place-items-center shrink-0"
                    style={{ background: "rgba(255,255,255,0.4)" }}
                  >
                    <Icon size={20} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold flex items-center gap-2">
                      {f.label}
                      {n > 0 && (
                        <span className="text-[11px] font-semibold" style={{ opacity: 0.7 }}>
                          {n} lượt
                        </span>
                      )}
                    </div>
                    <div className="text-sm truncate" style={{ opacity: 0.8 }}>
                      {f.desc}
                    </div>
                  </div>
                  <ChevronRight
                    size={18}
                    className="ml-auto transition-transform group-hover:translate-x-1"
                  />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
