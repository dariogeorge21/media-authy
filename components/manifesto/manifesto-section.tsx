"use client";

import React from "react";
import { motion } from "framer-motion";
import { Shield, Sparkles, ArrowDownRight, Terminal } from "lucide-react";
import { ScrambleText } from "@/components/ui/scramble-text";

export function ManifestoSection() {
  return (
    <section id="manifesto" className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-24">
      {/* Top Editorial Index Tag */}
      <div className="flex items-center gap-2 font-mono text-xs text-[#FF3B00] font-bold uppercase tracking-widest pb-4">
        <span className="w-2 h-2 bg-[#FF3B00]" />
        <span>[SECTION 07] // THE EPISTEMIC MANIFESTO</span>
      </div>

      {/* Main Asymmetric Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pt-8 hairline-t">
        {/* Left 4 Columns: Monospace Colophon & Key Invariants */}
        <div className="lg:col-span-4 space-y-8">
          <div className="space-y-3 font-mono text-xs text-[#64646E] leading-relaxed">
            <span className="text-[#0A0A0C] font-bold block uppercase text-sm">
              ON THE DISSOLUTION OF SENSORY PROOF
            </span>
            <p>
              For 180 years, photography and sound recording served as neutral legal arbiters of physical fact. Generative diffusion and autoregressive voice synthesis have permanently severed the link between sensory depiction and historical truth.
            </p>
          </div>

          <div className="p-6 bg-[#F2F2EE] hairline-all font-mono text-xs space-y-3">
            <div className="flex items-center gap-2 text-[#FF3B00] font-bold">
              <Terminal size={14} />
              <span>CORE INVARIANTS:</span>
            </div>
            <ul className="space-y-2 text-[#383838] text-[11px]">
              <li>01. Observation is vulnerable; mathematics is invariant.</li>
              <li>02. Hardware-enclave provenance (C2PA) must replace unverified rasters.</li>
              <li>03. Synthetic detection must operate in deterministic sub-second timeframes.</li>
            </ul>
          </div>
        </div>

        {/* Right 8 Columns: Massive Editorial Typography & Spreads */}
        <div className="lg:col-span-8 space-y-10">
          <h2 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-extrabold uppercase tracking-tight text-[#0A0A0C] leading-[0.92]">
            Perception is no longer reality. <span className="font-serif italic font-normal text-[#FF3B00] block mt-2">Only mathematics survives.</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 font-sans text-sm sm:text-base text-[#383838] leading-relaxed pt-6 hairline-t">
            <p>
              When synthetic models can generate flawless facial textures, authentic voice timbre, and synthetic historical archives, society faces an existential epistemic crisis. Trust can no longer be assumed by default; it must be proven with cryptographic certainty.
            </p>
            <p>
              Media Authy exists to preserve institutional integrity, legal veracity, and public trust through multi-spectral algorithmic forensics. We dissect the invisible mathematics that generative neural networks cannot conceal.
            </p>
          </div>

          <div className="pt-4 font-mono text-xs text-[#9898A4] flex items-center justify-between">
            <span>MEDIA AUTHY FORENSIC FOUNDATION</span>
            <span className="text-[#0A0A0C] font-bold">EST. 2026 // BERLIN · SAN FRANCISCO</span>
          </div>
        </div>
      </div>
    </section>
  );
}

