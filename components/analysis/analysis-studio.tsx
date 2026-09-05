"use client";

import React, { useState } from "react";
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
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Copy,
  Check,
  Printer,
  Binary,
  ArrowRight
} from "lucide-react";
import { ForensicSample } from "../upload/sample-presets";
import { CompareLens } from "./compare-lens";
import { ForensicReportModal } from "./forensic-report-modal";
import { playClick, playVerificationComplete } from "@/lib/audio-synth";

interface AnalysisStudioProps {
  sample: ForensicSample;
  onReset?: () => void;
}

export function AnalysisStudio({ sample, onReset }: AnalysisStudioProps) {
  const [activeLayer, setActiveLayer] = useState<"ela" | "fft" | "noise" | "biometric">("ela");
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  const handleCopyHash = () => {
    playClick(1500);
    navigator.clipboard.writeText(sample.hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const layers = [
    {
      id: "ela",
      name: "01 // ERROR LEVEL ANALYSIS (ELA)",
      shortName: "ELA Heatmap",
      desc: "Isolates JPEG/PNG compression quantization discrepancies and pixel inpainting seams.",
      score: `${sample.elaScore}%`,
      status: sample.elaScore > 70 ? "High Inpainting Seams" : sample.elaScore > 40 ? "Moderate Variance" : "Uniform Quantization",
      isWarning: sample.elaScore > 60,
    },
    {
      id: "fft",
      name: "02 // FFT FREQUENCY DOMAIN",
      shortName: "2D FFT Spectrum",
      desc: "Fast Fourier Transform maps periodic checkerboard lattice spikes from neural upsampling.",
      score: `${sample.fftAnomalyScore}%`,
      status: sample.fftAnomalyScore > 70 ? "Neural Grid Lattice Detected" : "Natural Optical 1/f Decay",
      isWarning: sample.fftAnomalyScore > 60,
    },
    {
      id: "noise",
      name: "03 // LATENT SENSOR NOISE",
      shortName: "Noise Residuals",
      desc: "Dissects sensor Poisson-Gaussian noise patterns against synthetic diffusion schedules.",
      score: `${sample.latentNoiseScore}%`,
      status: sample.latentNoiseScore > 70 ? "Non-Physical Noise Floor" : "Physical Camera PRNU",
      isWarning: sample.latentNoiseScore > 60,
    },
    {
      id: "biometric",
      name: "04 // BIOMETRIC & MICRO-TEXTURE",
      shortName: "Texture Coherence",
      desc: "Analyzes edge gradient continuity, micro-texture realism, and anatomical consistency.",
      score: `${sample.biometricScore}%`,
      status: sample.biometricScore > 70 ? "Synthetic Texture Smoothing" : "Natural Anatomical Pores",
      isWarning: sample.biometricScore > 60,
    },
  ];

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12 space-y-8 animate-fadeIn">
      {/* Top Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-6 hairline-b gap-4">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs text-[#FF3B00] font-bold uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-[#FF3B00] animate-pulse" />
            <span>[STAGE 02] // MULTI-SPECTRUM FORENSIC REPORT</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-extrabold uppercase tracking-tight text-[#0A0A0C] mt-2">
            Investigation Findings
          </h2>
        </div>

        {/* Global Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {onReset && (
            <button
              onClick={() => {
                playClick(1200);
                onReset();
              }}
              data-cursor="RESET"
              className="px-4 py-2.5 bg-[#F2F2EE] hover:bg-[#0A0A0C] hover:text-white transition-colors font-mono text-xs uppercase tracking-wider flex items-center gap-2 hairline-all cursor-pointer"
            >
              <RefreshCw size={13} />
              <span>Verify Another Media</span>
            </button>
          )}

          <button
            onClick={() => {
              playClick(1500);
              setIsReportOpen(true);
            }}
            data-cursor="DOSSIER"
            className="px-5 py-2.5 bg-[#0A0A0C] text-white hover:bg-[#FF3B00] transition-colors font-mono text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <FileText size={14} />
            <span>View Full Official Dossier</span>
          </button>
        </div>
      </div>

      {/* 1. Big Topline Verdict Banner */}
      <div
        className={`p-6 sm:p-8 hairline-all transition-all duration-300 relative overflow-hidden ${
          sample.isAuthentic
            ? "bg-[#059669]/5 border-[#059669]/40"
            : "bg-[#FF3B00]/5 border-[#FF3B00]/40"
        }`}
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Left 8 Cols: Large Verdict Badge & Plain Language Takeaway */}
          <div className="md:col-span-8 space-y-3">
            <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
              <span
                className={`font-mono text-xs font-extrabold px-3 py-1 uppercase tracking-wider ${
                  sample.isAuthentic ? "bg-[#059669] text-white" : "bg-[#FF3B00] text-white"
                }`}
              >
                {sample.isAuthentic ? "● VERIFIED AUTHENTIC MEDIA" : "● LIKELY AI-GENERATED MEDIA"}
              </span>
              <span className="text-[#9898A4]">ATTRIBUTION: {sample.modelSource}</span>
            </div>

            <h3 className="text-2xl sm:text-4xl font-display font-extrabold uppercase tracking-tight text-[#0A0A0C]">
              {sample.title}
            </h3>

            <p className="text-sm sm:text-base text-[#383838] font-sans leading-relaxed">
              {sample.description}
            </p>
          </div>

          {/* Right 4 Cols: Confidence Meter */}
          <div className="md:col-span-4 p-5 bg-white hairline-all font-mono space-y-2 text-left md:text-right">
            <span className="text-[10px] text-[#9898A4] uppercase tracking-widest block font-bold">
              TAMPER PROBABILITY SCORE
            </span>
            <p
              className={`text-4xl sm:text-5xl font-display font-black ${
                sample.isAuthentic ? "text-[#059669]" : "text-[#FF3B00]"
              }`}
            >
              {sample.isAuthentic ? "0.8%" : `${sample.tamperConfidence}%`}
            </p>
            <div className="w-full h-2 bg-[#F2F2EE] overflow-hidden mt-1">
              <div
                className={`h-full ${sample.isAuthentic ? "bg-[#059669]" : "bg-[#FF3B00]"}`}
                style={{ width: `${sample.isAuthentic ? 2 : sample.tamperConfidence}%` }}
              />
            </div>
            <span className="text-[10px] text-[#64646E] block pt-1">
              {sample.isAuthentic ? "Zero generative neural residuals detected" : "High statistical likelihood of synthetic origin"}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Key Performance Indicator (KPI) Metric Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between font-mono text-xs text-[#64646E] pb-1 hairline-b">
          <span className="uppercase text-[10px] tracking-widest font-bold text-[#0A0A0C]">
            // 05 KEY PERFORMANCE INDICATORS (FORENSIC DETECTORS):
          </span>
          <span className="text-[10px] text-[#FF3B00]">MULTI-SIGNAL DECOMPOSITION</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* KPI 1: ELA */}
          <div className="p-4 bg-white hairline-all space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between font-mono text-[10px]">
                <span className="text-[#9898A4] font-bold">01 // ELA ERROR</span>
                <span className={`font-bold ${sample.elaScore > 60 ? "text-[#FF3B00]" : "text-[#059669]"}`}>
                  {sample.elaScore}%
                </span>
              </div>
              <h4 className="text-sm font-display font-bold uppercase mt-1 text-[#0A0A0C]">Compression</h4>
              <p className="text-[11px] text-[#64646E] mt-1 font-sans line-clamp-2">
                Quantization disparity in spatial focal plane blocks.
              </p>
            </div>
            <span
              className={`font-mono text-[9px] font-bold px-2 py-0.5 mt-2 block w-fit ${
                sample.elaScore > 60 ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
              }`}
            >
              {sample.elaScore > 60 ? "HIGH SEAM DELTA" : "UNIFORM SINGLE-PASS"}
            </span>
          </div>

          {/* KPI 2: FFT */}
          <div className="p-4 bg-white hairline-all space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between font-mono text-[10px]">
                <span className="text-[#9898A4] font-bold">02 // 2D FOURIER</span>
                <span className={`font-bold ${sample.fftAnomalyScore > 60 ? "text-[#FF3B00]" : "text-[#059669]"}`}>
                  {sample.fftAnomalyScore}%
                </span>
              </div>
              <h4 className="text-sm font-display font-bold uppercase mt-1 text-[#0A0A0C]">Frequency Grid</h4>
              <p className="text-[11px] text-[#64646E] mt-1 font-sans line-clamp-2">
                High-frequency checkerboard harmonics from neural upsampling.
              </p>
            </div>
            <span
              className={`font-mono text-[9px] font-bold px-2 py-0.5 mt-2 block w-fit ${
                sample.fftAnomalyScore > 60 ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
              }`}
            >
              {sample.fftAnomalyScore > 60 ? "LATTICE SPIKES" : "OPTICAL 1/f DECAY"}
            </span>
          </div>

          {/* KPI 3: Noise */}
          <div className="p-4 bg-white hairline-all space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between font-mono text-[10px]">
                <span className="text-[#9898A4] font-bold">03 // PRNU NOISE</span>
                <span className={`font-bold ${sample.latentNoiseScore > 60 ? "text-[#FF3B00]" : "text-[#059669]"}`}>
                  {sample.latentNoiseScore}%
                </span>
              </div>
              <h4 className="text-sm font-display font-bold uppercase mt-1 text-[#0A0A0C]">Sensor Noise</h4>
              <p className="text-[11px] text-[#64646E] mt-1 font-sans line-clamp-2">
                Poisson-Gaussian sensor dispersion vs diffusion denoiser.
              </p>
            </div>
            <span
              className={`font-mono text-[9px] font-bold px-2 py-0.5 mt-2 block w-fit ${
                sample.latentNoiseScore > 60 ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
              }`}
            >
              {sample.latentNoiseScore > 60 ? "NON-PHYSICAL" : "PHYSICAL SENSOR PRNU"}
            </span>
          </div>

          {/* KPI 4: Biometrics */}
          <div className="p-4 bg-white hairline-all space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between font-mono text-[10px]">
                <span className="text-[#9898A4] font-bold">04 // BIOMETRICS</span>
                <span className={`font-bold ${sample.biometricScore > 60 ? "text-[#FF3B00]" : "text-[#059669]"}`}>
                  {sample.biometricScore}%
                </span>
              </div>
              <h4 className="text-sm font-display font-bold uppercase mt-1 text-[#0A0A0C]">Texture Realism</h4>
              <p className="text-[11px] text-[#64646E] mt-1 font-sans line-clamp-2">
                Micro-texture smoothness and anatomical symmetry consistency.
              </p>
            </div>
            <span
              className={`font-mono text-[9px] font-bold px-2 py-0.5 mt-2 block w-fit ${
                sample.biometricScore > 60 ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
              }`}
            >
              {sample.biometricScore > 60 ? "AI SMOOTHING" : "NATURAL PORES"}
            </span>
          </div>

          {/* KPI 5: Provenance */}
          <div className="p-4 bg-white hairline-all space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between font-mono text-[10px]">
                <span className="text-[#9898A4] font-bold">05 // PROVENANCE</span>
                <span className={`font-bold ${sample.c2paStatus === "valid" ? "text-[#059669]" : "text-[#FF3B00]"}`}>
                  {sample.c2paStatus.toUpperCase()}
                </span>
              </div>
              <h4 className="text-sm font-display font-bold uppercase mt-1 text-[#0A0A0C]">C2PA Credentials</h4>
              <p className="text-[11px] text-[#64646E] mt-1 font-sans line-clamp-2">
                Hardware cryptographic root-of-trust signature.
              </p>
            </div>
            <span
              className={`font-mono text-[9px] font-bold px-2 py-0.5 mt-2 block w-fit ${
                sample.c2paStatus === "valid" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
              }`}
            >
              {sample.c2paStatus === "valid" ? "ROOT-OF-TRUST ATTESTED" : "UNBOUND ORIGIN"}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Interactive Multi-Spectrum Comparator Lens */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 7 Columns: Dual Layer X-Ray Comparator */}
        <div className="lg:col-span-7 space-y-4">
          <CompareLens
            originalUrl={sample.previewUrl}
            heatmapUrl={activeLayer === "fft" ? sample.fftUrl : sample.heatmapUrl}
            originalLabel={`ORIGINAL: ${sample.title.toUpperCase()}`}
            forensicLabel={`LAYER: ${activeLayer.toUpperCase()} X-RAY SPECTRUM`}
            activeLayer={activeLayer}
            isAuthentic={sample.isAuthentic}
          />

          {/* Technical Telemetry Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-[#F2F2EE] hairline-all font-mono text-[10px] text-[#64646E]">
            <div>
              <span className="text-[#9898A4] block uppercase">RESOLUTION</span>
              <span className="text-[#0A0A0C] font-semibold">{sample.resolution}</span>
            </div>
            <div>
              <span className="text-[#9898A4] block uppercase">PAYLOAD SIZE</span>
              <span className="text-[#0A0A0C] font-semibold">{sample.fileSize}</span>
            </div>
            <div className="col-span-2">
              <span className="text-[#9898A4] block uppercase">SHA-256 PROOF</span>
              <span className="text-[#0A0A0C] font-semibold truncate block font-mono">
                {sample.hash}
              </span>
            </div>
          </div>
        </div>

        {/* Right 5 Columns: Forensic Spectrum Selector */}
        <div className="lg:col-span-5 space-y-4">
          <span className="font-mono text-xs uppercase tracking-widest text-[#0A0A0C] font-bold block">
            // SELECT X-RAY COMPARISON LAYER:
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
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10 font-mono text-[9px]">
                    <span className={isSelected ? "text-white/50" : "text-[#9898A4]"}>
                      ANALYSIS STATUS:
                    </span>
                    <span className={layer.isWarning ? "text-[#FF3B00] font-bold" : "text-[#059669] font-bold"}>
                      {layer.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Analysed Study Card (Tailored for Journalists & Researchers) */}
      <div className="p-6 sm:p-8 bg-white hairline-all space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 hairline-b gap-2">
          <div className="space-y-1">
            <span className="font-mono text-[10px] text-[#FF3B00] font-bold uppercase tracking-widest">
              // ANALYSED STUDY & EDITORIAL GUIDANCE
            </span>
            <h4 className="text-xl font-display font-bold uppercase text-[#0A0A0C]">
              What This Means For Researchers & Journalists
            </h4>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <code className="px-2 py-1 bg-[#F2F2EE] border border-[#E5E5DE] text-[11px] text-[#0A0A0C] font-bold">
              {sample.hash.slice(0, 16)}...
            </code>
            <button
              onClick={handleCopyHash}
              className="p-1.5 bg-[#F2F2EE] hover:bg-[#0A0A0C] hover:text-white transition-colors cursor-pointer text-xs"
              title="Copy Attestation Hash"
            >
              {copiedHash ? <Check size={13} className="text-[#059669]" /> : <Copy size={13} />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Key Observations List */}
          <div className="space-y-3">
            <span className="font-mono text-xs uppercase tracking-widest text-[#0A0A0C] font-bold block">
              1. Key Forensic Observations:
            </span>
            <div className="space-y-2">
              {sample.forensicSummary.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2.5 p-3 bg-[#FBFBFA] hairline-all text-xs">
                  <span className="font-mono text-[#FF3B00] font-bold shrink-0">[{idx + 1}]</span>
                  <span className="text-[#383838] font-sans leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actionable Editorial Guidance */}
          <div className="space-y-4">
            <span className="font-mono text-xs uppercase tracking-widest text-[#0A0A0C] font-bold block">
              2. Recommended Editorial Protocol:
            </span>

            <div className="p-4 bg-[#F2F2EE] hairline-all space-y-3 text-xs font-sans">
              <div className="flex items-start gap-2">
                <CheckCircle2 size={16} className={sample.isAuthentic ? "text-[#059669] shrink-0 mt-0.5" : "text-[#FF3B00] shrink-0 mt-0.5"} />
                <div>
                  <strong className="block text-[#0A0A0C] font-bold font-mono uppercase">
                    {sample.isAuthentic ? "Clear for Editorial Publication" : "Flag for Verification Desk"}
                  </strong>
                  <p className="text-[#64646E] mt-0.5">
                    {sample.isAuthentic
                      ? "The media exhibits uniform sensor noise and single-pass compression consistent with physical capture."
                      : "Do not publish as authentic without cross-referencing uncompressed camera RAW or witness corroboration."}
                  </p>
                </div>
              </div>

              <div className="pt-2 hairline-t text-[11px] text-[#64646E] font-mono flex items-center justify-between">
                <span>ORACLE ATTESTATION: ENCLAVE #442</span>
                <span className="text-[#FF3B00]">ZERO RETENTION AUDITED</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Forensic Report Dossier Modal */}
      <ForensicReportModal
        sample={sample}
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
      />
    </section>
  );
}
