"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, X, ArrowRight, Volume2, RotateCcw, Sparkles, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui";
import { studyBatch, recordResult, type PoolWord } from "@/lib/vocabPool";

const normalize = (s: string) => s.trim().toLowerCase().replace(/[^a-z\s]/gi, "").replace(/\s+/g, " ");

function speak(word: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const u = new SpeechSynthesisUtterance(word);
  u.lang = "en-US";
  u.rate = 0.9;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSR(): any {
  if (typeof window === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

type Status = "idle" | "listening";

// Read the word aloud; browser speech-recognition transcribes it and we grade
// whether the target word was said. Recorded as a "speak" attempt (drives SRS).
export default function SpeakingPractice() {
  const SR = getSR();
  const [batch, setBatch] = useState<PoolWord[]>(() => studyBatch(10));
  const [idx, setIdx] = useState(0);
  const [status, setStatus] = useState<Status>("idle");
  const [heard, setHeard] = useState("");
  const [result, setResult] = useState<null | boolean>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recRef = useRef<any>(null);

  const w = batch[idx];

  useEffect(() => {
    return () => {
      try {
        recRef.current?.abort?.();
      } catch {
        /* ignore */
      }
    };
  }, []);

  if (!SR) {
    return (
      <div className="reading-surface rounded-2xl p-8 text-center">
        <MicOff size={30} className="mx-auto text-muted mb-3" />
        <p className="text-fg font-medium">Trình duyệt chưa hỗ trợ nhận diện giọng nói</p>
        <p className="text-muted text-sm mt-1">
          Hãy dùng Chrome hoặc Edge (máy tính / Android) để luyện nói.
        </p>
      </div>
    );
  }

  if (batch.length === 0) {
    return (
      <div className="reading-surface rounded-2xl p-8 text-center">
        <Mic size={30} className="mx-auto text-accent mb-3" />
        <p className="text-muted font-medium">Kho từ đang trống</p>
        <p className="text-muted text-sm mt-1 mb-4">
          Tạo một bài ở “Vocab with Essay” để có từ luyện nói.
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

  const grade = (transcript: string) => {
    const said = normalize(transcript);
    const target = normalize(w.word);
    const ok = said === target || said.split(" ").includes(target);
    setHeard(transcript);
    setResult(ok);
    if (ok) setCorrectCount((c) => c + 1);
    recordResult(w.word, "speak", ok);
  };

  const listen = () => {
    if (status === "listening" || result !== null) return;
    setErr("");
    setHeard("");
    const rec = new SR();
    recRef.current = rec;
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 5;
    rec.onresult = (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => {
      const alts = Array.from(e.results[0] as ArrayLike<{ transcript: string }>).map((a) => a.transcript);
      // Prefer an alternative that matches the target word.
      const target = normalize(w.word);
      const best = alts.find((a) => normalize(a).split(" ").includes(target)) ?? alts[0] ?? "";
      grade(best);
    };
    rec.onerror = (e: { error?: string }) => {
      setErr(e?.error === "not-allowed" ? "Cần cấp quyền micro để luyện nói." : "Không nghe được, thử lại nhé.");
      setStatus("idle");
    };
    rec.onend = () => setStatus("idle");
    setStatus("listening");
    try {
      rec.start();
    } catch {
      setStatus("idle");
    }
  };

  const next = () => {
    if (isLast) {
      setDone(true);
      return;
    }
    setIdx((i) => i + 1);
    setHeard("");
    setResult(null);
    setErr("");
  };

  const restart = () => {
    setBatch(studyBatch(10));
    setIdx(0);
    setStatus("idle");
    setHeard("");
    setResult(null);
    setCorrectCount(0);
    setDone(false);
    setErr("");
  };

  if (done) {
    return (
      <div className="glass rounded-2xl p-6 text-center animate-fade-up">
        <div className="text-3xl font-extrabold text-fg">{correctCount}/{total}</div>
        <p className="text-muted text-sm mt-1 mb-5">từ phát âm đúng lượt này</p>
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

      <div className="reading-surface rounded-2xl p-5 text-center">
        <p className="text-sm text-muted mb-1">Đọc to từ sau:</p>
        <div className="flex items-center justify-center gap-2">
          <span className="text-3xl font-bold text-fg">{w.word}</span>
          <button
            type="button"
            aria-label="Nghe mẫu"
            onClick={() => speak(w.word)}
            className="text-muted hover:text-accent"
          >
            <Volume2 size={20} />
          </button>
        </div>
        {w.ipa && <div className="text-accent-soft text-sm mt-0.5">{w.ipa}</div>}
        <div className="text-muted text-sm mt-1">{w.meaning}</div>

        {result === null ? (
          <button
            type="button"
            onClick={listen}
            disabled={status === "listening"}
            className={`mt-5 mx-auto flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold transition ${
              status === "listening"
                ? "bg-bad/20 text-bad animate-pulse"
                : "bg-accent text-white hover:opacity-90"
            }`}
          >
            <Mic size={18} /> {status === "listening" ? "Đang nghe…" : "Bấm rồi nói"}
          </button>
        ) : (
          <div className="mt-4 border-t border-white/10 pt-3 text-left">
            <div className={`flex items-center gap-1.5 font-semibold ${result ? "text-ok" : "text-bad"}`}>
              {result ? <Check size={16} /> : <X size={16} />}
              {result ? "Phát âm khớp!" : "Chưa khớp"}
            </div>
            <div className="text-sm text-muted mt-1">
              Máy nghe được: <span className="text-fg font-medium">{heard || "(không rõ)"}</span>
            </div>
            <Button onClick={next} className="mt-3">
              {isLast ? "Xem kết quả" : "Từ tiếp"} <ArrowRight size={16} />
            </Button>
          </div>
        )}

        {err && <p className="text-bad text-sm mt-3">{err}</p>}
      </div>
    </div>
  );
}
