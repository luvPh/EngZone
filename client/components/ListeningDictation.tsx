"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, Gauge, ArrowRight, RotateCcw, Check } from "lucide-react";
import { Button, TextInput } from "@/components/ui";
import { normWord, splitSentences, scoreSentence } from "@/lib/textDiff";

function speak(text: string, rate: number) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = rate;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

interface Graded {
  matched: boolean[];
  score: number;
}

// Listen to each sentence of the essay and type it back. Graded word-by-word
// against the original (no AI needed — TTS + local diff).
export default function ListeningDictation({ text }: { text: string }) {
  const sentences = useRef(splitSentences(text)).current;
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [graded, setGraded] = useState<Graded | null>(null);
  const [scores, setScores] = useState<number[]>([]);
  const [slow, setSlow] = useState(false);
  const [done, setDone] = useState(false);

  const sentence = sentences[idx];
  const rate = slow ? 0.7 : 1;

  // Auto-play each new sentence.
  const played = useRef(-1);
  useEffect(() => {
    if (sentence && played.current !== idx) {
      played.current = idx;
      speak(sentence, slow ? 0.7 : 1);
    }
  }, [idx, sentence, slow]);

  useEffect(() => {
    return () => window.speechSynthesis?.cancel();
  }, []);

  if (sentences.length === 0) {
    return <p className="text-muted text-sm">Không tách được câu để nghe chép.</p>;
  }

  const total = sentences.length;
  const isLast = idx === total - 1;
  const displayTokens = sentence.match(/\S+/g) ?? [];

  const submit = () => {
    if (graded || !input.trim()) return;
    const { matched, score } = scoreSentence(sentence, input);
    setGraded({ matched, score });
    setScores((s) => [...s, score]);
  };

  const next = () => {
    if (isLast) {
      setDone(true);
      return;
    }
    setIdx((i) => i + 1);
    setInput("");
    setGraded(null);
  };

  const restart = () => {
    setIdx(0);
    setInput("");
    setGraded(null);
    setScores([]);
    setDone(false);
    played.current = -1;
  };

  if (done) {
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    return (
      <div className="glass rounded-2xl p-6 text-center animate-fade-up">
        <div className="text-4xl font-extrabold text-accent">{avg}%</div>
        <p className="text-muted text-sm mt-1 mb-5">độ chính xác khi nghe chép</p>
        <Button onClick={restart}>
          <RotateCcw size={16} /> Nghe lại từ đầu
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <div className="flex items-center justify-between text-xs text-muted mb-3">
        <span>Câu {idx + 1} / {total}</span>
        {graded && (
          <span className={graded.score >= 80 ? "text-ok" : graded.score >= 50 ? "text-accent-soft" : "text-bad"}>
            Đúng {graded.score}%
          </span>
        )}
      </div>
      <div className="h-1.5 rounded-full bg-accent-weak overflow-hidden mb-5">
        <div
          className="h-full bg-gradient-to-r from-accent to-[#38bdf8] transition-[width] duration-300"
          style={{ width: `${(idx / total) * 100}%` }}
        />
      </div>

      <div className="reading-surface rounded-2xl p-5">
        <p className="text-sm text-muted mb-3">Nghe rồi gõ lại câu bạn nghe được:</p>

        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => speak(sentence, rate)}
            className="flex-1 flex items-center justify-center gap-2 py-5 rounded-2xl bg-accent-weak text-accent hover:brightness-105 transition"
          >
            <Volume2 size={24} />
            <span className="font-semibold">Nghe lại</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setSlow((s) => !s);
              speak(sentence, slow ? 1 : 0.7);
            }}
            aria-pressed={slow}
            className={`px-4 rounded-2xl border transition text-sm font-medium ${
              slow ? "bg-accent text-white border-transparent" : "glass-input text-muted"
            }`}
          >
            <Gauge size={18} className="mx-auto" />
            {slow ? "Chậm" : "Bình thường"}
          </button>
        </div>

        <TextInput
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (!graded ? submit() : next())}
          placeholder="Gõ câu bạn nghe được…"
          disabled={!!graded}
          autoFocus
        />

        {!graded ? (
          <Button onClick={submit} disabled={!input.trim()} className="mt-3">
            Kiểm tra
          </Button>
        ) : (
          <div className="mt-4 border-t border-white/10 pt-3">
            <div className="text-xs text-muted mb-1">Câu gốc:</div>
            <p className="text-lg leading-[1.9]">
              {displayTokens.map((tok, k) => {
                let cls = "text-fg";
                if (normWord(tok)) {
                  cls = graded.matched[k]
                    ? "text-ok"
                    : "text-bad underline decoration-wavy decoration-bad/60";
                }
                return (
                  <span key={k} className={cls}>
                    {tok}{" "}
                  </span>
                );
              })}
            </p>
            <div className="flex gap-2 mt-3">
              <Button variant="ghost" onClick={() => { setGraded(null); setInput(""); }}>
                <RotateCcw size={15} /> Thử lại câu
              </Button>
              <Button onClick={next}>
                {isLast ? (
                  <>
                    <Check size={16} /> Xong
                  </>
                ) : (
                  <>
                    Câu tiếp <ArrowRight size={16} />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
