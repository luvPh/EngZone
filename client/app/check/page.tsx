"use client";

import { SpellCheck, Sparkles } from "lucide-react";
import { PageHeader, Field, TextArea, Button, Spinner, Card } from "@/components/ui";
import OutputPanel from "@/components/OutputPanel";
import ModelSelector from "@/components/ModelSelector";
import { useModel } from "@/lib/modelConfig";
import { useFeatureState } from "@/lib/store";
import { runCommand } from "@/lib/stream";
import { checkCommand } from "@/lib/prompts";
import { recordActivity } from "@/lib/storage";

interface State {
  text: string;
  output: string;
  loading: boolean;
}

const KEY = "check";

export default function CheckPage() {
  const [s, set] = useFeatureState<State>(`${KEY}:state`, {
    text: "",
    output: "",
    loading: false,
  });
  const [model, setModel] = useModel("check");

  const check = () => {
    const text = s.text.trim();
    if (!text || s.loading) return;
    set((p) => ({ ...p, output: "", loading: true }));
    recordActivity({ feature: "check" }); // không lưu nội dung (privacy)
    runCommand(KEY, checkCommand(text), {
      onText: (full) => set((p) => ({ ...p, output: full })),
      onDone: (full) => set((p) => ({ ...p, output: full, loading: false })),
      onError: (msg) => set((p) => ({ ...p, output: `[error] ${msg}`, loading: false })),
    }, { provider: model });
  };

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Error Checker"
        subtitle="Dán đoạn văn tiếng Anh — AI sửa lỗi theo mức độ."
        icon={<SpellCheck size={20} />}
        right={<ModelSelector value={model} onChange={setModel} />}
      />

      <Card>
        <Field label="Đoạn văn cần kiểm tra">
          <TextArea
            rows={5}
            value={s.text}
            onChange={(e) => set((p) => ({ ...p, text: e.target.value }))}
            placeholder="Nhập hoặc dán tiếng Anh ở đây…"
          />
        </Field>
        <Button onClick={check} disabled={s.loading || !s.text.trim()}>
          {s.loading ? <Spinner /> : <Sparkles size={18} />}
          {s.loading ? "Đang kiểm tra…" : "Sửa lỗi"}
        </Button>
      </Card>

      <OutputPanel
        output={s.output}
        loading={s.loading}
        emptyHint="Nhập đoạn văn rồi bấm “Sửa lỗi”."
      />
    </div>
  );
}
