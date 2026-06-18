"use client";

// Word families = groups of related words sharing a root across parts of speech
// (decide → decision, decisive, decisively). Stored separately from the meaning
// pool so the "form transformation" practice has its own mastery (no conflict
// with vocabPool's meaning mastery). Family members are ALSO added to vocabPool
// so they can be reviewed by meaning like any other word.

import { addVocab } from "./vocabPool";

export interface FamilyMember {
  word: string;
  pos: string;
  meaning?: string;
}
export interface FamilyEntry {
  root: string;
  members: FamilyMember[];
  correct: number; // form-transformation correct answers
  mastered: boolean;
  addedAt: number;
}

export const FAMILY_MASTER_AT = 4;
const KEY = "engzone:families:v1";

function read(): FamilyEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as FamilyEntry[];
  } catch {
    return [];
  }
}
function write(list: FamilyEntry[]) {
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(list));
}

const norm = (w: string) => w.trim().toLowerCase();
const cap = (w: string) => {
  const t = w.trim();
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : t;
};

/** Add word families (from essay gen). Dedupe by root; members must be single
 *  words; needs ≥2 distinct forms to count as a family. Members with a meaning
 *  also flow into the vocab pool. */
export function addFamilies(
  families: { root: string; members: FamilyMember[] }[]
): void {
  if (!Array.isArray(families) || !families.length) return;
  const list = read();
  const byRoot = new Map(list.map((e) => [norm(e.root), e]));
  const vocabToAdd: { word: string; meaning: string; pos?: string }[] = [];

  for (const f of families) {
    if (!f?.root?.trim() || !Array.isArray(f.members)) continue;
    const members: FamilyMember[] = [];
    const seen = new Set<string>();
    for (const m of f.members) {
      if (!m?.word?.trim() || /\s/.test(m.word.trim())) continue; // single words only
      const k = norm(m.word);
      if (seen.has(k)) continue;
      seen.add(k);
      members.push({ word: cap(m.word), pos: (m.pos || "").trim(), meaning: m.meaning?.trim() });
      if (m.meaning?.trim()) vocabToAdd.push({ word: m.word, meaning: m.meaning, pos: m.pos });
    }
    if (members.length < 2) continue; // not a real family

    const rk = norm(f.root);
    const existing = byRoot.get(rk);
    if (existing) {
      const have = new Set(existing.members.map((x) => norm(x.word)));
      for (const m of members) if (!have.has(norm(m.word))) existing.members.push(m);
    } else {
      byRoot.set(rk, { root: cap(f.root), members, correct: 0, mastered: false, addedAt: Date.now() });
    }
  }

  write([...byRoot.values()]);
  if (vocabToAdd.length) addVocab(vocabToAdd, "word-family");
}

export function getFamilies(): FamilyEntry[] {
  return read();
}

export function familyStats(): { total: number; mastered: number; learning: number } {
  const list = read();
  const mastered = list.filter((e) => e.mastered).length;
  return { total: list.length, mastered, learning: list.length - mastered };
}

/** Random batch of unmastered families to practise. */
export function studyFamilies(n: number): FamilyEntry[] {
  const pool = read().filter((e) => !e.mastered);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n);
}

/** 4 correct transformations → family mastered. */
export function recordFamilyResult(root: string, correct: boolean): void {
  const list = read();
  const e = list.find((x) => norm(x.root) === norm(root));
  if (!e) return;
  if (correct) {
    e.correct += 1;
    if (e.correct >= FAMILY_MASTER_AT) e.mastered = true;
  }
  write(list);
}

export function resetFamilies(): void {
  write(read().map((e) => ({ ...e, correct: 0, mastered: false })));
}
export function clearFamilies(): void {
  if (typeof window !== "undefined") localStorage.removeItem(KEY);
}
