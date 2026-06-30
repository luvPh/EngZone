"use client";

import { useEffect, useState } from "react";
import {
  Library as LibIcon,
  ListChecks,
  FileText,
  Layers,
  Trash2,
  ChevronDown,
  Check,
  Search,
  BookMarked,
  Volume2,
  type LucideIcon,
} from "lucide-react";
import { PageHeader, Button, TextInput } from "@/components/ui";
import Markdown from "@/components/Markdown";
import CardCarousel from "@/components/CardCarousel";
import EssayView from "@/components/EssayView";
import ExamPlayer from "@/components/ExamPlayer";
import { cleanOption } from "@/components/QuizPlayer";
import { getLibrary, deleteItem, type LibItem, type LibFeature } from "@/lib/library";
import { getPool, removeWord, type PoolWord } from "@/lib/vocabPool";
import { extractJson } from "@/lib/extractJson";
import type { Quiz, FlashSet, Essay, Exam } from "@/lib/types";

const META: Record<LibFeature, { icon: LucideIcon; label: string; color: string }> = {
  quiz: { icon: ListChecks, label: "Quiz", color: "#a78bfa" },
  essay: { icon: FileText, label: "Essay", color: "#fb923c" },
  flash: { icon: Layers, label: "Flashcard", color: "#34d399" },
};

const FEATURE_ORDER: LibFeature[] = ["quiz", "essay", "flash"];

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
                  {oi === q.correct && (
                    <Check size={13} className="inline ml-1 align-text-bottom" />
                  )}
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
    return essay?.essay ? (
      <EssayView data={essay} topic={item.topic} />
    ) : (
      <Markdown>{item.content}</Markdown>
    );
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

type Filter = "all" | LibFeature | "vocab";

const VOCAB_COLOR = "#38bdf8";

function speakWord(w: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const u = new SpeechSynthesisUtterance(w);
  u.lang = "en-US";
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

// Catalogue of words manually saved from essay lookup.
function SavedWords({ words, onRemove }: { words: PoolWord[]; onRemove: (w: string) => void }) {
  return (
    <section>
      <h2 className="flex items-center gap-2 text-sm font-semibold text-muted mb-2.5">
        <BookMarked size={15} style={{ color: VOCAB_COLOR }} />
        Kho từ vựng
        <span className="text-xs text-muted font-normal">{words.length}</span>
      </h2>
      <div className="grid sm:grid-cols-2 gap-2.5">
        {words.map((w) => (
          <div key={w.word} className="glass rounded-2xl p-3.5">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-fg">{w.word}</span>
              {w.pos && <span className="text-xs text-muted">({w.pos})</span>}
              {w.ipa && <span className="text-xs text-accent-soft">{w.ipa}</span>}
              <button
                type="button"
                aria-label="Phát âm"
                onClick={() => speakWord(w.word)}
                className="text-muted hover:text-accent"
              >
                <Volume2 size={14} />
              </button>
              <button
                type="button"
                aria-label="Xoá từ"
                onClick={() => onRemove(w.word)}
                className="ml-auto text-muted hover:text-bad p-1 rounded-lg hover:bg-accent-weak"
              >
                <Trash2 size={15} />
              </button>
            </div>
            <p className="text-[15px] text-fg mt-0.5">{w.meaning}</p>
            {w.example && <p className="text-sm text-muted italic mt-0.5">{w.example}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

function Row({
  it,
  isOpen,
  onToggle,
  onRemove,
}: {
  it: LibItem;
  isOpen: boolean;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const m = META[it.feature];
  const Icon = m.icon;
  return (
    <div className="glass hover-lift rounded-2xl overflow-hidden hover:shadow-glow-accent">
      <div className="flex items-center gap-3 p-3.5">
        <div
          className="w-9 h-9 rounded-lg grid place-items-center shrink-0"
          style={{ background: `${m.color}26`, color: m.color }}
        >
          <Icon size={17} />
        </div>
        <button className="flex-1 text-left min-w-0" onClick={onToggle}>
          <div className="font-medium text-fg truncate">{it.title}</div>
          <div className="text-xs text-muted">
            {m.label}
            {it.level ? ` · Level ${it.level}` : ""} ·{" "}
            {new Date(it.createdAt).toLocaleDateString("vi-VN", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </div>
        </button>
        <button
          onClick={onRemove}
          className="text-muted hover:text-bad p-1.5 rounded-lg hover:bg-accent-weak"
          aria-label="Xoá"
        >
          <Trash2 size={16} />
        </button>
        <button onClick={onToggle} className="text-muted p-1.5" aria-label="Mở">
          <ChevronDown size={18} className={`transition ${isOpen ? "rotate-180" : ""}`} />
        </button>
      </div>
      {isOpen && (
        <div className="border-t border-white/10 reading-surface p-4 animate-fade-up">
          <Viewer item={it} />
        </div>
      )}
    </div>
  );
}

export default function LibraryPage() {
  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState<LibItem[]>([]);
  const [words, setWords] = useState<PoolWord[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const refresh = () => {
    setItems(getLibrary());
    setWords(getPool().sort((a, b) => b.addedAt - a.addedAt));
  };
  useEffect(() => {
    setMounted(true);
    refresh();
  }, []);

  const remove = (id: string) => {
    deleteItem(id);
    if (open === id) setOpen(null);
    refresh();
  };

  const removeSavedWord = (w: string) => {
    removeWord(w);
    refresh();
  };

  if (!mounted) return null;

  const counts: Record<Filter, number> = {
    all: items.length,
    quiz: items.filter((i) => i.feature === "quiz").length,
    essay: items.filter((i) => i.feature === "essay").length,
    flash: items.filter((i) => i.feature === "flash").length,
    vocab: words.length,
  };

  const needle = q.trim().toLowerCase();
  // Vocab is its own tab — only shown under the "Từ vựng" filter, never mixed
  // into "Tất cả".
  const visibleWords =
    filter === "vocab"
      ? words.filter(
          (w) =>
            !needle ||
            w.word.toLowerCase().includes(needle) ||
            w.meaning.toLowerCase().includes(needle)
        )
      : [];
  const matches = (it: LibItem) =>
    (filter === "all" || it.feature === filter) &&
    (!needle ||
      it.title.toLowerCase().includes(needle) ||
      it.topic.toLowerCase().includes(needle));
  const filtered = items.filter(matches);

  // When showing "all", group by feature; otherwise a single flat group.
  const groups =
    filter === "vocab"
      ? [] // vocab tab renders SavedWords only — no library feature groups
      : filter === "all"
        ? FEATURE_ORDER.map((f) => ({
            feature: f,
            items: filtered.filter((it) => it.feature === f),
          })).filter((g) => g.items.length > 0)
        : [{ feature: filter as LibFeature, items: filtered }];

  const chip = (key: Filter, label: string) => (
    <button
      type="button"
      onClick={() => setFilter(key)}
      className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
        filter === key ? "bg-accent text-white" : "glass-input text-muted hover:text-fg"
      }`}
    >
      {label} <span className="opacity-60">{counts[key]}</span>
    </button>
  );

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Thư viện"
        subtitle="Quiz, essay và flashcard đã tạo — tái sử dụng không cần gen lại."
        icon={<LibIcon size={20} />}
      />

      {items.length === 0 && words.length === 0 ? (
        <div className="text-center text-muted text-sm py-12 reading-surface rounded-2xl">
          Chưa có nội dung nào. Tạo quiz / essay / flashcard để lưu vào đây.
        </div>
      ) : (
        <>
          <div className="relative mb-3">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <TextInput
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm theo tên hoặc chủ đề…"
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap gap-2 mb-5">
            {chip("all", "Tất cả")}
            {chip("quiz", "Quiz")}
            {chip("essay", "Essay")}
            {chip("flash", "Flashcard")}
            {chip("vocab", "Từ vựng")}
          </div>

          {filtered.length === 0 && visibleWords.length === 0 ? (
            <p className="text-muted text-sm text-center py-10">Không tìm thấy mục nào khớp.</p>
          ) : (
            <div className="space-y-6">
              {visibleWords.length > 0 && (
                <SavedWords words={visibleWords} onRemove={removeSavedWord} />
              )}
              {groups.map((g) => {
                const m = META[g.feature];
                const Icon = m.icon;
                return (
                  <section key={g.feature}>
                    <h2 className="flex items-center gap-2 text-sm font-semibold text-muted mb-2.5">
                      <Icon size={15} style={{ color: m.color }} />
                      {m.label}
                      <span className="text-xs text-muted font-normal">{g.items.length}</span>
                    </h2>
                    <div className="space-y-2.5">
                      {g.items.map((it) => (
                        <Row
                          key={it.id}
                          it={it}
                          isOpen={open === it.id}
                          onToggle={() => setOpen(open === it.id ? null : it.id)}
                          onRemove={() => remove(it.id)}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}

          <div className="pt-6 text-center">
            <Button
              variant="ghost"
              onClick={() => {
                if (confirm("Xoá toàn bộ thư viện đã lưu?")) {
                  getLibrary().forEach((i) => deleteItem(i.id));
                  refresh();
                }
              }}
            >
              <Trash2 size={16} /> Xoá tất cả
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
