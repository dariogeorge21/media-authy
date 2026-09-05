"use client";

import React, { useEffect, useState } from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";

export function CustomCursor() {
  const [cursorText, setCursorText] = useState("");
  const [cursorVariant, setCursorVariant] = useState<"default" | "hover" | "action" | "scanner">("default");
  const [isVisible, setIsVisible] = useState(false);

  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  const springConfig = { damping: 28, stiffness: 350, mass: 0.5 };
  const cursorX = useSpring(mouseX, springConfig);
  const cursorY = useSpring(mouseY, springConfig);

  useEffect(() => {
    // Only activate custom cursor on fine pointer devices (desktop)
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const moveMouse = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const cursorAttr = target.closest("[data-cursor]");
      const clickableAttr = target.closest("button, a, input, [role='button']");

      if (cursorAttr) {
        const text = cursorAttr.getAttribute("data-cursor") || "";
        const variant = (cursorAttr.getAttribute("data-cursor-variant") as "action" | "scanner" | "hover") || "action";
        setCursorText(text);
        setCursorVariant(variant);
      } else if (clickableAttr) {
        setCursorText("");
        setCursorVariant("hover");
      } else {
        setCursorText("");
        setCursorVariant("default");
      }
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    window.addEventListener("mousemove", moveMouse);
    document.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", moveMouse);
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [isVisible, mouseX, mouseY]);

  if (!isVisible) return null;

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-50 flex items-center justify-center font-mono text-[10px] tracking-wider uppercase"
      style={{
        x: cursorX,
        y: cursorY,
        translateX: "-50%",
        translateY: "-50%",
      }}
    >
      {cursorVariant === "default" && (
        <div className="h-2.5 w-2.5 rounded-full bg-[#0A0A0C] opacity-80 mix-blend-difference" />
      )}

      {cursorVariant === "hover" && (
        <div className="h-8 w-8 rounded-full border border-[#0A0A0C]/40 bg-[#0A0A0C]/[0.04] transition-all duration-200 flex items-center justify-center">
          <div className="h-1.5 w-1.5 rounded-full bg-[#FF3B00]" />
        </div>
      )}

      {cursorVariant === "action" && (
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.6, opacity: 0 }}
          className="h-16 w-16 rounded-full bg-[#0A0A0C] text-white flex flex-col items-center justify-center px-2 text-center shadow-lg"
        >
          <span className="text-[9px] font-bold tracking-widest text-[#FF3B00] leading-none mb-0.5">●</span>
          <span className="text-[8px] font-mono leading-tight">{cursorText}</span>
        </motion.div>
      )}

      {cursorVariant === "scanner" && (
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative h-14 w-14 border border-[#FF3B00] rounded-none flex items-center justify-center bg-[#FF3B00]/10 backdrop-blur-[1px]"
        >
          <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-[#FF3B00]" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-[#FF3B00]" />
          <span className="text-[8px] text-[#FF3B00] font-mono font-bold tracking-tighter">
            {cursorText || "SCAN"}
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}

