"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  UploadCloud,
  FileText,
  ArrowLeft,
  RefreshCw,
  Cpu,
  Layers,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Volume2,
  VolumeX,
  Zap,
  CheckCircle2,
  AlertCircle,
  Scan,
  CornerDownRight,
  Terminal,
  Image as ImageIcon
} from "lucide-react";
import { FORENSIC_PRESETS, ForensicSample } from "@/components/upload/sample-presets";
import { CompareLens } from "@/components/analysis/compare-lens";
import { ForensicReportModal } from "@/components/analysis/forensic-report-modal";
import { NoiseOverlay, GridLinesBackground } from "@/components/layout/noise-overlay";
import { CustomCursor } from "@/components/cursor/custom-cursor";
import { analyzeMediaPayload } from "@/lib/forensic-api";
import { playClick, playScanBlip, playVerificationComplete, toggleAudio, isAudioEnabled } from "@/lib/audio-synth";

export default function DedicatedAnalyzePage() {
  const [selectedSample, setSelectedSample] = useState<ForensicSample | null>(null);
  const [activeLayer, setActiveLayer] = useState<"ela" | "fft" | "noise" | "biometric">("ela");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [customFile, setCustomFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSoundToggle = () => {
    const nextState = toggleAudio();
    setSoundOn(nextState);
    if (nextState) playClick(1600);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    playScanBlip(2);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      await executeAnalysis(file);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      await executeAnalysis(file);
    }
  };

  const executeAnalysis = async (file: File) => {
    setCustomFile(file);
    setIsAnalyzing(true);
    setAnalysisProgress(10);
    playScanBlip(1);

    // Progressive simulated telemetry ticks
    const interval = setInterval(() => {
      setAnalysisProgress((prev) => {
        if (prev >= 85) {
          clearInterval(interval);
          return 85;
        }
        playScanBlip(Math.floor(prev / 20) + 1);
        return prev + 15;
      });
    }, 120);

    // Execute through FastAPI bridge / fallback
    const result = await analyzeMediaPayload(file);

    clearInterval(interval);
    setAnalysisProgress(100);

    setTimeout(() => {
      setSelectedSample(result);
      setIsAnalyzing(false);
      playVerificationComplete(result.isAuthentic);
    }, 300);
  };

  const handleLoadPreset = (preset: ForensicSample) => {
    playClick(1400);
    setIsAnalyzing(true);
    setAnalysisProgress(0);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      if (progress >= 100) {
        clearInterval(interval);
        setAnalysisProgress(100);
        setSelectedSample(preset);
        setIsAnalyzing(false);
        playVerificationComplete(preset.isAuthentic);
      } else {
        setAnalysisProgress(progress);
        playScanBlip(Math.floor(progress / 20));
      }
    }, 80);
  };

  const handleReset = () => {
    playClick(1200);
    setSelectedSample(null);
    setCustomFile(null);
    setAnalysisProgress(0);
  };

  const layers = [
    {
      id: "ela",
      name: "01 // ERROR LEVEL ANALYSIS (ELA)",
      desc: "Isolates JPEG/PNG compression quantization discrepancies and pixel inpainting seams.",
      score: selectedSample ? `${selectedSample.elaScore}%` : "--",
    },
    {
      id: "fft",
      name: "02 // FFT FREQUENCY DOMAIN",
      desc: "Fast Fourier Transform maps high-frequency checkerboard upsampling artifacts from GANs.",
      score: selectedSample ? `${selectedSample.fftAnomalyScore}%` : "--",
    },
    {
      id: "noise",
      name: "03 // LATENT NOISE RESIDUALS",
      desc: "Dissects sensor Poisson-Gaussian noise patterns against synthetic diffusion schedules.",
      score: selectedSample ? `${selectedSample.latentNoiseScore}%` : "--",
    },
    {
      id: "biometric",
      name: "04 // BIOMETRIC & AUDIO PHASE",
      desc: "Tracks micro-vascular blood perfusion (rPPG) and vocal tract formant phase continuity.",
      score: selectedSample ? `${selectedSample.biometricScore}%` : "--",
    },
  ];

  return (
    <main className="min-h-screen bg-[#FBFBFA] text-[#0A0A0C] flex flex-col relative selection:bg-[#FF3B00] selection:text-white">
      {/* Ambient Grain & Grid Overlay */}
      <NoiseOverlay />
      <GridLinesBackground />
      <CustomCursor />

      {/* Dedicated Workstation Top Bar */}
      <header className="sticky top-0 z-30 w-full bg-[#FBFBFA]/90 backdrop-blur-md hairline-b">
        <div className="flex items-center justify-between px-4 sm:px-8 py-3.5">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              onClick={() => playClick(1100)}
              className="group flex items-center gap-2 font-mono text-xs text-[#64646E] hover:text-[#0A0A0C] transition-colors cursor-pointer"
              data-cursor="BACK"
            >
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              <span className="font-bold">HOME</span>
            </Link>

            <span className="text-[#E5E5DE]">|</span>

            <div className="flex items-baseline gap-2">
              <span className="text-base sm:text-lg font-bold font-display uppercase tracking-tight text-[#0A0A0C]">
                MediaAuth
              </span>
              <span className="text-[10px] font-mono tracking-widest text-[#FF3B00] font-bold">
                [WORKSTATION v2.4]
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            {/* FastAPI Agent Connection Pill */}
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-[#F2F2EE] hairline-all text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#059669] animate-pulse" />
              <span className="text-[#64646E]">FASTAPI AGENT:</span>
              <span className="font-bold text-[#0A0A0C]">ACTIVE</span>
            </div>

            <button
              onClick={handleSoundToggle}
              className="flex items-center gap-1.5 text-[#0A0A0C] hover:text-[#FF3B00] transition-colors cursor-pointer"
              aria-label="Toggle audio"
            >
              {soundOn ? <Volume2 size={13} className="text-[#FF3B00]" /> : <VolumeX size={13} />}
              <span className="text-[10px] uppercase font-bold">{soundOn ? "AUDIO" : "MUTED"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workstation Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-12 space-y-8">
        {/* Top Workstation Title & Mode Status */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-6 hairline-b gap-4">
          <div>
            <div className="flex items-center gap-2 font-mono text-[10px] text-[#FF3B00] font-bold uppercase tracking-widest">
              <Terminal size={12} />
              <span>DEDICATED FORENSIC INGESTION & SPECTRAL DECOMPOSITION</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-display font-extrabold uppercase tracking-tight text-[#0A0A0C] mt-2">
              Forensic Workstation
            </h1>
          </div>

          {selectedSample && (
            <button
              onClick={handleReset}
              data-cursor="NEW"
              className="px-4 py-2 bg-[#F2F2EE] hover:bg-[#0A0A0C] hover:text-white transition-colors font-mono text-xs uppercase tracking-wider flex items-center gap-2 hairline-all cursor-pointer w-fit"
            >
              <RefreshCw size={13} />
              <span>Analyze Another Media</span>
            </button>
          )}
        </div>

        {/* State 1: Ingestion Deck (When no file is analyzed or analyzing) */}
        {!selectedSample && (
          <div className="space-y-8">
            {/* Architectural Drag & Drop Deck */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => {
                if (!isAnalyzing) {
                  playClick(1400);
                  fileInputRef.current?.click();
                }
              }}
              data-cursor="UPLOAD"
              className={`crosshair-corner relative group flex flex-col items-center justify-center p-8 sm:p-16 text-center cursor-pointer transition-all duration-300 min-h-[400px] sm:min-h-[480px] hairline-all ${
                isDragging
                  ? "bg-[#FF3B00]/10 border-[#FF3B00]"
                  : "bg-white hover:bg-[#FBFBFA] border-[#E5E5DE] hover:border-[#0A0A0C]"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileInputChange}
                accept="image/*,video/*,audio/*"
                className="hidden"
              />

              {/* Corner Metadata stamps */}
              <div className="absolute top-3 left-3 font-mono text-[9px] text-[#9898A4] tracking-widest uppercase">
                INPUT_BUFFER: ARMED // SHA-256 ORACLE
              </div>
              <div className="absolute top-3 right-3 font-mono text-[9px] text-[#9898A4] tracking-widest uppercase">
                MAX: 100MB / RAW / PNG / MP4 / WAV
              </div>
              <div className="absolute bottom-3 left-3 font-mono text-[9px] text-[#9898A4] tracking-widest uppercase">
                FASTAPI_AGENT_PIPELINE: STANDBY
              </div>
              <div className="absolute bottom-3 right-3 font-mono text-[9px] text-[#FF3B00] tracking-widest uppercase font-bold">
                ● READY FOR PAYLOAD
              </div>

              {/* Central Ingestion Trigger or Active Scanning State */}
              {isAnalyzing ? (
                <div className="space-y-4 max-w-md">
                  <Scan size={42} className="text-[#FF3B00] mx-auto animate-pulse" />
                  <div className="space-y-1 font-mono">
                    <p className="text-xs text-[#FF3B00] uppercase tracking-widest font-bold">
                      // TRANSMITTING TO FORENSIC AGENT PIPELINE
                    </p>
                    <p className="text-3xl font-display font-black text-[#0A0A0C]">{analysisProgress}%</p>
                    <p className="text-xs text-[#64646E]">
                      Extracting spatial ELA, FFT Fourier harmonics, and sensor noise...
                    </p>
                  </div>
                  <div className="w-56 h-1.5 bg-[#F2F2EE] mx-auto overflow-hidden">
                    <div
                      className="h-full bg-[#FF3B00] transition-all duration-100"
                      style={{ width: `${analysisProgress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-6 max-w-lg">
                  <div className="relative mx-auto w-20 h-20 border border-[#0A0A0C] flex items-center justify-center bg-[#FBFBFA] group-hover:scale-105 group-hover:border-[#FF3B00] transition-all duration-300">
                    <UploadCloud
                      size={36}
                      className={`transition-colors duration-300 ${
                        isDragging ? "text-[#FF3B00] animate-bounce" : "text-[#0A0A0C] group-hover:text-[#FF3B00]"
                      }`}
                    />
                    <div className="absolute inset-x-0 h-0.5 bg-[#FF3B00] opacity-0 group-hover:opacity-100 animate-scan-vertical" />
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-display font-bold uppercase tracking-tight text-[#0A0A0C]">
                      {isDragging ? "Release File to Start Analysis" : "Drop Target Media For Analysis"}
                    </h2>
                    <p className="text-sm text-[#64646E] font-sans">
                      or <span className="text-[#FF3B00] font-semibold underline underline-offset-4">browse your computer</span> to upload image, audio, or video frame
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2 font-mono text-[10px] text-[#64646E]">
                    <span className="px-2.5 py-1 bg-[#F2F2EE] border border-[#E5E5DE]">
                      PNG / JPG / WEBP / TIFF
                    </span>
                    <span className="px-2.5 py-1 bg-[#F2F2EE] border border-[#E5E5DE]">
                      MP4 / MOV VIDEO
                    </span>
                    <span className="px-2.5 py-1 bg-[#F2F2EE] border border-[#E5E5DE]">
                      WAV / MP3 AUDIO
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Test Presets Bar */}
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between font-mono text-xs text-[#64646E] pb-2 hairline-b">
                <span className="uppercase text-[10px] tracking-widest font-bold text-[#0A0A0C]">
                  OR TEST PRESET CASE STUDY:
                </span>
                <span className="text-[10px] text-[#FF3B00]">ONE-CLICK SIMULATION</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {FORENSIC_PRESETS.map((preset) => (
                  <div
                    key={preset.id}
                    onClick={() => handleLoadPreset(preset)}
                    data-cursor="TEST"
                    className="p-4 bg-white hover:bg-[#F8F8F5] hairline-all cursor-pointer transition-all duration-200 group flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between font-mono text-[9px]">
                        <span className="px-1.5 py-0.5 bg-[#F2F2EE] font-bold text-[#0A0A0C] uppercase">
                          {preset.category}
                        </span>
                        <span
                          className={`font-bold ${
                            preset.isAuthentic ? "text-[#059669]" : "text-[#FF3B00]"
                          }`}
                        >
                          {preset.isAuthentic ? "GENUINE" : `${preset.tamperConfidence}% SYN`}
                        </span>
                      </div>
                      <h3 className="text-sm font-display font-bold uppercase tracking-tight text-[#0A0A0C] group-hover:text-[#FF3B00] transition-colors line-clamp-1">
                        {preset.title}
                      </h3>
                      <p className="text-[11px] text-[#64646E] font-sans line-clamp-2">
                        {preset.subtitle}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 hairline-t font-mono text-[10px] text-[#9898A4]">
                      <span className="truncate max-w-[120px]">{preset.modelSource}</span>
                      <CornerDownRight size={13} className="text-[#0A0A0C] group-hover:text-[#FF3B00]" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* State 2: Analysis Results View (When media is analyzed) */}
        {selectedSample && !isAnalyzing && (
          <div className="space-y-8 animate-fadeIn">
            {/* Top Analysis Header & Dossier Action */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start bg-white p-6 sm:p-8 hairline-all">
              <div className="md:col-span-8 space-y-2">
                <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                  <span
                    className={`font-bold px-2 py-0.5 uppercase ${
                      selectedSample.isAuthentic
                        ? "bg-[#059669] text-white"
                        : "bg-[#FF3B00] text-white"
                    }`}
                  >
                    {selectedSample.isAuthentic ? "AUTHENTIC ORIGIN" : "CONFIRMED SYNTHETIC MEDIA"}
                  </span>
                  <span className="text-[#9898A4]">MODEL: {selectedSample.modelSource}</span>
                  <span className="text-[#9898A4]">|</span>
                  <span className="text-[#9898A4]">PAYLOAD: {selectedSample.fileSize}</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-display font-extrabold uppercase tracking-tight text-[#0A0A0C]">
                  {selectedSample.title}
                </h2>
                <p className="text-xs sm:text-sm text-[#64646E] font-sans">
                  {selectedSample.description}
                </p>
              </div>

              <div className="md:col-span-4 flex flex-col items-start md:items-end justify-between space-y-4">
                <div className="text-left md:text-right font-mono">
                  <span className="text-[10px] text-[#9898A4] uppercase block">CONFIDENCE SCORE</span>
                  <p
                    className={`text-4xl sm:text-5xl font-display font-black ${
                      selectedSample.isAuthentic ? "text-[#059669]" : "text-[#FF3B00]"
                    }`}
                  >
                    {selectedSample.isAuthentic ? "0.8%" : `${selectedSample.tamperConfidence}%`}
                  </p>
                  <p className="text-[10px] text-[#64646E]">
                    {selectedSample.isAuthentic ? "C2PA Provenance Validated" : "Neural Artifacts Detected"}
                  </p>
                </div>

                <button
                  onClick={() => {
                    playClick(1500);
                    setIsReportOpen(true);
                  }}
                  data-cursor="DOSSIER"
                  className="px-5 py-2.5 bg-[#0A0A0C] text-white hover:bg-[#FF3B00] transition-colors font-mono text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-sm w-full md:w-auto justify-center"
                >
                  <FileText size={14} />
                  <span>View Full Forensic Dossier</span>
                </button>
              </div>
            </div>

            {/* Main Interactive Multi-Spectrum Comparator */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left 7 Columns: Dual-Layer X-Ray Lens */}
              <div className="lg:col-span-7 space-y-4">
                <CompareLens
                  originalUrl={selectedSample.previewUrl}
                  heatmapUrl={activeLayer === "fft" ? selectedSample.fftUrl : selectedSample.heatmapUrl}
                  originalLabel={`SOURCE: ${selectedSample.title.toUpperCase()}`}
                  forensicLabel={`LAYER: ${activeLayer.toUpperCase()} FORENSIC SPECTRUM`}
                  activeLayer={activeLayer}
                  isAuthentic={selectedSample.isAuthentic}
                />

                {/* Technical Coordinates Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-[#F2F2EE] hairline-all font-mono text-[10px] text-[#64646E]">
                  <div>
                    <span className="text-[#9898A4] block uppercase">RESOLUTION</span>
                    <span className="text-[#0A0A0C] font-semibold">{selectedSample.resolution}</span>
                  </div>
                  <div>
                    <span className="text-[#9898A4] block uppercase">PROVENANCE</span>
                    <span
                      className={`font-bold ${
                        selectedSample.c2paStatus === "valid" ? "text-[#059669]" : "text-[#FF3B00]"
                      }`}
                    >
                      {selectedSample.c2paStatus.toUpperCase()}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[#9898A4] block uppercase">SHA-256 PROOF</span>
                    <span className="text-[#0A0A0C] font-semibold truncate block font-mono">
                      {selectedSample.hash}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right 5 Columns: 4-Layer Spectrum Switcher */}
              <div className="lg:col-span-5 space-y-4">
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
                        data-cursor="LAYER"
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

                {/* Evidence Findings Block */}
                <div className="p-4 bg-white hairline-all space-y-2 pt-4">
                  <span className="font-mono text-[10px] text-[#9898A4] uppercase tracking-widest block font-bold">
                    // FORENSIC EVIDENCE OBSERVATIONS:
                  </span>
                  <div className="space-y-1.5">
                    {selectedSample.forensicSummary.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs font-sans text-[#383838]">
                        <span className="font-mono text-[#FF3B00] font-bold text-[11px]">[{idx + 1}]</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Dossier Modal */}
            <ForensicReportModal
              sample={selectedSample}
              isOpen={isReportOpen}
              onClose={() => setIsReportOpen(false)}
            />
          </div>
        )}
      </div>

      {/* Minimal Workstation Colophon */}
      <footer className="w-full bg-[#0A0A0C] text-[#FBFBFA] py-6 px-4 sm:px-8 font-mono text-[11px] text-[#64646E] hairline-dark-t mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-white font-bold">MEDIA AUTH // WORKSTATION</span>
            <span>FASTAPI COMPATIBLE // C2PA 2.1 SPECIFICATION</span>
          </div>
          <span className="text-[#9898A4]">DETERMINISTIC NEURAL FORENSICS</span>
        </div>
      </footer>
    </main>
  );
}

