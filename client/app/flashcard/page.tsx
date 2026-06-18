"use client";

import { useEffect } from "react";
import { Layers, RefreshCw } from "lucide-react";
import { PageHeader, LevelSlider, Button } from "@/components/ui";
import GenForm from "@/components/GenForm";
import CardCarousel from "@/components/CardCarousel";
import ModelSelector from "@/components/ModelSelector";
import { useModel } from "@/lib/modelConfig";
import { useFeatureState } from "@/lib/store";
import { runCommand } from "@/lib/stream";
import { flashCommand } from "@/lib/prompts";
import { extractJson } from "@/lib/extractJson";
import { recordActivity } from "@/lib/storage";
import { listItems, addItem } from "@/lib/library";
import { randomTopic } from "@/lib/topicPool";
import type { FlashSet } from "@/lib/types";

interface State {
  topic: string;
  level: number;
  custom: boolean;
  loading: boolean;
  error: string;
  set: FlashSet | null;
  source: "" | "new" | "library";
  genTopic: string;
}

const KEY = "flash";

export default function FlashcardPage() {
  const [s, set] = useFeatureState<State>(`${KEY}:state`, {
    topic: "",
    level: 3,
    custom: false,
    loading: false,
    error: "",
    set: null,
    source: "",
    genTopic: "",
  });
  const [flashPrefill, setFlashPrefill] = useFeatureState<string>("prefill:flashTopic", "");
  const [model, setModel] = useModel("flashcard");

  // Cross-link from a grammar lesson: prefill + switch to custom topic.
  useEffect(() => {
    if (!flashPrefill) return;
    set((p) => ({ ...p, topic: flashPrefill, custom: true }));
    setFlashPrefill("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flashPrefill]);

  const generate = (forceNew = false, resolvedTopic?: string) => {
    if (s.loading) return;
    const topic = (
      resolvedTopic ?? (s.custom && s.topic.trim() ? s.topic.trim() : randomTopic())
    ).trim();

    const prevSets = listItems("flash", topic, s.level);

    if (!forceNew && prevSets.length) {
      const parsed = extractJson<FlashSet>(prevSets[0].content);
      if (parsed?.cards?.length) {
        set((p) => ({ ...p, set: parsed, error: "", source: "library", genTopic: topic }));
        return;
      }
    }

    set((p) => ({ ...p, loading: true, error: "", set: null, source: "new", genTopic: topic }));
    recordActivity({ feature: "flash", topic, level: s.level });

    const prevWords = prevSets.flatMap(
      (it) => extractJson<FlashSet>(it.content)?.cards?.map((c) => c.word) ?? []
    );
    const shown = s.set?.cards?.map((c) => c.word) ?? [];
    const avoid = Array.from(new Set([...shown, ...prevWords]));

    runCommand(KEY, flashCommand(topic, s.level, 10, avoid), {
      onText: () => {},
      onDone: (full) => {
        const parsed = extractJson<FlashSet>(full);
        if (!parsed?.cards?.length) {
          set((p) => ({
            ...p,
            loading: false,
            error: "Không phân tích được thẻ. Thử tạo lại nhé.",
          }));
          return;
        }
        set((p) => ({ ...p, loading: false, set: parsed, source: "new" }));
        const n = listItems("flash", topic, s.level).length + 1;
        addItem({
          feature: "flash",
          topic,
          level: s.level,
          title: `Flashcard · ${topic} · L${s.level} · bộ ${n}`,
          content: JSON.stringify(parsed),
        });
      },
      onError: (msg) => set((p) => ({ ...p, loading: false, error: msg })),
    }, { provider: model, maxTokens: 4000 });
  };

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Flashcard"
        subtitle="10 thẻ từ vựng mỗi bộ; bấm “Tạo mới” để thêm bộ khác (không ghi đè)."
        icon={<Layers size={20} />}
        right={<ModelSelector value={model} onChange={setModel} />}
      />

      <GenForm
        custom={s.custom}
        onCustomChange={(custom) => set((p) => ({ ...p, custom }))}
        topic={s.topic}
        onTopicChange={(topic) => set((p) => ({ ...p, topic }))}
        loading={s.loading}
        onGenerate={(t) => generate(false, t)}
        label="Tạo Flashcard"
        placeholder="vd: emotions, work, travel…"
      >
        <LevelSlider value={s.level} onChange={(level) => set((p) => ({ ...p, level }))} />
      </GenForm>

      {s.set && !s.loading && (
        <div className="flex items-center justify-between gap-3 mt-3">
          <span className="text-xs text-muted">
            Chủ đề: <span className="text-slate-300 font-medium">{s.genTopic}</span>
            {s.source === "library" && " · đã tải từ thư viện"}
          </span>
          <Button variant="ghost" onClick={() => generate(true)}>
            <RefreshCw size={16} /> Tạo mới
          </Button>
        </div>
      )}
      {s.error && <p className="text-bad text-sm mt-3">{s.error}</p>}

      {s.loading && (
        <div className="mt-5 flex items-center gap-2 text-muted text-sm">
          Đang tạo bộ thẻ về “{s.genTopic}”…
        </div>
      )}

      {s.set && !s.loading && <CardCarousel cards={s.set.cards} />}
    </div>
  );
}
