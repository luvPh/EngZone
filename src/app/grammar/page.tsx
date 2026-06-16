"use client";

import { useState } from "react";
import { useChatStream } from "@/components/useChatStream";

const QUICK = [
  "present perfect",
  "articles a/an/the",
  "gerund vs infinitive",
  "conditionals",
];

export default function GrammarPage() {
  const [q, setQ] = useState("");
  const { output, loading, run } = useChatStream();

  return (
    <div>
      <h1>Grammar</h1>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        {QUICK.map((t) => (
          <button key={t} onClick={() => setQ(t)} style={{ fontSize: 13 }}>
            {t}
          </button>
        ))}
      </div>

      <textarea
        rows={2}
        placeholder="Hỏi về ngữ pháp…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      <button
        style={{ marginTop: 12 }}
        disabled={loading || !q.trim()}
        onClick={() => run(`/grammar ${q.trim()}`)}
      >
        {loading ? "Generating…" : "Giải thích"}
      </button>

      {output && <div className="output">{output}</div>}
    </div>
  );
}
