import type { CSSProperties } from "react";

const DITHER_ORDER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

export const ditherMasks = [4, 8, 12, 15].map((threshold) => {
  const pixels = DITHER_ORDER.flatMap((value, pixel) => value >= threshold
    ? [`<rect x="${pixel % 4}" y="${Math.floor(pixel / 4)}" width="1" height="1" fill="white"/>`]
    : []).join("");
  const mask = `<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4" viewBox="0 0 4 4" shape-rendering="crispEdges">${pixels}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(mask)}")`;
});

export const ditherStyle = Object.fromEntries(ditherMasks.map((mask, index) => [`--dither-${index + 1}`, mask])) as CSSProperties;
