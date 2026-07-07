"use client";

// Lightweight progress tracking in localStorage (no backend DB).

export type Feature = "quiz" | "essay" | "grammar" | "flash" | "check";

export interface ActivityRecord {
  feature: Feature;
  topic?: string;
  level?: number;
  at: number; // epoch ms
}

const KEY = "engzone:activity:v1";

function read(): ActivityRecord[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as ActivityRecord[];
  } catch {
    return [];
  }
}

function write(records: ActivityRecord[]) {
  localStorage.setItem(KEY, JSON.stringify(records));
}

export function recordActivity(rec: Omit<ActivityRecord, "at">) {
  if (typeof window === "undefined") return;
  const records = read();
  records.push({ ...rec, at: Date.now() });
  write(records);
}

export function getActivity(): ActivityRecord[] {
  return read();
}

export function clearActivity() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}

function dayKey(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10);
}

/** Counts per feature. */
export function countsByFeature(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const r of read()) counts[r.feature] = (counts[r.feature] || 0) + 1;
  return counts;
}

/** Distinct active days, most recent first. */
export function activeDays(): string[] {
  const set = new Set(read().map((r) => dayKey(r.at)));
  return [...set].sort().reverse();
}

/** Current consecutive-day streak ending today or yesterday. */
export function currentStreak(): number {
  const days = new Set(activeDays());
  if (days.size === 0) return 0;
  let streak = 0;
  const cursor = new Date();
  // Allow the streak to count if today isn't logged yet but yesterday is.
  if (!days.has(dayKey(cursor.getTime()))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(dayKey(cursor.getTime()))) return 0;
  }
  for (;;) {
    if (days.has(dayKey(cursor.getTime()))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else break;
  }
  return streak;
}

/** Activity counts per day for the last `n` days (oldest→newest). */
export function dailyCounts(n: number): { date: string; count: number }[] {
  const map = new Map<string, number>();
  for (const r of read()) {
    const k = dayKey(r.at);
    map.set(k, (map.get(k) || 0) + 1);
  }
  const out: { date: string; count: number }[] = [];
  const cursor = new Date();
  cursor.setDate(cursor.getDate() - (n - 1));
  for (let i = 0; i < n; i++) {
    const k = dayKey(cursor.getTime());
    out.push({ date: k, count: map.get(k) || 0 });
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

/** Last 7 day-keys (oldest→newest) with active flag, for a mini calendar. */
export function last7Days(): { date: string; active: boolean }[] {
  const days = new Set(activeDays());
  const out: { date: string; active: boolean }[] = [];
  const cursor = new Date();
  cursor.setDate(cursor.getDate() - 6);
  for (let i = 0; i < 7; i++) {
    const key = dayKey(cursor.getTime());
    out.push({ date: key, active: days.has(key) });
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}
