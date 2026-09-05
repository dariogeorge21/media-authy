"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers,
  Activity,
  Cpu,
  ShieldCheck,
  ShieldAlert,
  FileText,
  RefreshCw,
  Sparkles,
  Volume2,
  Scan,
  Zap,
  Sliders,
  Maximize2
} from "lucide-react";
import { ForensicSample } from "../upload/sample-presets";
import { CompareLens } from "./compare-lens";
import { ForensicReportModal } from "./forensic-report-modal";
import { playClick, playScanBlip, playVerificationComplete } from "@/lib/audio-synth";

interface AnalysisStudioProps {
  sample: ForensicSample;
}

export function AnalysisStudio({ sample }: AnalysisStudioProps) {
  const [activeLayer, setActiveLayer] = useState<"ela" | "fft" | "noise" | "biometric">("ela");
  const [isScanning, setIsScanning] = useState(true);
  const [scanProgress, setScanProgress] = useState(0);
  const [isReportOpen, setIsReportOpen] = useState(false);

  // Trigger scanning sequence whenever sample changes
  useEffect(() => {
    setIsScanning(true);
    setScanProgress(0);

    let current = 0;
    const interval = setInterval(() => {
      current += 15;
      if (current >= 100) {
        current = 100;
        setScanProgress(100);
        setIsScanning(false);
        clearInterval(interval);
        playVerificationComplete(sample.isAuthentic);
      } else {
        setScanProgress(current);
        playScanBlip(Math.floor(current / 20));
      }
    }, 80);

    return () => clearInterval(interval);
  }, [sample.id]);

  const layers = [
    {
      id: "ela",
      name: "01 // ERROR LEVEL ANALYSIS (ELA)",
      desc: "Isolates JPEG/PNG compression quantization discrepancies and pixel inpainting seams.",
      score: `${sample.elaScore}%`,
    },
    {
      id: "fft",
      name: "02 // FFT FREQUENCY DOMAIN",
      desc: "Fast Fourier Transform maps high-frequency checkerboard upsampling artifacts from GANs.",
      score: `${sample.fftAnomalyScore}%`,
    },
    {
      id: "noise",
      name: "03 // LATENT NOISE RESIDUALS",
      desc: "Dissects sensor Poisson-Gaussian noise patterns against synthetic diffusion schedules.",
      score: `${sample.latentNoiseScore}%`,
    },
    {
      id: "biometric",
      name: "04 // BIOMETRIC & AUDIO PHASE",
      desc: "Tracks micro-vascular blood perfusion (rPPG) and vocal tract formant phase continuity.",
      score: `${sample.biometricScore}%`,
    },
  ];

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-12">
      {/* Editorial Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between pb-6 hairline-b gap-4">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs text-[#FF3B00] font-bold uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-[#FF3B00] animate-pulse" />
            <span>[SECTION 03] // MULTI-SPECTRUM FORENSIC ENGINE</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-extrabold uppercase tracking-tight text-[#0A0A0C] mt-2">
            Dissection & Spectral Matrix
          </h2>
        </div>

        {/* Live Status and Action Trigger */}
        <div className="flex items-center gap-4">
          <div className="text-right font-mono text-xs hidden sm:block">
            <span className="text-[#9898A4] block text-[10px]">CASE ID</span>
            <span className="font-bold text-[#0A0A0C]">{sample.id.toUpperCase()}</span>
          </div>

          <button
            onClick={() => {
              playClick(1500);
              setIsReportOpen(true);
            }}
            data-cursor="DOSSIER"
            className="px-4 py-2.5 bg-[#0A0A0C] text-white hover:bg-[#FF3B00] transition-colors font-mono text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <FileText size={14} />
            <span>View Full Dossier</span>
          </button>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8 items-start">
        {/* Left 7 Columns: Interactive Lens Comparator */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          {/* Scanning Overlay State */}
          <div className="relative">
            {isScanning && (
              <div className="absolute inset-0 z-30 bg-[#0A0A0C]/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center text-white space-y-4 hairline-all">
                <Scan size={36} className="text-[#FF3B00] animate-pulse" />
                <div className="space-y-1 font-mono">
                  <p className="text-xs text-[#FF3B00] uppercase tracking-widest font-bold">
                    // EXECUTING NEURAL RASTER DECOMPOSITION
                  </p>
                  <p className="text-2xl font-display font-bold">{scanProgress}%</p>
                  <p className="text-[10px] text-[#9898A4]">Extracting FFT harmonics & quantization matrices...</p>
                </div>
                <div className="w-48 h-1 bg-white/20 overflow-hidden">
                  <div
                    className="h-full bg-[#FF3B00] transition-all duration-100"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
              </div>
            )}

            <CompareLens
              originalUrl={sample.previewUrl}
              heatmapUrl={activeLayer === "fft" ? sample.fftUrl : sample.heatmapUrl}
              originalLabel={`SOURCE: ${sample.title.toUpperCase()}`}
              forensicLabel={`LAYER: ${activeLayer.toUpperCase()} SPECTRAL MATRIX`}
              activeLayer={activeLayer}
              isAuthentic={sample.isAuthentic}
            />
          </div>

          {/* Under-Lens Telemetry Bar */}
          <div className="grid grid-cols-3 gap-2 p-3 bg-[#F2F2EE] hairline-all font-mono text-[10px] text-[#64646E]">
            <div>
              <span className="text-[#9898A4] block">PAYLOAD:</span>
              <span className="text-[#0A0A0C] font-semibold">{sample.fileSize} / {sample.resolution}</span>
            </div>
            <div>
              <span className="text-[#9898A4] block">MODEL DETECTED:</span>
              <span className="text-[#0A0A0C] font-semibold truncate block">{sample.modelSource}</span>
            </div>
            <div className="text-right">
              <span className="text-[#9898A4] block">C2PA PROVENANCE:</span>
              <span
                className={`font-bold ${
                  sample.c2paStatus === "valid" ? "text-[#059669]" : "text-[#FF3B00]"
                }`}
              >
                {sample.c2paStatus.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Right 5 Columns: Layer Controls & Verdict Meter */}
        <div className="lg:col-span-5 flex flex-col space-y-6">
          {/* Verdict Card */}
          <div
            className={`p-6 hairline-all transition-colors duration-300 ${
              sample.isAuthentic
                ? "bg-[#059669]/5 border-[#059669]/30"
                : "bg-[#FF3B00]/5 border-[#FF3B00]/30"
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#9898A4]">
                  FORENSIC VERDICT
                </span>
                <h3
                  className={`text-2xl sm:text-3xl font-display font-extrabold uppercase mt-1 ${
                    sample.isAuthentic ? "text-[#059669]" : "text-[#FF3B00]"
                  }`}
                >
                  {sample.isAuthentic ? "Authentic Origin" : "Synthetic Media"}
                </h3>
              </div>
              <div className="text-right font-mono">
                <span className="text-[10px] text-[#9898A4] uppercase">CONFIDENCE</span>
                <p
                  className={`text-3xl font-display font-black ${
                    sample.isAuthentic ? "text-[#059669]" : "text-[#FF3B00]"
                  }`}
                >
                  {sample.isAuthentic ? "99.2%" : `${sample.tamperConfidence}%`}
                </p>
              </div>
            </div>

            <p className="text-xs text-[#383838] mt-3 font-sans leading-relaxed">
              {sample.description}
            </p>
          </div>

          {/* Layer Selector Tabs */}
          <div className="space-y-3">
            <span className="font-mono text-xs uppercase tracking-widest text-[#0A0A0C] font-bold block">
              // SELECT FORENSIC SPECTRUM:
            </span>

            <div className="space-y-2">
              {layers.map((layer) => {
                const isSelected = activeLayer === layer.id;
                return (
                  <div
                    key={layer.id}
                    onClick={() => {
                      playClick(1400);
                      setActiveLayer(layer.id as any);
                    }}
                    data-cursor="SWITCH"
                    className={`p-4 hairline-all cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? "bg-[#0A0A0C] text-white border-[#0A0A0C] shadow-sm"
                        : "bg-white hover:bg-[#F8F8F5] text-[#0A0A0C] border-[#E5E5DE]"
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono text-xs">
                      <span className="font-bold tracking-tight">{layer.name}</span>
                      <span
                        className={`text-xs font-mono font-bold ${
                          isSelected ? "text-[#FF3B00]" : "text-[#0A0A0C]"
                        }`}
                      >
                        {layer.score}
                      </span>
                    </div>
                    <p
                      className={`text-xs mt-1.5 font-sans leading-normal ${
                        isSelected ? "text-white/70" : "text-[#64646E]"
                      }`}
                    >
                      {layer.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Forensic Report Modal */}
      <ForensicReportModal
        sample={sample}
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
      />
    </section>
  );
}

