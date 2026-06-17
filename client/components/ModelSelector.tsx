"use client";

import { useProviders, type Provider } from "@/lib/modelConfig";

const ORDER: Provider[] = ["claude", "gemini-flash", "gemini-flash-lite"];
const LABELS: Record<Provider, string> = {
  claude: "Claude",
  "gemini-flash": "Flash",
  "gemini-flash-lite": "Lite",
};
const TITLES: Record<Provider, string> = {
  claude: "Claude (subscription)",
  "gemini-flash": "Gemini 3.5 Flash — chất lượng cao (giới hạn ~20 lần/ngày)",
  "gemini-flash-lite": "Gemini 3.1 Flash Lite — rate limit lớn, tiết kiệm",
};

/** Compact per-tab model picker. Controlled by the parent (via useModel). */
export default function ModelSelector({
  value,
  onChange,
}: {
  value: Provider;
  onChange: (p: Provider) => void;
}) {
  const pv = useProviders();

  return (
    <div className="inline-flex items-center rounded-lg bg-surface-2 border border-border p-0.5">
      {ORDER.map((p) => {
        const available = p === "claude" ? pv.claude : pv.gemini;
        const active = value === p;
        return (
          <button
            key={p}
            type="button"
            disabled={!available}
            onClick={() => onChange(p)}
            title={available ? TITLES[p] : `${LABELS[p]} chưa cấu hình (thêm GEMINI_API_KEY)`}
            className={`px-2 py-1 rounded-md text-xs font-medium transition ${
              active
                ? "bg-accent text-white"
                : available
                  ? "text-muted hover:text-white"
                  : "text-muted/40 cursor-not-allowed"
            }`}
          >
            {LABELS[p]}
          </button>
        );
      })}
    </div>
  );
}
