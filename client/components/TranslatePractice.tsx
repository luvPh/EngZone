"use client";

import { useEffect, useState } from "react";
import { Loader2, ArrowRight, RotateCcw, Check, Languages, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui";
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

const TYPE_VI: Record<string, string> = {
  grammar: "Ngữ pháp",
  vocabulary: "Từ vựng",
  meaning: "Sai nghĩa",
  natural: "Chưa tự nhiên",
};

// Vietnamese → English translation drill. Sentences are generated from the
// essay's topic/level; each answer is graded by the AI right away.
export default function TranslatePractice({
  topic,
  level,
  provider,
}: {
  topic: string;
  level: number;
  provider?: string;
}) {
  const [sentences, setSentences] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [genErr, setGenErr] = useState("");
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [grading, setGrading] = useState(false);
  const [grade, setGrade] = useState<Grade | null>(null);
  const [scores, setScores] = useState<number[]>([]);
  const [done, setDone] = useState(false);

  const generate = () => {
    setLoading(true);
    setGenErr("");
    setSentences([]);
    runCommand(
      "essay-translate-gen",
      translateSentencesCommand(topic, level, COUNT),
      {
        onText: () => {},
        onDone: (full) => {
          const obj = extractJson<{ sentences: string[] }>(full);
          const list = (obj?.sentences ?? []).filter((s) => typeof s === "string" && s.trim());
          if (!list.length) setGenErr("Không tạo được câu, thử lại nhé.");
          setSentences(list);
          setLoading(false);
        },
        onError: (m) => {
          setGenErr(m);
          setLoading(false);
        },
      },
      { provider, maxTokens: 1200 }
    );
  };

  useEffect(generate, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="mt-5 flex items-center gap-2 text-muted text-sm">
        <Loader2 size={16} className="animate-spin" /> Đang tạo câu tiếng Việt về “{topic}”…
      </div>
    );
  }

  if (genErr || sentences.length === 0) {
    return (
      <div className="reading-surface rounded-2xl p-6 text-center">
        <p className="text-bad text-sm mb-3">{genErr || "Chưa có câu nào."}</p>
        <Button onClick={generate}>
          <RotateCcw size={16} /> Thử lại
        </Button>
      </div>
    );
  }

  const total = sentences.length;
  const isLast = idx === total - 1;
  const vi = sentences[idx];

  const submit = () => {
    if (grading || grade || !input.trim()) return;
    setGrading(true);
    runCommand(
      "essay-translate-grade",
      gradeTranslationCommand(vi, input.trim()),
      {
        onText: () => {},
        onDone: (full) => {
          const g = extractJson<Grade>(full);
          const score = typeof g?.score === "number" ? Math.max(0, Math.min(10, g.score)) : 0;
          setGrade(g ? { ...g, score } : { score: 0, comment: "Không chấm được, thử lại nhé." });
          setScores((s) => [...s, score]);
          setGrading(false);
        },
        onError: () => {
          setGrade({ score: 0, comment: "Không chấm được, thử lại nhé." });
          setGrading(false);
        },
      },
      { provider, maxTokens: 700 }
    );
  };

  const next = () => {
    if (isLast) {
      setDone(true);
      return;
    }
    setIdx((i) => i + 1);
    setInput("");
    setGrade(null);
  };

  const restart = () => {
    setIdx(0);
    setInput("");
    setGrade(null);
    setScores([]);
    setDone(false);
    generate();
  };

  if (done) {
    const avg = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : "0";
    return (
      <div className="glass rounded-2xl p-6 text-center animate-fade-up">
        <div className="text-4xl font-extrabold text-accent">{avg}/10</div>
        <p className="text-muted text-sm mt-1 mb-5">điểm dịch trung bình</p>
        <Button onClick={restart}>
          <RotateCcw size={16} /> Bộ câu mới
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <div className="flex items-center justify-between text-xs text-muted mb-3">
        <span>Câu {idx + 1} / {total}</span>
        {grade && (
          <span className={grade.score >= 8 ? "text-ok" : grade.score >= 5 ? "text-accent-soft" : "text-bad"}>
            {grade.score}/10
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
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) (grade ? next() : submit());
          }}
          placeholder="Viết bản dịch tiếng Anh của bạn…"
          disabled={!!grade || grading}
          rows={3}
          className="w-full glass-input rounded-xl px-3.5 py-2.5 text-fg resize-y disabled:opacity-70"
        />

        {!grade ? (
          <Button onClick={submit} disabled={!input.trim() || grading} className="mt-3">
            {grading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Đang chấm…
              </>
            ) : (
              "Chấm bài"
            )}
          </Button>
        ) : (
          <div className="mt-4 border-t border-white/10 pt-3 space-y-3">
            {grade.comment && <p className="text-sm text-fg">{grade.comment}</p>}

            {grade.reference && (
              <div>
                <div className="text-xs text-muted mb-0.5">Bản dịch tham khảo</div>
                <p className="text-[15px] text-ok">{grade.reference}</p>
              </div>
            )}

            {grade.errors && grade.errors.length > 0 && (
              <div>
                <div className="text-xs text-muted mb-1.5">Lỗi cần sửa ({grade.errors.length})</div>
                <ul className="space-y-2">
                  {grade.errors.map((e, i) => (
                    <li key={i} className="glass rounded-xl p-2.5">
                      <div className="flex items-center gap-2 mb-0.5">
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
