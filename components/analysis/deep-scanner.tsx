"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Scan,
  Shield,
  Binary,
  Layers,
  Activity,
  Cpu,
  CheckCircle2,
  Sparkles,
  Zap,
  Terminal,
  Clock,
  Eye
} from "lucide-react";

interface StageInfo {
  id: string;
  name: string;
  desc: string;
  icon: React.ReactNode;
}

interface DeepScannerProps {
  isOpen: boolean;
  progress: number;
  currentAction: string;
  imagePreviewUrl: string | null;
  fileName: string;
  reasoningLogs: string[];
}

const STAGES: StageInfo[] = [
  {
    id: "stage-1",
    name: "01 // CRYPTOGRAPHIC & METADATA",
    desc: "Hashing SHA-256, parsing EXIF tags, checking C2PA provenance enclave",
    icon: <Shield size={14} />,
  },
  {
    id: "stage-2",
    name: "02 // ERROR LEVEL QUANTIZATION (ELA)",
    desc: "Measuring discrete cosine transform recompression delta & inpainting seams",
    icon: <Layers size={14} />,
  },
  {
    id: "stage-3",
    name: "03 // 2D FFT FREQUENCY SPECTRUM",
    desc: "Mapping high-frequency checkerboard harmonics from neural upsampling",
    icon: <Binary size={14} />,
  },
  {
    id: "stage-4",
    name: "04 // SENSOR NOISE & MICRO-TEXTURE",
    desc: "Extracting Poisson-Gaussian sensor PRNU vs synthetic diffusion noise floor",
    icon: <Activity size={14} />,
  },
  {
    id: "stage-5",
    name: "05 // GROQ MULTI-MODAL REASONING",
    desc: "LPU multi-signal Bayesian synthesis evaluating physical & lighting coherence",
    icon: <Cpu size={14} />,
  },
];

export function DeepScanner({
  isOpen,
  progress,
  currentAction,
  imagePreviewUrl,
  fileName,
  reasoningLogs,
}: DeepScannerProps) {
  if (!isOpen) return null;

  // Determine current active stage index based on progress (0 to 4)
  const currentStageIndex = Math.min(
    Math.floor((progress / 100) * STAGES.length),
    STAGES.length - 1
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25 }}
          className="relative w-full max-w-4xl bg-[#0A0A0C] text-[#FBFBFA] border border-[#26262E] shadow-2xl p-6 sm:p-8 space-y-6 max-h-[92vh] overflow-y-auto"
        >
          {/* Top Holographic Machine Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#26262E] gap-2">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF3B00] animate-ping" />
              <span className="font-mono text-xs uppercase tracking-widest text-[#FF3B00] font-bold">
                // DEEP FORENSIC DISSECTION IN PROGRESS
              </span>
            </div>

            <div className="flex items-center gap-3 font-mono text-[11px] text-[#9898A4]">
              <span>TARGET: <strong className="text-white truncate max-w-[180px] inline-block align-bottom">{fileName}</strong></span>
              <span>|</span>
              <span className="text-[#FF3B00] font-bold">{progress}% COMPLETE</span>
            </div>
          </div>

          {/* Central Holographic Scanning Viewport & Stage Matrix */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 6 Cols: Holographic Scanning Laser Screen */}
            <div className="lg:col-span-6 flex flex-col space-y-3">
              <div className="relative w-full aspect-[4/3] bg-black border border-[#26262E] overflow-hidden flex items-center justify-center">
                {/* Background Image Preview */}
                {imagePreviewUrl ? (
                  <div
                    className="absolute inset-0 bg-contain bg-center bg-no-repeat opacity-60"
                    style={{ backgroundImage: `url(${imagePreviewUrl})` }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#111115]">
                    <Eye size={36} className="text-[#64646E] animate-pulse" />
                  </div>
                )}

                {/* Laser Scanning Beam moving up and down */}
                <div className="absolute inset-x-0 h-1 bg-[#FF3B00] shadow-[0_0_15px_4px_#FF3B00] animate-scan-vertical pointer-events-none" />

                {/* Cyber Matrix Coordinate Grid */}
                <div
                  className="absolute inset-0 opacity-20 pointer-events-none"
                  style={{
                    backgroundImage:
                      "linear-gradient(to right, #FF3B00 1px, transparent 1px), linear-gradient(to bottom, #FF3B00 1px, transparent 1px)",
                    backgroundSize: "32px 32px",
                  }}
                />

                {/* Radar Concentric Rings */}
                <div className="absolute w-36 h-36 rounded-full border border-[#FF3B00]/40 animate-ping pointer-events-none" />
                <div className="absolute w-56 h-56 rounded-full border border-[#FF3B00]/20 pointer-events-none" />

                {/* Corner Crosshairs */}
                <div className="absolute top-2 left-2 font-mono text-[9px] text-[#FF3B00] font-bold tracking-wider">
                  ┌ RADAR: SPECTRAL
                </div>
                <div className="absolute top-2 right-2 font-mono text-[9px] text-[#9898A4] tracking-wider">
                  LPU: GROQ_ACTIVE ┐
                </div>
                <div className="absolute bottom-2 left-2 font-mono text-[9px] text-[#9898A4] tracking-wider">
                  └ RESIDUAL: ACQUIRING
                </div>
                <div className="absolute bottom-2 right-2 font-mono text-[9px] text-[#FF3B00] font-bold animate-pulse">
                  ● SCANNING ┘
                </div>
              </div>

              {/* Progress Bar under viewport */}
              <div className="w-full h-2 bg-[#1A1A20] border border-[#26262E] overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#FF3B00] via-[#FF6A00] to-[#059669]"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: "easeInOut", duration: 0.3 }}
                />
              </div>

              {/* Active Action Display */}
              <div className="p-3 bg-[#111115] border border-[#26262E] font-mono text-xs text-[#E5E5DE] flex items-center gap-2">
                <span className="w-2 h-2 bg-[#FF3B00] animate-pulse shrink-0" />
                <span className="truncate">{currentAction}</span>
              </div>
            </div>

            {/* Right 6 Cols: 5-Stage Machine Checklist */}
            <div className="lg:col-span-6 space-y-2.5">
              <span className="font-mono text-[10px] text-[#9898A4] uppercase tracking-widest block font-bold">
                // 05-STAGE FORENSIC DECOMPOSITION PIPELINE:
              </span>

              <div className="space-y-2">
                {STAGES.map((stg, idx) => {
                  const isFinished = idx < currentStageIndex || progress >= 100;
                  const isCurrent = idx === currentStageIndex && progress < 100;

                  return (
                    <div
                      key={stg.id}
                      className={`p-3 border transition-all duration-200 font-mono text-xs flex items-start justify-between gap-3 ${
                        isFinished
                          ? "bg-[#059669]/10 border-[#059669]/40 text-white"
                          : isCurrent
                          ? "bg-[#FF3B00]/10 border-[#FF3B00] text-white shadow-sm"
                          : "bg-[#111115] border-[#26262E] text-[#64646E]"
                      }`}
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={
                              isFinished
                                ? "text-[#059669]"
                                : isCurrent
                                ? "text-[#FF3B00] animate-spin"
                                : "text-[#64646E]"
                            }
                          >
                            {stg.icon}
                          </span>
                          <span className="font-bold tracking-tight">{stg.name}</span>
                        </div>
                        <p className="text-[10px] text-[#9898A4] font-sans leading-tight">
                          {stg.desc}
                        </p>
                      </div>

                      <div className="shrink-0 font-mono text-[10px] pt-0.5">
                        {isFinished ? (
                          <span className="text-[#059669] font-bold flex items-center gap-1">
                            <CheckCircle2 size={12} />
                            <span>DONE</span>
                          </span>
                        ) : isCurrent ? (
                          <span className="text-[#FF3B00] font-bold animate-pulse">
                            ACTIVE...
                          </span>
                        ) : (
                          <span className="text-[#64646E]">QUEUED</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom Terminal Log: Live Agent Thoughts */}
          <div className="p-4 bg-black border border-[#26262E] font-mono text-xs space-y-2">
            <div className="flex items-center justify-between text-[10px] text-[#9898A4] border-b border-[#26262E] pb-1.5">
              <span className="flex items-center gap-1 text-[#FF3B00] font-bold uppercase">
                <Terminal size={12} />
                <span>AI FORENSIC REASONING STREAM (GROQ LPU)</span>
              </span>
              <span>LIVE LOG OUTPUT</span>
            </div>

            <div className="space-y-1.5 max-h-24 overflow-y-auto pr-2">
              {reasoningLogs.length > 0 ? (
                reasoningLogs.map((log, i) => (
                  <p key={i} className="text-[#059669] text-[11px] leading-relaxed font-mono">
                    <span className="text-[#9898A4] mr-1.5">&gt;</span>
                    {log}
                  </p>
                ))
              ) : (
                <p className="text-[#64646E] text-[11px] italic">
                  &gt; Ingestion buffer armed. Awaiting multi-spectral detector outputs...
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

