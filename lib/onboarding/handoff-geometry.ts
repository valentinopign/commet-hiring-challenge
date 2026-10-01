type Rectangle = { left: number; top: number; width: number; height: number };

/** Physical viewport bounds keep the handoff aligned even inside CSS/browser zoom. */
export function handoffTransform(rectangle: Rectangle, width: number, height: number, viewportHeight?: number): string {
  const visibleHeight = Math.max(1, viewportHeight === undefined ? rectangle.height : Math.min(rectangle.height, Math.max(1, viewportHeight - rectangle.top)));
  return `translate(${rectangle.left}px, ${rectangle.top}px) scale(${Math.max(1, rectangle.width) / Math.max(1, width)}, ${visibleHeight / Math.max(1, height)})`;
}
