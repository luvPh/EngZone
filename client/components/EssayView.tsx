"use client";

import Markdown from "./Markdown";
import type { Essay } from "@/lib/types";

export default function EssayView({ data }: { data: Essay }) {
  return (
    <div className="mt-5 space-y-5 animate-fade-up">
      <div className="reading-surface rounded-2xl p-5">
        <h2 className="text-lg font-bold text-fg mb-2">Essay</h2>
        <Markdown>{data.essay}</Markdown>
      </div>

      {data.vocab?.length > 0 && (
        <div className="reading-surface rounded-2xl p-5">
          <h2 className="text-lg font-bold text-fg mb-3">
            Vocabulary{" "}
            <span className="text-muted text-sm font-normal">
              ({data.vocab.length} từ)
            </span>
          </h2>
          <ul className="divide-y divide-border">
            {data.vocab.map((v, i) => (
              <li key={i} className="py-2.5">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-semibold text-fg">{v.word}</span>
                  {v.pos && <span className="text-xs text-muted">({v.pos})</span>}
                  {v.ipa && <span className="text-xs text-accent-soft">{v.ipa}</span>}
                  <span className="text-muted text-[15px]">· {v.meaning}</span>
                </div>
                {v.example && (
                  <p className="text-sm text-muted italic mt-0.5">{v.example}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
