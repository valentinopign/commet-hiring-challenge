/** All outgoing layers, including the reversed background entrance, finish before reveal. */
export function getHandoffTiming(reduced: boolean) {
  return reduced
    ? { layer: 0, stagger: 0, background: 0, backgroundStagger: 0, exit: 0, reveal: 200 }
    : { layer: 600, stagger: 60, background: 1600, backgroundStagger: 120, exit: 1720, reveal: 300 };
}

/** A destination that never renders its dashboard must not leave the outgoing scene covering the page. */
export const destinationWaitLimit = 4000;
