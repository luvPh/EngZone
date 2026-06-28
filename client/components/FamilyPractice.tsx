"use client";

import { useMemo, useState } from "react";
import { Check, X, ArrowRight } from "lucide-react";
import { Button, TextInput } from "@/components/ui";
import { recordFamilyResult, FAMILY_MASTER_AT, type FamilyEntry } from "@/lib/wordFamily";

const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
const hint = (w: string) => w.split("").map((c) => (c === " " ? " " : "‧")).join(" ");

function buildQ(fam: FamilyEntry) {
  const ms = [...fam.members];
  for (let i = ms.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ms[i], ms[j]] = [ms[j], ms[i]];
  }
  return { prompt: ms[0], target: ms[1] ?? ms[0] };
}

export default function FamilyPractice({
  families,
  onDone,
}: {
  families: FamilyEntry[];
  onDone: (correct: number) => void;
}) {
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [result, setResult] = useState<null | boolean>(null);
  const [correctCount, setCorrectCount] = useState(0);

  const fam = families[idx];
  const q = useMemo(() => buildQ(fam), [idx]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!fam) return null;

  const total = families.length;
  const isLast = idx === total - 1;

  const submit = () => {
    if (result !== null || !input.trim()) return;
    const ok = normalize(input) === normalize(q.target.word);
    setResult(ok);
    if (ok) setCorrectCount((c) => c + 1);
    recordFamilyResult(fam.root, ok);
  };
  const next = () => {
    if (isLast) return onDone(correctCount);
    setIdx((i) => i + 1);
    setInput("");
    setResult(null);
  };

  return (
    <div className="animate-fade-up">
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
        <p className="text-sm text-muted mb-1">
          Từ họ <span className="text-accent-soft font-semibold">{fam.root}</span> — đổi dạng:
        </p>
        <div className="text-xl text-fg">
          <span className="font-bold">{q.prompt.word}</span>
          {q.prompt.pos && <span className="text-sm text-muted"> ({q.prompt.pos})</span>}
          {q.prompt.meaning && <span className="text-muted"> · {q.prompt.meaning}</span>}
        </div>
        <p className="mt-3 text-sm">
          Điền dạng <span className="font-semibold text-accent">{q.target.pos || "khác"}</span>
          {q.target.meaning && <span className="text-muted"> (nghĩa: {q.target.meaning})</span>}:
        </p>
        <div className="font-mono text-lg text-accent-soft tracking-wider mt-1 mb-2">
          {hint(q.target.word)}
        </div>

        <TextInput
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (result === null ? submit() : next())}
          placeholder="Gõ dạng từ…"
          disabled={result !== null}
          autoFocus
        />
        {result === null && (
          <Button onClick={submit} disabled={!input.trim()} className="mt-3">
            Kiểm tra
          </Button>
        )}

        {result !== null && (
          <div className="mt-4 border-t border-white/10 pt-3">
            <div className={`flex items-center gap-1.5 font-semibold ${result ? "text-ok" : "text-bad"}`}>
              {result ? <Check size={16} /> : <X size={16} />}
              {result ? "Chính xác!" : "Chưa đúng"}
            </div>
            <div className="text-sm text-muted mt-1">
              <span className="font-semibold text-fg">{q.target.word}</span>
              {q.target.pos && <span className="text-xs text-muted"> ({q.target.pos})</span>}
              {q.target.meaning && <span> · {q.target.meaning}</span>}
            </div>
            <div className="text-xs text-muted mt-1">
              Họ từ đúng {Math.min(fam.correct + (result ? 1 : 0), FAMILY_MASTER_AT)}/{FAMILY_MASTER_AT}
              {result && fam.correct + 1 >= FAMILY_MASTER_AT ? " · đã thuộc 🎉" : ""}
            </div>
            <Button onClick={next} className="mt-3">
              {isLast ? "Xem kết quả" : "Câu tiếp"} <ArrowRight size={16} />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
