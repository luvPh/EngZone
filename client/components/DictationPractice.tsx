"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, X, ArrowRight, Volume2, RotateCcw, Sparkles, Headphones } from "lucide-react";
import { Button, TextInput } from "@/components/ui";
import { studyBatch, recordResult, type PoolWord } from "@/lib/vocabPool";

const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

function speak(word: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const u = new SpeechSynthesisUtterance(word);
  u.lang = "en-US";
  u.rate = 0.9;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

// Listen to a word, type its spelling. Grades as the "fill" mode so it also
// drives spaced-repetition scheduling.
export default function DictationPractice() {
  const [batch, setBatch] = useState<PoolWord[]>(() => studyBatch(10));
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [result, setResult] = useState<null | boolean>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [done, setDone] = useState(false);

  const w = batch[idx];

  // Auto-play the word each time a new one appears.
  const played = useRef(-1);
  useEffect(() => {
    if (w && played.current !== idx) {
      played.current = idx;
      speak(w.word);
    }
  }, [idx, w]);

  if (batch.length === 0) {
    return (
      <div className="reading-surface rounded-2xl p-8 text-center">
        <Headphones size={30} className="mx-auto text-accent mb-3" />
        <p className="text-muted font-medium">Kho từ đang trống</p>
        <p className="text-muted text-sm mt-1 mb-4">
          Tạo một bài ở “Vocab with Essay” để có từ nghe chép.
        </p>
        <Link href="/essay">
          <Button>
            <Sparkles size={18} /> Tạo Vocab with Essay
          </Button>
        </Link>
      </div>
    );
  }

  const total = batch.length;
  const isLast = idx === total - 1;

  const submit = () => {
    if (result !== null || !input.trim()) return;
    const ok = normalize(input) === normalize(w.word);
    setResult(ok);
    if (ok) setCorrectCount((c) => c + 1);
    recordResult(w.word, "fill", ok);
  };

  const next = () => {
    if (isLast) {
      setDone(true);
      return;
    }
    setIdx((i) => i + 1);
    setInput("");
    setResult(null);
  };

  const restart = () => {
    setBatch(studyBatch(10));
    setIdx(0);
    setInput("");
    setResult(null);
    setCorrectCount(0);
    setDone(false);
    played.current = -1;
  };

  if (done) {
    return (
      <div className="glass rounded-2xl p-6 text-center animate-fade-up">
        <div className="text-3xl font-extrabold text-fg">{correctCount}/{total}</div>
        <p className="text-muted text-sm mt-1 mb-5">từ nghe chép đúng lượt này</p>
        <Button onClick={restart}>
          <RotateCcw size={16} /> Lượt mới
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <div className="flex items-center justify-between text-xs text-muted mb-3">
        <span>Từ {idx + 1} / {total}</span>
        <span>Đúng {correctCount}</span>
      </div>
      <div className="h-1.5 rounded-full bg-accent-weak overflow-hidden mb-5">
        <div
          className="h-full bg-gradient-to-r from-accent to-[#38bdf8] transition-[width] duration-300"
          style={{ width: `${(idx / total) * 100}%` }}
        />
      </div>

      <div className="reading-surface rounded-2xl p-5">
        <p className="text-sm text-muted mb-3">Nghe và gõ lại từ bạn nghe được:</p>

        <button
          type="button"
          onClick={() => speak(w.word)}
          className="w-full flex items-center justify-center gap-2 py-6 rounded-2xl bg-accent-weak text-accent hover:brightness-105 transition mb-4"
        >
          <Volume2 size={28} />
          <span className="font-semibold">Nghe lại</span>
        </button>

        <TextInput
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (result === null ? submit() : next())}
          placeholder="Gõ từ bạn nghe được…"
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
              <span className="font-semibold text-fg">{w.word}</span>
              {w.ipa && <span className="text-accent-soft"> {w.ipa}</span>} · {w.meaning}
            </div>
            {w.example && <p className="text-sm text-muted italic mt-1">{w.example}</p>}
            <Button onClick={next} className="mt-3">
              {isLast ? "Xem kết quả" : "Từ tiếp"} <ArrowRight size={16} />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
