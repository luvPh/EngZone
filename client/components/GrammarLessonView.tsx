"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw, ListChecks, Layers, Database } from "lucide-react";
import { PageHeader, Button } from "@/components/ui";
import OutputPanel from "@/components/OutputPanel";
import ModelSelector from "@/components/ModelSelector";
import { useModel, getProvider } from "@/lib/modelConfig";
import { useFeatureState } from "@/lib/store";
import { runCommand } from "@/lib/stream";
import { grammarLessonCommand } from "@/lib/prompts";
import { recordActivity } from "@/lib/storage";
import { getLesson, saveLessonContent, type StoredLesson } from "@/lib/grammarLibrary";

export default function GrammarLessonView({ slug }: { slug: string }) {
  const router = useRouter();
  const [lesson, setLesson] = useState<StoredLesson | null | undefined>(undefined);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [fromCache, setFromCache] = useState(false);

  const [model, setModel] = useModel("grammar");
  // Prefill keys read by Quiz / Flashcard on mount.
  const [, setQuizPrefill] = useFeatureState<string>("prefill:quizTopic", "");
  const [, setFlashPrefill] = useFeatureState<string>("prefill:flashTopic", "");

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
    if (l) runGen(l, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  if (lesson === undefined) return null; // mounting / reading localStorage

  if (lesson === null) {
    return (
      <div className="animate-fade-up">
        <Link
          href="/grammar"
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-white mb-3"
        >
          <ArrowLeft size={16} /> Tất cả bài học
        </Link>
        <p className="text-muted">Không tìm thấy bài học này trong thư viện.</p>
      </div>
    );
  }

  const goQuiz = () => {
    setQuizPrefill(lesson.titleEn);
    router.push("/quiz");
  };
  const goFlash = () => {
    setFlashPrefill(lesson.titleEn);
    router.push("/flashcard");
  };

  return (
    <div className="animate-fade-up">
      <Link
        href="/grammar"
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-white mb-3"
      >
        <ArrowLeft size={16} /> Tất cả bài học
      </Link>

      <PageHeader
        title={lesson.titleVi}
        subtitle={lesson.titleEn}
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
        <Button variant="ghost" onClick={() => runGen(lesson, true)} disabled={loading}>
          <RefreshCw size={16} /> Tạo lại
        </Button>
        <Button variant="ghost" onClick={goQuiz}>
          <ListChecks size={16} /> Làm quiz chủ đề này
        </Button>
        <Button variant="ghost" onClick={goFlash}>
          <Layers size={16} /> Flashcard
        </Button>
      </div>

      {fromCache && !loading && (
        <p className="text-xs text-muted mt-2 flex items-center gap-1">
          <Database size={12} /> Đã lưu trong thư viện — bấm “Tạo lại” để cập nhật.
        </p>
      )}

      <OutputPanel output={content} loading={loading} emptyHint="Đang tải bài học…" />
    </div>
  );
}
