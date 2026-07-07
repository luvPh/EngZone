"use client";

// A per-WORD vocabulary pool accumulated from generated content (Vocab-with-Essay,
// flashcards). The "Luyện từ" practice feature draws unmastered words from here;
// a word answered correctly 3 times becomes "mastered" and stops appearing.

import type { VocabItem } from "./types";

export interface PoolWord {
  word: string;
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
      if (opts.saved) existing.saved = true;
    } else {
      byWord.set(k, {
        word: cap(it.word),
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

/** Random batch of `size` unmastered words (fewer if the pool is smaller). */
export function studyBatch(size: number): PoolWord[] {
  const pool = read().filter((e) => !e.mastered);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, size);
}

/** Record a practice result. Mastered = ≥5 correct AND all 3 modes answered right. */
export function recordResult(word: string, mode: string, correct: boolean): void {
  const list = read();
  const e = list.find((x) => norm(x.word) === norm(word));
  if (!e) return;
  if (!Array.isArray(e.modes)) e.modes = [];
  if (correct) {
    e.correct += 1;
    if (!e.modes.includes(mode)) e.modes.push(mode);
    if (e.correct >= MASTER_AT && ALL_MODES.every((m) => e.modes.includes(m))) {
      e.mastered = true;
    }
  }
  write(list);
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
