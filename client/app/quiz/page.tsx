"use client";

import { useEffect } from "react";
import { ListChecks, RefreshCw, GraduationCap, Play, Lock } from "lucide-react";
import { PageHeader, Segmented, Button, Spinner, Card } from "@/components/ui";
import ExamPlayer, { type ExamState } from "@/components/ExamPlayer";
import GenProgress from "@/components/GenProgress";
import ModelSelector from "@/components/ModelSelector";
import { useModel } from "@/lib/modelConfig";
import { useFeatureState } from "@/lib/store";
import { runCommand } from "@/lib/stream";
import { examCommand, type ExamDifficulty } from "@/lib/prompts";
import { extractJson } from "@/lib/extractJson";
import { recordActivity } from "@/lib/storage";
import { findItem, saveItem } from "@/lib/library";
import type { Exam } from "@/lib/types";

type ExamSize = 20 | 40;

interface ExamRun {
  loading: boolean;
  error: string;
  exam: Exam | null;
  size: ExamSize;
  source: "" | "new" | "library";
  startedAt: number;
  bytes: number;
}

const KEY = "quiz";

const DIFF_LABEL: Record<ExamDifficulty, string> = { 1: "Dễ", 2: "Trung bình", 3: "Khó" };

export default function QuizPage() {
  const [model, setModel] = useModel("quiz");
  const [difficulty, setDifficulty] = useFeatureState<ExamDifficulty>(`${KEY}:difficulty`, 2);

  const [examRun, setExamRun] = useFeatureState<ExamRun>(`${KEY}:examRun`, {
    loading: false,
    error: "",
    exam: null,
    size: 40,
    source: "",
    startedAt: 0,
    bytes: 0,
  });
  const [examState, setExamState] = useFeatureState<ExamState>(`${KEY}:examState`, {
    answers: {},
    submitted: false,
  });
  const [session, setSession] = useFeatureState<{ started: boolean; endsAt: number }>(
    `${KEY}:session`,
    { started: false, endsAt: 0 }
  );
  const [, setNavLocked] = useFeatureState<boolean>("nav:locked", false);

  const testInProgress = session.started && !examState.submitted;

  // Warn before leaving while a timed test runs.
  useEffect(() => {
    if (!testInProgress) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [testInProgress]);

  const startTest = () => {
    const minutes = examRun.size === 40 ? 50 : 25;
    setExamState({ answers: {}, submitted: false });
    setSession({ started: true, endsAt: Date.now() + minutes * 60000 });
    setNavLocked(true);
  };
  const finishTest = () => setNavLocked(false);

  const generateExam = (forceNew = false) => {
    if (examRun.loading) return;
    const size = examRun.size;
    const cacheTopic = "Đề thi THPT";
    setExamState({ answers: {}, submitted: false });
    setSession({ started: false, endsAt: 0 });
    setNavLocked(false);

    const meta = { kind: "exam", size, difficulty };
    const base = { size, startedAt: 0, bytes: 0 };
    if (!forceNew) {
      const cached = findItem("quiz", cacheTopic, undefined, meta);
      if (cached) {
        const exam = extractJson<Exam>(cached.content);
        if (exam?.sections?.length) {
          setExamRun({ ...base, loading: false, error: "", exam, source: "library" });
          return;
        }
      }
    }

    setExamRun({ ...base, loading: true, error: "", exam: null, source: "new", startedAt: Date.now() });
    recordActivity({ feature: "quiz", topic: cacheTopic });

    runCommand(
      KEY,
      examCommand(size, difficulty),
      {
        onText: (full) => setExamRun((p) => (p.loading ? { ...p, bytes: full.length } : p)),
        onDone: (full) => {
          const exam = extractJson<Exam>(full);
          if (!exam?.sections?.length) {
            setExamRun((p) => ({ ...p, loading: false, error: "Không phân tích được đề. Thử tạo lại nhé.", exam: null }));
            return;
          }
          setExamRun((p) => ({ ...p, loading: false, error: "", exam, source: "new" }));
          saveItem({
            feature: "quiz",
            topic: cacheTopic,
            meta,
            title: `Đề thi THPT · ${size} câu · ${DIFF_LABEL[difficulty]}`,
            content: JSON.stringify(exam),
          });
        },
        onError: (msg) => setExamRun((p) => ({ ...p, loading: false, error: msg, exam: null })),
      },
      { maxTokens: 8000, provider: model }
    );
  };

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Luyện đề"
        subtitle="Đề thi thử theo cấu trúc THPT 2025 — nội dung random hoá + chọn độ khó."
        icon={<ListChecks size={20} />}
        right={!testInProgress && <ModelSelector value={model} onChange={setModel} />}
      />

      {!testInProgress && (
        <>
          <Card>
            <p className="text-sm text-muted mb-4">
              Theo cấu trúc đề tốt nghiệp THPT 2025 (4 dạng: điền thông tin · sắp xếp câu ·
              điền câu thiếu · đọc hiểu) — nội dung & chủ đề được random hoá mỗi lần để luyện đa dạng.
            </p>

            <div className="mb-4">
              <div className="text-sm font-medium text-slate-300 mb-1.5">Độ khó</div>
              <Segmented
                value={difficulty}
                onChange={setDifficulty}
                options={[
                  { value: 1, label: "Dễ" },
                  { value: 2, label: "Trung bình" },
                  { value: 3, label: "Khó" },
                ]}
              />
            </div>

            <div className="mb-4">
              <div className="text-sm font-medium text-slate-300 mb-1.5">Độ dài</div>
              <Segmented
                value={examRun.size}
                onChange={(size) => setExamRun({ ...examRun, size })}
                options={[
                  { value: 20, label: "Rút gọn (~20 câu)" },
                  { value: 40, label: "Đầy đủ (40 câu)" },
                ]}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={() => generateExam(false)} disabled={examRun.loading}>
                {examRun.loading ? <Spinner /> : <GraduationCap size={18} />}
                {examRun.loading ? "Đang ra đề…" : "Tạo đề"}
              </Button>
              {examRun.exam && !examRun.loading && (
                <Button variant="ghost" onClick={() => generateExam(true)}>
                  <RefreshCw size={16} /> Đề khác
                </Button>
              )}
            </div>
          </Card>

          {examRun.source === "library" && examRun.exam && (
            <p className="text-xs text-muted mt-3">Đã tải từ thư viện. Bấm “Đề khác” để ra đề mới.</p>
          )}
          {examRun.error && <p className="text-bad text-sm mt-3">{examRun.error}</p>}
          {examRun.loading && (
            <GenProgress
              startedAt={examRun.startedAt}
              bytes={examRun.bytes}
              estMs={examRun.size === 40 ? 270000 : 120000}
              estBytes={examRun.size === 40 ? 14000 : 6500}
              label={`Đang biên soạn đề ${examRun.size} câu…`}
            />
          )}
        </>
      )}

      {examRun.exam && !examRun.loading && !session.started && !examState.submitted && (
        <Card className="mt-4 text-center">
          <GraduationCap size={28} className="mx-auto text-accent mb-2" />
          <div className="font-semibold text-white">Sẵn sàng làm bài</div>
          <p className="text-sm text-muted mt-1 mb-4">
            {examRun.exam.sections.reduce((n, s) => n + s.questions.length, 0)} câu ·{" "}
            {examRun.size === 40 ? "50 phút" : "25 phút"} · bấm bắt đầu là tính giờ và khoá chuyển tab.
          </p>
          <Button onClick={startTest} className="mx-auto">
            <Play size={18} /> Bắt đầu làm bài
          </Button>
        </Card>
      )}

      {testInProgress && (
        <div className="flex items-center gap-2 text-xs text-muted mt-1 mb-1">
          <Lock size={13} /> Đang làm bài — đã khoá chuyển tab cho tới khi nộp/hết giờ.
        </div>
      )}

      {examRun.exam && !examRun.loading && (session.started || examState.submitted) && (
        <ExamPlayer
          exam={examRun.exam}
          state={examState}
          endsAt={session.started && !examState.submitted ? session.endsAt : undefined}
          onChange={(next) => {
            setExamState(next);
            if (next.submitted) finishTest();
          }}
          onTimeUp={() => {
            setExamState({ ...examState, submitted: true });
            finishTest();
          }}
          onRetry={() => {
            setExamState({ answers: {}, submitted: false });
            setSession({ started: false, endsAt: 0 });
          }}
        />
      )}
    </div>
  );
}
