"use client";

import { BookOpen, MessageCircle, Library } from "lucide-react";
import { PageHeader, Segmented } from "@/components/ui";
import { useFeatureState } from "@/lib/store";
import { useModel } from "@/lib/modelConfig";
import ModelSelector from "@/components/ModelSelector";
import GrammarChat from "@/components/GrammarChat";
import GrammarThemes from "@/components/GrammarThemes";

export default function GrammarPage() {
  const [tab, setTab] = useFeatureState<"ask" | "library">("grammar:tab", "ask");
  const [model, setModel] = useModel("grammar");

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Grammar"
        subtitle="Hỏi AI ngữ pháp tự do, hoặc học theo thư viện bài có sẵn."
        icon={<BookOpen size={20} />}
        right={<ModelSelector value={model} onChange={setModel} />}
      />

      <div className="mb-5">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: "ask", label: <><MessageCircle size={15} /> Hỏi AI</> },
            { value: "library", label: <><Library size={15} /> Thư viện</> },
          ]}
        />
      </div>

      {tab === "ask" ? <GrammarChat provider={model} /> : <GrammarThemes />}
    </div>
  );
}
