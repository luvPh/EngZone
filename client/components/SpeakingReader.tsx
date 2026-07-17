"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, Mic, MicOff, ArrowRight, RotateCcw, Check } from "lucide-react";
import { Button } from "@/components/ui";
import { useFeatureState } from "@/lib/store";
import { speak as ttsSpeak } from "@/lib/tts";
import { normWord, splitSentences, scoreSentence } from "@/lib/textDiff";

const speak = (text: string) => ttsSpeak(text, 0.92);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSR(): any {
  if (typeof window === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

interface Graded {
  matched: boolean[]; // per display token
  score: number; // 0..100 over real words
  heard: string;
}
interface SState {
  sig: string; // which passage this run belongs to
  idx: number;
  graded: Graded | null;
  scores: number[];
  done: boolean;
}
const INIT: SState = { sig: "", idx: 0, graded: null, scores: [], done: false };
const sigOf = (t: string) => `${t.length}|${t.slice(0, 40)}`;

// Read an essay aloud sentence-by-sentence; browser speech-recognition transcribes
// each read and we mark which words were said correctly (word-level, via LCS).
// Progress lives in the app store so switching tabs keeps the run — it resets on
// a new essay, an explicit restart, or a full page reload.
export default function SpeakingReader({ text }: { text: string }) {
  const SR = getSR();
  const sentencesRef = useRef(splitSentences(text));
  sentencesRef.current = splitSentences(text);
  const sentences = sentencesRef.current;
  const sig = sigOf(text);
  const [st, setSt] = useFeatureState<SState>("essay:speak", INIT);
  const patch = (p: Partial<SState>) => setSt((prev) => ({ ...prev, ...p }));
  // Transient recognition state stays local — it must not survive a remount.
  const [status, setStatus] = useState<"idle" | "listening">("idle");
  const [interim, setInterim] = useState("");
  const [err, setErr] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recRef = useRef<any>(null);

  const idx = Math.min(st.idx, Math.max(0, sentences.length - 1));
  const graded = st.graded;

  // New passage → start a fresh run.
  useEffect(() => {
    if (st.sig !== sig) setSt({ ...INIT, sig });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);

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
        <p className="text-muted text-sm mt-1">Dùng Chrome hoặc Edge (máy tính / Android) để luyện đọc.</p>
      </div>
    );
  }

  if (sentences.length === 0) {
    return <p className="text-muted text-sm">Không tách được câu để luyện đọc.</p>;
  }

  const sentence = sentences[idx];
  const displayTokens = sentence.match(/\S+/g) ?? [];
  const total = sentences.length;
  const isLast = idx === total - 1;

  const grade = (transcript: string) => {
    const { matched, score } = scoreSentence(sentence, transcript);
    setSt((prev) => ({
      ...prev,
      graded: { matched, score, heard: transcript.trim() },
      scores: [...prev.scores, score],
    }));
  };

  const listen = () => {
    if (status === "listening" || graded) return;
    setErr("");
    setInterim("");
    const rec = new SR();
    recRef.current = rec;
    rec.lang = "en-US";
    rec.continuous = true;
    rec.interimResults = true;
    let finalText = "";
    rec.onresult = (e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => {
      let live = "";
      for (let k = e.resultIndex; k < e.results.length; k++) {
        const res = e.results[k];
        const t = res[0].transcript;
        if (res.isFinal) finalText += t + " ";
        else live += t;
      }
      setInterim(live);
    };
    rec.onerror = (e: { error?: string }) => {
      setErr(e?.error === "not-allowed" ? "Cần cấp quyền micro để luyện đọc." : "Không nghe được, thử lại nhé.");
      setStatus("idle");
    };
    rec.onend = () => {
      setStatus("idle");
      setInterim("");
      grade(finalText);
    };
    setStatus("listening");
    try {
      rec.start();
    } catch {
      setStatus("idle");
    }
  };

  const stop = () => {
    try {
      recRef.current?.stop?.();
    } catch {
      /* ignore */
    }
  };

  const next = () => {
    if (isLast) {
      patch({ done: true });
      return;
    }
    patch({ idx: idx + 1, graded: null });
    setErr("");
  };

  const restart = () => {
    setSt({ ...INIT, sig });
    setStatus("idle");
    setErr("");
  };

  if (st.done) {
    const avg = st.scores.length
      ? Math.round(st.scores.reduce((a, b) => a + b, 0) / st.scores.length)
      : 0;
    return (
      <div className="glass rounded-2xl p-6 text-center animate-fade-up">
        <div className="text-4xl font-extrabold text-accent">{avg}%</div>
        <p className="text-muted text-sm mt-1 mb-5">độ khớp trung bình khi đọc</p>
        <Button onClick={restart}>
          <RotateCcw size={16} /> Đọc lại
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
            Khớp {graded.score}%
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
        <div className="flex items-center gap-2 mb-3">
          <p className="text-sm text-muted flex-1">Đọc to câu sau:</p>
          <button
            type="button"
            aria-label="Nghe mẫu"
            onClick={() => speak(sentence)}
            className="text-muted hover:text-accent"
          >
            <Volume2 size={18} />
          </button>
        </div>

        {/* Sentence — coloured per word after grading */}
        <p className="text-lg leading-[1.9] text-fg">
          {displayTokens.map((tok, k) => {
            let cls = "";
            if (graded && normWord(tok)) {
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

        {status === "listening" && interim && (
          <p className="text-sm text-muted italic mt-2">nghe: {interim}…</p>
        )}

        {!graded ? (
          <div className="mt-4 flex items-center gap-2">
            {status === "listening" ? (
              <Button variant="ghost" onClick={stop}>
                <Mic size={16} className="text-bad animate-pulse" /> Dừng
              </Button>
            ) : (
              <Button onClick={listen}>
                <Mic size={16} /> Bấm rồi đọc
              </Button>
            )}
          </div>
        ) : (
          <div className="mt-4 border-t border-white/10 pt-3">
            <div className="text-sm text-muted">
              Máy nghe được: <span className="text-fg">{graded.heard || "(không rõ)"}</span>
            </div>
            <div className="flex gap-2 mt-3">
              <Button variant="ghost" onClick={() => patch({ graded: null })}>
                <RotateCcw size={15} /> Đọc lại câu
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

        {err && <p className="text-bad text-sm mt-3">{err}</p>}
      </div>
    </div>
  );
}
