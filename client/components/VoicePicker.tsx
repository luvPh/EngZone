"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AudioLines, Play, X } from "lucide-react";
import {
  getEnglishVoices,
  onVoicesChanged,
  getPreferredVoiceName,
  setPreferredVoiceName,
  resolveVoice,
  speak,
} from "@/lib/tts";

const SAMPLE = "Technology has changed the way we learn English every day.";

// Global picker for the voice used by every read-aloud in the app.
export default function VoicePicker() {
  const [open, setOpen] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [picked, setPicked] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const load = () => {
    setVoices(getEnglishVoices());
    setPicked(getPreferredVoiceName() || resolveVoice()?.name || "");
  };

  useEffect(() => {
    load();
    return onVoicesChanged(load); // Chrome fills voices asynchronously
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!panelRef.current?.contains(t) && !btnRef.current?.contains(t)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  if (!voices.length) return null;

  const choose = (name: string) => {
    setPicked(name);
    setPreferredVoiceName(name);
    speak(SAMPLE);
  };

  const rect = btnRef.current?.getBoundingClientRect();

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Giọng đọc tiếng Anh"
        aria-label="Giọng đọc tiếng Anh"
        className="w-9 h-9 rounded-full grid place-items-center cursor-pointer transition hover:text-accent hover:border-accent"
        style={{
          border: "1px solid var(--border)",
          background: open ? "var(--accent-weak)" : "var(--panel)",
          color: open ? "var(--accent)" : "var(--fg)",
        }}
      >
        <AudioLines size={16} />
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={panelRef}
            className="fixed z-50 glass rounded-2xl p-3.5 shadow-glow-accent"
            style={{
              top: (rect?.bottom ?? 60) + 8,
              right: Math.max(8, window.innerWidth - (rect?.right ?? 0)),
              width: 280,
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold text-fg">Giọng đọc tiếng Anh</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Đóng"
                className="ml-auto text-muted hover:text-fg"
              >
                <X size={15} />
              </button>
            </div>
            <p className="text-xs text-muted mb-2.5">
              Sắp xếp theo độ tự nhiên. Bấm để nghe thử — áp dụng cho toàn app.
            </p>

            <div className="max-h-64 overflow-y-auto space-y-1">
              {voices.map((v) => {
                const on = v.name === picked;
                return (
                  <button
                    key={v.name}
                    type="button"
                    onClick={() => choose(v.name)}
                    className={`w-full text-left rounded-xl px-3 py-2 text-sm transition flex items-center gap-2 ${
                      on ? "bg-accent text-white" : "glass-input text-fg hover:border-accent/60"
                    }`}
                  >
                    <span className="flex-1 min-w-0 truncate">{v.name}</span>
                    <span className={`text-[11px] shrink-0 ${on ? "text-white/80" : "text-muted"}`}>
                      {v.lang}
                    </span>
                    <Play size={13} className="shrink-0" />
                  </button>
                );
              })}
            </div>

            <p className="text-[11px] text-muted mt-2.5 leading-snug">
              💡 macOS: tải giọng <b>Premium</b> ở System Settings → Accessibility → Spoken
              Content → Manage Voices để nghe hay hơn hẳn.
            </p>
          </div>,
          document.body
        )}
    </>
  );
}
