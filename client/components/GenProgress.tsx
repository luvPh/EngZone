"use client";

import { useEffect, useState } from "react";

/**
 * Progress bar for long background generations (e.g. exam).
 * Combines two signals so it always moves and stays mostly honest:
 *  - byte progress: chars of model output received so far / expected
 *  - time progress: elapsed / estimated total (covers the initial "thinking"
 *    phase before any bytes arrive)
 * Takes the max of the two, capped just under 100% until generation finishes.
 */
export default function GenProgress({
  startedAt,
  bytes,
  estMs,
  estBytes,
  label = "Đang tạo…",
}: {
  startedAt: number;
  bytes: number;
  estMs: number;
  estBytes: number;
  label?: string;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 400);
    return () => clearInterval(id);
  }, []);

  const elapsed = Math.max(0, now - startedAt);
  const timePct = Math.min(95, (elapsed / estMs) * 95);
  const bytePct = Math.min(97, (bytes / estBytes) * 100);
  const pct = Math.max(3, timePct, bytePct);

  const mm = Math.floor(elapsed / 60000);
  const ss = Math.floor((elapsed % 60000) / 1000)
    .toString()
    .padStart(2, "0");

  return (
    <div className="mt-5 bg-surface border border-border rounded-2xl p-4 shadow-card animate-fade-up">
      <div className="flex items-center justify-between text-sm mb-2">
        <span className="text-slate-300">{label}</span>
        <span className="text-muted tabular-nums">
          {Math.round(pct)}% · {mm}:{ss}
        </span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-surface-2 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent to-accent-soft transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-muted mt-2">
        Cứ để yên trang — đề đang được biên soạn ngầm.
      </p>
    </div>
  );
}
