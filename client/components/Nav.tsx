"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Home,
  ListChecks,
  FileText,
  BookOpen,
  Layers,
  SpellCheck,
  Library,
  Lock,
  Flame,
  type LucideIcon,
} from "lucide-react";
import { useFeatureState } from "@/lib/store";
import AuthButton from "@/components/AuthButton";
import { currentStreak } from "@/lib/storage";

const TABS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "Trang chủ", icon: Home },
  { href: "/quiz", label: "Luyện đề", icon: ListChecks },
  { href: "/essay", label: "Vocab + Essay", icon: FileText },
  { href: "/grammar", label: "Grammar", icon: BookOpen },
  { href: "/flashcard", label: "Luyện từ", icon: Layers },
  { href: "/check", label: "Check", icon: SpellCheck },
  { href: "/library", label: "Thư viện", icon: Library },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/** Squircle gradient logo with a slow shine sweep. */
function Logo() {
  return (
    <div className="flex items-center gap-3 px-1 pt-1.5 pb-4">
      <div
        className="relative w-[42px] h-[42px] shrink-0 rounded-[13px] overflow-hidden flex flex-col gap-[4.5px] items-start justify-center pl-3"
        style={{
          background:
            "linear-gradient(155deg, var(--accent-soft) 0%, var(--accent) 100%)",
          boxShadow:
            "0 8px 22px -9px var(--accent), inset 0 1px 0 rgba(255,255,255,.5)",
        }}
      >
        <div className="w-[18px] h-[3.6px] rounded-[9px] bg-white" />
        <div className="w-[12px] h-[3.6px] rounded-[9px] bg-white/80" />
        <div className="w-[16px] h-[3.6px] rounded-[9px] bg-white/[.66]" />
        <div
          className="ez-shine absolute top-0 left-[-60%] w-[55%] h-full"
          style={{
            background:
              "linear-gradient(100deg, transparent, rgba(255,255,255,.3), transparent)",
            filter: "blur(2px)",
            transform: "skewX(-18deg)",
          }}
        />
      </div>
      <div className="leading-none">
        <div
          className="font-display text-[21px] font-bold tracking-tight"
          style={{
            background: "linear-gradient(100deg, var(--fg), var(--accent))",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
            color: "transparent",
          }}
        >
          EngZone
        </div>
        <div className="text-[9.5px] text-faint tracking-[.16em] mt-[5px] font-semibold">
          HỌC MỖI NGÀY
        </div>
      </div>
    </div>
  );
}

/** Animated floating gradient blobs behind the sidebar content. */
function Blobs() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      <div
        className="ez-drift1 absolute left-[-34px] top-[210px] w-[150px] h-[150px] rounded-[40px]"
        style={{
          background: "linear-gradient(145deg, var(--accent-soft), var(--accent))",
          filter: "blur(20px)",
          opacity: 0.34,
        }}
      />
      <div
        className="ez-drift2 absolute right-[-46px] top-[400px] w-[172px] h-[172px] rounded-[48px]"
        style={{
          background: "linear-gradient(160deg, #E8B59C, var(--accent-soft))",
          filter: "blur(24px)",
          opacity: 0.3,
        }}
      />
      <div
        className="ez-drift3 absolute left-[16px] bottom-[14px] w-[144px] h-[144px] rounded-[42px]"
        style={{
          background: "linear-gradient(150deg, var(--accent), var(--accent-soft))",
          filter: "blur(22px)",
          opacity: 0.32,
        }}
      />
    </div>
  );
}

export default function Nav() {
  const pathname = usePathname() ?? "/";
  const [locked] = useFeatureState<boolean>("nav:locked", false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const streak = mounted ? currentStreak() : 0;

  return (
    <>
      {/* ===== Desktop sidebar ===== */}
      <aside
        className="hidden md:flex md:flex-col md:w-[248px] md:shrink-0 relative overflow-hidden sticky top-0 h-screen"
        style={{
          background:
            "radial-gradient(130% 50% at 50% 0%, var(--accent-weak) 0%, transparent 55%), var(--rail)",
          borderRight: "1px solid var(--border)",
          padding: "22px 16px",
        }}
      >
        <Blobs />

        <div className="relative z-[1] flex flex-col gap-1 flex-1 min-h-0">
          <Logo />

          <div className="text-[10.5px] font-semibold tracking-[.13em] text-faint px-3 pb-2 pt-0.5">
            ĐIỀU HƯỚNG
          </div>

          {locked && (
            <div className="flex items-center gap-2 px-3 py-2 mb-1 text-xs text-bad bg-bad/10 border border-bad/30 rounded-lg">
              <Lock size={13} /> Đang làm bài — khoá chuyển tab
            </div>
          )}

          {TABS.map((t) => {
            const active = isActive(pathname, t.href);
            const Icon = t.icon;
            const inner = (
              <>
                <Icon size={18} />
                {t.label}
              </>
            );
            const style = {
              background: active ? "var(--accent-weak)" : "transparent",
              color: active ? "var(--accent)" : "var(--muted)",
            };
            const cls =
              "flex items-center gap-3 w-full text-left px-3 py-[9px] rounded-[11px] text-sm font-medium";
            if (locked && !active) {
              return (
                <span
                  key={t.href}
                  className={`${cls} opacity-30 cursor-not-allowed`}
                  style={style}
                  aria-disabled
                >
                  {inner}
                </span>
              );
            }
            return (
              <Link key={t.href} href={t.href} className={cls} style={style}>
                {inner}
              </Link>
            );
          })}

          {/* ===== Footer: goal / streak / profile ===== */}
          <div className="mt-auto flex flex-col gap-[11px] pt-3.5">
            <div
              className="rounded-[14px] p-[13px_14px]"
              style={{
                background: "var(--panel)",
                border: "1px solid var(--border)",
                boxShadow: "0 6px 18px -12px rgba(0,0,0,.35)",
              }}
            >
              <div className="flex justify-between items-center text-xs mb-[9px]">
                <span className="font-semibold text-fg">Mục tiêu hôm nay</span>
                <span className="text-accent font-bold">3/5</span>
              </div>
              <div
                className="h-[7px] rounded-full overflow-hidden"
                style={{ background: "var(--accent-weak)" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: "60%",
                    background:
                      "linear-gradient(90deg, var(--accent-soft), var(--accent))",
                  }}
                />
              </div>
            </div>

            <div
              className="flex items-center gap-[9px] px-3 py-2.5 rounded-xl text-xs font-semibold text-accent"
              style={{ background: "var(--accent-weak)" }}
            >
              <Flame size={15} className="shrink-0" /> Chuỗi {streak} ngày · giữ
              lửa nhé
            </div>

            <div
              className="pt-3.5 pb-1"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              <AuthButton />
            </div>
          </div>
        </div>
      </aside>

      {/* ===== Mobile bottom tab bar ===== */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-20 flex"
        style={{
          background: "var(--rail)",
          borderTop: "1px solid var(--border)",
        }}
      >
        {TABS.map((t) => {
          const active = isActive(pathname, t.href);
          const Icon = t.icon;
          const cls = "flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px]";
          const style = { color: active ? "var(--accent)" : "var(--muted)" };
          if (locked && !active) {
            return (
              <span
                key={t.href}
                className={`${cls} opacity-30`}
                style={style}
                aria-disabled
              >
                <Icon size={19} />
                {t.label}
              </span>
            );
          }
          return (
            <Link key={t.href} href={t.href} className={cls} style={style}>
              <Icon size={19} />
              {t.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
