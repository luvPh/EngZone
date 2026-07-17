"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Volume2 } from "lucide-react";
import { speak as ttsSpeak } from "@/lib/tts";
import type { Flashcard } from "@/lib/types";

export default function CardCarousel({ cards }: { cards: Flashcard[] }) {
  const [i, setI] = useState(0);
  const [revealed, setRevealed] = useState(false);

  if (cards.length === 0) return null;
  const card = cards[Math.min(i, cards.length - 1)];

  const go = (delta: number) => {
    setRevealed(false);
    setI((prev) => (prev + delta + cards.length) % cards.length);
  };

  const speak = () => ttsSpeak(card.word);

  return (
    <div className="mt-5">
      <div className="flex items-center justify-between mb-3 text-sm text-muted">
        <span>
          Thẻ {i + 1} / {cards.length}
        </span>
        <span>Bấm thẻ để xem nghĩa</span>
      </div>

      <div
        onClick={() => setRevealed((r) => !r)}
        className="bg-gradient-to-br from-surface to-surface-2 border border-border rounded-3xl p-6 min-h-[20rem] flex flex-col shadow-card cursor-pointer select-none animate-fade-up"
      >
        {/* Front: word */}
        <div className="flex items-start justify-between">
          <div>
            <div className="text-3xl font-bold text-fg">{card.word}</div>
            {card.ipa && (
              <div className="text-muted mt-1 font-mono text-sm">{card.ipa}</div>
            )}
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              speak();
            }}
            className="text-muted hover:text-accent p-1.5 rounded-lg hover:bg-accent-weak"
            aria-label="Phát âm"
          >
            <Volume2 size={20} />
          </button>
        </div>

        {card.example && (
          <p className="mt-4 text-muted italic">“{card.example}”</p>
        )}

        {/* Back: meaning + note */}
        <div className="mt-auto pt-5">
          {revealed ? (
            <div className="animate-fade-up border-t border-border pt-4">
              <div className="text-lg text-fg font-semibold">{card.meaning}</div>
              {card.note && <p className="text-muted text-sm mt-2">{card.note}</p>}
            </div>
          ) : (
            <div className="text-center text-muted text-sm border-t border-border pt-4">
              Nghĩa đang ẩn — bấm để hiện
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mt-4">
        <button
          onClick={() => go(-1)}
          className="inline-flex items-center gap-1 px-4 py-2.5 rounded-xl bg-accent-weak border border-border hover:bg-accent-weak transition"
        >
          <ChevronLeft size={18} /> Trước
        </button>
        <div className="flex gap-1.5">
          {cards.map((_, idx) => (
            <span
              key={idx}
              className={`w-1.5 h-1.5 rounded-full ${
                idx === i ? "bg-accent" : "bg-border"
              }`}
            />
          ))}
        </div>
        <button
          onClick={() => go(1)}
          className="inline-flex items-center gap-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-accent to-accent-soft text-white font-semibold hover:brightness-110 transition"
        >
          Tiếp <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
