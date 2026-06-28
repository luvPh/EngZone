"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type Theme = "light" | "dark";
type Dir = "serif" | "soft";

type ThemeCtx = {
  theme: Theme;
  dir: Dir;
  toggleTheme: () => void;
  setDir: (d: Dir) => void;
};

const Ctx = createContext<ThemeCtx | null>(null);

const THEME_KEY = "engzone:theme";
const DIR_KEY = "engzone:dir";

function apply(theme: Theme, dir: Dir) {
  const el = document.documentElement;
  el.setAttribute("data-theme", theme);
  el.setAttribute("data-dir", dir);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [dir, setDirState] = useState<Dir>("serif");

  // Hydrate from localStorage once on mount.
  useEffect(() => {
    const t = (localStorage.getItem(THEME_KEY) as Theme) || "light";
    const d = (localStorage.getItem(DIR_KEY) as Dir) || "serif";
    setTheme(t);
    setDirState(d);
    apply(t, d);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      localStorage.setItem(THEME_KEY, next);
      apply(next, dir);
      return next;
    });
  };

  const setDir = (d: Dir) => {
    setDirState(d);
    localStorage.setItem(DIR_KEY, d);
    apply(theme, d);
  };

  return (
    <Ctx.Provider value={{ theme, dir, toggleTheme, setDir }}>
      {children}
    </Ctx.Provider>
  );
}

export function useTheme() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useTheme must be used within ThemeProvider");
  return c;
}

/** Inline script string to set theme before first paint (avoids flash). */
export const themeNoFlashScript = `(function(){try{var t=localStorage.getItem('${THEME_KEY}')||'light';var d=localStorage.getItem('${DIR_KEY}')||'serif';var e=document.documentElement;e.setAttribute('data-theme',t);e.setAttribute('data-dir',d);}catch(e){}})();`;
