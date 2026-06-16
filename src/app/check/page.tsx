"use client";

import { useState } from "react";
import { useChatStream } from "@/components/useChatStream";

export default function CheckPage() {
  const [text, setText] = useState("");
  const { output, loading, run } = useChatStream();

  return (
    <div>
      <h1>Error Checker</h1>
      <textarea
        rows={5}
        placeholder="Dán đoạn văn tiếng Anh cần sửa…"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <button
        style={{ marginTop: 12 }}
        disabled={loading || !text.trim()}
        onClick={() => run(`/check ${text.trim()}`)}
      >
        {loading ? "Checking…" : "Sửa lỗi"}
      </button>

      {output && <div className="output">{output}</div>}
    </div>
  );
}
