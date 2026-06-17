"use client";

import { useEffect } from "react";
import { ListChecks, Sparkles, RefreshCw, GraduationCap, Play, Lock } from "lucide-react";
import {
  PageHeader,
  Field,
  TextInput,
  LevelSlider,
  Segmented,
  Button,
  Spinner,
  Card,
} from "@/components/ui";
import QuizPlayer, { type QuizGameState } from "@/components/QuizPlayer";
import ExamPlayer, { type ExamState } from "@/components/ExamPlayer";
import GenProgress from "@/components/GenProgress";
import ModelSelector from "@/components/ModelSelector";
import { useModel } from "@/lib/modelConfig";
import { useFeatureState } from "@/lib/store";
import { runCommand } from "@/lib/stream";
import { quizCommand, examCommand, type QuizType } from "@/lib/prompts";
import { extractJson } from "@/lib/extractJson";
import { recordActivity } from "@/lib/storage";
import { findItem, saveItem } from "@/lib/library";
import type { Quiz, Exam } from "@/lib/types";

type Mode = "practice" | "exam";
type ExamSize = 20 | 40;

interface Inputs {
  topic: string;
  level: number;
  count: number;
  type: QuizType;
}
interface RunState {
  loading: boolean;
  error: string;
  quiz: Quiz | null;
  source: "" | "new" | "library";
}
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

export default function QuizPage() {
  const [mode, setMode] = useFeatureState<Mode>(`${KEY}:mode`, "practice");
  const [model, setModel] = useModel("quiz");

  // --- Practice mode state ---
  const [inputs, setInputs] = useFeatureState<Inputs>(`${KEY}:inputs`, {
    topic: "",
    level: 2,
    count: 5,
    type: "mcq",
  });
  const [run, setRun] = useFeatureState<RunState>(`${KEY}:run`, {
    loading: false,
    error: "",
    quiz: null,
    source: "",
  });
  const [game, setGame] = useFeatureState<QuizGameState>(`${KEY}:game`, {
    answers: {},
    submitted: false,
  });

  // --- Exam mode state ---
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
  // Test session (separate from ExamState so ExamPlayer's onChange can't clobber it).
  const [session, setSession] = useFeatureState<{ started: boolean; endsAt: number }>(
    `${KEY}:session`,
    { started: false, endsAt: 0 }
  );
  const [, setNavLocked] = useFeatureState<boolean>("nav:locked", false);
  // Topic prefilled from a grammar lesson cross-link.
  const [quizPrefill, setQuizPrefill] = useFeatureState<string>("prefill:quizTopic", "");

  const testInProgress = session.started && !examState.submitted;

  useEffect(() => {
    if (!quizPrefill) return;
    setInputs((i) => ({ ...i, topic: quizPrefill }));
    setMode("practice");
    setQuizPrefill("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizPrefill]);

  // Warn before unloading the page while a timed test is running.
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

  const generate = (forceNew = false) => {
    const topic = inputs.topic.trim();
    if (!topic || run.loading) return;
    setGame({ answers: {}, submitted: false });

    const meta = { count: inputs.count, type: inputs.type };
    if (!forceNew) {
      const cached = findItem("quiz", topic, inputs.level, meta);
      if (cached) {
        const quiz = extractJson<Quiz>(cached.content);
        if (quiz?.questions?.length) {
          setRun({ loading: false, error: "", quiz, source: "library" });
          return;
        }
      }
    }

    setRun({ loading: true, error: "", quiz: null, source: "new" });
    recordActivity({ feature: "quiz", topic, level: inputs.level });

    runCommand(KEY, quizCommand({ topic, level: inputs.level, ...meta, fresh: forceNew }), {
      onText: () => {},
      onDone: (full) => {
        const quiz = extractJson<Quiz>(full);
        if (!quiz?.questions?.length) {
          setRun({ loading: false, error: "Không phân tích được quiz. Thử lại nhé.", quiz: null, source: "" });
          return;
        }
        setRun({ loading: false, error: "", quiz, source: "new" });
        saveItem({
          feature: "quiz",
          topic,
          level: inputs.level,
          meta,
          title: `Quiz · ${topic} · L${inputs.level}`,
          content: JSON.stringify(quiz),
        });
      },
      onError: (msg) => setRun({ loading: false, error: msg, quiz: null, source: "" }),
    }, { provider: model });
  };

  const generateExam = (forceNew = false) => {
    if (examRun.loading) return;
    const size = examRun.size;
    setExamState({ answers: {}, submitted: false });
    setSession({ started: false, endsAt: 0 });
    setNavLocked(false);

    const meta = { kind: "exam", size };
    const base = { size, startedAt: 0, bytes: 0 };
    if (!forceNew) {
      const cached = findItem("quiz", "Đề thi THPT", undefined, meta);
      if (cached) {
        const exam = extractJson<Exam>(cached.content);
        if (exam?.sections?.length) {
          setExamRun({ ...base, loading: false, error: "", exam, source: "library" });
          return;
        }
      }
    }

    setExamRun({
      ...base,
      loading: true,
      error: "",
      exam: null,
      source: "new",
      startedAt: Date.now(),
    });
    recordActivity({ feature: "quiz", topic: "THPT exam" });

    // Exams are long — give the model more token headroom + drive a progress bar.
    runCommand(
      KEY,
      examCommand(size),
      {
        onText: (full) =>
          setExamRun((p) => (p.loading ? { ...p, bytes: full.length } : p)),
        onDone: (full) => {
          const exam = extractJson<Exam>(full);
          if (!exam?.sections?.length) {
            setExamRun((p) => ({ ...p, loading: false, error: "Không phân tích được đề. Thử tạo lại nhé.", exam: null }));
            return;
          }
          setExamRun((p) => ({ ...p, loading: false, error: "", exam, source: "new" }));
          saveItem({
            feature: "quiz",
            topic: "Đề thi THPT",
            meta,
            title: `Đề thi THPT · ${size} câu`,
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
        title="Quiz"
        subtitle="Luyện tập theo chủ đề hoặc làm đề thi thử THPT."
        icon={<ListChecks size={20} />}
        right={!testInProgress && <ModelSelector value={model} onChange={setModel} />}
      />

      {!testInProgress && (
        <div className="mb-4">
          <Segmented
            value={mode}
            onChange={setMode}
            options={[
              { value: "practice", label: "Luyện tập" },
              { value: "exam", label: "Đề thi THPT" },
            ]}
          />
        </div>
      )}

      {mode === "practice" ? (
        <>
          <Card>
            <Field label="Chủ đề">
              <TextInput
                value={inputs.topic}
                onChange={(e) => setInputs({ ...inputs, topic: e.target.value })}
                placeholder="vd: present perfect, articles, prepositions…"
              />
            </Field>
            <div className="mb-4">
              <LevelSlider value={inputs.level} onChange={(level) => setInputs({ ...inputs, level })} />
            </div>
            <div className="flex flex-wrap gap-5">
              <div>
                <div className="text-sm font-medium text-slate-300 mb-1.5">Số câu</div>
                <Segmented
                  value={inputs.count}
                  onChange={(count) => setInputs({ ...inputs, count })}
                  options={[
                    { value: 3, label: "3" },
                    { value: 5, label: "5" },
                    { value: 10, label: "10" },
                  ]}
                />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-300 mb-1.5">Dạng câu</div>
                <Segmented
                  value={inputs.type}
                  onChange={(type) => setInputs({ ...inputs, type })}
                  options={[
                    { value: "mcq", label: "Trắc nghiệm" },
                    { value: "fill", label: "Điền từ" },
                    { value: "mixed", label: "Hỗn hợp" },
                  ]}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <Button onClick={() => generate(false)} disabled={run.loading || !inputs.topic.trim()}>
                {run.loading ? <Spinner /> : <Sparkles size={18} />}
                {run.loading ? "Đang tạo…" : "Tạo quiz"}
              </Button>
              {run.quiz && !run.loading && (
                <Button variant="ghost" onClick={() => generate(true)}>
                  <RefreshCw size={16} /> Tạo mới
                </Button>
              )}
            </div>
          </Card>

          {run.source === "library" && run.quiz && (
            <p className="text-xs text-muted mt-3">
              Đã tải từ thư viện. Bấm “Tạo mới” để tạo bộ khác.
            </p>
          )}
          {run.error && <p className="text-bad text-sm mt-3">{run.error}</p>}
          {run.loading && (
            <div className="mt-5 flex items-center gap-2 text-muted text-sm">
              <Spinner /> Đang tạo {inputs.count} câu hỏi…
            </div>
          )}
          {run.quiz && !run.loading && (
            <QuizPlayer
              questions={run.quiz.questions}
              state={game}
              onChange={setGame}
              onRetry={() => setGame({ answers: {}, submitted: false })}
            />
          )}
        </>
      ) : (
        <>
          {/* Config + generate — hidden while a timed test is running */}
          {!testInProgress && (
            <>
              <Card>
                <p className="text-sm text-muted mb-4">
                  Đề thi thử theo cấu trúc tốt nghiệp THPT 2025: trắc nghiệm A/B/C/D,
                  đủ 4 dạng bài (điền thông tin · sắp xếp câu · điền câu thiếu · đọc
                  hiểu). Thời gian: 25 phút (rút gọn) / 50 phút (đầy đủ).
                </p>
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
                    {examRun.loading ? "Đang ra đề…" : "Tạo đề thi"}
                  </Button>
                  {examRun.exam && !examRun.loading && (
                    <Button variant="ghost" onClick={() => generateExam(true)}>
                      <RefreshCw size={16} /> Đề khác
                    </Button>
                  )}
                </div>
              </Card>

              {examRun.source === "library" && examRun.exam && (
                <p className="text-xs text-muted mt-3">
                  Đã tải từ thư viện. Bấm “Đề khác” để ra đề mới.
                </p>
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

          {/* Start gate: exam ready, not yet started */}
          {examRun.exam && !examRun.loading && !session.started && !examState.submitted && (
            <Card className="mt-4 text-center">
              <GraduationCap size={28} className="mx-auto text-accent mb-2" />
              <div className="font-semibold text-white">Sẵn sàng làm bài</div>
              <p className="text-sm text-muted mt-1 mb-4">
                {examRun.exam.sections.reduce((n, s) => n + s.questions.length, 0)} câu ·{" "}
                {examRun.size === 40 ? "50 phút" : "25 phút"} · bấm bắt đầu là tính giờ và
                khoá chuyển tab.
              </p>
              <Button onClick={startTest} className="mx-auto">
                <Play size={18} /> Bắt đầu làm bài
              </Button>
            </Card>
          )}

          {/* In-progress notice */}
          {testInProgress && (
            <div className="flex items-center gap-2 text-xs text-muted mt-1 mb-1">
              <Lock size={13} /> Đang làm bài — đã khoá chuyển tab cho tới khi nộp/hết giờ.
            </div>
          )}

          {/* The exam itself: only after starting (or to show results after submit) */}
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
        </>
      )}
    </div>
  );
}
