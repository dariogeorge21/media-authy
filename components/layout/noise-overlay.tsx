"use client";

import React from "react";

export function NoiseOverlay() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-40 opacity-[0.028] mix-blend-multiply"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
      }}
    />
  );
}

export function GridLinesBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 flex justify-between px-6 md:px-12 max-w-7xl mx-auto opacity-30"
    >
      <div className="w-px h-full bg-[#0A0A0C]/[0.06]" />
      <div className="w-px h-full bg-[#0A0A0C]/[0.06] hidden md:block" />
      <div className="w-px h-full bg-[#0A0A0C]/[0.06] hidden lg:block" />
      <div className="w-px h-full bg-[#0A0A0C]/[0.06]" />
    </div>
  );
}

