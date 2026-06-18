"use client";

// A per-WORD vocabulary pool accumulated from generated content (Vocab-with-Essay,
// flashcards). The "Luyện từ" practice feature draws unmastered words from here;
// a word answered correctly 3 times becomes "mastered" and stops appearing.

import type { VocabItem } from "./types";

export interface PoolWord {
  word: string;
  meaning: string;
  ipa?: string;
  example?: string;
  correct: number; // cumulative correct answers
  mastered: boolean;
  source?: string; // e.g. essay topic
  addedAt: number;
}

export const MASTER_AT = 3;
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

/** Add vocab to the pool (dedupe by word; enrich missing ipa/example/example). */
export function addVocab(items: VocabItem[], source?: string): void {
  const list = read();
  const byWord = new Map(list.map((e) => [norm(e.word), e]));
  for (const it of items) {
    if (!it?.word?.trim() || !it?.meaning?.trim()) continue;
    const k = norm(it.word);
    const existing = byWord.get(k);
    if (existing) {
      if (!existing.ipa && it.ipa) existing.ipa = it.ipa;
      if (!existing.example && it.example) existing.example = it.example;
    } else {
      byWord.set(k, {
        word: it.word.trim(),
        meaning: it.meaning.trim(),
        ipa: it.ipa,
        example: it.example,
        correct: 0,
        mastered: false,
        source,
        addedAt: Date.now(),
      });
    }
  }
  write([...byWord.values()]);
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

/** Record a practice result; 3 cumulative correct answers → mastered. */
export function recordResult(word: string, correct: boolean): void {
  const list = read();
  const e = list.find((x) => norm(x.word) === norm(word));
  if (!e) return;
  if (correct) {
    e.correct += 1;
    if (e.correct >= MASTER_AT) e.mastered = true;
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
  const list = read().map((e) => ({ ...e, correct: 0, mastered: false }));
  write(list);
}

export function clearVocab(): void {
  if (typeof window !== "undefined") localStorage.removeItem(KEY);
}
