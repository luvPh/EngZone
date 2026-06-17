"use client";

import { Sparkles } from "lucide-react";
import { Field, TextArea, Button, Spinner, Card } from "@/components/ui";
import OutputPanel from "@/components/OutputPanel";
import { useFeatureState } from "@/lib/store";
import { runCommand } from "@/lib/stream";
import { grammarCommand } from "@/lib/prompts";
import { recordActivity } from "@/lib/storage";

interface State {
  q: string;
  output: string;
  loading: boolean;
}

const KEY = "grammar:chat";

export default function GrammarChat({
  provider,
}: {
  provider?: string;
}) {
  const [s, set] = useFeatureState<State>(KEY, { q: "", output: "", loading: false });

  const ask = () => {
    const q = s.q.trim();
    if (!q || s.loading) return;
    set((p) => ({ ...p, output: "", loading: true }));
    recordActivity({ feature: "grammar", topic: q });
    runCommand(KEY, grammarCommand(q), {
      onText: (full) => set((p) => ({ ...p, output: full })),
      onDone: (full) => set((p) => ({ ...p, output: full, loading: false })),
      onError: (msg) => set((p) => ({ ...p, output: `[lỗi] ${msg}`, loading: false })),
    }, { provider });
  };

  return (
    <div>
      <Card>
        <Field label="Câu hỏi ngữ pháp">
          <TextArea
            rows={2}
            value={s.q}
            onChange={(e) => set((p) => ({ ...p, q: e.target.value }))}
            placeholder="vd: phân biệt since và for; khi nào dùng present perfect…"
          />
        </Field>
        <Button onClick={ask} disabled={s.loading || !s.q.trim()}>
          {s.loading ? <Spinner /> : <Sparkles size={18} />}
          {s.loading ? "Đang giải thích…" : "Giải thích"}
        </Button>
      </Card>

      <OutputPanel
        output={s.output}
        loading={s.loading}
        emptyHint="Nhập câu hỏi ngữ pháp rồi bấm “Giải thích”."
      />
    </div>
  );
}
