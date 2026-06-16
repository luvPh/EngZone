"use client";

import { useState } from "react";
import { useChatStream } from "@/components/useChatStream";

export default function FlashcardPage() {
  const [topic, setTopic] = useState("emotions");
  const { output, loading, run } = useChatStream();

  return (
    <div>
      <h1>Flashcard</h1>
      <label>Topic</label>
      <input value={topic} onChange={(e) => setTopic(e.target.value)} />

      <button
        style={{ marginTop: 12 }}
        disabled={loading || !topic.trim()}
        onClick={() => run(`/flash ${topic.trim()}`)}
      >
        {loading ? "Generating…" : "Tạo flashcard"}
      </button>

      {/* MVP: render raw text. TODO: parse 6 cards → flip-card UI. */}
      {output && <div className="output">{output}</div>}
    </div>
  );
}
