"use client";

import Markdown from "./Markdown";
import type { Essay } from "@/lib/types";

export default function EssayView({ data }: { data: Essay }) {
  return (
    <div className="mt-5 space-y-5 animate-fade-up">
      <div className="bg-surface border border-border rounded-2xl p-5 shadow-card">
        <h2 className="text-lg font-bold text-white mb-2">Essay</h2>
        <Markdown>{data.essay}</Markdown>
      </div>

      {data.vocab?.length > 0 && (
        <div className="bg-surface border border-border rounded-2xl p-5 shadow-card">
          <h2 className="text-lg font-bold text-white mb-3">
            Vocabulary{" "}
            <span className="text-muted text-sm font-normal">
              ({data.vocab.length} từ)
            </span>
          </h2>
          <ul className="divide-y divide-border">
            {data.vocab.map((v, i) => (
              <li
                key={i}
                className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-3 py-2.5"
              >
                <span className="font-semibold text-white sm:w-48 sm:shrink-0">
                  {v.word}
                </span>
                <span className="text-slate-300 text-[15px]">{v.meaning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
