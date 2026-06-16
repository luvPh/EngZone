"use client";

import { useState } from "react";
import { useChatStream } from "@/components/useChatStream";

const TOPICS = [
  "articles",
  "present perfect",
  "modal verbs",
  "prepositions",
  "conditionals",
  "passive voice",
];

export default function QuizPage() {
  const [topic, setTopic] = useState(TOPICS[0]);
  const [level, setLevel] = useState(2);
  const { output, loading, run } = useChatStream();

  return (
    <div>
      <h1>Quiz</h1>
      <label>Topic</label>
      <select value={topic} onChange={(e) => setTopic(e.target.value)}>
        {TOPICS.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>

      <label style={{ marginTop: 12, display: "block" }}>Level: {level}</label>
      <input
        type="range"
        min={1}
        max={5}
        value={level}
        onChange={(e) => setLevel(Number(e.target.value))}
      />

      <button
        style={{ marginTop: 12 }}
        disabled={loading}
        onClick={() => run(`/quiz ${topic} ${level}`)}
      >
        {loading ? "Generating…" : "Tạo quiz"}
      </button>

      {output && <div className="output">{output}</div>}
    </div>
  );
}
