"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";

type LensMaps = { width: number; height: number; displacement: string; reflection: string };

/** Rounded-rectangle distance and its outward normal keep the refraction local to the bevel. */
function createLensMaps(width: number, height: number, radius: number): LensMaps | null {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return null;
  const displacement = context.createImageData(width, height);
  const reflection = context.createImageData(width, height);
  const bevel = Math.min(14, radius);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offsetX = x + 0.5 - width / 2;
      const offsetY = y + 0.5 - height / 2;
      const cornerX = Math.abs(offsetX) - (width / 2 - radius);
      const cornerY = Math.abs(offsetY) - (height / 2 - radius);
      const outsideX = Math.max(cornerX, 0);
      const outsideY = Math.max(cornerY, 0);
      const outsideLength = Math.hypot(outsideX, outsideY);
      const distance = outsideLength + Math.min(Math.max(cornerX, cornerY), 0) - radius;
      const depth = -distance;
      const normalX = outsideLength > 0 ? outsideX / outsideLength : cornerX > cornerY ? 1 : 0;
      const normalY = outsideLength > 0 ? outsideY / outsideLength : cornerY >= cornerX ? 1 : 0;
      const signedX = normalX * Math.sign(offsetX);
      const signedY = normalY * Math.sign(offsetY);
      const bend = depth >= 0 && depth < bevel ? Math.sin(Math.PI * depth / bevel) : 0;
      const pixel = (y * width + x) * 4;
      displacement.data[pixel] = Math.round(128 - signedX * bend * 105);
      displacement.data[pixel + 1] = Math.round(128 - signedY * bend * 105);
      displacement.data[pixel + 2] = 128;
      displacement.data[pixel + 3] = 255;

      // Two narrow catches of light describe a polished edge, leaving the center clear.
      const edge = Math.exp(-Math.pow((depth - 1.2) / 1.1, 2));
      const innerEdge = Math.exp(-Math.pow((depth - 5) / 2.2, 2)) * 0.22;
      const light = 0.25 + 0.75 * Math.abs(signedX * 0.65 - signedY * 0.76);
      reflection.data[pixel] = 211;
      reflection.data[pixel + 1] = 228;
      reflection.data[pixel + 2] = 220;
      reflection.data[pixel + 3] = depth >= 0 ? Math.round((edge + innerEdge) * light * 170) : 0;
    }
  }
  context.putImageData(displacement, 0, 0);
  const displacementUrl = canvas.toDataURL();
  context.putImageData(reflection, 0, 0);
  return { width, height, displacement: displacementUrl, reflection: canvas.toDataURL() };
}

/** Only the backdrop is refracted: input text and native controls stay crisp and interactive. */
export function LiquidGlassSurface({ children }: { children: ReactNode }) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const id = `liquid-glass-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const [maps, setMaps] = useState<LensMaps | null>(null);
  const [refracts, setRefracts] = useState(false);

  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return;
    setRefracts(/Chrome|Chromium|Edg\//.test(navigator.userAgent));
    let frame = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const width = Math.round(surface.offsetWidth);
        const height = Math.round(surface.offsetHeight);
        if (width < 2 || height < 2) return;
        const radius = Math.min(28, height / 2, width / 2);
        setMaps(createLensMaps(width, height, radius));
      });
    });
    observer.observe(surface);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, []);

  const style = {
    "--liquid-filter": maps && refracts ? `url("#${id}")` : "blur(0.5px) saturate(115%)",
    "--liquid-reflection": maps ? `url("${maps.reflection}")` : "none",
  } as CSSProperties;

  return (
    <div className="liquid-glass-scene">
      <div ref={surfaceRef} className="liquid-glass-surface" style={style}>
        {maps && <svg aria-hidden="true" width="0" height="0" className="pointer-events-none absolute" focusable="false">
          <defs>
            <filter id={id} x="0" y="0" width={maps.width} height={maps.height} filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
              <feGaussianBlur in="SourceGraphic" stdDeviation="0.35" result="soft-backdrop" />
              <feImage href={maps.displacement} width={maps.width} height={maps.height} result="lens-map" />
              <feDisplacementMap in="soft-backdrop" in2="lens-map" scale="32" xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </defs>
        </svg>}
        <div aria-hidden="true" className="liquid-glass-lens" />
        <div aria-hidden="true" className="liquid-glass-reflection" />
        <div className="liquid-glass-content">{children}</div>
      </div>
    </div>
  );
}
