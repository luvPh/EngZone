"use client";

import { useEffect } from "react";
import { Layers, Sparkles, RefreshCw } from "lucide-react";
import {
  PageHeader,
  Field,
  TextInput,
  LevelSlider,
  Button,
  Spinner,
  Card,
} from "@/components/ui";
import CardCarousel from "@/components/CardCarousel";
import ModelSelector from "@/components/ModelSelector";
import { useModel } from "@/lib/modelConfig";
import { useFeatureState } from "@/lib/store";
import { runCommand } from "@/lib/stream";
import { flashCommand } from "@/lib/prompts";
import { extractJson } from "@/lib/extractJson";
import { recordActivity } from "@/lib/storage";
import { listItems, addItem } from "@/lib/library";
import type { FlashSet } from "@/lib/types";

interface State {
  topic: string;
  level: number;
  loading: boolean;
  error: string;
  set: FlashSet | null;
  source: "" | "new" | "library";
}

const KEY = "flash";

export default function FlashcardPage() {
  const [s, set] = useFeatureState<State>(`${KEY}:state`, {
    topic: "",
    level: 3,
    loading: false,
    error: "",
    set: null,
    source: "",
  });
  const [flashPrefill, setFlashPrefill] = useFeatureState<string>("prefill:flashTopic", "");
  const [model, setModel] = useModel("flashcard");

  useEffect(() => {
    if (!flashPrefill) return;
    set((p) => ({ ...p, topic: flashPrefill }));
    setFlashPrefill("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flashPrefill]);

  const generate = (forceNew = false) => {
    const topic = s.topic.trim();
    if (!topic || s.loading) return;

    // Mọi bộ thẻ đã tạo cho chủ đề+level này (mới nhất trước).
    const prevSets = listItems("flash", topic, s.level);

    // Nút chính: nếu đã có bộ trong thư viện thì tải bộ MỚI NHẤT (đỡ tốn token).
    if (!forceNew && prevSets.length) {
      const parsed = extractJson<FlashSet>(prevSets[0].content);
      if (parsed?.cards?.length) {
        set((p) => ({ ...p, set: parsed, error: "", source: "library" }));
        return;
      }
    }

    set((p) => ({ ...p, loading: true, error: "", set: null, source: "new" }));
    recordActivity({ feature: "flash", topic, level: s.level });

    // Tránh lặp: loại mọi từ đã xuất hiện ở TẤT CẢ bộ trước (+ bộ đang hiện).
    const prevWords = prevSets.flatMap(
      (it) => extractJson<FlashSet>(it.content)?.cards?.map((c) => c.word) ?? []
    );
    const shown = s.set?.cards?.map((c) => c.word) ?? [];
    const avoid = Array.from(new Set([...shown, ...prevWords]));

    runCommand(KEY, flashCommand(topic, s.level, 10, avoid), {
      onText: () => {}, // gen ngầm — chỉ render thẻ đã parse
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
        // Tích lũy: LƯU THÀNH BỘ MỚI (không ghi đè bộ cũ cùng chủ đề).
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
    }, { provider: model, maxTokens: 4000 }); // 10 thẻ cần nhiều token hơn
  };

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Flashcard"
        subtitle="10 thẻ từ vựng mỗi bộ; bấm “Tạo mới” để thêm bộ khác (không ghi đè)."
        icon={<Layers size={20} />}
        right={<ModelSelector value={model} onChange={setModel} />}
      />

      <Card>
        <Field label="Chủ đề">
          <TextInput
            value={s.topic}
            onChange={(e) => set((p) => ({ ...p, topic: e.target.value }))}
            placeholder="vd: emotions, work, travel…"
          />
        </Field>
        <div className="mb-4">
          <LevelSlider value={s.level} onChange={(level) => set((p) => ({ ...p, level }))} />
        </div>
        <div className="flex gap-2">
          <Button onClick={() => generate(false)} disabled={s.loading || !s.topic.trim()}>
            {s.loading ? <Spinner /> : <Sparkles size={18} />}
            {s.loading ? "Đang tạo…" : "Tạo flashcard"}
          </Button>
          {s.set && !s.loading && (
            <Button variant="ghost" onClick={() => generate(true)}>
              <RefreshCw size={16} /> Tạo mới
            </Button>
          )}
        </div>
      </Card>

      {s.source === "library" && s.set && (
        <p className="text-xs text-muted mt-3">
          Đã tải từ thư viện (cùng chủ đề + độ khó). Bấm “Tạo mới” để tạo bộ khác.
        </p>
      )}
      {s.error && <p className="text-bad text-sm mt-3">{s.error}</p>}

      {s.loading && (
        <div className="mt-5 flex items-center gap-2 text-muted text-sm">
          <Spinner /> Đang tạo bộ thẻ…
        </div>
      )}

      {s.set && !s.loading && <CardCarousel cards={s.set.cards} />}
    </div>
  );
}
