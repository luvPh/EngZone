"use client";

import { supabase } from "./supabase";

// The localStorage keys that hold the user's learning data. These mirror to a
// single Supabase table `app_state(user_id, key, value)` — one row per key.
export const SYNC_KEYS = [
  "engzone:vocab:v1",
  "engzone:families:v1",
  "engzone:grammar:lib:v1",
  "engzone:library:v1",
  "engzone:activity:v1",
  "engzone:models:v1",
] as const;

const SYNC_KEY_SET = new Set<string>(SYNC_KEYS);

// ----- localStorage helpers -----
function lsGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function lsSetRaw(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* quota / unavailable — ignore */
  }
}

/**
 * Pull every synced key for this user from Supabase into localStorage.
 * Strategy (conflict-light, good for a single user):
 *  - If the cloud has a key → it wins (you logged in to GET your data).
 *  - If the cloud lacks a key but localStorage has one → push it up (so brand
 *    new local data made before first login isn't lost).
 * Returns true if any local value changed (caller may reload to re-read state).
 */
export async function pullAll(userId: string): Promise<boolean> {
  if (!supabase) return false;
  const { data, error } = await supabase
    .from("app_state")
    .select("key,value")
    .eq("user_id", userId);
  if (error) {
    console.warn("[sync] pull failed:", error.message);
    return false;
  }

  const remote = new Map<string, unknown>();
  for (const row of data ?? []) remote.set(row.key as string, row.value);

  let changed = false;
  for (const key of SYNC_KEYS) {
    if (remote.has(key)) {
      const incoming = JSON.stringify(remote.get(key));
      if (incoming !== lsGet(key)) {
        lsSetRaw(key, incoming);
        changed = true;
      }
    } else {
      // Cloud doesn't have it yet — seed it from local if present.
      const local = lsGet(key);
      if (local != null) void pushKey(userId, key);
    }
  }
  return changed;
}

/** Upsert one key's current localStorage value to the cloud. */
export async function pushKey(userId: string, key: string): Promise<void> {
  if (!supabase || !SYNC_KEY_SET.has(key)) return;
  const raw = lsGet(key);
  if (raw == null) return;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    value = raw;
  }
  const { error } = await supabase
    .from("app_state")
    .upsert(
      { user_id: userId, key, value, updated_at: new Date().toISOString() },
      { onConflict: "user_id,key" }
    );
  if (error) console.warn(`[sync] push ${key} failed:`, error.message);
}

// ----- write interception -----
// We avoid touching every storage module by wrapping localStorage.setItem once:
// any write to a synced key schedules a debounced push to the cloud.
let installed = false;
let currentUserId: string | null = null;
const timers = new Map<string, ReturnType<typeof setTimeout>>();
const DEBOUNCE_MS = 1200;

export function setSyncUser(userId: string | null) {
  currentUserId = userId;
}

export function installSyncInterceptor() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  const orig = window.localStorage.setItem.bind(window.localStorage);
  window.localStorage.setItem = (key: string, value: string) => {
    orig(key, value);
    if (currentUserId && SYNC_KEY_SET.has(key)) {
      const existing = timers.get(key);
      if (existing) clearTimeout(existing);
      timers.set(
        key,
        setTimeout(() => {
          timers.delete(key);
          const uid = currentUserId;
          if (uid) void pushKey(uid, key);
        }, DEBOUNCE_MS)
      );
    }
  };
}
