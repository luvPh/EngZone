"use client";

import { useEffect } from "react";
import { Loader2, ArrowRight, RotateCcw, Check, Languages, Lightbulb, SkipForward } from "lucide-react";
import { Button } from "@/components/ui";
import { useFeatureState } from "@/lib/store";
import { initSkip, skipCurrent } from "@/lib/skipQueue";
import { runCommand } from "@/lib/stream";
import { translateSentencesCommand, gradeTranslationCommand } from "@/lib/prompts";
import { extractJson } from "@/lib/extractJson";

const COUNT = 5;

interface TransError {
  type?: string;
  wrong?: string;
  fix?: string;
  why?: string;
}
interface Grade {
  score: number;
  reference?: string;
  errors?: TransError[];
  comment?: string;
}

interface TState {
  sig: string; // topic|level this set was generated for
  sentences: string[];
  idx: number; // position within `order`, not an index into `sentences`
  input: string;
  grade: Grade | null;
  grading: boolean;
  scores: number[];
  done: boolean;
  loading: boolean;
  err: string;
  order: number[]; // sentence order; skipped sentences get appended
  requeued: number[];
}

const INIT: TState = {
  sig: "",
  sentences: [],
  idx: 0,
  input: "",
  grade: null,
  grading: false,
  scores: [],
  done: false,
  loading: false,
  err: "",
  order: [],
  requeued: [],
};

const TYPE_VI: Record<string, string> = {
  grammar: "Ngữ pháp",
  vocabulary: "Từ vựng",
  meaning: "Sai nghĩa",
  natural: "Chưa tự nhiên",
};

// Vietnamese → English translation drill. Sentences are generated from the
// essay's topic/level; each answer is graded by the AI right away. The whole
// session lives in the app store, so switching tabs never re-generates (which
// would both lose progress and burn AI quota) — only a new topic, an explicit
// "Bộ câu mới", or a full page reload starts over.
export default function TranslatePractice({
  topic,
  level,
  provider,
}: {
  topic: string;
  level: number;
  provider?: string;
}) {
  const [st, setSt] = useFeatureState<TState>("essay:translate", INIT);
  const patch = (p: Partial<TState>) => setSt((prev) => ({ ...prev, ...p }));
  const sig = `${topic}|${level}`;

  const generate = (forSig: string) => {
    setSt({ ...INIT, sig: forSig, loading: true });
    runCommand(
      "essay-translate-gen",
      translateSentencesCommand(topic, level, COUNT),
      {
        onText: () => {},
        onDone: (full) => {
          const obj = extractJson<{ sentences: string[] }>(full);
          const list = (obj?.sentences ?? []).filter((s) => typeof s === "string" && s.trim());
          patch({
            sentences: list,
            ...initSkip(list.length),
            loading: false,
            err: list.length ? "" : "Không tạo được câu, thử lại nhé.",
          });
        },
        onError: (m) => patch({ err: m, loading: false }),
      },
      { provider, maxTokens: 1200 }
    );
  };

  // Generate only for a topic/level we haven't got a set for yet.
  useEffect(() => {
    if (st.sig !== sig) generate(sig);
    else if (!st.sentences.length && !st.loading && !st.err) generate(sig);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);

  if (st.loading) {
    return (
      <div className="mt-5 flex items-center gap-2 text-muted text-sm">
        <Loader2 size={16} className="animate-spin" /> Đang tạo câu tiếng Việt về “{topic}”…
      </div>
    );
  }

  if (st.err || st.sentences.length === 0) {
    return (
      <div className="reading-surface rounded-2xl p-6 text-center">
        <p className="text-bad text-sm mb-3">{st.err || "Chưa có câu nào."}</p>
        <Button onClick={() => generate(sig)}>
          <RotateCcw size={16} /> Thử lại
        </Button>
      </div>
    );
  }

  // Fall back to natural order for runs persisted before skip existed.
  const order = st.order.length ? st.order : initSkip(st.sentences.length).order;
  const total = order.length;
  const idx = Math.min(st.idx, total - 1);
  const isLast = idx === total - 1;
  const vi = st.sentences[order[idx]];

  const submit = () => {
    if (st.grading || st.grade || !st.input.trim()) return;
    patch({ grading: true });
    runCommand(
      "essay-translate-grade",
      gradeTranslationCommand(vi, st.input.trim()),
      {
        onText: () => {},
        onDone: (full) => {
          const g = extractJson<Grade>(full);
          const score = typeof g?.score === "number" ? Math.max(0, Math.min(10, g.score)) : 0;
          setSt((prev) => ({
            ...prev,
            grade: g ? { ...g, score } : { score: 0, comment: "Không chấm được, thử lại nhé." },
            scores: [...prev.scores, score],
            grading: false,
          }));
        },
        onError: () =>
          patch({ grade: { score: 0, comment: "Không chấm được, thử lại nhé." }, grading: false }),
      },
      { provider, maxTokens: 700 }
    );
  };

  const next = () => {
    if (isLast) {
      patch({ done: true });
      return;
    }
    patch({ idx: idx + 1, input: "", grade: null });
  };

  // Skip = tính như sai (0 điểm, không tốn lượt gọi AI) + gặp lại ở cuối lượt.
  const onSkip = () => {
    if (st.grading || st.grade) return;
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
      grade: null,
    });
  };

  if (st.done) {
    const avg = st.scores.length
      ? (st.scores.reduce((a, b) => a + b, 0) / st.scores.length).toFixed(1)
      : "0";
    return (
      <div className="glass rounded-2xl p-6 text-center animate-fade-up">
        <div className="text-4xl font-extrabold text-accent">{avg}/10</div>
        <p className="text-muted text-sm mt-1 mb-5">điểm dịch trung bình</p>
        <Button onClick={() => generate(sig)}>
          <RotateCcw size={16} /> Bộ câu mới
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <div className="flex items-center justify-between text-xs text-muted mb-3">
        <span>Câu {idx + 1} / {total}</span>
        {st.grade && (
          <span className={st.grade.score >= 8 ? "text-ok" : st.grade.score >= 5 ? "text-accent-soft" : "text-bad"}>
            {st.grade.score}/10
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
        <p className="text-sm text-muted mb-1 flex items-center gap-1.5">
          <Languages size={15} /> Dịch câu sau sang tiếng Anh:
        </p>
        <p className="text-lg text-fg font-medium mb-4">{vi}</p>

        <textarea
          value={st.input}
          onChange={(e) => patch({ input: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) (st.grade ? next() : submit());
          }}
          placeholder="Viết bản dịch tiếng Anh của bạn…"
          disabled={!!st.grade || st.grading}
          rows={3}
          className="w-full glass-input rounded-xl px-3.5 py-2.5 text-fg resize-y disabled:opacity-70"
        />

        {!st.grade ? (
          <div className="mt-3 flex items-center justify-between gap-3">
            <Button onClick={submit} disabled={!st.input.trim() || st.grading}>
              {st.grading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Đang chấm…
                </>
              ) : (
                "Chấm bài"
              )}
            </Button>
            <button
              type="button"
              onClick={onSkip}
              disabled={st.grading}
              title="Tính 0 điểm, sẽ gặp lại cuối lượt"
              className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-accent transition disabled:opacity-40"
            >
              Bỏ qua <SkipForward size={15} />
            </button>
          </div>
        ) : (
          <div className="mt-4 border-t border-white/10 pt-3 space-y-3">
            {st.grade.comment && <p className="text-sm text-fg">{st.grade.comment}</p>}

            {st.grade.reference && (
              <div>
                <div className="text-xs text-muted mb-0.5">Bản dịch tham khảo</div>
                <p className="text-[15px] text-ok">{st.grade.reference}</p>
              </div>
            )}

            {st.grade.errors && st.grade.errors.length > 0 && (
              <div>
                <div className="text-xs text-muted mb-1.5">Lỗi cần sửa ({st.grade.errors.length})</div>
                <ul className="space-y-2">
                  {st.grade.errors.map((e, i) => (
                    <li key={i} className="glass rounded-xl p-2.5">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full bg-accent-weak text-accent">
                          {TYPE_VI[e.type ?? ""] ?? e.type ?? "Lỗi"}
                        </span>
                        {e.wrong && <span className="text-sm text-bad line-through">{e.wrong}</span>}
                        {e.fix && <span className="text-sm text-ok">→ {e.fix}</span>}
                      </div>
                      {e.why && (
                        <p className="text-xs text-muted flex items-start gap-1">
                          <Lightbulb size={12} className="mt-0.5 shrink-0" /> {e.why}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Button onClick={next}>
              {isLast ? (
                <>
                  <Check size={16} /> Xem kết quả
                </>
              ) : (
                <>
                  Câu tiếp <ArrowRight size={16} />
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
