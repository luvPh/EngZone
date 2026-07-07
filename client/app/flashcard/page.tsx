"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Layers, GraduationCap, Sparkles, RotateCcw, Network, ClipboardCheck, Headphones, Mic } from "lucide-react";
import { PageHeader, Segmented, Button } from "@/components/ui";
import VocabPractice from "@/components/VocabPractice";
import CardCarousel from "@/components/CardCarousel";
import DictationPractice from "@/components/DictationPractice";
import SpeakingPractice from "@/components/SpeakingPractice";
import FamilyPractice from "@/components/FamilyPractice";
import FamilyMindmap from "@/components/FamilyMindmap";
import { getLibrary } from "@/lib/library";
import { extractJson } from "@/lib/extractJson";
import { recordActivity } from "@/lib/storage";
import { addVocab, studyBatch, poolStats, dueCount, type PoolWord } from "@/lib/vocabPool";
import { getFamilies, studyFamilies, familyStats, type FamilyEntry } from "@/lib/wordFamily";
import type { FlashSet } from "@/lib/types";

type Phase = "setup" | "study" | "playing" | "done";
type Tab = "vocab" | "family" | "dictation" | "speaking";

// Review the batch as flip cards before the test starts.
function StudyCards({
  words,
  onStart,
  onBack,
}: {
  words: PoolWord[];
  onStart: () => void;
  onBack: () => void;
}) {
  const cards = words.map((w) => ({
    word: w.word,
    meaning: w.meaning,
    ipa: w.ipa,
    example: w.example,
    note: w.pos ? `(${w.pos})` : undefined,
  }));
  return (
    <div className="animate-fade-up">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm text-muted">
          Ôn lại <span className="font-semibold text-fg">{words.length}</span> từ rồi bấm kiểm tra
        </p>
        <button onClick={onBack} className="text-xs text-muted hover:text-fg">
          Quay lại
        </button>
      </div>
      <CardCarousel cards={cards} />
      <Button onClick={onStart} className="mt-5 w-full justify-center">
        <ClipboardCheck size={18} /> Kiểm tra
      </Button>
    </div>
  );
}

// Bring vocab from previously-generated flashcard sets into the pool (idempotent).
function seedFromLibrary() {
  for (const it of getLibrary()) {
    if (it.feature !== "flash") continue;
    const set = extractJson<FlashSet>(it.content);
    if (set?.cards?.length) {
      addVocab(
        set.cards.map((c) => ({ word: c.word, meaning: c.meaning, ipa: c.ipa, example: c.example })),
        it.topic
      );
    }
  }
}

function StatBox({ value, label, cls }: { value: number; label: string; cls: string }) {
  return (
    <div className="glass rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center text-center min-h-[120px]">
      <div className={`text-4xl font-extrabold leading-none ${cls}`}>{value}</div>
      <div className="text-xs text-muted mt-2">{label}</div>
    </div>
  );
}

const EmptyCTA = ({ what }: { what: string }) => (
  <div className="reading-surface rounded-2xl p-8 text-center">
    <GraduationCap size={30} className="mx-auto text-accent mb-3" />
    <p className="text-muted font-medium">{what}</p>
    <p className="text-muted text-sm mt-1 mb-4">
      Tạo một bài ở “Vocab with Essay” — từ vựng & họ từ của bài sẽ tự lưu vào đây.
    </p>
    <Link href="/essay">
      <Button>
        <Sparkles size={18} /> Tạo Vocab with Essay
      </Button>
    </Link>
  </div>
);

export default function PracticePage() {
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<Tab>("vocab");

  // Vocab (meaning) practice
  const [phase, setPhase] = useState<Phase>("setup");
  const [size, setSize] = useState<10 | 15 | 20>(10);
  const [batch, setBatch] = useState<PoolWord[]>([]);
  const [lastCorrect, setLastCorrect] = useState(0);
  const [stats, setStats] = useState({ total: 0, mastered: 0, learning: 0 });
  const [due, setDue] = useState(0);

  // Word-family (form transformation) practice
  const [fPhase, setFPhase] = useState<Phase>("setup");
  const [fBatch, setFBatch] = useState<FamilyEntry[]>([]);
  const [fLast, setFLast] = useState(0);
  const [fStats, setFStats] = useState({ total: 0, mastered: 0, learning: 0 });
  const [families, setFamilies] = useState<FamilyEntry[]>([]);

  const refresh = () => {
    setStats(poolStats());
    setDue(dueCount());
    setFStats(familyStats());
    setFamilies(getFamilies());
  };
  useEffect(() => {
    seedFromLibrary();
    setMounted(true);
    refresh();
  }, []);

  const start = () => {
    const b = studyBatch(size);
    if (!b.length) return;
    setBatch(b);
    setLastCorrect(0);
    setPhase("study");
    recordActivity({ feature: "flash", topic: "luyện từ" });
  };
  const finish = (correct: number) => {
    setLastCorrect(correct);
    refresh();
    setPhase("done");
  };

  const fStart = () => {
    const b = studyFamilies(8);
    if (!b.length) return;
    setFBatch(b);
    setFLast(0);
    setFPhase("playing");
    recordActivity({ feature: "flash", topic: "họ từ" });
  };
  const fFinish = (correct: number) => {
    setFLast(correct);
    refresh();
    setFPhase("done");
  };

  if (!mounted) return null;

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Luyện từ"
        subtitle="Ôn nghĩa từ + luyện chuyển dạng họ từ (Word Family). Từ vựng đến từ Vocab with Essay."
        icon={<Layers size={20} />}
      />

      <div className="mb-5">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: "vocab", label: <><Layers size={15} /> Ôn nghĩa</> },
            { value: "family", label: <><Network size={15} /> Họ từ</> },
            { value: "dictation", label: <><Headphones size={15} /> Nghe chép</> },
            { value: "speaking", label: <><Mic size={15} /> Nói</> },
          ]}
        />
      </div>

      {tab === "vocab" ? (
        stats.total === 0 ? (
          <EmptyCTA what="Kho từ đang trống" />
        ) : phase === "setup" ? (
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="grid grid-cols-3 gap-3 flex-1">
              <StatBox value={stats.total} label="Tổng" cls="text-fg" />
              <StatBox value={stats.mastered} label="Đã thuộc" cls="text-ok" />
              <StatBox value={stats.learning} label="Đang học" cls="text-accent-soft" />
            </div>
            <div className="glass rounded-2xl p-5 lg:w-80 shrink-0 flex flex-col justify-center">
              {stats.learning === 0 ? (
                <p className="text-muted text-sm">Bạn đã thuộc tất cả! Tạo thêm Vocab with Essay để có từ mới.</p>
              ) : (
                <>
                  <div className="mb-3 text-sm">
                    {due > 0 ? (
                      <span className="text-accent-soft font-semibold">🔁 {due} từ đến hạn ôn hôm nay</span>
                    ) : (
                      <span className="text-muted">Chưa có từ đến hạn — ôn sớm cũng được 👍</span>
                    )}
                  </div>
                  <div className="text-sm font-medium text-muted mb-1.5">Số từ mỗi lượt</div>
                  <Segmented
                    fullWidth
                    value={size}
                    onChange={(v) => setSize(v)}
                    options={[
                      { value: 10, label: "10" },
                      { value: 15, label: "15" },
                      { value: 20, label: "20" },
                    ]}
                  />
                  <Button onClick={start} className="mt-5 w-full justify-center">
                    <GraduationCap size={18} /> Bắt đầu luyện
                  </Button>
                </>
              )}
            </div>
          </div>
        ) : phase === "study" ? (
          <StudyCards
            words={batch}
            onStart={() => setPhase("playing")}
            onBack={() => setPhase("setup")}
          />
        ) : phase === "playing" ? (
          <VocabPractice words={batch} onDone={finish} />
        ) : (
          <div className="glass rounded-2xl p-6 text-center">
            <div className="text-3xl font-extrabold text-fg">{lastCorrect}/{batch.length}</div>
            <p className="text-muted text-sm mt-1 mb-1">câu đúng lượt này</p>
            <p className="text-sm text-ok mb-5">Đã thuộc {stats.mastered}/{stats.total} từ</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={start} disabled={stats.learning === 0}>
                <RotateCcw size={16} /> Luyện tiếp
              </Button>
              <Button variant="ghost" onClick={() => setPhase("setup")}>Xong</Button>
            </div>
          </div>
        )
      ) : tab === "dictation" ? (
        <DictationPractice />
      ) : tab === "speaking" ? (
        <SpeakingPractice />
      ) : fStats.total === 0 ? (
        <EmptyCTA what="Chưa có họ từ nào" />
      ) : fPhase === "playing" ? (
        <FamilyPractice families={fBatch} onDone={fFinish} />
      ) : fPhase === "done" ? (
        <div className="glass rounded-2xl p-6 text-center">
          <div className="text-3xl font-extrabold text-fg">{fLast}/{fBatch.length}</div>
          <p className="text-muted text-sm mt-1 mb-1">câu đúng lượt này</p>
          <p className="text-sm text-ok mb-5">Đã thuộc {fStats.mastered}/{fStats.total} họ từ</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={fStart} disabled={fStats.learning === 0}>
              <RotateCcw size={16} /> Luyện tiếp
            </Button>
            <Button variant="ghost" onClick={() => setFPhase("setup")}>Xong</Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="grid grid-cols-3 gap-3 flex-1">
              <StatBox value={fStats.total} label="Họ từ" cls="text-fg" />
              <StatBox value={fStats.mastered} label="Đã thuộc" cls="text-ok" />
              <StatBox value={fStats.learning} label="Đang học" cls="text-accent-soft" />
            </div>
            <div className="glass rounded-2xl p-5 lg:w-80 shrink-0 flex flex-col justify-center">
              {fStats.learning === 0 ? (
                <p className="text-muted text-sm">Đã thuộc hết họ từ! Tạo thêm Vocab with Essay để có thêm.</p>
              ) : (
                <Button onClick={fStart} className="w-full justify-center">
                  <GraduationCap size={18} /> Luyện chuyển dạng
                </Button>
              )}
            </div>
          </div>

          <h2 className="text-sm font-semibold text-muted mb-3">Sơ đồ họ từ</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {families.map((f) => (
              <div key={f.root} className="glass rounded-2xl p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-fg">{f.root}</span>
                  {f.mastered && <span className="text-xs text-ok">đã thuộc ✓</span>}
                </div>
                <FamilyMindmap family={f} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
