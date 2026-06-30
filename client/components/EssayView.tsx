"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2, Plus, Check, Volume2, X } from "lucide-react";
import { runCommand } from "@/lib/stream";
import { wordLookupCommand } from "@/lib/prompts";
import { extractJson } from "@/lib/extractJson";
import { addVocab } from "@/lib/vocabPool";
import type { Essay, VocabItem } from "@/lib/types";

type LookupState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ok"; data: VocabItem };

// One word token (letters + internal ' or -) we render as clickable.
const WORD_RE = /[A-Za-z]+(?:['’-][A-Za-z]+)*/g;

function speak(word: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const u = new SpeechSynthesisUtterance(word);
  u.lang = "en-US";
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

export default function EssayView({
  data,
  provider,
  topic,
}: {
  data: Essay;
  provider?: string;
  topic?: string;
}) {
  // Cache lookups by lowercased word so re-clicking the same word is instant.
  const [cache, setCache] = useState<Record<string, LookupState>>({});
  const [added, setAdded] = useState<Record<string, boolean>>({});
  // The currently open popover: which word + the DOM node it's anchored to (so it
  // can follow that word on scroll).
  const [open, setOpen] = useState<{ word: string; anchor: HTMLElement } | null>(null);
  const close = useCallback(() => setOpen(null), []);

  const lookup = useCallback(
    (word: string, sentence: string) => {
      const key = word.toLowerCase();
      setCache((c) => {
        if (c[key]?.status === "ok" || c[key]?.status === "loading") return c;
        runCommand(
          `essay-lookup`,
          wordLookupCommand(word, sentence),
          {
            onText: () => {},
            onDone: (full) => {
              const obj = extractJson<VocabItem>(full);
              setCache((cc) => ({
                ...cc,
                [key]: obj?.meaning
                  ? { status: "ok", data: { ...obj, word: obj.word || word } }
                  : { status: "error" },
              }));
            },
            onError: () => setCache((cc) => ({ ...cc, [key]: { status: "error" } })),
          },
          { provider, maxTokens: 300 }
        );
        return { ...c, [key]: { status: "loading" } };
      });
    },
    [provider]
  );

  const onWordClick = (e: React.MouseEvent, word: string, sentence: string) => {
    setOpen({ word, anchor: e.currentTarget as HTMLElement });
    lookup(word, sentence);
  };

  const addToPool = (word: string, item: VocabItem) => {
    addVocab([item], topic ? `essay: ${topic}` : "essay");
    setAdded((a) => ({ ...a, [word.toLowerCase()]: true }));
  };

  return (
    <div className="mt-5 space-y-5 animate-fade-up">
      <div className="reading-surface rounded-2xl p-5">
        <div className="flex items-baseline justify-between mb-2">
          <h2 className="text-lg font-bold text-fg">Essay</h2>
          <span className="text-xs text-muted">Bấm vào từ bất kỳ để tra nghĩa</span>
        </div>
        <ClickableEssay text={data.essay} onWordClick={onWordClick} />
      </div>

      {data.vocab?.length > 0 && (
        <div className="reading-surface rounded-2xl p-5">
          <h2 className="text-lg font-bold text-fg mb-3">
            Vocabulary{" "}
            <span className="text-muted text-sm font-normal">
              ({data.vocab.length} từ)
            </span>
          </h2>
          <ul className="divide-y divide-border">
            {data.vocab.map((v, i) => (
              <li key={i} className="py-2.5">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-semibold text-fg">{v.word}</span>
                  {v.pos && <span className="text-xs text-muted">({v.pos})</span>}
                  {v.ipa && <span className="text-xs text-accent-soft">{v.ipa}</span>}
                  <span className="text-muted text-[15px]">· {v.meaning}</span>
                </div>
                {v.example && (
                  <p className="text-sm text-muted italic mt-0.5">{v.example}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {open && (
        <WordPopover
          key={open.word + open.anchor.offsetTop}
          word={open.word}
          anchor={open.anchor}
          state={cache[open.word.toLowerCase()]}
          added={!!added[open.word.toLowerCase()]}
          onClose={close}
          onAdd={addToPool}
        />
      )}
    </div>
  );
}

// Renders essay prose: each English word becomes a clickable, hover-highlighted
// span; whitespace/punctuation/newlines are preserved verbatim.
function ClickableEssay({
  text,
  onWordClick,
}: {
  text: string;
  onWordClick: (e: React.MouseEvent, word: string, sentence: string) => void;
}) {
  return (
    <p className="text-fg whitespace-pre-wrap leading-[1.9]">
      {tokenize(text).map((tok, i) =>
        tok.word ? (
          <span
            key={i}
            role="button"
            tabIndex={0}
            onClick={(e) => onWordClick(e, tok.text, tok.sentence)}
            className="cursor-pointer rounded px-0.5 -mx-0.5 transition-colors hover:bg-accent-weak hover:text-accent"
          >
            {tok.text}
          </span>
        ) : (
          <span key={i}>{tok.text}</span>
        )
      )}
    </p>
  );
}

interface Tok {
  text: string;
  word: boolean;
  sentence: string;
}

// Split into word / non-word tokens, tagging each word with the sentence it sits
// in (so the lookup gets context). Sentence = run up to . ! ? or newline.
function tokenize(text: string): Tok[] {
  const sentences = text.split(/(?<=[.!?])\s+|\n+/);
  const out: Tok[] = [];
  let cursor = 0;
  for (const sentence of sentences) {
    const start = text.indexOf(sentence, cursor);
    if (start < 0) continue;
    const segEnd = start + sentence.length;
    // Emit any gap (whitespace/newlines) between previous segment and this one.
    if (start > cursor) out.push({ text: text.slice(cursor, start), word: false, sentence: "" });
    let last = start;
    for (const m of sentence.matchAll(WORD_RE)) {
      const wStart = start + m.index!;
      if (wStart > last) out.push({ text: text.slice(last, wStart), word: false, sentence: "" });
      out.push({ text: m[0], word: true, sentence: sentence.trim() });
      last = wStart + m[0].length;
    }
    if (last < segEnd) out.push({ text: text.slice(last, segEnd), word: false, sentence: "" });
    cursor = segEnd;
  }
  if (cursor < text.length) out.push({ text: text.slice(cursor), word: false, sentence: "" });
  return out;
}

const POPOVER_W = 260;
const FADE_DISTANCE = 110; // px the word may scroll before the popover fully fades

function place(anchor: HTMLElement): { left: number; top: number; opacity: number } {
  const r = anchor.getBoundingClientRect();
  const vw = typeof window !== "undefined" ? window.innerWidth : 9999;
  return { left: Math.max(8, Math.min(r.left, vw - POPOVER_W - 8)), top: r.bottom + 6, opacity: 1 };
}

function WordPopover({
  word,
  anchor,
  state,
  added,
  onClose,
  onAdd,
}: {
  word: string;
  anchor: HTMLElement;
  state: LookupState | undefined;
  added: boolean;
  onClose: () => void;
  onAdd: (word: string, item: VocabItem) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const top0 = useRef<number | null>(null); // word's viewport-top when opened
  const [box, setBox] = useState(() => place(anchor));

  useEffect(() => {
    let raf = 0;
    const update = () => {
      const r = anchor.getBoundingClientRect();
      if (top0.current === null) top0.current = r.top;
      const offscreen = r.bottom < 0 || r.top > window.innerHeight;
      const delta = Math.abs(r.top - top0.current);
      const opacity = offscreen ? 0 : Math.max(0, 1 - delta / FADE_DISTANCE);
      if (opacity <= 0.02) {
        onClose();
        return;
      }
      const left = Math.max(8, Math.min(r.left, window.innerWidth - POPOVER_W - 8));
      setBox({ left, top: r.bottom + 6, opacity });
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    // capture:true so it also fires for any nested scroll container.
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!ref.current?.contains(t) && !anchor.contains(t)) onClose();
    };
    document.addEventListener("mousedown", onDown);
    update();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
      document.removeEventListener("mousedown", onDown);
    };
  }, [anchor, onClose]);

  return (
    <>
      <div
        ref={ref}
        className="fixed z-50 glass rounded-2xl p-3.5 shadow-glow-accent"
        style={{
          left: box.left,
          top: box.top,
          width: POPOVER_W,
          opacity: box.opacity,
          transition: "opacity 90ms linear",
        }}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-fg">{word}</span>
          <button
            type="button"
            aria-label="Phát âm"
            onClick={() => speak(word)}
            className="text-muted hover:text-accent"
          >
            <Volume2 size={15} />
          </button>
          <button
            type="button"
            aria-label="Đóng"
            onClick={onClose}
            className="ml-auto text-muted hover:text-fg"
          >
            <X size={15} />
          </button>
        </div>

        {(!state || state.status === "loading") && (
          <div className="flex items-center gap-2 text-sm text-muted py-1.5">
            <Loader2 size={15} className="animate-spin" /> Đang tra…
          </div>
        )}

        {state?.status === "error" && (
          <p className="text-sm text-bad py-1">Không tra được, thử lại nhé.</p>
        )}

        {state?.status === "ok" && (
          <>
            <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
              {state.data.pos && <span className="text-xs text-muted">({state.data.pos})</span>}
              {state.data.ipa && (
                <span className="text-xs text-accent-soft">{state.data.ipa}</span>
              )}
            </div>
            <p className="text-fg text-[15px] mt-0.5">{state.data.meaning}</p>
            {state.data.example && (
              <p className="text-sm text-muted italic mt-1">{state.data.example}</p>
            )}
            <button
              type="button"
              disabled={added}
              onClick={() => onAdd(word, { ...state.data, word })}
              className={`mt-2.5 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition ${
                added
                  ? "bg-ok/15 text-ok cursor-default"
                  : "bg-accent text-white hover:opacity-90"
              }`}
            >
              {added ? (
                <>
                  <Check size={15} /> Đã thêm vào kho từ
                </>
              ) : (
                <>
                  <Plus size={15} /> Thêm vào kho từ
                </>
              )}
            </button>
          </>
        )}
      </div>
    </>
  );
}
