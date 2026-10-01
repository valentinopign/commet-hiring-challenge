"use client";

import { useEffect, useRef, useState } from "react";

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

/** Rasterize the ordered dither only on resize; CSS moves the two cached textures. */
export function DitherBackground({ paused }: { paused: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const firstRef = useRef<HTMLCanvasElement>(null);
  const secondRef = useRef<HTMLCanvasElement>(null);
  const rightFirstRef = useRef<HTMLCanvasElement>(null);
  const rightSecondRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let frame = 0;
    function draw() {
      if (!container) return;
      const width = Math.min(640, Math.ceil(container.clientWidth / 3));
      const height = Math.min(400, Math.ceil(container.clientHeight / 3));
      const color = getComputedStyle(container).getPropertyValue("--color-onboarding-dither").trim();
      [firstRef.current, secondRef.current].forEach((canvas, layer) => {
        if (!canvas || !width || !height) return;
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        if (!context) return;
        context.fillStyle = color;
        const phase = layer * 2.1;
        for (let y = 0; y < height; y++) {
          const vertical = y / height;
          for (let x = 0; x < width; x++) {
            const horizontal = x / width;
            const left = Math.exp(-Math.pow((horizontal + 0.08 - 0.1 * Math.sin(vertical * 5 + phase)) / 0.25, 2));
            const right = Math.exp(-Math.pow((horizontal - 1.08 - 0.1 * Math.cos(vertical * 4 + phase)) / 0.25, 2));
            const wave = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(vertical * 9 - horizontal * 5 + phase));
            const quietCenter = 1 - Math.exp(-Math.pow((horizontal - 0.5) / 0.22, 2));
            const intensity = Math.min(0.7, (left + right) * wave * quietCenter * 0.7);
            if (intensity > (BAYER[(y % 4) * 4 + x % 4] + 0.5) / 16) context.fillRect(x, y, 1, 1);
          }
        }
      });
      // Both edges share the original textures, so the resting backdrop is unchanged.
      [rightFirstRef.current, rightSecondRef.current].forEach((canvas, layer) => {
        const source = layer === 0 ? firstRef.current : secondRef.current;
        if (!canvas || !source) return;
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d")?.drawImage(source, 0, 0);
      });
      setReady(true);
    }
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(draw);
    });
    observer.observe(container);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, []);

  return (
    <div ref={containerRef} aria-hidden="true" className={`onboarding-dither pointer-events-none fixed inset-0 -z-10 overflow-hidden ${ready ? "is-ready" : ""} ${paused ? "is-paused" : ""}`}>
      <div className="onboarding-dither-edge onboarding-dither-left">
      <canvas ref={firstRef} className="onboarding-dither-layer onboarding-dither-first" />
      <canvas ref={secondRef} className="onboarding-dither-layer onboarding-dither-second" />
      </div>
      <div className="onboarding-dither-edge onboarding-dither-right">
        <canvas ref={rightFirstRef} className="onboarding-dither-layer onboarding-dither-first" />
        <canvas ref={rightSecondRef} className="onboarding-dither-layer onboarding-dither-second" />
      </div>
    </div>
  );
}
