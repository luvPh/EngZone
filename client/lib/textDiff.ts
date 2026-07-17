"use client";

// Shared word-level comparison for read-aloud (speech) and dictation (typing):
// split a passage into sentences, then mark which target words the learner
// actually produced, in order.

export const normWord = (s: string) => s.toLowerCase().replace(/[^a-z']/g, "");

/** Split a passage into trimmed sentences (drops fragments with no letters). */
export function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.replace(/[^a-z]/gi, "").length > 0);
}

/** Longest-common-subsequence: which of `a` appear (in order) inside `b`. */
export function lcsMatched(a: string[], b: string[]): boolean[] {
  const n = a.length;
  const m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++)
    for (let j = 1; j <= m; j++)
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
  const matched = new Array(n).fill(false);
  let i = n;
  let j = m;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      matched[i - 1] = true;
      i--;
      j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) i--;
    else j--;
  }
  return matched;
}

export interface WordScore {
  matched: boolean[]; // per display token of the target sentence
  score: number; // 0..100 over real words
}

/** Compare what the learner produced against a target sentence, word by word. */
export function scoreSentence(target: string, produced: string): WordScore {
  const displayTokens = target.match(/\S+/g) ?? [];
  const targetNorm = displayTokens.map(normWord);
  const producedNorm = (produced.match(/\S+/g) ?? []).map(normWord).filter(Boolean);
  const matched = lcsMatched(targetNorm, producedNorm);
  const realIdx = targetNorm.map((w, k) => (w ? k : -1)).filter((k) => k >= 0);
  const hit = realIdx.filter((k) => matched[k]).length;
  const score = realIdx.length ? Math.round((hit / realIdx.length) * 100) : 0;
  return { matched, score };
}
