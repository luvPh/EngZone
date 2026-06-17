"use client";

import Markdown from "./Markdown";
import { Spinner } from "./ui";

export default function OutputPanel({
  output,
  loading,
  emptyHint,
}: {
  output: string;
  loading: boolean;
  emptyHint?: string;
}) {
  if (!output && !loading) {
    return (
      <div className="mt-5 text-center text-muted text-sm py-12 border border-dashed border-border rounded-2xl">
        {emptyHint ?? "Kết quả sẽ hiện ở đây."}
      </div>
    );
  }

  return (
    <div className="mt-5 reading-surface rounded-2xl p-5 min-h-[80px] animate-fade-up">
      {output ? (
        <Markdown>{output}</Markdown>
      ) : (
        <div className="flex items-center gap-2 text-muted text-sm">
          <Spinner />
          Đang tạo…
        </div>
      )}
      {output && loading && (
        <span className="inline-block w-2 h-4 bg-accent/70 animate-pulse align-middle ml-0.5" />
      )}
    </div>
  );
}
