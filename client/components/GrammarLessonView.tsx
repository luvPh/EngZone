"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  RefreshCw,
  MessageCircle,
  Database,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { PageHeader, Button } from "@/components/ui";
import OutputPanel from "@/components/OutputPanel";
import ModelSelector from "@/components/ModelSelector";
import { useModel, getProvider } from "@/lib/modelConfig";
import { useFeatureState } from "@/lib/store";
import { runCommand } from "@/lib/stream";
import { grammarLessonCommand } from "@/lib/prompts";
import { recordActivity } from "@/lib/storage";
import { slugify } from "@/lib/slug";
import {
  getLesson,
  saveLessonContent,
  setLearned,
  getLessonNeighbors,
  type StoredLesson,
} from "@/lib/grammarLibrary";

function tocFromMarkdown(md: string): { level: number; text: string; id: string }[] {
  const out: { level: number; text: string; id: string }[] = [];
  for (const line of md.split("\n")) {
    const m = /^(#{2,3})\s+(.*)$/.exec(line.trim());
    if (m) out.push({ level: m[1].length, text: m[2].trim(), id: slugify(m[2].trim()) });
  }
  return out;
}

export default function GrammarLessonView({ slug }: { slug: string }) {
  const router = useRouter();
  const [lesson, setLesson] = useState<StoredLesson | null | undefined>(undefined);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const [learned, setLearnedState] = useState(false);
  const [neighbors, setNeighbors] = useState<{
    prev: StoredLesson | null;
    next: StoredLesson | null;
  }>({ prev: null, next: null });

  const [model, setModel] = useModel("grammar");
  // Deep-link to the Grammar "Hỏi AI" tab: drop a question into a prefill key
  // (GrammarChat reads it on mount) and switch the tab, then navigate back.
  const [, setAskPrefill] = useFeatureState<string>("prefill:grammarAsk", "");
  const [, setGrammarTab] = useFeatureState<"ask" | "library">("grammar:tab", "ask");

  const runGen = (l: StoredLesson, force: boolean) => {
    if (loading) return;
    if (!force && l.content) {
      setContent(l.content);
      setFromCache(true);
      return;
    }
    setContent("");
    setFromCache(false);
    setLoading(true);
    recordActivity({ feature: "grammar", topic: l.titleEn });
    runCommand(`grammar:${slug}`, grammarLessonCommand(l), {
      onText: (full) => setContent(full),
      onDone: (full) => {
        setContent(full);
        setLoading(false);
        saveLessonContent(slug, full); // persist into the local library
      },
      onError: (msg) => {
        setContent(`[lỗi] ${msg}`);
        setLoading(false);
      },
      // Đọc provider trực tiếp từ localStorage để tránh state-race lúc auto-gen.
    }, { provider: getProvider("grammar") });
  };

  // Read lesson from the local library; auto-load cached content or generate.
  useEffect(() => {
    const l = getLesson(slug);
    setLesson(l ?? null);
    if (l) {
      setLearnedState(l.learned);
      setNeighbors(getLessonNeighbors(slug));
    }
    if (l) runGen(l, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  if (lesson === undefined) return null; // mounting / reading localStorage

  if (lesson === null) {
    return (
      <div className="animate-fade-up">
        <Link
          href="/grammar"
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-fg mb-3"
        >
          <ArrowLeft size={16} /> Tất cả bài học
        </Link>
        <p className="text-muted">Không tìm thấy bài học này trong thư viện.</p>
      </div>
    );
  }

  const toggleLearned = () => {
    const next = !learned;
    setLearnedState(next);
    setLearned(slug, next);
  };

  const askAI = () => {
    setAskPrefill(
      `Giải thích ngắn gọn, dễ hiểu về "${lesson.titleVi}" (${lesson.titleEn}) trong tiếng Anh, kèm ví dụ.`
    );
    setGrammarTab("ask");
    router.push("/grammar");
  };

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={lesson.titleVi}
        subtitle={lesson.titleEn}
        onBack={() => router.push("/grammar")}
        right={
          <div className="flex items-center gap-2 shrink-0">
            <ModelSelector value={model} onChange={setModel} />
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-accent/15 text-accent">
              {lesson.level}
            </span>
          </div>
        }
      />

      <p className="text-muted text-sm -mt-2 mb-4">{lesson.description}</p>

      <div className="flex flex-wrap gap-2 mb-1">
        <Button variant={learned ? "primary" : "ghost"} onClick={toggleLearned}>
          <Check size={16} /> {learned ? "Đã học" : "Đánh dấu đã học"}
        </Button>
        <Button variant="ghost" onClick={() => runGen(lesson, true)} disabled={loading}>
          <RefreshCw size={16} /> Tạo lại
        </Button>
        <Button variant="ghost" onClick={askAI}>
          <MessageCircle size={16} /> Hỏi AI về bài này
        </Button>
      </div>

      {fromCache && !loading && (
        <p className="text-xs text-muted mt-2 flex items-center gap-1">
          <Database size={12} /> Đã lưu trong thư viện — bấm “Tạo lại” để cập nhật.
        </p>
      )}

      {content && !loading && tocFromMarkdown(content).length > 0 && (
        <nav className="glass rounded-2xl p-3 mt-4 mb-1">
          <div className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
            Mục lục
          </div>
          <ul className="space-y-1">
            {tocFromMarkdown(content).map((h, i) => (
              <li key={i} className={h.level === 3 ? "pl-3" : ""}>
                <button
                  onClick={() =>
                    document.getElementById(h.id)?.scrollIntoView({ behavior: "smooth", block: "start" })
                  }
                  className="text-sm text-muted hover:text-accent text-left"
                >
                  {h.text}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <OutputPanel output={content} loading={loading} emptyHint="Đang tải bài học…" />

      {(neighbors.prev || neighbors.next) && (
        <div className="flex items-center justify-between gap-3 mt-5">
          {neighbors.prev ? (
            <Link
              href={`/grammar/${neighbors.prev.slug}`}
              className="glass rounded-xl px-3 py-2 text-sm text-fg hover:text-fg inline-flex items-center gap-1.5 max-w-[48%]"
            >
              <ChevronLeft size={16} className="shrink-0" />
              <span className="truncate">{neighbors.prev.titleVi}</span>
            </Link>
          ) : (
            <span />
          )}
          {neighbors.next ? (
            <Link
              href={`/grammar/${neighbors.next.slug}`}
              className="glass rounded-xl px-3 py-2 text-sm text-fg hover:text-fg inline-flex items-center gap-1.5 max-w-[48%] ml-auto"
            >
              <span className="truncate">Bài tiếp: {neighbors.next.titleVi}</span>
              <ChevronRight size={16} className="shrink-0" />
            </Link>
          ) : (
            <span />
          )}
        </div>
      )}
    </div>
  );
}
