"use client";

import { useEffect } from "react";
import { Check, X, ArrowRight } from "lucide-react";
import { Button, TextInput } from "@/components/ui";
import { useFeatureState } from "@/lib/store";
import { distractors, recordResult, nextIntervalDays, MASTER_AT, ALL_MODES, type PoolWord } from "@/lib/vocabPool";

type Mode = "mcq-word" | "mcq-meaning" | "fill";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// "resilient" → "‧ ‧ ‧ ‧ ‧ ‧ ‧ ‧ ‧" — chỉ gợi ý SỐ KÝ TỰ, không lộ chữ cái đầu.
function charHint(word: string): string {
  return word
    .split("")
    .map((ch) => (ch === " " ? " " : "‧"))
    .join(" ");
}

const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

interface Question {
  mode: Mode;
  options: PoolWord[]; // for mcq (incl. the correct word), shuffled
}

function buildQuestion(w: PoolWord): Question {
  const others = distractors(w.word, 3);
  // Need ≥1 distractor for a meaningful multiple choice; otherwise fall back to fill.
  const canMcq = others.length >= 1;
  const roll = Math.random();
  const mode: Mode = !canMcq ? "fill" : roll < 0.34 ? "mcq-word" : roll < 0.67 ? "mcq-meaning" : "fill";
  return { mode, options: mode.startsWith("mcq") ? shuffle([w, ...others]) : [] };
}

interface VState {
  sig: string; // which batch this run belongs to
  idx: number;
  picked: string | null; // chosen word (mcq) or "submitted" (fill)
  input: string;
  result: null | boolean;
  correctCount: number;
  q: Question | null;
}
const INIT: VState = { sig: "", idx: 0, picked: null, input: "", result: null, correctCount: 0, q: null };

// The run lives in the app store so switching tabs keeps the current question,
// answer and score — it only restarts on a new batch or a full page reload.
export default function VocabPractice({
  words,
  onDone,
}: {
  words: PoolWord[];
  onDone: (correct: number) => void;
}) {
  const sig = words.map((x) => x.word).join("|");
  const [st, setSt] = useFeatureState<VState>("flash:vocabq", INIT);
  const patch = (p: Partial<VState>) => setSt((prev) => ({ ...prev, ...p }));

  // New batch → fresh run (and build its first question once).
  useEffect(() => {
    if (st.sig !== sig && words.length) {
      setSt({ ...INIT, sig, q: buildQuestion(words[0]) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);

  const idx = Math.min(st.idx, Math.max(0, words.length - 1));
  const w = words[idx];
  const q = st.q;
  const { result, input, picked, correctCount } = st;

  const total = words.length;
  const isLast = idx === total - 1;

  const grade = (ok: boolean) => {
    if (result !== null || !q) return;
    setSt((prev) => ({
      ...prev,
      result: ok,
      correctCount: prev.correctCount + (ok ? 1 : 0),
    }));
    recordResult(w.word, q.mode, ok);
  };

  const onMcq = (chosen: PoolWord) => {
    if (result !== null) return;
    patch({ picked: chosen.word });
    grade(normalize(chosen.word) === normalize(w.word));
  };
  const onFill = () => {
    if (result !== null || !input.trim()) return;
    patch({ picked: "submitted" });
    grade(normalize(input) === normalize(w.word));
  };

  const next = () => {
    if (isLast) {
      onDone(correctCount);
      return;
    }
    patch({ idx: idx + 1, picked: null, input: "", result: null, q: buildQuestion(words[idx + 1]) });
  };

  // Enter: nộp câu trả lời (khi chưa nộp) → sau đó Enter lần nữa để sang câu tiếp.
  // Dùng listener toàn cục vì input bị disable sau khi nộp (không nhận keydown nữa).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      if (result !== null) {
        e.preventDefault();
        next();
      } else if (q?.mode === "fill" && input.trim()) {
        e.preventDefault();
        onFill();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, input, q?.mode, idx, correctCount]);

  if (!w || !q) return null;

  return (
    <div className="animate-fade-up">
      {/* progress */}
      <div className="flex items-center justify-between text-xs text-muted mb-3">
        <span>Câu {idx + 1} / {total}</span>
        <span>Đúng {correctCount}</span>
      </div>
      <div className="h-1.5 rounded-full bg-accent-weak overflow-hidden mb-5">
        <div
          className="h-full bg-gradient-to-r from-accent to-[#38bdf8] transition-[width] duration-300"
          style={{ width: `${(idx / total) * 100}%` }}
        />
      </div>

      <div className="reading-surface rounded-2xl p-5">
        {/* Prompt */}
        {q.mode === "mcq-word" && (
          <p className="text-sm text-muted mb-1">Từ này nghĩa là gì?</p>
        )}
        {q.mode === "mcq-meaning" && (
          <p className="text-sm text-muted mb-1">Chọn từ đúng với nghĩa:</p>
        )}
        {q.mode === "fill" && <p className="text-sm text-muted mb-1">Điền từ đúng:</p>}

        <div className="text-2xl font-bold text-fg mb-1">
          {q.mode === "mcq-word" ? w.word : q.mode === "mcq-meaning" ? w.meaning : w.meaning}
        </div>
        {q.mode === "mcq-word" && w.ipa && (
          <div className="text-sm text-accent-soft mb-1">{w.ipa}</div>
        )}
        {q.mode === "fill" && (
          <div className="font-mono text-lg text-accent-soft tracking-wider mt-1 mb-2">
            {charHint(w.word)}
          </div>
        )}

        {/* Answer area */}
        {q.mode === "fill" ? (
          <div className="mt-3 space-y-3">
            <TextInput
              value={input}
              onChange={(e) => patch({ input: e.target.value })}
              placeholder="Gõ từ tiếng Anh…"
              disabled={result !== null}
              autoFocus
            />
            {result === null ? (
              <Button onClick={onFill} disabled={!input.trim()}>Kiểm tra</Button>
            ) : null}
          </div>
        ) : (
          <div className="mt-4 grid sm:grid-cols-2 gap-2.5">
            {q.options.map((opt) => {
              const label = q.mode === "mcq-word" ? opt.meaning : opt.word;
              const isCorrect = normalize(opt.word) === normalize(w.word);
              const isPicked = picked === opt.word;
              let cls = "glass-input hover:border-accent/60";
              if (result !== null && isCorrect) cls = "bg-ok/20 border border-ok/60 text-fg";
              else if (result !== null && isPicked) cls = "bg-bad/20 border border-bad/60 text-fg";
              return (
                <button
                  key={opt.word}
                  type="button"
                  onClick={() => onMcq(opt)}
                  disabled={result !== null}
                  className={`text-left rounded-xl px-3.5 py-2.5 text-sm transition ${cls}`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {/* Feedback */}
        {result !== null && (
          <div className="mt-4 border-t border-white/10 pt-3">
            <div
              className={`flex items-center gap-1.5 font-semibold ${result ? "text-ok" : "text-bad"}`}
            >
              {result ? <Check size={16} /> : <X size={16} />}
              {result ? "Chính xác!" : "Chưa đúng"}
            </div>
            <div className="text-sm text-muted mt-1">
              <span className="font-semibold text-fg">{w.word}</span>
              {w.pos && <span className="text-xs text-muted"> ({w.pos})</span>}
              {w.ipa && <span className="text-accent-soft"> {w.ipa}</span>} · {w.meaning}
            </div>
            {w.example && <p className="text-sm text-muted italic mt-1">{w.example}</p>}
            {(() => {
              const c = Math.min(w.correct + (result ? 1 : 0), MASTER_AT);
              const modes = result
                ? Array.from(new Set([...(w.modes || []), q.mode]))
                : w.modes || [];
              const nModes = modes.filter((m) => ALL_MODES.includes(m)).length;
              const done = c >= MASTER_AT && nModes >= ALL_MODES.length;
              const iv = nextIntervalDays(w, !!result);
              return (
                <>
                  <div className="text-xs text-muted mt-1">
                    Đúng {c}/{MASTER_AT} · dạng {nModes}/{ALL_MODES.length}
                    {done ? " · đã thuộc 🎉" : ""}
                  </div>
                  {!done && (
                    <div className="text-xs text-accent-soft mt-0.5">
                      🔁 {result ? `Ôn lại sau ${iv} ngày` : "Ôn lại ngay lượt sau"}
                    </div>
                  )}
                </>
              );
            })()}
            <Button onClick={next} className="mt-3">
              {isLast ? "Xem kết quả" : "Câu tiếp"} <ArrowRight size={16} />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
