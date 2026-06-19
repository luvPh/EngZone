"use client";

import { useCallback, useEffect, useState } from "react";

export type Provider = "claude" | "gemini-flash" | "gemini-flash-lite";

// Map lựa chọn → model Gemini thực tế (route dùng để gọi API).
export const GEMINI_MODEL_MAP: Record<string, string> = {
  "gemini-flash": "gemini-3.5-flash",
  "gemini-flash-lite": "gemini-3.1-flash-lite",
};

function normalize(v: unknown): Provider {
  if (v === "gemini") return "gemini-flash"; // tương thích lựa chọn cũ
  if (v === "claude" || v === "gemini-flash" || v === "gemini-flash-lite") return v;
  return "claude";
}

export const FEATURES = [
  "quiz",
  "essay",
  "grammar",
  "flashcard",
  "check",
  "bubble",
] as const;
export type Feature = (typeof FEATURES)[number];

const KEY = "engzone:models:v1";
// Default provider per feature. Local dev defaults to Claude (CLI subscription);
// a Vercel deploy sets NEXT_PUBLIC_DEFAULT_PROVIDER=gemini-flash so first-load
// uses the free Gemini provider (Claude/CLI isn't available there).
const DEFAULT: Provider = normalize(process.env.NEXT_PUBLIC_DEFAULT_PROVIDER);

function readMap(): Partial<Record<Feature, Provider>> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

export function getProvider(f: Feature): Provider {
  const stored = readMap()[f];
  return stored ? normalize(stored) : DEFAULT;
}

export function setProvider(f: Feature, p: Provider): void {
  if (typeof window === "undefined") return;
  const map = readMap();
  map[f] = p;
  localStorage.setItem(KEY, JSON.stringify(map));
}

/** Per-feature provider choice, persisted in localStorage. */
export function useModel(feature: Feature): [Provider, (p: Provider) => void] {
  const [p, setP] = useState<Provider>(DEFAULT);
  useEffect(() => setP(getProvider(feature)), [feature]);
  const set = useCallback(
    (next: Provider) => {
      setProvider(feature, next);
      setP(next);
    },
    [feature]
  );
  return [p, set];
}

// Which providers are actually configured on the server (cached one fetch).
let providersCache: Promise<{ claude: boolean; gemini: boolean }> | null = null;

export function useProviders(): { claude: boolean; gemini: boolean } {
  const [pv, setPv] = useState({ claude: true, gemini: false });
  useEffect(() => {
    if (!providersCache) {
      providersCache = fetch("/api/health")
        .then((r) => r.json())
        .then((d) => d.providers ?? { claude: true, gemini: false })
        .catch(() => ({ claude: true, gemini: false }));
    }
    providersCache.then(setPv);
  }, []);
  return pv;
}
