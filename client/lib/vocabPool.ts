"use client";

// A per-WORD vocabulary pool accumulated from generated content (Vocab-with-Essay,
// flashcards). The "Luyện từ" practice feature draws unmastered words from here;
// a word answered correctly 3 times becomes "mastered" and stops appearing.

import type { VocabItem } from "./types";

export interface PoolWord {
  word: string;
  short?: string; // nghĩa ngắn gọn 1-4 từ (fallback sang meaning nếu thiếu)
  meaning: string;
  pos?: string;
  ipa?: string;
  example?: string;
  correct: number; // cumulative correct answers
  modes: string[]; // distinct test modes answered correctly
  mastered: boolean;
  saved?: boolean; // manually saved from essay lookup → shown as its own catalogue
  source?: string; // e.g. essay topic
  addedAt: number;
  // Spaced-repetition scheduling (SM-2 lite).
  due?: number; // epoch ms of next review (undefined = brand new, review now)
  interval?: number; // current interval in days
  ease?: number; // ease factor (>= 1.3)
  reps?: number; // consecutive correct reviews
}

const DAY_MS = 86400000;
const DEFAULT_EASE = 2.5;

/** Predicted next interval (days) for a review outcome — used to show "ôn lại sau N ngày". */
export function nextIntervalDays(w: PoolWord, correct: boolean): number {
  if (!correct) return 0;
  const ease = w.ease ?? DEFAULT_EASE;
  const interval = w.interval ?? 0;
  const reps = (w.reps ?? 0) + 1;
  return reps === 1 ? 1 : reps === 2 ? 3 : Math.round(interval * ease);
}

// A word is "mastered" only after 10 correct answers spanning all 3 test modes.
export const MASTER_AT = 10;
export const ALL_MODES = ["mcq-word", "mcq-meaning", "fill"];
const KEY = "engzone:vocab:v1";

function read(): PoolWord[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as PoolWord[];
  } catch {
    return [];
  }
}

function write(list: PoolWord[]) {
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(list));
}

const norm = (w: string) => w.trim().toLowerCase();
const cap = (w: string) => {
  const t = w.trim();
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : t;
};

/** Add vocab to the pool (dedupe by word; enrich missing ipa/example/example). */
export function addVocab(
  items: VocabItem[],
  source?: string,
  opts: { saved?: boolean } = {}
): void {
  const list = read();
  const byWord = new Map(list.map((e) => [norm(e.word), e]));
  for (const it of items) {
    if (!it?.word?.trim() || !it?.meaning?.trim()) continue;
    // Single words only — skip compounds / multi-word / phrasal verbs.
    if (/\s/.test(it.word.trim())) continue;
    const k = norm(it.word);
    const existing = byWord.get(k);
    if (existing) {
      if (!existing.ipa && it.ipa) existing.ipa = it.ipa;
      if (!existing.example && it.example) existing.example = it.example;
      if (!existing.pos && it.pos) existing.pos = it.pos;
      if (!existing.short && it.short) existing.short = it.short;
      if (opts.saved) existing.saved = true;
    } else {
      byWord.set(k, {
        word: cap(it.word),
        short: it.short,
        meaning: it.meaning.trim(),
        pos: it.pos,
        ipa: it.ipa,
        example: it.example,
        correct: 0,
        modes: [],
        mastered: false,
        saved: opts.saved,
        source,
        addedAt: Date.now(),
      });
    }
  }
  write([...byWord.values()]);
}

/** Words manually saved from essay lookup (own catalogue in the Library). */
export function getSavedWords(): PoolWord[] {
  return read()
    .filter((e) => e.saved)
    .sort((a, b) => b.addedAt - a.addedAt);
}

/** Remove a word from the pool entirely (by word, case-insensitive). */
export function removeWord(word: string): void {
  write(read().filter((e) => norm(e.word) !== norm(word)));
}

export function getPool(): PoolWord[] {
  return read();
}

export function poolStats(): { total: number; mastered: number; learning: number } {
  const list = read();
  const mastered = list.filter((e) => e.mastered).length;
  return { total: list.length, mastered, learning: list.length - mastered };
}

/** Batch of `size` unmastered words, prioritising the ones DUE for review
 *  (spaced repetition). Due words come first (shuffled), then the soonest-due
 *  future ones to fill the batch. */
export function studyBatch(size: number): PoolWord[] {
  const now = Date.now();
  const pool = read().filter((e) => !e.mastered);
  const dueNow = pool.filter((e) => (e.due ?? 0) <= now);
  for (let i = dueNow.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [dueNow[i], dueNow[j]] = [dueNow[j], dueNow[i]];
  }
  const future = pool
    .filter((e) => (e.due ?? 0) > now)
    .sort((a, b) => (a.due ?? 0) - (b.due ?? 0));
  return [...dueNow, ...future].slice(0, size);
}

/** Record a practice result. Mastered = ≥5 correct AND all 3 modes answered right. */
export function recordResult(word: string, mode: string, correct: boolean): void {
  const list = read();
  const e = list.find((x) => norm(x.word) === norm(word));
  if (!e) return;
  if (!Array.isArray(e.modes)) e.modes = [];
  e.ease = e.ease ?? DEFAULT_EASE;
  e.reps = e.reps ?? 0;
  e.interval = e.interval ?? 0;
  if (correct) {
    e.correct += 1;
    if (!e.modes.includes(mode)) e.modes.push(mode);
    e.reps += 1;
    e.interval = e.reps === 1 ? 1 : e.reps === 2 ? 3 : Math.round(e.interval * e.ease);
    e.ease = Math.min(2.6, e.ease + 0.1);
    if (e.correct >= MASTER_AT && ALL_MODES.every((m) => e.modes.includes(m))) {
      e.mastered = true;
    }
  } else {
    // Lapse: reset streak, review again this session.
    e.reps = 0;
    e.interval = 0;
    e.ease = Math.max(1.3, e.ease - 0.2);
  }
  e.due = Date.now() + e.interval * DAY_MS;
  write(list);
}

/** How many unmastered words are due for review right now (incl. brand-new). */
export function dueCount(): number {
  const now = Date.now();
  return read().filter((e) => !e.mastered && (e.due ?? 0) <= now).length;
}

/** A few random distractor words (for multiple-choice), excluding `word`. */
export function distractors(word: string, n = 3): PoolWord[] {
  const others = read().filter((e) => norm(e.word) !== norm(word));
  for (let i = others.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [others[i], others[j]] = [others[j], others[i]];
  }
  return others.slice(0, n);
}

export function resetMastery(): void {
  const list = read().map((e) => ({ ...e, correct: 0, modes: [], mastered: false }));
  write(list);
}

export function clearVocab(): void {
  if (typeof window !== "undefined") localStorage.removeItem(KEY);
}
