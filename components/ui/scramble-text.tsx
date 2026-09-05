"use client";

import React, { useState, useEffect, useRef } from "react";
import { playClick } from "@/lib/audio-synth";

interface ScrambleTextProps {
  text: string;
  className?: string;
  as?: "span" | "div" | "h1" | "h2" | "h3" | "p";
  triggerOnHover?: boolean;
  autoPlay?: boolean;
}

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_#*/%$!?";

export function ScrambleText({
  text,
  className = "",
  as: Component = "span",
  triggerOnHover = true,
  autoPlay = false,
}: ScrambleTextProps) {
  const [displayText, setDisplayText] = useState(text);
  const [isScrambling, setIsScrambling] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startScramble = () => {
    if (isScrambling) return;
    setIsScrambling(true);

    let iteration = 0;
    const maxIterations = text.length;

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setDisplayText(() =>
        text
          .split("")
          .map((char, index) => {
            if (char === " ") return " ";
            if (index < iteration) {
              return text[index];
            }
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          })
          .join("")
      );

      if (iteration >= maxIterations) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setDisplayText(text);
        setIsScrambling(false);
      }

      iteration += 1 / 2;
    }, 28);
  };

  useEffect(() => {
    if (autoPlay) {
      startScramble();
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [text, autoPlay]);

  return (
    <Component
      onMouseEnter={() => {
        if (triggerOnHover) {
          playClick(1500, "sine", 0.015);
          startScramble();
        }
      }}
      className={`inline-block ${className}`}
    >
      {displayText}
    </Component>
  );
}

