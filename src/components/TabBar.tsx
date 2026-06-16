"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/quiz", label: "Quiz" },
  { href: "/essay", label: "Essay" },
  { href: "/grammar", label: "Grammar" },
  { href: "/flashcard", label: "Flashcard" },
  { href: "/check", label: "Check" },
];

export default function TabBar() {
  const pathname = usePathname();
  return (
    <nav className="tabbar">
      {TABS.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={pathname?.startsWith(t.href) ? "active" : ""}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
