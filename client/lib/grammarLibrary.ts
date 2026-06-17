"use client";

import { grammarLessons, type GrammarLesson } from "./grammar";

// Toàn bộ thư viện grammar sống trong localStorage, seed từ grammarLessons.
// Mỗi bài lưu kèm nội dung AI đã sinh + cờ "đã học". Khi seed (code) thêm bài
// mới, các bài mới được merge vào mà không xoá dữ liệu người dùng.

export interface StoredLesson extends GrammarLesson {
  content: string; // markdown giải thích (rỗng = chưa sinh)
  learned: boolean;
  updatedAt: number;
}

const KEY = "engzone:grammar:lib:v1";

function fromSeed(l: GrammarLesson): StoredLesson {
  return { ...l, content: "", learned: false, updatedAt: 0 };
}

function read(): StoredLesson[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as StoredLesson[]) : null;
  } catch {
    return null;
  }
}

function write(list: StoredLesson[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(list));
}

/**
 * Catalog = the seed (canonical: order, titles, level, category, keywords).
 * localStorage only carries over per-lesson generated `content` + `learned`
 * (matched by slug). New seed lessons are added; renamed/removed slugs drop out.
 */
export function getAllLessons(): StoredLesson[] {
  if (typeof window === "undefined") return grammarLessons.map(fromSeed);
  const prevBySlug = new Map((read() ?? []).map((l) => [l.slug, l]));
  const merged = grammarLessons.map((seed) => {
    const prev = prevBySlug.get(seed.slug);
    return prev
      ? { ...fromSeed(seed), content: prev.content, learned: prev.learned, updatedAt: prev.updatedAt }
      : fromSeed(seed);
  });
  write(merged);
  return merged;
}

export function getLesson(slug: string): StoredLesson | undefined {
  return getAllLessons().find((l) => l.slug === slug);
}

/** Persist generated content for a lesson. Does NOT mark it learned. */
export function saveLessonContent(slug: string, content: string): void {
  const list = getAllLessons();
  const next = list.map((l) =>
    l.slug === slug ? { ...l, content, updatedAt: Date.now() } : l
  );
  write(next);
}

/** User-controlled "đã học" toggle. */
export function setLearned(slug: string, value: boolean): void {
  const list = getAllLessons();
  const next = list.map((l) =>
    l.slug === slug ? { ...l, learned: value } : l
  );
  write(next);
}

/** Optional: wipe the local library (re-seeds from code on next read). */
export function resetLibrary(): void {
  if (typeof window !== "undefined") localStorage.removeItem(KEY);
}

export type LessonStatus = "new" | "loaded" | "learned";

/** ○ new (no content yet) · ◐ loaded (content cached) · ✓ learned (user-marked). */
export function lessonStatus(l: StoredLesson): LessonStatus {
  if (l.learned) return "learned";
  if (l.content) return "loaded";
  return "new";
}

/** Lessons of one level, in canonical seed order. */
export function getLevelLessons(level: string): StoredLesson[] {
  return getAllLessons().filter((l) => l.level === level);
}

/** Previous/next lesson within the same level (seed order). */
export function getLessonNeighbors(slug: string): {
  prev: StoredLesson | null;
  next: StoredLesson | null;
} {
  const all = getAllLessons();
  const cur = all.find((l) => l.slug === slug);
  if (!cur) return { prev: null, next: null };
  const inLevel = all.filter((l) => l.level === cur.level);
  const i = inLevel.findIndex((l) => l.slug === slug);
  return {
    prev: i > 0 ? inLevel[i - 1] : null,
    next: i >= 0 && i < inLevel.length - 1 ? inLevel[i + 1] : null,
  };
}
