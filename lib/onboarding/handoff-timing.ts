/** Reveal is delayed until the spatial handoff has completely settled. */
export function getHandoffTiming(reduced: boolean) {
  return reduced
    ? { cover: 0, expansion: 0, previewFade: 200, previewDelay: 0, reveal: 200, revealDelay: 0 }
    : { cover: 200, expansion: 1000, previewFade: 250, previewDelay: 0, reveal: 300, revealDelay: 1000 };
}
