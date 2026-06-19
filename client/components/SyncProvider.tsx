"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { supabase, supabaseEnabled } from "@/lib/supabase";
import {
  pullAll,
  setSyncUser,
  installSyncInterceptor,
} from "@/lib/cloudSync";

interface AuthCtx {
  enabled: boolean; // is cloud sync configured at all?
  ready: boolean; // initial session check done
  email: string | null; // logged-in user's email, or null
  syncing: boolean; // a pull is in flight
  signIn: () => void;
  signOut: () => void;
}

const Ctx = createContext<AuthCtx>({
  enabled: false,
  ready: true,
  email: null,
  syncing: false,
  signIn: () => {},
  signOut: () => {},
});

export function useAuth() {
  return useContext(Ctx);
}

// Reload at most once per tab session, so freshly-pulled cloud data is picked
// up by the feature components (which read localStorage on mount).
const RELOAD_FLAG = "engzone:sync:reloaded";

export default function SyncProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [ready, setReady] = useState(!supabaseEnabled);
  const [email, setEmail] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const hydrate = useCallback(async (userId: string) => {
    setSyncing(true);
    try {
      const changed = await pullAll(userId);
      if (
        changed &&
        typeof sessionStorage !== "undefined" &&
        !sessionStorage.getItem(RELOAD_FLAG)
      ) {
        sessionStorage.setItem(RELOAD_FLAG, "1");
        window.location.reload();
        return;
      }
    } finally {
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    if (!supabaseEnabled || !supabase) return;
    installSyncInterceptor();

    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      const u = data.session?.user;
      setEmail(u?.email ?? null);
      setSyncUser(u?.id ?? null);
      setReady(true);
      if (u) void hydrate(u.id);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user;
      setEmail(u?.email ?? null);
      setSyncUser(u?.id ?? null);
      if (u) void hydrate(u.id);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [hydrate]);

  const signIn = useCallback(() => {
    if (!supabase) return;
    void supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
  }, []);

  const signOut = useCallback(() => {
    if (!supabase) return;
    setSyncUser(null);
    if (typeof sessionStorage !== "undefined") sessionStorage.removeItem(RELOAD_FLAG);
    void supabase.auth.signOut().then(() => setEmail(null));
  }, []);

  return (
    <Ctx.Provider value={{ enabled: supabaseEnabled, ready, email, syncing, signIn, signOut }}>
      {children}
    </Ctx.Provider>
  );
}
