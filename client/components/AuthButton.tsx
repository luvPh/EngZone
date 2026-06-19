"use client";

import { LogIn, LogOut, RefreshCw, Cloud } from "lucide-react";
import { useAuth } from "./SyncProvider";

/**
 * Cloud-sync login control. Renders nothing when sync isn't configured
 * (no Supabase env) so the app looks unchanged in localStorage-only mode.
 */
export default function AuthButton({ className = "" }: { className?: string }) {
  const { enabled, ready, email, syncing, signIn, signOut } = useAuth();
  if (!enabled || !ready) return null;

  if (!email) {
    return (
      <button
        type="button"
        onClick={signIn}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium glass-input text-slate-200 hover:text-white transition ${className}`}
      >
        <LogIn size={16} /> Đăng nhập đồng bộ
      </button>
    );
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl glass-input text-xs ${className}`}>
      {syncing ? (
        <RefreshCw size={14} className="text-accent animate-spin shrink-0" />
      ) : (
        <Cloud size={14} className="text-ok shrink-0" />
      )}
      <span className="truncate text-slate-300 flex-1" title={email}>
        {email}
      </span>
      <button
        type="button"
        onClick={signOut}
        aria-label="Đăng xuất"
        className="text-muted hover:text-white shrink-0"
      >
        <LogOut size={15} />
      </button>
    </div>
  );
}
