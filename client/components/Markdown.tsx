"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

export default function Markdown({ children }: { children: string }) {
  return (
    <div className="prose-claude">
      {/* remark-breaks: render single newlines as <br> so model line-by-line
          formatting (English / Vietnamese on separate lines) shows correctly. */}
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
