"use client";

import { createContext, useCallback, useContext, useState } from "react";

/**
 * In-memory app store mounted at the root layout. Because the provider never
 * unmounts during client-side navigation, feature state survives tab switches
 * and is reset only on a full page reload (in-memory = gone on reload).
 */
type Store = Record<string, unknown>;
const StoreCtx = createContext<{
  store: Store;
  setStore: React.Dispatch<React.SetStateAction<Store>>;
} | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [store, setStore] = useState<Store>({});
  return (
    <StoreCtx.Provider value={{ store, setStore }}>{children}</StoreCtx.Provider>
  );
}

export function useFeatureState<T>(
  key: string,
  initial: T
): [T, (next: T | ((prev: T) => T)) => void] {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useFeatureState must be used within AppProvider");
  const { store, setStore } = ctx;
  const value = (key in store ? store[key] : initial) as T;

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setStore((s) => {
        const prev = (key in s ? s[key] : initial) as T;
        const resolved =
          typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        return { ...s, [key]: resolved };
      });
    },
    // initial is only used on first read; intentionally not a dep.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key, setStore]
  );

  return [value, set];
}
