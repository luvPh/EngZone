"use client";

import { usePathname } from "next/navigation";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import VoicePicker from "@/components/VoicePicker";

const CRUMBS: Record<string, string> = {
  "/": "Trang chủ",
  "/quiz": "Luyện đề",
  "/essay": "Essay",
  "/grammar": "Grammar",
  "/flashcard": "Luyện từ",
  "/check": "Check",
  "/library": "Thư viện",
};

function crumbFor(pathname: string) {
  if (pathname === "/") return CRUMBS["/"];
  const hit = Object.keys(CRUMBS).find(
    (k) => k !== "/" && pathname.startsWith(k)
  );
  return hit ? CRUMBS[hit] : "EngZone";
}

export default function Topbar() {
  const pathname = usePathname() ?? "/";
  const { theme, dir, toggleTheme, setDir } = useTheme();

  const segBase =
    "border-none px-3.5 py-[5px] rounded-full text-[13px] font-semibold cursor-pointer font-sans transition";
  const segOn = "text-fg";
  const segOff = "text-muted";

  return (
    <div
      className="h-[60px] shrink-0 flex items-center justify-between px-7 sticky top-0 z-10"
      style={{ borderBottom: "1px solid var(--border)", background: "var(--bg)" }}
    >
      <div className="text-[13px] text-muted font-medium">
        {crumbFor(pathname)}
      </div>
      <div className="flex items-center gap-2.5">
        {/* Direction toggle */}
        <div
          className="flex p-[3px] gap-0.5 rounded-full"
          style={{ background: "var(--rail)", border: "1px solid var(--border)" }}
        >
          <button
            type="button"
            onClick={() => setDir("serif")}
            className={`${segBase} ${dir === "serif" ? segOn : segOff}`}
            style={
              dir === "serif"
                ? { background: "var(--panel)", boxShadow: "0 1px 3px rgba(0,0,0,.1)" }
                : { background: "transparent" }
            }
          >
            Serif
          </button>
          <button
            type="button"
            onClick={() => setDir("soft")}
            className={`${segBase} ${dir === "soft" ? segOn : segOff}`}
            style={
              dir === "soft"
                ? { background: "var(--panel)", boxShadow: "0 1px 3px rgba(0,0,0,.1)" }
                : { background: "transparent" }
            }
          >
            Soft
          </button>
        </div>

        {/* English read-aloud voice */}
        <VoicePicker />

        {/* Theme toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          title="Đổi nền sáng / tối"
          aria-label="Đổi nền sáng / tối"
          className="w-9 h-9 rounded-full grid place-items-center cursor-pointer transition hover:text-accent hover:border-accent"
          style={{
            border: "1px solid var(--border)",
            background: "var(--panel)",
            color: "var(--fg)",
          }}
        >
          {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
        </button>
      </div>
    </div>
  );
}
