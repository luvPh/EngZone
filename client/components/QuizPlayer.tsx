"use client";

import { Check, X } from "lucide-react";
import { Button } from "./ui";
import type { QuizQuestion } from "@/lib/types";

// Some models prefix options with "A. " / "1) " despite instructions — strip it
// so it doesn't double up with the player's own letter labels.
export function cleanOption(opt: string): string {
  return opt.replace(/^\s*(?:[A-Da-d][.)]|\d+[.)])\s+/, "");
}

export interface QuizGameState {
  answers: Record<number, string>; // qIndex -> answer (option index as string, or text)
  submitted: boolean;
}

function isCorrect(q: QuizQuestion, answer: string | undefined): boolean {
  if (answer == null || answer === "") return false;
  if (q.type === "mcq") return Number(answer) === q.correct;
  return answer.trim().toLowerCase() === q.correct.trim().toLowerCase();
}

export default function QuizPlayer({
  questions,
  state,
  onChange,
  onRetry,
}: {
  questions: QuizQuestion[];
  state: QuizGameState;
  onChange: (next: QuizGameState) => void;
  onRetry: () => void;
}) {
  const { answers, submitted } = state;
  const score = questions.reduce(
    (n, q, i) => n + (isCorrect(q, answers[i]) ? 1 : 0),
    0
  );
  const allAnswered = questions.every(
    (_, i) => answers[i] != null && answers[i] !== ""
  );

  const setAnswer = (i: number, v: string) =>
    onChange({ ...state, answers: { ...answers, [i]: v } });

  return (
    <div className="mt-5 space-y-4">
      {submitted && (
        <div className="bg-surface border border-border rounded-2xl p-4 flex items-center justify-between shadow-card animate-fade-up">
          <div>
            <div className="text-sm text-muted">Kết quả</div>
            <div className="text-2xl font-bold">
              {score}/{questions.length}{" "}
              <span className="text-muted text-base font-normal">đúng</span>
            </div>
          </div>
          <Button variant="ghost" onClick={onRetry}>
            Làm lại
          </Button>
        </div>
      )}

      {questions.map((q, i) => {
        const ans = answers[i];
        const correct = isCorrect(q, ans);
        return (
          <div
            key={i}
            className={`bg-surface border rounded-2xl p-4 shadow-card ${
              submitted
                ? correct
                  ? "border-ok/50"
                  : "border-bad/50"
                : "border-border"
            }`}
          >
            <div className="flex items-start gap-2 mb-3">
              <span className="text-accent font-bold">{i + 1}.</span>
              <p className="font-medium text-slate-100">{q.q}</p>
              {submitted &&
                (correct ? (
                  <Check size={18} className="text-ok shrink-0 ml-auto" />
                ) : (
                  <X size={18} className="text-bad shrink-0 ml-auto" />
                ))}
            </div>

            {q.type === "mcq" ? (
              <div className="space-y-2">
                {q.options.map((opt, oi) => {
                  const selected = ans === String(oi);
                  const isAnswer = q.correct === oi;
                  let cls = "border-border hover:border-accent/60";
                  if (submitted) {
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
                      disabled={submitted}
                      onClick={() => setAnswer(i, String(oi))}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl border transition ${cls}`}
                    >
                      <span className="text-muted mr-2">
                        {String.fromCharCode(65 + oi)}.
                      </span>
                      {cleanOption(opt)}
                    </button>
                  );
                })}
              </div>
            ) : (
              <input
                disabled={submitted}
                value={ans ?? ""}
                onChange={(e) => setAnswer(i, e.target.value)}
                placeholder="Điền đáp án…"
                className={`w-full bg-surface-2 border rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-accent/30 ${
                  submitted
                    ? correct
                      ? "border-ok"
                      : "border-bad"
                    : "border-border focus:border-accent"
                }`}
              />
            )}

            {submitted && (
              <div className="mt-3 text-sm space-y-1 animate-fade-up">
                {q.type === "fill" && !correct && (
                  <div>
                    <span className="text-muted">Đáp án: </span>
                    <span className="text-ok font-medium">{q.correct}</span>
                  </div>
                )}
                {q.explain && (
                  <div className="text-muted">
                    <span className="text-slate-300 font-medium">Giải thích: </span>
                    {q.explain}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {!submitted && (
        <Button
          onClick={() => onChange({ ...state, submitted: true })}
          disabled={!allAnswered}
          className="w-full"
        >
          {allAnswered ? "Nộp bài" : "Hãy trả lời hết các câu"}
        </Button>
      )}
    </div>
  );
}
