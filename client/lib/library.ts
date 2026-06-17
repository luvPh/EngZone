"use client";

// localStorage-backed library of generated content (quiz / essay / flashcard).
// Lets users browse past generations and lets feature pages reuse a matching
// item instead of regenerating the same topic/level.

export type LibFeature = "quiz" | "essay" | "flash";

export interface LibItem {
  id: string;
  feature: LibFeature;
  topic: string;
  level?: number;
  meta?: Record<string, unknown>; // e.g. quiz { count, type }
  title: string;
  content: string; // markdown (essay) or JSON string (quiz/flash)
  createdAt: number;
}

const KEY = "engzone:library:v1";

function read(): LibItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as LibItem[];
  } catch {
    return [];
  }
}

function write(items: LibItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function getLibrary(): LibItem[] {
  return read().sort((a, b) => b.createdAt - a.createdAt);
}

function makeId(): string {
  return `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

/** Find an existing item matching feature/topic/level (+ optional meta keys). */
export function findItem(
  feature: LibFeature,
  topic: string,
  level?: number,
  meta?: Record<string, unknown>
): LibItem | undefined {
  const t = topic.trim().toLowerCase();
  return read().find((it) => {
    if (it.feature !== feature) return false;
    if (it.topic.trim().toLowerCase() !== t) return false;
    if (level !== undefined && it.level !== level) return false;
    if (meta) {
      for (const k of Object.keys(meta)) {
        if (String(it.meta?.[k]) !== String(meta[k])) return false;
      }
    }
    return true;
  });
}

/** All items matching feature(/topic/level/meta), newest first. */
export function listItems(
  feature: LibFeature,
  topic?: string,
  level?: number,
  meta?: Record<string, unknown>
): LibItem[] {
  const t = topic?.trim().toLowerCase();
  return getLibrary().filter((it) => {
    if (it.feature !== feature) return false;
    if (t !== undefined && it.topic.trim().toLowerCase() !== t) return false;
    if (level !== undefined && it.level !== level) return false;
    if (meta) {
      for (const k of Object.keys(meta)) {
        if (String(it.meta?.[k]) !== String(meta[k])) return false;
      }
    }
    return true;
  });
}

/** Always append a NEW entry (no dedupe) — used to accumulate flashcard sets. */
export function addItem(item: Omit<LibItem, "id" | "createdAt">): LibItem {
  const record: LibItem = { ...item, id: makeId(), createdAt: Date.now() };
  write([...read(), record]);
  return record;
}

export function saveItem(item: Omit<LibItem, "id" | "createdAt">): LibItem {
  const items = read();
  // Replace an existing exact match (same feature/topic/level/meta) to dedupe.
  const existing = findItem(item.feature, item.topic, item.level, item.meta);
  const record: LibItem = {
    ...item,
    id: existing?.id ?? makeId(),
    createdAt: Date.now(),
  };
  const next = existing
    ? items.map((it) => (it.id === existing.id ? record : it))
    : [...items, record];
  write(next);
  return record;
}

export function deleteItem(id: string) {
  write(read().filter((it) => it.id !== id));
}

export function clearLibrary() {
  if (typeof window !== "undefined") localStorage.removeItem(KEY);
}
