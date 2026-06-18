"use client";

import { useEffect, useState } from "react";
import { Check, X, Clock } from "lucide-react";
import Markdown from "./Markdown";
import { Button } from "./ui";
import { cleanOption } from "./QuizPlayer";
import type { Exam } from "@/lib/types";

export interface ExamState {
  answers: Record<number, number>; // flat question index -> chosen option index
  submitted: boolean;
}

// The "sắp xếp câu" task lists clauses a) b) c)… — models sometimes inline them
// into one paragraph. If we detect ≥3 standalone labels not already on their own
// lines, break them into a markdown list so each clause is readable.
function normalizePassage(text?: string): string {
  if (!text) return "";
  const labels = text.match(/(?<=^|[\s(])[a-eA-E][.)]\s/g) || [];
  if (labels.length < 3) return text;
  if (/\n\s*(?:[-*]\s*)?[a-eA-E][.)]/.test(text)) return text; // already multiline
  return text
    .replace(/(?<=^|[\s(])([a-eA-E])[.)]\s+/g, (_m, l) => `\n- ${l}) `)
    .trim();
}

function fmt(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

export default function ExamPlayer({
  exam,
  state,
  onChange,
  onRetry,
  review = false,
  endsAt,
  onTimeUp,
}: {
  exam: Exam;
  state: ExamState;
  onChange: (next: ExamState) => void;
  onRetry?: () => void;
  review?: boolean;
  endsAt?: number;
  onTimeUp?: () => void;
}) {
  // Flatten questions for global numbering + grading.
  const flat = exam.sections.flatMap((s) => s.questions);
  const total = flat.length;
  const { answers, submitted } = state;
  const effectiveSubmitted = review || submitted;

  // Countdown timer (only while doing the test, not in review/after submit).
  const timed = !!endsAt && !effectiveSubmitted;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!timed) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [timed]);
  const remaining = endsAt ? endsAt - now : 0;
  useEffect(() => {
    if (timed && remaining <= 0) onTimeUp?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timed, remaining <= 0]);

  const score = flat.reduce(
    (n, q, i) => n + (answers[i] === q.correct ? 1 : 0),
    0
  );
  const answered = flat.filter((_, i) => answers[i] != null).length;

  let counter = -1; // running flat index across sections

  const lowTime = timed && remaining <= 60000;

  return (
    <div className="mt-5 space-y-5">
      {timed && (
        // Full-bleed top bar: flush to the top, spans the content width, rounded
        // only at the bottom, strong glass — so scrolling content slides cleanly
        // underneath instead of peeking through a gap.
        <div
          className={`sticky top-0 z-30 -mx-4 flex items-center justify-between rounded-b-2xl px-5 py-3.5 glass ${
            lowTime ? "text-bad ring-1 ring-bad/50" : "text-slate-200"
          }`}
        >
          <span className="flex items-center gap-2 text-sm font-medium">
            <Clock size={16} /> Thời gian làm bài
          </span>
          <span className="text-2xl font-bold tabular-nums">{fmt(remaining)}</span>
        </div>
      )}

      {exam.title && !review && (
        <h2 className="text-xl font-bold text-white">{exam.title}</h2>
      )}

      {submitted && !review && (
        <div className="bg-surface border border-border rounded-2xl p-4 flex items-center justify-between shadow-card animate-fade-up">
          <div>
            <div className="text-sm text-muted">Điểm</div>
            <div className="text-2xl font-bold">
              {score}/{total}{" "}
              <span className="text-muted text-base font-normal">
                · {((score / total) * 10).toFixed(2)}/10
              </span>
            </div>
          </div>
          {onRetry && (
            <Button variant="ghost" onClick={onRetry}>
              Làm lại
            </Button>
          )}
        </div>
      )}

      {exam.sections.map((section, si) => {
        const questionEls = section.questions.map((q) => {
          counter += 1;
          const idx = counter;
          const ans = answers[idx];
          const correct = ans === q.correct;
          return (
            <div
              key={idx}
              className={`bg-surface border rounded-2xl p-4 shadow-card ${
                effectiveSubmitted
                  ? correct
                    ? "border-ok/50"
                    : "border-bad/50"
                  : "border-border"
              }`}
            >
              <div className="flex items-start gap-2 mb-3">
                <span className="text-accent font-bold">{idx + 1}.</span>
                <p className="font-medium text-slate-100 whitespace-pre-line">{q.q}</p>
                {effectiveSubmitted &&
                  !review &&
                  (correct ? (
                    <Check size={18} className="text-ok shrink-0 ml-auto" />
                  ) : (
                    <X size={18} className="text-bad shrink-0 ml-auto" />
                  ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {q.options.map((opt, oi) => {
                  const selected = ans === oi;
                  const isAnswer = q.correct === oi;
                  let cls = "border-border hover:border-accent/60";
                  if (effectiveSubmitted) {
                    if (isAnswer) cls = "border-ok bg-ok/10";
                    else if (selected) cls = "border-bad bg-bad/10";
                    else cls = "border-border opacity-70";
                  } else if (selected) {
                    cls = "border-accent bg-accent/10";
                  }
                  return (
                    <button
                      key={oi}
                      type="button"
                      disabled={effectiveSubmitted}
                      onClick={() => onChange({ ...state, answers: { ...answers, [idx]: oi } })}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl border transition ${cls}`}
                    >
                      <span className="text-muted mr-2">{String.fromCharCode(65 + oi)}.</span>
                      {cleanOption(opt)}
                    </button>
                  );
                })}
              </div>

              {effectiveSubmitted && q.explain && (
                <div className="mt-3 text-sm text-muted animate-fade-up">
                  <span className="text-slate-300 font-medium">Giải thích: </span>
                  {q.explain}
                </div>
              )}
            </div>
          );
        });

        const passageEl = section.passage ? (
          <div className="bg-surface-2 border border-border rounded-xl p-4 text-sm text-slate-200 prose-claude lg:sticky lg:top-16 lg:max-h-[80vh] lg:overflow-auto">
            <Markdown>{normalizePassage(section.passage)}</Markdown>
          </div>
        ) : null;

        return (
          <div key={si} className="space-y-3">
            <div className="text-sm font-semibold text-accent uppercase tracking-wide">
              Phần {si + 1}
            </div>
            <p className="text-slate-300 text-sm">{section.instruction}</p>

            {passageEl ? (
              // Reading/cloze: passage left (sticky — follows while you scroll its
              // questions, releases at the next cluster); questions on the right.
              <div className="flex flex-col lg:flex-row gap-4 lg:items-stretch">
                <div className="lg:w-1/2">{passageEl}</div>
                <div className="lg:w-1/2 space-y-3">{questionEls}</div>
              </div>
            ) : (
              <div className="space-y-3">{questionEls}</div>
            )}
          </div>
        );
      })}

      {!effectiveSubmitted && (
        <Button
          onClick={() => onChange({ ...state, submitted: true })}
          disabled={answered < total}
          className="w-full"
        >
          {answered < total
            ? `Đã trả lời ${answered}/${total} câu`
            : "Nộp bài"}
        </Button>
      )}
    </div>
  );
}
