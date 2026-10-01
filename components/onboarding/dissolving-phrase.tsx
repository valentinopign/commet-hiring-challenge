"use client";

import { useEffect, useState, type CSSProperties } from "react";

const DITHER_ORDER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const ditherStyle = Object.fromEntries([4, 8, 12, 15].map((threshold, index) => {
  const pixels = DITHER_ORDER.flatMap((value, pixel) => value >= threshold
    ? [`<rect x="${pixel % 4}" y="${Math.floor(pixel / 4)}" width="1" height="1" fill="white"/>`]
    : []).join("");
  const mask = `<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4" viewBox="0 0 4 4" shape-rendering="crispEdges">${pixels}</svg>`;
  return [`--dither-${index + 1}`, `url("data:image/svg+xml,${encodeURIComponent(mask)}")`];
})) as CSSProperties;

/** Decorative character spans keep the same dissolve for the intro and its handoff. */
export function DissolvingPhrase({ text, leaving }: { text: string; leaving: boolean }) {
  const [dollarPositions, setDollarPositions] = useState<Set<number>>(() => new Set());
  useEffect(() => {
    // Choose once per phrase, after hydration; changing the exit state keeps the same positions.
    const positions = new Set<number>();
    let position = 0;
    for (const character of Array.from(text)) {
      if (character === " ") continue;
      if (/[a-z]/i.test(character) && Math.random() < 0.45) positions.add(position);
      position++;
    }
    setDollarPositions(positions);
  }, [text]);
  let characterIndex = 0;
  const words = text.split(" ");
  return (
    <span aria-hidden="true" style={ditherStyle} className={`onboarding-phrase ${leaving ? "is-leaving" : ""}`}>
      {words.map((word, wordIndex) => (
        <span key={wordIndex} className="inline-block whitespace-nowrap">
          {Array.from(word).map((character) => {
            const index = characterIndex++;
            const style = {
              "--letter-enter": `${index * 14}ms`,
              "--letter-exit": `${(text.length - 1 - index) * 15}ms`,
            } as CSSProperties;
            return (
              <span key={index} className="onboarding-character" style={style}>
                <span className="onboarding-letter">{character}</span>
                {dollarPositions.has(index) && <span className="onboarding-dollar">$</span>}
              </span>
            );
          })}
          {wordIndex < words.length - 1 ? "\u00a0" : ""}
        </span>
      ))}
    </span>
  );
}
