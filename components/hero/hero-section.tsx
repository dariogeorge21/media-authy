"use client";

import React from "react";
import { motion, type Variants } from "framer-motion";
import { ArrowDownRight, Shield, Zap, Sparkles, Binary } from "lucide-react";
import { ScrambleText } from "@/components/ui/scramble-text";
import { MagneticButton } from "@/components/ui/magnetic-button";

export function HeroSection() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  return (
    <section className="relative w-full pt-8 pb-16 lg:pt-14 lg:pb-24 px-4 sm:px-8 max-w-7xl mx-auto">
      {/* Top Editorial Metadata Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-8 hairline-b text-xs font-mono tracking-widest text-[#64646E] uppercase">
        <div className="flex flex-col">
          <span className="text-[10px] text-[#9898A4]">01 // PURPOSE</span>
          <span className="text-[#0A0A0C] font-semibold mt-1">Autonomous Media Forensics</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-[#9898A4]">02 // ARCHITECTURE</span>
          <span className="text-[#0A0A0C] font-semibold mt-1">Multi-Spectrum Neural ELA</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-[#9898A4]">03 // STANDARDS</span>
          <span className="text-[#0A0A0C] font-semibold mt-1">C2PA / W3C Verifiable</span>
        </div>
        <div className="flex flex-col md:text-right">
          <span className="text-[10px] text-[#9898A4]">04 // PROTOCOL</span>
          <span className="text-[#FF3B00] font-bold mt-1">MEDIA AUTH v2.4 // PRODUCTION</span>
        </div>
      </div>

      {/* Massive Hero Editorial Composition */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="pt-12 sm:pt-16 pb-8"
      >
        {/* Asymmetrical Kicker */}
        <motion.div variants={itemVariants} className="flex items-center gap-3 mb-6">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-none bg-[#0A0A0C] text-white font-mono text-xs font-bold">
            01
          </span>
          <span className="font-mono text-xs tracking-widest uppercase text-[#FF3B00] font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#FF3B00] animate-ping" />
            EPISTEMIC VERIFICATION SYSTEM
          </span>
        </motion.div>

        {/* The Massive Editorial Heading: "VERIFY BEFORE YOU TRUST." */}
        <div className="relative">
          <motion.h1
            variants={itemVariants}
            className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-display font-extrabold uppercase tracking-tighter text-[#0A0A0C] leading-[0.88] select-none"
          >
            <div className="flex flex-wrap items-baseline gap-x-4 sm:gap-x-8">
              <span className="hover:text-[#FF3B00] transition-colors duration-300" data-cursor="TRUTH">
                <ScrambleText text="VERIFY" triggerOnHover autoPlay />
              </span>
              <span className="font-serif italic font-normal lowercase text-4xl sm:text-6xl md:text-7xl lg:text-8xl text-[#64646E] tracking-tight">
                before
              </span>
            </div>
            <div className="flex flex-wrap items-baseline gap-x-4 sm:gap-x-8 mt-2 sm:mt-4">
              <span className="text-[#0A0A0C]">YOU</span>
              <span
                className="relative text-transparent bg-clip-text bg-gradient-to-r from-[#0A0A0C] via-[#FF3B00] to-[#0A0A0C] hover:text-[#FF3B00] transition-colors"
                data-cursor="INSPECT"
              >
                <ScrambleText text="TRUST." triggerOnHover />
              </span>
            </div>
          </motion.h1>

          {/* Floating Editorial Notation / Super-stamp */}
          <div className="hidden md:block absolute right-0 top-0 max-w-xs text-right font-mono text-[11px] text-[#64646E] leading-relaxed">
            <div className="p-3 bg-[#F2F2EE] hairline-all inline-block text-left">
              <div className="flex items-center gap-1.5 text-[#FF3B00] font-bold mb-1">
                <Binary size={13} />
                <span>FORENSIC SIGNATURE:</span>
              </div>
              <p className="text-[10px] text-[#383838]">
                Neural synthesis has rendered sensory observation obsolete. Deterministic pixel computation is the only surviving baseline of truth.
              </p>
            </div>
          </div>
        </div>

        {/* Asymmetrical Sub-Grid / Manifesto Statement */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-12 sm:pt-16 mt-6 sm:mt-10 hairline-t"
        >
          {/* Left Column: Provocative Statement */}
          <div className="lg:col-span-7 space-y-6">
            <p className="text-xl sm:text-2xl md:text-3xl font-serif text-[#0A0A0C] leading-snug font-normal">
              “In the post-generative era, seeing is no longer believing. Media Authy provides mathematical certainty against deepfakes, cloned voiceprints, and synthetic reality.”
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <MagneticButton
                variant="signal"
                dataCursor="START"
                onClick={() => {
                  const el = document.getElementById("upload-deck");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <span>Launch Analysis Studio</span>
                <ArrowDownRight size={14} className="ml-2" />
              </MagneticButton>

              <MagneticButton
                variant="outline"
                dataCursor="READ"
                onClick={() => {
                  const el = document.getElementById("methodology");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <span>Read Methodology</span>
              </MagneticButton>
            </div>
          </div>

          {/* Right Column: Key Metrics & Technical Specifications */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-4 font-mono text-xs bg-[#F2F2EE]/80 p-6 hairline-all">
            <div className="space-y-1">
              <span className="text-[10px] text-[#9898A4] uppercase">DETECTION PRECISION</span>
              <p className="text-2xl sm:text-3xl font-bold font-display text-[#0A0A0C]">99.84%</p>
              <p className="text-[10px] text-[#64646E]">Across 28 generative model architectures</p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-[#9898A4] uppercase">INSPECTION LATENCY</span>
              <p className="text-2xl sm:text-3xl font-bold font-display text-[#FF3B00]">240ms</p>
              <p className="text-[10px] text-[#64646E]">Full multi-spectral raster decomposition</p>
            </div>

            <div className="col-span-2 pt-4 hairline-t flex items-center justify-between text-[11px] text-[#383838]">
              <div className="flex items-center gap-2">
                <Shield size={14} className="text-[#059669]" />
                <span className="font-semibold">Zero Telemetry Storage</span>
              </div>
              <span className="text-[#9898A4]">Cryptographic Hash Only</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}

