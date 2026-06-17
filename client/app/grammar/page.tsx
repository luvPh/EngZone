"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, ChevronRight, Check, MessageSquare, Library } from "lucide-react";
import { PageHeader, Card, Segmented } from "@/components/ui";
import { useFeatureState } from "@/lib/store";
import { useModel } from "@/lib/modelConfig";
import ModelSelector from "@/components/ModelSelector";
import GrammarChat from "@/components/GrammarChat";
import { LEVELS } from "@/lib/grammar";
import { getAllLessons, type StoredLesson } from "@/lib/grammarLibrary";

const LEVEL_LABEL: Record<string, string> = {
  "A1-A2": "Sơ cấp",
  "B1-B2": "Trung cấp",
  "C1-C2": "Nâng cao",
};

function GrammarCatalog() {
  const [lessons, setLessons] = useState<StoredLesson[] | null>(null);
  useEffect(() => setLessons(getAllLessons()), []);

  if (!lessons) return null; // wait for localStorage (avoids hydration mismatch)

  const learnedCount = lessons.filter((l) => l.learned).length;

  return (
    <div>
      <p className="text-xs text-muted mb-4">
        Đã học {learnedCount}/{lessons.length} bài · nội dung lưu sẵn trên máy bạn.
      </p>
      <div className="space-y-8">
        {LEVELS.map((level) => {
          const items = lessons.filter((l) => l.level === level);
          if (items.length === 0) return null;
          // Categories in first-appearance order within this level.
          const cats: string[] = [];
          for (const l of items) if (!cats.includes(l.category)) cats.push(l.category);
          const doneInLevel = items.filter((l) => l.learned).length;
          return (
            <section key={level}>
              <div className="flex items-center gap-2 mb-3 sticky top-0 bg-bg/80 backdrop-blur py-1 z-[1]">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-accent/15 text-accent">
                  {level}
                </span>
                <h2 className="text-base font-bold text-white">{LEVEL_LABEL[level]}</h2>
                <span className="text-xs text-muted ml-auto">
                  {doneInLevel}/{items.length}
                </span>
              </div>

              <div className="space-y-5">
                {cats.map((cat) => {
                  const catItems = items.filter((l) => l.category === cat);
                  return (
                    <div key={cat}>
                      <h3 className="text-[13px] font-semibold text-muted uppercase tracking-wide mb-2">
                        {cat}
                      </h3>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {catItems.map((l) => (
                          <Link key={l.id} href={`/grammar/${l.slug}`}>
                            <Card className="hover:border-accent/70 transition group h-full">
                              <div className="flex items-start gap-2">
                                <div className="min-w-0 flex-1">
                                  <div className="font-semibold text-white flex items-center gap-2">
                                    {l.titleVi}
                                    {l.learned && (
                                      <Check size={14} className="text-ok shrink-0" />
                                    )}
                                  </div>
                                  <div className="text-xs text-accent-soft">{l.titleEn}</div>
                                  <p className="text-sm text-muted mt-1.5">{l.description}</p>
                                </div>
                                <ChevronRight
                                  size={18}
                                  className="text-muted group-hover:text-accent transition shrink-0 mt-0.5"
                                />
                              </div>
                            </Card>
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

export default function GrammarPage() {
  const [tab, setTab] = useFeatureState<"ask" | "library">("grammar:tab", "ask");
  const [model, setModel] = useModel("grammar");

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Grammar"
        subtitle="Hỏi đáp ngữ pháp tự do, hoặc học theo thư viện bài có sẵn."
        icon={<BookOpen size={20} />}
        right={<ModelSelector value={model} onChange={setModel} />}
      />

      <div className="mb-4">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: "ask", label: "Hỏi đáp" },
            { value: "library", label: "Thư viện" },
          ]}
        />
      </div>

      {tab === "ask" ? <GrammarChat provider={model} /> : <GrammarCatalog />}

      <div className="mt-4 text-xs text-muted flex items-center gap-1.5">
        {tab === "ask" ? (
          <>
            <Library size={13} /> Mẹo: chuyển sang “Thư viện” để học theo chủ đề có sẵn.
          </>
        ) : (
          <>
            <MessageSquare size={13} /> Cần hỏi nhanh? Dùng “Hỏi đáp” hoặc bong bóng tra cứu.
          </>
        )}
      </div>
    </div>
  );
}
