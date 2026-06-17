"use client";

import { useEffect, useState } from "react";
import {
  Library as LibIcon,
  ListChecks,
  FileText,
  Layers,
  Trash2,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { PageHeader, Card, Button } from "@/components/ui";
import Markdown from "@/components/Markdown";
import CardCarousel from "@/components/CardCarousel";
import EssayView from "@/components/EssayView";
import ExamPlayer from "@/components/ExamPlayer";
import { cleanOption } from "@/components/QuizPlayer";
import { getLibrary, deleteItem, type LibItem, type LibFeature } from "@/lib/library";
import { extractJson } from "@/lib/extractJson";
import type { Quiz, FlashSet, Essay, Exam } from "@/lib/types";

const META: Record<LibFeature, { icon: LucideIcon; label: string }> = {
  quiz: { icon: ListChecks, label: "Quiz" },
  essay: { icon: FileText, label: "Essay" },
  flash: { icon: Layers, label: "Flashcard" },
};

function QuizReview({ json }: { json: string }) {
  const quiz = extractJson<Quiz>(json);
  if (!quiz?.questions?.length) return <p className="text-muted text-sm">Không đọc được quiz.</p>;
  return (
    <ol className="space-y-3 list-decimal pl-5">
      {quiz.questions.map((q, i) => (
        <li key={i}>
          <p className="font-medium">{q.q}</p>
          {q.type === "mcq" ? (
            <ul className="mt-1 space-y-0.5">
              {q.options.map((o, oi) => (
                <li
                  key={oi}
                  className={oi === q.correct ? "text-ok font-medium" : "text-muted"}
                >
                  {String.fromCharCode(65 + oi)}. {cleanOption(o)}
                  {oi === q.correct && " ✓"}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1">
              <span className="text-muted">Đáp án: </span>
              <span className="text-ok font-medium">{q.correct}</span>
            </p>
          )}
          {q.explain && <p className="text-sm text-muted mt-1">{q.explain}</p>}
        </li>
      ))}
    </ol>
  );
}

function Viewer({ item }: { item: LibItem }) {
  if (item.feature === "essay") {
    const essay = extractJson<Essay>(item.content);
    return essay?.essay ? <EssayView data={essay} /> : <Markdown>{item.content}</Markdown>;
  }
  if (item.feature === "quiz") {
    // Exam items are { sections: [...] }; practice quizzes are { questions: [...] }.
    if (item.meta?.kind === "exam") {
      const exam = extractJson<Exam>(item.content);
      return exam?.sections?.length ? (
        <ExamPlayer
          exam={exam}
          state={{ answers: {}, submitted: false }}
          onChange={() => {}}
          review
        />
      ) : (
        <p className="text-muted text-sm">Không đọc được đề.</p>
      );
    }
    return <QuizReview json={item.content} />;
  }
  const set = extractJson<FlashSet>(item.content);
  return set?.cards?.length ? (
    <CardCarousel cards={set.cards} />
  ) : (
    <p className="text-muted text-sm">Không đọc được thẻ.</p>
  );
}

export default function LibraryPage() {
  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState<LibItem[]>([]);
  const [open, setOpen] = useState<string | null>(null);

  const refresh = () => setItems(getLibrary());
  useEffect(() => {
    setMounted(true);
    refresh();
  }, []);

  const remove = (id: string) => {
    deleteItem(id);
    if (open === id) setOpen(null);
    refresh();
  };

  if (!mounted) return null;

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Thư viện"
        subtitle="Quiz, essay và flashcard đã tạo — tái sử dụng không cần gen lại."
        icon={<LibIcon size={20} />}
      />

      {items.length === 0 ? (
        <div className="text-center text-muted text-sm py-12 border border-dashed border-border rounded-2xl">
          Chưa có nội dung nào. Tạo quiz / essay / flashcard để lưu vào đây.
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map((it) => {
            const m = META[it.feature];
            const Icon = m.icon;
            const isOpen = open === it.id;
            return (
              <Card key={it.id} className="p-0 overflow-hidden">
                <div className="flex items-center gap-3 p-3.5">
                  <div className="w-9 h-9 rounded-lg bg-accent/15 text-accent grid place-items-center shrink-0">
                    <Icon size={17} />
                  </div>
                  <button
                    className="flex-1 text-left min-w-0"
                    onClick={() => setOpen(isOpen ? null : it.id)}
                  >
                    <div className="font-medium truncate">{it.title}</div>
                    <div className="text-xs text-muted">
                      {m.label} ·{" "}
                      {new Date(it.createdAt).toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </div>
                  </button>
                  <button
                    onClick={() => remove(it.id)}
                    className="text-muted hover:text-bad p-1.5 rounded-lg hover:bg-white/5"
                    aria-label="Xoá"
                  >
                    <Trash2 size={16} />
                  </button>
                  <button
                    onClick={() => setOpen(isOpen ? null : it.id)}
                    className="text-muted p-1.5"
                    aria-label="Mở"
                  >
                    <ChevronDown
                      size={18}
                      className={`transition ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                </div>
                {isOpen && (
                  <div className="border-t border-border p-4 animate-fade-up">
                    <Viewer item={it} />
                  </div>
                )}
              </Card>
            );
          })}
          <div className="pt-2">
            <Button variant="ghost" onClick={() => { getLibrary().forEach((i) => deleteItem(i.id)); refresh(); }}>
              <Trash2 size={16} /> Xoá tất cả
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
