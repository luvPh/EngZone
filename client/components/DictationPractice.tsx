"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, X, ArrowRight, Volume2, RotateCcw, Sparkles, Headphones } from "lucide-react";
import { Button, TextInput } from "@/components/ui";
import { useFeatureState } from "@/lib/store";
import { speak as ttsSpeak } from "@/lib/tts";
import { studyBatch, recordResult, type PoolWord } from "@/lib/vocabPool";

const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

interface DState {
  started: boolean;
  batch: PoolWord[];
  idx: number;
  input: string;
  result: null | boolean;
  correctCount: number;
  done: boolean;
}
const INIT: DState = {
  started: false,
  batch: [],
  idx: 0,
  input: "",
  result: null,
  correctCount: 0,
  done: false,
};

const speak = (word: string) => ttsSpeak(word, 0.9);

// Listen to a word, type its spelling. Grades as the "fill" mode so it also
// drives spaced-repetition scheduling. The run lives in the app store so
// switching tabs keeps it — only "Lượt mới" or a page reload draws a new batch.
export default function DictationPractice() {
  const [st, setSt] = useFeatureState<DState>("flash:dict", INIT);
  const patch = (p: Partial<DState>) => setSt((prev) => ({ ...prev, ...p }));
  const { batch, idx } = st;

  // Draw the first batch once (localStorage is only readable after mount).
  useEffect(() => {
    if (!st.started) setSt({ ...INIT, started: true, batch: studyBatch(10) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const w = batch[idx];

  // Auto-play the word each time a new one appears.
  const played = useRef(-1);
  useEffect(() => {
    if (w && played.current !== idx) {
      played.current = idx;
      speak(w.word);
    }
  }, [idx, w]);

  if (!st.started) return null;

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
    if (st.result !== null || !st.input.trim()) return;
    const ok = normalize(st.input) === normalize(w.word);
    setSt((prev) => ({ ...prev, result: ok, correctCount: prev.correctCount + (ok ? 1 : 0) }));
    recordResult(w.word, "fill", ok);
  };

  const next = () => {
    if (isLast) {
      patch({ done: true });
      return;
    }
    patch({ idx: idx + 1, input: "", result: null });
  };

  const restart = () => {
    setSt({ ...INIT, started: true, batch: studyBatch(10) });
    played.current = -1;
  };

  if (st.done) {
    return (
      <div className="glass rounded-2xl p-6 text-center animate-fade-up">
        <div className="text-3xl font-extrabold text-fg">{st.correctCount}/{total}</div>
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
        <span>Đúng {st.correctCount}</span>
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
          value={st.input}
          onChange={(e) => patch({ input: e.target.value })}
          onKeyDown={(e) => e.key === "Enter" && (st.result === null ? submit() : next())}
          placeholder="Gõ từ bạn nghe được…"
          disabled={st.result !== null}
          autoFocus
        />
        {st.result === null && (
          <Button onClick={submit} disabled={!st.input.trim()} className="mt-3">
            Kiểm tra
          </Button>
        )}

        {st.result !== null && (
          <div className="mt-4 border-t border-white/10 pt-3">
            <div className={`flex items-center gap-1.5 font-semibold ${st.result ? "text-ok" : "text-bad"}`}>
              {st.result ? <Check size={16} /> : <X size={16} />}
              {st.result ? "Chính xác!" : "Chưa đúng"}
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
