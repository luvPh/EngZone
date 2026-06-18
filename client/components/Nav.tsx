"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  ListChecks,
  FileText,
  BookOpen,
  Layers,
  SpellCheck,
  Library,
  Lock,
  type LucideIcon,
} from "lucide-react";
import { useFeatureState } from "@/lib/store";

const TABS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/quiz", label: "Luyện đề", icon: ListChecks },
  { href: "/essay", label: "Essay", icon: FileText },
  { href: "/grammar", label: "Grammar", icon: BookOpen },
  { href: "/flashcard", label: "Luyện từ", icon: Layers },
  { href: "/check", label: "Check", icon: SpellCheck },
  { href: "/library", label: "Library", icon: Library },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export default function Nav() {
  const pathname = usePathname() ?? "/";
  // Locked while a timed exam is in progress (set by the quiz page).
  const [locked] = useFeatureState<boolean>("nav:locked", false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-64 lg:w-72 md:shrink-0 border-r border-white/10 glass-nav p-4 gap-1">
        <div className="flex items-center gap-2 px-2 py-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-soft grid place-items-center text-white font-bold">
            E
          </div>
          <span className="text-lg font-bold tracking-tight">
            Eng<span className="text-accent">Zone</span>
          </span>
        </div>
        {locked && (
          <div className="flex items-center gap-2 px-3 py-2 mb-1 text-xs text-bad bg-bad/10 border border-bad/30 rounded-lg">
            <Lock size={13} /> Đang làm bài — khoá chuyển tab
          </div>
        )}
        {TABS.map((t) => {
          const active = isActive(pathname, t.href);
          const Icon = t.icon;
          const cls = `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            active ? "bg-accent/15 text-white" : "text-muted hover:text-white hover:bg-white/5"
          }`;
          if (locked && !active) {
            return (
              <span key={t.href} className={`${cls} opacity-30 cursor-not-allowed`} aria-disabled>
                <Icon size={18} />
                {t.label}
              </span>
            );
          }
          return (
            <Link key={t.href} href={t.href} className={cls}>
              <Icon size={18} className={active ? "text-accent" : ""} />
              {t.label}
            </Link>
          );
        })}
      </aside>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-20 flex glass-nav border-t border-white/10">
        {TABS.map((t) => {
          const active = isActive(pathname, t.href);
          const Icon = t.icon;
          const cls = `flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] ${
            active ? "text-accent" : "text-muted"
          }`;
          if (locked && !active) {
            return (
              <span key={t.href} className={`${cls} opacity-30`} aria-disabled>
                <Icon size={19} />
                {t.label}
              </span>
            );
          }
          return (
            <Link key={t.href} href={t.href} className={cls}>
              <Icon size={19} />
              {t.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
