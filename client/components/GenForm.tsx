"use client";

import { Sparkles } from "lucide-react";
import { Spinner, TextInput } from "./ui";
import { randomTopic } from "@/lib/topicPool";

// Shared "generate" form for Quiz / Essay / Flashcard:
// left = controls (a "tự điền chủ đề" checkbox + optional topic input + the
// children, e.g. level/count/type); right = one big highlighted "Tạo" button.
// By default the topic is left blank → a random popular topic is chosen on gen.
export default function GenForm({
  custom,
  onCustomChange,
  topic,
  onTopicChange,
  loading,
  onGenerate,
  label,
  placeholder,
  children,
}: {
  custom: boolean;
  onCustomChange: (v: boolean) => void;
  topic: string;
  onTopicChange: (v: string) => void;
  loading: boolean;
  onGenerate: (resolvedTopic: string) => void;
  label: string;
  placeholder?: string;
  children?: React.ReactNode;
}) {
  const run = () => {
    if (loading) return;
    const t = custom && topic.trim() ? topic.trim() : randomTopic();
    onGenerate(t);
  };

  return (
    <div className="glass rounded-2xl p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row gap-5">
        <div className="flex-1 min-w-0 space-y-4">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={custom}
              onChange={(e) => onCustomChange(e.target.checked)}
              className="w-4 h-4 accent-accent"
            />
            <span className="text-sm font-medium text-slate-200">Tự điền chủ đề</span>
            {!custom && (
              <span className="text-xs text-muted">· mặc định: chủ đề ngẫu nhiên</span>
            )}
          </label>

          {custom && (
            <TextInput
              value={topic}
              onChange={(e) => onTopicChange(e.target.value)}
              placeholder={placeholder}
              autoFocus
            />
          )}

          {children}
        </div>

        <button
          type="button"
          onClick={run}
          disabled={loading}
          className="sm:w-48 shrink-0 rounded-2xl px-5 py-4 min-h-[120px] sm:min-h-0 flex flex-col items-center justify-center gap-2 font-bold text-white bg-gradient-to-br from-accent to-accent-soft shadow-glow-accent hover:brightness-110 active:scale-[0.98] transition disabled:opacity-60"
        >
          {loading ? <Spinner className="w-6 h-6" /> : <Sparkles size={26} />}
          <span className="text-base">{loading ? "Đang tạo…" : label}</span>
        </button>
      </div>
    </div>
  );
}
