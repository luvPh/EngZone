"use client";

// Text-to-speech via the browser's Web Speech Synthesis. The browser default
// voice for a language is often the oldest/most robotic one, so we score the
// available English voices and pick the most natural — and let the user override.

const KEY = "engzone:tts:voice";

// Natural-sounding macOS voices (Chrome on macOS exposes the system voices).
const GOOD_NAMES = ["samantha", "ava", "allison", "susan", "zoe", "evan", "nathan", "noelle", "tom"];

/** Higher = more natural. Tuned for Chrome (Google voices) + macOS system voices. */
export function scoreVoice(v: SpeechSynthesisVoice): number {
  const n = v.name.toLowerCase();
  let s = 0;
  if (n.includes("natural")) s += 100; // Edge "Online (Natural)"
  else if (n.includes("premium")) s += 95; // macOS downloaded premium
  else if (n.includes("enhanced")) s += 85; // macOS enhanced
  else if (n.includes("google")) s += 75; // Chrome network voice
  else if (GOOD_NAMES.some((g) => n.includes(g))) s += 55;
  if (n.includes("compact")) s -= 60; // legacy low-quality
  if (v.lang === "en-US") s += 10;
  else if (v.lang === "en-GB") s += 6;
  else if (v.lang.startsWith("en")) s += 4;
  return s;
}

export function getEnglishVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !window.speechSynthesis) return [];
  return window.speechSynthesis
    .getVoices()
    .filter((v) => v.lang.toLowerCase().startsWith("en"))
    .sort((a, b) => scoreVoice(b) - scoreVoice(a));
}

/** Voices load asynchronously in Chrome — subscribe until they're available. */
export function onVoicesChanged(cb: () => void): () => void {
  if (typeof window === "undefined" || !window.speechSynthesis) return () => {};
  window.speechSynthesis.addEventListener("voiceschanged", cb);
  return () => window.speechSynthesis.removeEventListener("voiceschanged", cb);
}

export function getPreferredVoiceName(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(KEY) || "";
}

export function setPreferredVoiceName(name: string): void {
  if (typeof window === "undefined") return;
  if (name) localStorage.setItem(KEY, name);
  else localStorage.removeItem(KEY);
}

/** The user's pick if it still exists, otherwise the best-scoring English voice. */
export function resolveVoice(): SpeechSynthesisVoice | null {
  const voices = getEnglishVoices();
  if (!voices.length) return null;
  const preferred = getPreferredVoiceName();
  return voices.find((v) => v.name === preferred) ?? voices[0];
}

export function cancelSpeak(): void {
  if (typeof window !== "undefined") window.speechSynthesis?.cancel();
}

/** Speak English text with the best available voice. */
export function speak(text: string, rate = 1): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const u = new SpeechSynthesisUtterance(text);
  const v = resolveVoice();
  if (v) {
    u.voice = v;
    u.lang = v.lang;
  } else {
    u.lang = "en-US";
  }
  u.rate = rate;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}
