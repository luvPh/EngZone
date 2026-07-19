"use client";

import { useEffect, useRef } from "react";
import { Volume2, Gauge, ArrowRight, RotateCcw, Check, SkipForward } from "lucide-react";
import { Button, TextInput } from "@/components/ui";
import { useFeatureState } from "@/lib/store";
import { initSkip, skipCurrent } from "@/lib/skipQueue";
import { speak } from "@/lib/tts";
import { normWord, splitSentences, scoreSentence } from "@/lib/textDiff";

interface Graded {
  matched: boolean[];
  score: number;
}
interface LState {
  sig: string; // which passage this run belongs to
  idx: number; // position within `order`, not an index into the sentence list
  input: string;
  graded: Graded | null;
  scores: number[];
  done: boolean;
  slow: boolean;
  order: number[]; // sentence order; skipped sentences get appended
  requeued: number[];
}
const INIT: LState = {
  sig: "",
  idx: 0,
  input: "",
  graded: null,
  scores: [],
  done: false,
  slow: false,
  order: [],
  requeued: [],
};

const sigOf = (t: string) => `${t.length}|${t.slice(0, 40)}`;

// Listen to each sentence of the essay and type it back. Graded word-by-word
// against the original (no AI needed — TTS + local diff). Progress lives in the
// app store so switching tabs keeps the run; it resets on a new essay, an
// explicit restart, or a full page reload.
export default function ListeningDictation({ text }: { text: string }) {
  const sentences = useRef(splitSentences(text));
  sentences.current = splitSentences(text);
  const sig = sigOf(text);
  const [st, setSt] = useFeatureState<LState>("essay:listen", INIT);
  const patch = (p: Partial<LState>) => setSt((prev) => ({ ...prev, ...p }));

  // New passage → start a fresh run.
  useEffect(() => {
    if (st.sig !== sig) setSt({ ...INIT, sig, ...initSkip(sentences.current.length) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);

  const list = sentences.current;
  // Fall back to natural order for runs persisted before skip existed.
  const order = st.order.length ? st.order : initSkip(list.length).order;
  const idx = Math.min(st.idx, Math.max(0, order.length - 1));
  const sentence = list[order[idx]];

  // Auto-play each new sentence.
  const played = useRef(-1);
  useEffect(() => {
    if (sentence && played.current !== idx) {
      played.current = idx;
      speak(sentence, st.slow ? 0.7 : 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, sentence]);

  useEffect(() => {
    return () => window.speechSynthesis?.cancel();
  }, []);

  if (list.length === 0) {
    return <p className="text-muted text-sm">Không tách được câu để nghe chép.</p>;
  }

  const total = order.length;
  const isLast = idx === total - 1;
  const displayTokens = sentence.match(/\S+/g) ?? [];
  const rate = st.slow ? 0.7 : 1;

  const submit = () => {
    if (st.graded || !st.input.trim()) return;
    const { matched, score } = scoreSentence(sentence, st.input);
    setSt((prev) => ({ ...prev, graded: { matched, score }, scores: [...prev.scores, score] }));
  };

  const next = () => {
    if (isLast) {
      patch({ done: true });
      return;
    }
    patch({ idx: idx + 1, input: "", graded: null });
  };

  // Skip = tính như sai (ghi 0 điểm cho câu này) + gặp lại ở cuối lượt.
  const onSkip = () => {
    if (st.graded) return;
    const { next: ns, hasMore } = skipCurrent({ order, requeued: st.requeued }, idx);
    if (!hasMore) {
      patch({ scores: [...st.scores, 0], done: true });
      return;
    }
    patch({
      scores: [...st.scores, 0],
      order: ns.order,
      requeued: ns.requeued,
      idx: idx + 1,
      input: "",
      graded: null,
    });
  };

  const restart = () => {
    setSt({ ...INIT, sig, ...initSkip(list.length) });
    played.current = -1;
  };

  if (st.done) {
    const avg = st.scores.length
      ? Math.round(st.scores.reduce((a, b) => a + b, 0) / st.scores.length)
      : 0;
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
        {st.graded && (
          <span className={st.graded.score >= 80 ? "text-ok" : st.graded.score >= 50 ? "text-accent-soft" : "text-bad"}>
            Đúng {st.graded.score}%
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
              patch({ slow: !st.slow });
              speak(sentence, st.slow ? 1 : 0.7);
            }}
            aria-pressed={st.slow}
            className={`px-4 rounded-2xl border transition text-sm font-medium ${
              st.slow ? "bg-accent text-white border-transparent" : "glass-input text-muted"
            }`}
          >
            <Gauge size={18} className="mx-auto" />
            {st.slow ? "Chậm" : "Bình thường"}
          </button>
        </div>

        <TextInput
          value={st.input}
          onChange={(e) => patch({ input: e.target.value })}
          onKeyDown={(e) => e.key === "Enter" && (!st.graded ? submit() : next())}
          placeholder="Gõ câu bạn nghe được…"
          disabled={!!st.graded}
          autoFocus
        />

        {!st.graded ? (
          <div className="mt-3 flex items-center justify-between gap-3">
            <Button onClick={submit} disabled={!st.input.trim()}>
              Kiểm tra
            </Button>
            <button
              type="button"
              onClick={onSkip}
              title="Tính 0 điểm, sẽ gặp lại cuối lượt"
              className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-accent transition"
            >
              Bỏ qua <SkipForward size={15} />
            </button>
          </div>
        ) : (
          <div className="mt-4 border-t border-white/10 pt-3">
            <div className="text-xs text-muted mb-1">Câu gốc:</div>
            <p className="text-lg leading-[1.9]">
              {displayTokens.map((tok, k) => {
                let cls = "text-fg";
                if (normWord(tok)) {
                  cls = st.graded!.matched[k]
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
              <Button variant="ghost" onClick={() => patch({ graded: null, input: "" })}>
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
