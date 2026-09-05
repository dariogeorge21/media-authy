"use client";

import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { playClick } from "@/lib/audio-synth";

interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  strength?: number;
  dataCursor?: string;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "signal";
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export function MagneticButton({
  children,
  className = "",
  strength = 20,
  dataCursor,
  variant = "primary",
  onClick,
  ...props
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    setPosition({
      x: (middleX / width) * strength,
      y: (middleY / height) * strength,
    });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseEnter = () => {
    playClick(1400, "sine", 0.02);
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    playClick(1800, "triangle", 0.04);
    if (onClick) onClick(e);
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "primary":
        return "bg-[#0A0A0C] text-[#FBFBFA] hover:bg-[#1A1A1F] border border-[#0A0A0C]";
      case "signal":
        return "bg-[#FF3B00] text-white hover:bg-[#E03400] border border-[#FF3B00] shadow-sm";
      case "outline":
        return "bg-transparent text-[#0A0A0C] border border-[#0A0A0C] hover:bg-[#0A0A0C] hover:text-[#FBFBFA]";
      case "secondary":
        return "bg-[#F2F2EE] text-[#0A0A0C] border border-[#E5E5DE] hover:border-[#0A0A0C]";
      case "ghost":
        return "bg-transparent text-[#0A0A0C] hover:bg-[#F2F2EE]";
      default:
        return "";
    }
  };

  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      onClick={handleClick}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", damping: 15, stiffness: 200, mass: 0.1 }}
      data-cursor={dataCursor}
      className={`relative inline-flex items-center justify-center font-mono text-xs uppercase tracking-widest px-6 py-3.5 transition-colors cursor-pointer select-none ${getVariantStyles()} ${className}`}
      {...(props as any)}
    >
      {children}
    </motion.button>
  );
}

