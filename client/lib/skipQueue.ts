// Shared "skip" queue for practice drills.
//
// A session walks `order` (a list of item indices) by position. Skipping an item
// counts as a wrong answer AND pushes that item to the END of the queue so it
// comes back later in the same session — but only ONCE, so a learner can't loop
// forever by skipping the same item every time it reappears.

export interface SkipState {
  /** Item indices in the order they'll be shown; grows when an item is requeued. */
  order: number[];
  /** Item indices already requeued once (never requeued again). */
  requeued: number[];
}

export function initSkip(count: number): SkipState {
  return { order: Array.from({ length: count }, (_, i) => i), requeued: [] };
}

/**
 * Skip the item at `pos`. Returns the updated state plus whether the session has
 * another item after `pos` (false → the drill is finished).
 */
export function skipCurrent(
  s: SkipState,
  pos: number
): { next: SkipState; hasMore: boolean } {
  const cur = s.order[pos];
  const already = cur === undefined || s.requeued.includes(cur);
  const order = already ? s.order : [...s.order, cur];
  const requeued = already ? s.requeued : [...s.requeued, cur];
  return { next: { order, requeued }, hasMore: pos < order.length - 1 };
}
