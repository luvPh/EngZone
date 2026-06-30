"use client";

import { FileText, RefreshCw } from "lucide-react";
import { PageHeader, LevelSlider, Button } from "@/components/ui";
import GenForm from "@/components/GenForm";
import EssayView from "@/components/EssayView";
import Markdown from "@/components/Markdown";
import ModelSelector from "@/components/ModelSelector";
import { useModel } from "@/lib/modelConfig";
import { useFeatureState } from "@/lib/store";
import { runCommand } from "@/lib/stream";
import { essayCommand } from "@/lib/prompts";
import { extractJson } from "@/lib/extractJson";
import { recordActivity } from "@/lib/storage";
import { findItem, saveItem } from "@/lib/library";
import { randomTopic } from "@/lib/topicPool";
import { addVocab } from "@/lib/vocabPool";
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

  const generate = (forceNew = false, resolvedTopic?: string) => {
    if (run.loading) return;
    const topic = (
      resolvedTopic ??
      (inputs.custom && inputs.topic.trim() ? inputs.topic.trim() : randomTopic())
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

    runCommand(KEY, essayCommand(topic, inputs.level), {
      onText: () => {},
      onDone: (full) => {
        const essay = parseEssay(full);
        if (!essay) {
          setRun({ loading: false, error: "", essay: null, raw: full, source: "new", topic });
          return;
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
        title="Vocab with Essay"
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
        <EssayView data={run.essay} provider={model} topic={run.topic} />
      )}
      {!run.loading && !run.essay && run.raw && (
        <div className="mt-5 reading-surface rounded-2xl p-5">
          <Markdown>{run.raw}</Markdown>
        </div>
      )}
    </div>
  );
}
