"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { MoveHorizontal, Eye, ShieldAlert, Sparkles } from "lucide-react";

interface CompareLensProps {
  originalUrl: string;
  heatmapUrl: string;
  originalLabel?: string;
  forensicLabel?: string;
  activeLayer: string;
  isAuthentic: boolean;
}

export function CompareLens({
  originalUrl,
  heatmapUrl,
  originalLabel = "SOURCE STREAM [RAW]",
  forensicLabel = "FORENSIC SPECTRUM [ELA / FFT]",
  activeLayer,
  isAuthentic,
}: CompareLensProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.max(0, Math.min((x / rect.width) * 100, 100));
    setSliderPosition(percent);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  const handleMouseDown = () => setIsDragging(true);

  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false);
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handleMove(e.clientX);
      }
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onTouchMove={handleTouchMove}
      className="relative w-full aspect-[16/10] md:aspect-[16/9] bg-[#0A0A0C] overflow-hidden select-none cursor-ew-resize hairline-all group"
      data-cursor="COMPARE"
      data-cursor-variant="scanner"
    >
      {/* Forensic / Heatmap Layer (Underneath / Background) */}
      <div className="absolute inset-0 w-full h-full flex items-center justify-center">
        {/* Generative Forensic Spectrum Visual Filter */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${heatmapUrl})`,
            filter:
              activeLayer === "ela"
                ? "contrast(2.2) saturate(3) hue-rotate(330deg)"
                : activeLayer === "fft"
                ? "grayscale(1) invert(1) contrast(3)"
                : activeLayer === "noise"
                ? "contrast(3) saturate(0) brightness(1.2)"
                : "hue-rotate(180deg) saturate(2.5)",
          }}
        />

        {/* Heatmap overlay grid */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(to right, #FF3B00 1px, transparent 1px), linear-gradient(to bottom, #FF3B00 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Dynamic Anomaly Hotspot Markers */}
        {!isAuthentic && (
          <div className="absolute top-1/3 left-1/3 p-2 bg-[#FF3B00]/90 text-white font-mono text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-lg pointer-events-none animate-pulse">
            <ShieldAlert size={12} />
            <span>ARTIFACT DETECTED Δ 0.94</span>
          </div>
        )}

        <div className="absolute bottom-4 right-4 bg-[#0A0A0C]/90 text-[#FF3B00] font-mono text-[10px] tracking-widest px-2.5 py-1 hairline-dark-all">
          {forensicLabel}
        </div>
      </div>

      {/* Original Source Layer (Clipped by slider) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${sliderPosition}%` }}
      >
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center"
          style={{
            backgroundImage: `url(${originalUrl})`,
            width: containerRef.current ? `${containerRef.current.clientWidth}px` : "100%",
          }}
        />
        <div className="absolute bottom-4 left-4 bg-[#0A0A0C]/90 text-white font-mono text-[10px] tracking-widest px-2.5 py-1 hairline-dark-all">
          {originalLabel}
        </div>
      </div>

      {/* The Split Divider Line with Interactive Handle */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-[#FF3B00] z-20"
        style={{ left: `${sliderPosition}%` }}
      >
        {/* Laser scanner vertical glow line */}
        <div className="absolute -inset-x-1.5 inset-y-0 bg-[#FF3B00]/30 blur-sm pointer-events-none" />

        {/* Center Grab Handle */}
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-none bg-[#0A0A0C] border-2 border-[#FF3B00] text-white flex items-center justify-center shadow-2xl cursor-ew-resize">
          <MoveHorizontal size={14} className="text-[#FF3B00]" />
        </div>

        {/* Top/Bottom Coordinate Notch */}
        <div className="absolute top-2 -translate-x-1/2 px-1 py-0.5 bg-[#0A0A0C] text-[#FF3B00] font-mono text-[8px] whitespace-nowrap">
          {Math.round(sliderPosition)}% SPLIT
        </div>
      </div>

      {/* Top Telemetry overlay */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none font-mono text-[10px] text-white/90 drop-shadow-md">
        <span className="bg-black/60 px-2 py-0.5 backdrop-blur-sm">
          LAYER: {activeLayer.toUpperCase()} FORENSIC MATRIX
        </span>
        <span className="bg-black/60 px-2 py-0.5 backdrop-blur-sm text-[#FF3B00]">
          DRAG TO COMPARE
        </span>
      </div>
    </div>
  );
}

