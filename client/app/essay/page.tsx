"use client";

import { FileText, Sparkles, RefreshCw } from "lucide-react";
import {
  PageHeader,
  Field,
  TextInput,
  LevelSlider,
  Button,
  Spinner,
  Card,
} from "@/components/ui";
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
import type { Essay } from "@/lib/types";

interface Inputs {
  topic: string;
  level: number;
}
interface RunState {
  loading: boolean;
  error: string;
  essay: Essay | null;
  raw: string; // fallback if JSON parse fails
  source: "" | "new" | "library";
}

const KEY = "essay";

// Old library items stored plain markdown; new ones store JSON. Handle both.
function parseEssay(content: string): Essay | null {
  const obj = extractJson<Essay>(content);
  if (obj?.essay) return obj;
  return null;
}

export default function EssayPage() {
  const [inputs, setInputs] = useFeatureState<Inputs>(`${KEY}:inputs`, {
    topic: "",
    level: 3,
  });
  const [run, setRun] = useFeatureState<RunState>(`${KEY}:run`, {
    loading: false,
    error: "",
    essay: null,
    raw: "",
    source: "",
  });
  const [model, setModel] = useModel("essay");

  const generate = (forceNew = false) => {
    const topic = inputs.topic.trim();
    if (!topic || run.loading) return;

    if (!forceNew) {
      const cached = findItem("essay", topic, inputs.level);
      if (cached) {
        const essay = parseEssay(cached.content);
        setRun({
          loading: false,
          error: "",
          essay,
          raw: essay ? "" : cached.content,
          source: "library",
        });
        return;
      }
    }

    setRun({ loading: true, error: "", essay: null, raw: "", source: "new" });
    recordActivity({ feature: "essay", topic, level: inputs.level });

    runCommand(KEY, essayCommand(topic, inputs.level), {
      onText: () => {}, // gen ngầm; UI hiện loader rồi render gọn gàng
      onDone: (full) => {
        const essay = parseEssay(full);
        if (!essay) {
          setRun({ loading: false, error: "", essay: null, raw: full, source: "new" });
          return;
        }
        setRun({ loading: false, error: "", essay, raw: "", source: "new" });
        saveItem({
          feature: "essay",
          topic,
          level: inputs.level,
          title: `Essay · ${topic} · L${inputs.level}`,
          content: JSON.stringify(essay),
        });
      },
      onError: (msg) =>
        setRun({ loading: false, error: msg, essay: null, raw: "", source: "" }),
    }, { provider: model });
  };

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Essay"
        subtitle="Bài essay + danh sách từ vựng."
        icon={<FileText size={20} />}
        right={<ModelSelector value={model} onChange={setModel} />}
      />

      <Card>
        <Field label="Chủ đề">
          <TextInput
            value={inputs.topic}
            onChange={(e) => setInputs({ ...inputs, topic: e.target.value })}
            placeholder="vd: social media, education, technology…"
          />
        </Field>
        <div className="mb-4">
          <LevelSlider
            value={inputs.level}
            onChange={(level) => setInputs({ ...inputs, level })}
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={() => generate(false)} disabled={run.loading || !inputs.topic.trim()}>
            {run.loading ? <Spinner /> : <Sparkles size={18} />}
            {run.loading ? "Đang tạo…" : "Tạo essay"}
          </Button>
          {(run.essay || run.raw) && !run.loading && (
            <Button variant="ghost" onClick={() => generate(true)}>
              <RefreshCw size={16} /> Tạo mới
            </Button>
          )}
        </div>
      </Card>

      {run.source === "library" && (
        <p className="text-xs text-muted mt-3">
          Đã tải từ thư viện. Bấm “Tạo mới” để viết bài khác.
        </p>
      )}
      {run.error && <p className="text-bad text-sm mt-3">{run.error}</p>}

      {run.loading && (
        <div className="mt-5 flex items-center gap-2 text-muted text-sm">
          <Spinner /> Đang viết essay…
        </div>
      )}

      {!run.loading && run.essay && <EssayView data={run.essay} />}
      {!run.loading && !run.essay && run.raw && (
        <div className="mt-5 bg-surface border border-border rounded-2xl p-5 shadow-card">
          <Markdown>{run.raw}</Markdown>
        </div>
      )}
    </div>
  );
}
