"use client";

import { Sparkles, Trash2 } from "lucide-react";
import { TextArea, Button, Spinner, Card } from "@/components/ui";
import { useFeatureState } from "@/lib/store";
import { runChat, type ChatMessage } from "@/lib/stream";
import { grammarChatTurn } from "@/lib/prompts";
import { recordActivity } from "@/lib/storage";
import Markdown from "@/components/Markdown";

interface State {
  q: string;
  messages: ChatMessage[]; // display history (raw text); RAM only, resets on reload
  streaming: string; // current assistant reply being streamed
  loading: boolean;
}

const KEY = "grammar:chat";
const INIT: State = { q: "", messages: [], streaming: "", loading: false };

export default function GrammarChat({ provider }: { provider?: string }) {
  const [s, set] = useFeatureState<State>(KEY, INIT);

  const ask = () => {
    const q = s.q.trim();
    if (!q || s.loading) return;
    const history: ChatMessage[] = [...s.messages, { role: "user", content: q }];
    set((p) => ({ ...p, q: "", messages: history, streaming: "", loading: true }));
    recordActivity({ feature: "grammar", topic: q });

    // Wire messages: wrap each user turn with the concise directive.
    const wire: ChatMessage[] = history.map((m) =>
      m.role === "user" ? { role: "user", content: grammarChatTurn(m.content) } : m
    );

    runChat(
      KEY,
      wire,
      {
        onText: (full) => set((p) => ({ ...p, streaming: full })),
        onDone: (full) =>
          set((p) => ({
            ...p,
            messages: [...p.messages, { role: "assistant", content: full }],
            streaming: "",
            loading: false,
          })),
        onError: (msg) =>
          set((p) => ({
            ...p,
            messages: [...p.messages, { role: "assistant", content: `[lỗi] ${msg}` }],
            streaming: "",
            loading: false,
          })),
      },
      { provider }
    );
  };

  const reset = () => set(() => INIT);

  return (
    <div>
      <Card>
        <TextArea
          rows={2}
          value={s.q}
          onChange={(e) => set((p) => ({ ...p, q: e.target.value }))}
          placeholder="vd: phân biệt since và for; khi nào dùng present perfect…"
        />
        <div className="flex items-center gap-2 mt-3">
          <Button onClick={ask} disabled={s.loading || !s.q.trim()}>
            {s.loading ? <Spinner /> : <Sparkles size={18} />}
            {s.loading ? "Đang trả lời…" : "Gửi"}
          </Button>
          {s.messages.length > 0 && (
            <Button variant="ghost" onClick={reset} disabled={s.loading}>
              <Trash2 size={16} /> Xoá hội thoại
            </Button>
          )}
        </div>
      </Card>

      <div className="mt-4 space-y-3">
        {s.messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === "user"
                ? "glass-input rounded-2xl px-4 py-3 text-sm text-slate-200"
                : "reading-surface rounded-2xl px-4 py-3"
            }
          >
            {m.role === "user" ? m.content : <Markdown>{m.content}</Markdown>}
          </div>
        ))}
        {s.loading && (
          <div className="reading-surface rounded-2xl px-4 py-3">
            {s.streaming ? (
              <Markdown>{s.streaming}</Markdown>
            ) : (
              <div className="flex items-center gap-2 text-muted text-sm">
                <Spinner /> Đang trả lời…
              </div>
            )}
          </div>
        )}
        {s.messages.length === 0 && !s.loading && (
          <p className="text-muted text-sm text-center py-8">
            Đặt câu hỏi ngữ pháp để bắt đầu hội thoại.
          </p>
        )}
      </div>

      <p className="mt-3 text-xs text-muted/70">
        Hội thoại không được lưu — tải lại trang sẽ xoá lịch sử.
      </p>
    </div>
  );
}
