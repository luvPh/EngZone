"use client";

import { useMemo, useState } from "react";
import { Check, X, ArrowRight } from "lucide-react";
import { Button, TextInput } from "@/components/ui";
import { distractors, recordResult, MASTER_AT, ALL_MODES, type PoolWord } from "@/lib/vocabPool";

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

export default function VocabPractice({
  words,
  onDone,
}: {
  words: PoolWord[];
  onDone: (correct: number) => void;
}) {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null); // chosen word (mcq) or "submitted" (fill)
  const [input, setInput] = useState("");
  const [result, setResult] = useState<null | boolean>(null);
  const [correctCount, setCorrectCount] = useState(0);

  const w = words[idx];
  const q = useMemo(() => buildQuestion(w), [idx]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!w) return null;

  const total = words.length;
  const isLast = idx === total - 1;

  const grade = (ok: boolean) => {
    if (result !== null) return;
    setResult(ok);
    if (ok) setCorrectCount((c) => c + 1);
    recordResult(w.word, q.mode, ok);
  };

  const onMcq = (chosen: PoolWord) => {
    if (result !== null) return;
    setPicked(chosen.word);
    grade(normalize(chosen.word) === normalize(w.word));
  };
  const onFill = () => {
    if (result !== null || !input.trim()) return;
    setPicked("submitted");
    grade(normalize(input) === normalize(w.word));
  };

  const next = () => {
    if (isLast) {
      onDone(correctCount);
      return;
    }
    setIdx((i) => i + 1);
    setPicked(null);
    setInput("");
    setResult(null);
  };

  return (
    <div className="animate-fade-up">
      {/* progress */}
      <div className="flex items-center justify-between text-xs text-muted mb-3">
        <span>Câu {idx + 1} / {total}</span>
        <span>Đúng {correctCount}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden mb-5">
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

        <div className="text-2xl font-bold text-white mb-1">
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
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (result === null ? onFill() : next())}
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
              if (result !== null && isCorrect) cls = "bg-ok/20 border border-ok/60 text-white";
              else if (result !== null && isPicked) cls = "bg-bad/20 border border-bad/60 text-white";
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
            <div className="text-sm text-slate-300 mt-1">
              <span className="font-semibold text-white">{w.word}</span>
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
              return (
                <div className="text-xs text-muted mt-1">
                  Đúng {c}/{MASTER_AT} · dạng {nModes}/{ALL_MODES.length}
                  {done ? " · đã thuộc 🎉" : ""}
                </div>
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
