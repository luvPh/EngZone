"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, X, Send, Sparkles } from "lucide-react";
import Markdown from "./Markdown";
import { Spinner } from "./ui";
import ModelSelector from "./ModelSelector";
import { useModel } from "@/lib/modelConfig";
import { runCommand } from "@/lib/stream";
import { chatCommand } from "@/lib/prompts";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Nghĩa của 'resilient'?",
  "Phân biệt 'affect' và 'effect'",
  "Khi nào dùng 'a' / 'an' / 'the'?",
];

const BUBBLE = 56; // px
const DRAG_THRESHOLD = 10; // px before a press counts as a drag (vs a tap)

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

export default function ChatBubble() {
  const pathname = usePathname() ?? "/";
  const onQuiz = pathname.startsWith("/quiz");

  // Persists across navigation (component lives in the persistent layout).
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [model, setModel] = useModel("bubble");
  const scrollRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    offX: number;
    offY: number;
    startX: number;
    startY: number;
    moved: boolean;
  } | null>(null);
  // True right after a drag so the trailing click doesn't also open the panel.
  const draggedRef = useRef(false);

  // Default to the bottom-right corner once we can read the viewport.
  useEffect(() => {
    setPos({ x: window.innerWidth - BUBBLE - 16, y: window.innerHeight - BUBBLE - 88 });
    const onResize = () =>
      setPos((p) =>
        p
          ? {
              x: clamp(p.x, 8, window.innerWidth - BUBBLE - 8),
              y: clamp(p.y, 8, window.innerHeight - BUBBLE - 8),
            }
          : p
      );
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, open]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (!pos) return;
    // Capture on the button itself (currentTarget), not the inner <svg> — capturing
    // on a child that can re-render drops the pointer stream and breaks tap on touch.
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      /* capture unsupported — taps still work via pointerup */
    }
    drag.current = {
      offX: e.clientX - pos.x,
      offY: e.clientY - pos.y,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
    };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    if (
      !d.moved &&
      (Math.abs(e.clientX - d.startX) > DRAG_THRESHOLD ||
        Math.abs(e.clientY - d.startY) > DRAG_THRESHOLD)
    ) {
      d.moved = true;
    }
    setPos({
      x: clamp(e.clientX - d.offX, 8, window.innerWidth - BUBBLE - 8),
      y: clamp(e.clientY - d.offY, 8, window.innerHeight - BUBBLE - 8),
    });
  };
  const onPointerUp = () => {
    // Remember whether this gesture was a drag; the trailing click reads it.
    draggedRef.current = !!drag.current?.moved;
    drag.current = null;
  };
  const onPointerCancel = () => {
    draggedRef.current = false;
    drag.current = null;
  };
  // Open on click (most reliable for taps across mouse + touch); skip if dragging.
  const onBubbleClick = () => {
    if (draggedRef.current) {
      draggedRef.current = false;
      return;
    }
    setOpen(true);
  };

  const send = (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: q }, { role: "assistant", content: "" }]);
    setBusy(true);
    runCommand("chat", chatCommand(q), {
      onText: (full) =>
        setMessages((m) => {
          const c = [...m];
          c[c.length - 1] = { role: "assistant", content: full };
          return c;
        }),
      onDone: () => setBusy(false),
      onError: (msg) => {
        setMessages((m) => {
          const c = [...m];
          c[c.length - 1] = { role: "assistant", content: `[lỗi] ${msg}` };
          return c;
        });
        setBusy(false);
      },
    }, { provider: model });
  };

  if (!pos) return null; // wait for viewport (avoids hydration mismatch)

  // Panel placement: open up-left of the bubble, flip/clamp to stay on screen.
  const vw = typeof window !== "undefined" ? window.innerWidth : 400;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const panelW = Math.min(384, vw * 0.92);
  const panelH = Math.min(448, vh * 0.8);
  const panelLeft = clamp(pos.x + BUBBLE - panelW, 8, vw - panelW - 8);
  const panelTop =
    pos.y - panelH - 8 >= 8
      ? pos.y - panelH - 8
      : clamp(pos.y + BUBBLE + 8, 8, vh - panelH - 8);

  const hidden = onQuiz; // hide (with animation) on the quiz tab

  return (
    <>
      {/* Click-outside overlay (transparent) — closes the chat */}
      {open && !hidden && (
        <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
      )}

      {/* Chat panel */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ left: panelLeft, top: panelTop, width: panelW }}
        className={`fixed z-40 origin-bottom-right transition-all duration-300 ${
          open && !hidden
            ? "scale-100 opacity-100"
            : "scale-0 opacity-0 pointer-events-none"
        } ${hidden ? "translate-y-4" : ""}`}
      >
        <div
          className="flex flex-col reading-surface rounded-2xl shadow-card-deep overflow-hidden"
          style={{ height: panelH }}
        >
          <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-border bg-surface-2">
            <div className="flex items-center gap-1.5 font-semibold text-sm shrink-0">
              <Sparkles size={15} className="text-accent" /> Tra cứu
            </div>
            <div className="flex items-center gap-1.5">
              <ModelSelector value={model} onChange={setModel} />
              <button
                onClick={() => setOpen(false)}
                className="text-muted hover:text-white p-1 rounded-lg hover:bg-white/5"
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.length === 0 ? (
              <div className="text-sm text-muted">
                <p className="mb-3">
                  Hỏi nhanh nghĩa từ, ngữ pháp… Trả lời ngắn gọn để tiết kiệm token.
                </p>
                <div className="flex flex-col gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="text-left text-[13px] px-3 py-2 rounded-lg border border-border hover:border-accent/60 hover:bg-white/5 transition"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, i) =>
                m.role === "user" ? (
                  <div key={i} className="flex justify-end">
                    <div className="bg-accent text-white rounded-2xl rounded-br-sm px-3 py-2 text-sm max-w-[85%]">
                      {m.content}
                    </div>
                  </div>
                ) : (
                  <div key={i} className="flex justify-start">
                    <div className="bg-surface-2 border border-border rounded-2xl rounded-bl-sm px-3 py-2 text-sm max-w-[90%] prose-claude">
                      {m.content ? <Markdown>{m.content}</Markdown> : <Spinner />}
                    </div>
                  </div>
                )
              )
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 p-2.5 border-t border-border"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Hỏi nhanh…"
              className="flex-1 bg-surface-2 border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-accent"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="bg-accent text-white rounded-xl p-2.5 disabled:opacity-40 hover:brightness-110 transition"
              aria-label="Gửi"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>

      {/* Draggable bubble FAB */}
      <button
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onClick={onBubbleClick}
        style={{ left: pos.x, top: pos.y, width: BUBBLE, height: BUBBLE, touchAction: "none" }}
        className={`fixed z-40 rounded-full bg-gradient-to-br from-accent to-accent-soft text-white grid place-items-center shadow-lg shadow-accent/30 transition-[opacity,transform] duration-300 hover:brightness-110 active:cursor-grabbing cursor-grab ${
          open || hidden
            ? "scale-0 opacity-0 pointer-events-none"
            : "scale-100 opacity-100"
        }`}
        aria-label="Mở tra cứu nhanh (kéo để di chuyển)"
      >
        <MessageCircle size={24} />
      </button>
    </>
  );
}
