"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  Flame,
  Zap,
  GraduationCap,
  RefreshCw,
  ArrowLeft,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/ui";
import { currentStreak, countsByFeature, dailyCounts } from "@/lib/storage";
import { poolStats, dueCount } from "@/lib/vocabPool";
import { familyStats } from "@/lib/wordFamily";

const DOW = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

const FEATURE_META: Record<string, { label: string; color: string }> = {
  quiz: { label: "Luyện đề", color: "#a78bfa" },
  essay: { label: "Vocab + Essay", color: "#fb923c" },
  grammar: { label: "Grammar", color: "#38bdf8" },
  flash: { label: "Luyện từ", color: "#34d399" },
  check: { label: "Check", color: "#f472b6" },
};

function Stat({ icon: Icon, value, label, cls }: { icon: LucideIcon; value: number; label: string; cls: string }) {
  return (
    <div className="glass rounded-2xl p-4 flex flex-col justify-center min-h-[104px]">
      <div className="flex items-center gap-1.5 text-muted text-[13px] font-medium">
        <Icon size={15} className={cls} /> {label}
      </div>
      <div className={`text-3xl font-extrabold mt-1 ${cls}`}>{value}</div>
    </div>
  );
}

export default function StatsPage() {
  const [mounted, setMounted] = useState(false);
  const [streak, setStreak] = useState(0);
  const [pool, setPool] = useState({ total: 0, mastered: 0, learning: 0 });
  const [due, setDue] = useState(0);
  const [fam, setFam] = useState({ total: 0, mastered: 0, learning: 0 });
  const [days, setDays] = useState<{ date: string; count: number }[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    setMounted(true);
    setStreak(currentStreak());
    setPool(poolStats());
    setDue(dueCount());
    setFam(familyStats());
    setDays(dailyCounts(14));
    setCounts(countsByFeature());
  }, []);

  if (!mounted) return null;

  const totalActivity = Object.values(counts).reduce((a, b) => a + b, 0);
  const maxDay = Math.max(1, ...days.map((d) => d.count));
  const masteredPct = pool.total ? Math.round((pool.mastered / pool.total) * 100) : 0;
  const featureRows = Object.entries(FEATURE_META)
    .map(([key, m]) => ({ key, ...m, n: counts[key] || 0 }))
    .sort((a, b) => b.n - a.n);
  const maxFeature = Math.max(1, ...featureRows.map((f) => f.n));

  // Donut geometry for vocab mastery.
  const R = 42;
  const C = 2 * Math.PI * R;

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Thống kê"
        subtitle="Tiến độ học của bạn — chuỗi ngày, hoạt động và mức độ thuộc từ."
        icon={<BarChart3 size={20} />}
      />

      {/* Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <Stat icon={Flame} value={streak} label="Chuỗi ngày" cls="text-accent" />
        <Stat icon={Zap} value={totalActivity} label="Tổng lượt" cls="text-accent-soft" />
        <Stat icon={GraduationCap} value={pool.mastered} label="Từ đã thuộc" cls="text-ok" />
        <Stat icon={RefreshCw} value={due} label="Đến hạn ôn" cls="text-[#38bdf8]" />
      </div>

      {/* Activity 14 days */}
      <div className="glass rounded-2xl p-5 mb-4">
        <div className="text-sm font-semibold text-muted mb-4">Hoạt động 14 ngày gần đây</div>
        {totalActivity === 0 ? (
          <p className="text-muted text-sm text-center py-6">Chưa có hoạt động nào — bắt đầu luyện để lên biểu đồ nhé.</p>
        ) : (
          <div className="flex items-end gap-1.5 h-32">
            {days.map((d) => {
              const h = d.count === 0 ? 3 : Math.round((d.count / maxDay) * 100);
              const dow = DOW[new Date(d.date).getDay()];
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end" title={`${d.date}: ${d.count} lượt`}>
                  {d.count > 0 && <span className="text-[10px] text-muted">{d.count}</span>}
                  <div
                    className="w-full rounded-md transition-all"
                    style={{
                      height: `${h}%`,
                      background:
                        d.count > 0
                          ? "linear-gradient(180deg, var(--accent-soft), var(--accent))"
                          : "var(--border)",
                    }}
                  />
                  <span className="text-[10px] text-muted">{dow}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Vocab mastery donut */}
        <div className="glass rounded-2xl p-5">
          <div className="text-sm font-semibold text-muted mb-4">Mức độ thuộc từ</div>
          {pool.total === 0 ? (
            <p className="text-muted text-sm text-center py-6">Kho từ đang trống.</p>
          ) : (
            <div className="flex items-center gap-5">
              <svg width="110" height="110" viewBox="0 0 110 110" className="shrink-0">
                <circle cx="55" cy="55" r={R} fill="none" stroke="var(--accent-weak)" strokeWidth="11" />
                <circle
                  cx="55"
                  cy="55"
                  r={R}
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="11"
                  strokeLinecap="round"
                  strokeDasharray={`${(masteredPct / 100) * C} ${C}`}
                  transform="rotate(-90 55 55)"
                />
                <text x="55" y="52" textAnchor="middle" className="fill-fg" style={{ fontSize: 20, fontWeight: 800 }}>
                  {masteredPct}%
                </text>
                <text x="55" y="68" textAnchor="middle" className="fill-muted" style={{ fontSize: 10 }}>
                  đã thuộc
                </text>
              </svg>
              <div className="space-y-2 text-sm">
                <Legend color="var(--accent)" label="Đã thuộc" value={pool.mastered} />
                <Legend color="var(--accent-weak)" label="Đang học" value={pool.learning} border />
                <div className="text-xs text-muted pt-1">Tổng {pool.total} từ · họ từ: {fam.total}</div>
              </div>
            </div>
          )}
        </div>

        {/* Feature breakdown */}
        <div className="glass rounded-2xl p-5">
          <div className="text-sm font-semibold text-muted mb-4">Luyện theo tính năng</div>
          {totalActivity === 0 ? (
            <p className="text-muted text-sm text-center py-6">Chưa có dữ liệu.</p>
          ) : (
            <div className="space-y-3">
              {featureRows.map((f) => (
                <div key={f.key}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-fg font-medium">{f.label}</span>
                    <span className="text-muted">{f.n}</span>
                  </div>
                  <div className="h-2 rounded-full bg-accent-weak overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${(f.n / maxFeature) * 100}%`, background: f.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
          <ArrowLeft size={16} /> Về trang chủ
        </Link>
      </div>
    </div>
  );
}

function Legend({ color, label, value, border }: { color: string; label: string; value: number; border?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="w-3 h-3 rounded-full shrink-0"
        style={{ background: color, border: border ? "1px solid var(--border)" : "none" }}
      />
      <span className="text-muted">{label}</span>
      <span className="text-fg font-semibold ml-auto">{value}</span>
    </div>
  );
}
