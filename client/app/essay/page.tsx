"use client";

import { FileText, RefreshCw, BookOpen, Mic, Headphones, Languages } from "lucide-react";
import { PageHeader, LevelSlider, Button, Segmented } from "@/components/ui";
import GenForm from "@/components/GenForm";
import EssayView from "@/components/EssayView";
import SpeakingReader from "@/components/SpeakingReader";
import ListeningDictation from "@/components/ListeningDictation";
import TranslatePractice from "@/components/TranslatePractice";
import Markdown from "@/components/Markdown";
import ModelSelector from "@/components/ModelSelector";
import { useModel } from "@/lib/modelConfig";
import { useFeatureState } from "@/lib/store";
import { runCommand } from "@/lib/stream";
import { essayCommand } from "@/lib/prompts";
import { extractJson } from "@/lib/extractJson";
import { recordActivity } from "@/lib/storage";
import { findItem, saveItem } from "@/lib/library";
import { nextEssayTopic } from "@/lib/topicPool";
import { addVocab, getPool } from "@/lib/vocabPool";
import { addFamilies } from "@/lib/wordFamily";
import type { Essay } from "@/lib/types";

interface Inputs {
  topic: string;
  level: number;
  custom: boolean;
}
interface RunState {
  loading: boolean;
  error: string;
  essay: Essay | null;
  raw: string;
  source: "" | "new" | "library";
  topic: string;
}

const KEY = "essay";

function parseEssay(content: string): Essay | null {
  const obj = extractJson<Essay>(content);
  return obj?.essay ? obj : null;
}

export default function EssayPage() {
  const [inputs, setInputs] = useFeatureState<Inputs>(`${KEY}:inputs`, {
    topic: "",
    level: 3,
    custom: false,
  });
  const [run, setRun] = useFeatureState<RunState>(`${KEY}:run`, {
    loading: false,
    error: "",
    essay: null,
    raw: "",
    source: "",
    topic: "",
  });
  const [model, setModel] = useModel("essay");
  const [mode, setMode] = useFeatureState<"read" | "speak" | "listen" | "translate">(
    "essay:mode",
    "read"
  );

  const generate = (forceNew = false, resolvedTopic?: string) => {
    if (run.loading) return;
    const topic = (
      resolvedTopic ??
      (inputs.custom && inputs.topic.trim() ? inputs.topic.trim() : nextEssayTopic())
    ).trim();

    if (!forceNew) {
      const cached = findItem("essay", topic, inputs.level);
      if (cached) {
        const essay = parseEssay(cached.content);
        if (essay?.vocab?.length) addVocab(essay.vocab, topic);
        if (essay?.families?.length) addFamilies(essay.families);
        setRun({
          loading: false,
          error: "",
          essay,
          raw: essay ? "" : cached.content,
          source: "library",
          topic,
        });
        return;
      }
    }

    setRun({ loading: true, error: "", essay: null, raw: "", source: "new", topic });
    recordActivity({ feature: "essay", topic, level: inputs.level });

    // Chụp pool TRƯỚC khi gen để lọc bỏ từ đã học khỏi vocab sau khi model trả về.
    const known = new Set(getPool().map((w) => w.word.trim().toLowerCase()));
    runCommand(KEY, essayCommand(topic, inputs.level), {
      onText: () => {},
      onDone: (full) => {
        const essay = parseEssay(full);
        if (!essay) {
          setRun({ loading: false, error: "", essay: null, raw: full, source: "new", topic });
          return;
        }
        // Post-filter: chỉ giữ từ MỚI (chưa có trong pool); model đã sinh dư (14-18)
        // nên vẫn còn đủ. Nếu lọc xong còn quá ít (<4) thì giữ nguyên để không trống.
        if (essay.vocab?.length) {
          const fresh = essay.vocab.filter((v) => v.word && !known.has(v.word.trim().toLowerCase()));
          essay.vocab = (fresh.length >= 4 ? fresh : essay.vocab).slice(0, 12);
        }
        setRun({ loading: false, error: "", essay, raw: "", source: "new", topic });
        if (essay.vocab?.length) addVocab(essay.vocab, topic);
        if (essay.families?.length) addFamilies(essay.families);
        saveItem({
          feature: "essay",
          topic,
          level: inputs.level,
          title: `Essay · ${topic} · L${inputs.level}`,
          content: JSON.stringify(essay),
        });
      },
      onError: (msg) =>
        setRun({ loading: false, error: msg, essay: null, raw: "", source: "", topic }),
    }, { provider: model });
  };

  const hasResult = (run.essay || run.raw) && !run.loading;

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Essay"
        subtitle="Tạo bài essay + bộ từ vựng (tự lưu vào kho để Luyện từ)."
        icon={<FileText size={20} />}
        right={<ModelSelector value={model} onChange={setModel} />}
      />

      <GenForm
        custom={inputs.custom}
        onCustomChange={(custom) => setInputs({ ...inputs, custom })}
        topic={inputs.topic}
        onTopicChange={(topic) => setInputs({ ...inputs, topic })}
        loading={run.loading}
        onGenerate={(t) => generate(false, t)}
        label="Tạo Essay"
        placeholder="vd: social media, education, technology…"
      >
        <LevelSlider value={inputs.level} onChange={(level) => setInputs({ ...inputs, level })} />
      </GenForm>

      {hasResult && (
        <div className="flex items-center justify-between gap-3 mt-3">
          <span className="text-xs text-muted">
            Chủ đề: <span className="text-muted font-medium">{run.topic}</span>
            {run.source === "library" && " · đã tải từ thư viện"}
          </span>
          <Button variant="ghost" onClick={() => generate(true)}>
            <RefreshCw size={16} /> Tạo mới
          </Button>
        </div>
      )}
      {run.error && <p className="text-bad text-sm mt-3">{run.error}</p>}

      {run.loading && (
        <div className="mt-5 flex items-center gap-2 text-muted text-sm">
          Đang viết essay về “{run.topic}”…
        </div>
      )}

      {!run.loading && run.essay && (
        <>
          <div className="mt-5">
            <Segmented
              value={mode}
              onChange={setMode}
              options={[
                { value: "read", label: <><BookOpen size={15} /> Bài đọc</> },
                { value: "speak", label: <><Mic size={15} /> Luyện nói</> },
                { value: "listen", label: <><Headphones size={15} /> Nghe chép</> },
                { value: "translate", label: <><Languages size={15} /> Luyện dịch</> },
              ]}
            />
          </div>
          {mode === "read" ? (
            <EssayView data={run.essay} provider={model} topic={run.topic} />
          ) : mode === "speak" ? (
            <div className="mt-5">
              <SpeakingReader text={run.essay.essay} />
            </div>
          ) : mode === "listen" ? (
            <div className="mt-5">
              <ListeningDictation text={run.essay.essay} />
            </div>
          ) : (
            <div className="mt-5">
              <TranslatePractice topic={run.topic} level={inputs.level} provider={model} />
            </div>
          )}
        </>
      )}
      {!run.loading && !run.essay && run.raw && (
        <div className="mt-5 reading-surface rounded-2xl p-5">
          <Markdown>{run.raw}</Markdown>
        </div>
      )}
    </div>
  );
}
