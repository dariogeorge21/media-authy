"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Volume2, VolumeX, Terminal } from "lucide-react";
import { ForensicUploader } from "@/components/upload/forensic-uploader";
import { FORENSIC_PRESETS, ForensicSample } from "@/components/upload/sample-presets";
import { AnalysisStudio } from "@/components/analysis/analysis-studio";
import { DeepScanner } from "@/components/analysis/deep-scanner";
import { NoiseOverlay, GridLinesBackground } from "@/components/layout/noise-overlay";
import { CustomCursor } from "@/components/cursor/custom-cursor";
import { streamMediaAnalysis, StreamEvent } from "@/lib/forensic-api";
import { playClick, playScanBlip, playVerificationComplete, toggleAudio } from "@/lib/audio-synth";

export default function DedicatedAnalyzePage() {
  const [selectedSample, setSelectedSample] = useState<ForensicSample | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [currentScanAction, setCurrentScanAction] = useState("Initializing deep forensic pipeline...");
  const [activeFilePreviewUrl, setActiveFilePreviewUrl] = useState<string | null>(null);
  const [activeFileName, setActiveFileName] = useState<string>("suspect_media.jpg");
  const [reasoningLogs, setReasoningLogs] = useState<string[]>([]);
  const [soundOn, setSoundOn] = useState(true);

  const handleSoundToggle = () => {
    const nextState = toggleAudio();
    setSoundOn(nextState);
    if (nextState) playClick(1600);
  };

  const handleStartUploadAnalysis = async (file: File) => {
    const preview = URL.createObjectURL(file);
    setActiveFilePreviewUrl(preview);
    setActiveFileName(file.name);
    setIsAnalyzing(true);
    setScanProgress(10);
    setCurrentScanAction("Transmitting payload to FastAPI Forensic Agent...");
    setReasoningLogs([`Payload received: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`]);
    playScanBlip(1);

    try {
      const result = await streamMediaAnalysis(file, (ev: StreamEvent) => {
        if (ev.event === "analysis_started") {
          setScanProgress(20);
          setCurrentScanAction("SHA-256 attested. Initializing multi-stage detectors...");
          setReasoningLogs((prev) => [...prev, `Cryptographic SHA-256 computed: ${ev.sha256_hash || "Attested"}`]);
          playScanBlip(1);
        } else if (ev.event === "check_progress") {
          const prog = ev.progress_percentage || 50;
          setScanProgress(prog);
          if (ev.current_action) {
            setCurrentScanAction(ev.current_action);
          }
          playScanBlip(Math.floor(prog / 20) + 1);
        } else if (ev.event === "stage_completed") {
          if (ev.stage_result?.stage_name) {
            setReasoningLogs((prev) => [...prev, `Completed: ${ev.stage_result.stage_name} (score: ${ev.stage_result.score ?? "--"}%)`]);
          }
        } else if (ev.event === "reasoning_step") {
          setScanProgress(95);
          if (ev.thought_process) {
            setCurrentScanAction(ev.thought_process);
            setReasoningLogs((prev) => [...prev, ev.thought_process]);
          }
        } else if (ev.event === "final_verdict") {
          setScanProgress(100);
          setCurrentScanAction("Multi-spectral dossier compiled.");
        }
      });

      setScanProgress(100);
      setTimeout(() => {
        setSelectedSample(result);
        setIsAnalyzing(false);
        playVerificationComplete(result.isAuthentic);
      }, 600);
    } catch (e) {
      console.error("Upload analysis error:", e);
      setIsAnalyzing(false);
    }
  };

  const handleSelectPreset = (preset: ForensicSample) => {
    playClick(1400);
    setActiveFileName(preset.title);
    setActiveFilePreviewUrl(preset.previewUrl);
    setIsAnalyzing(true);
    setScanProgress(0);
    setReasoningLogs([
      `Loading pre-verified forensic case: ${preset.title}`,
      `Model family target: ${preset.modelSource}`,
    ]);

    let prog = 0;
    const interval = setInterval(() => {
      prog += 20;
      if (prog >= 100) {
        clearInterval(interval);
        setScanProgress(100);
        setCurrentScanAction("Compiling final multi-spectral verdict...");
        setReasoningLogs((prev) => [...prev, `Decomposition completed with ${preset.tamperConfidence}% tamper probability.`]);

        setTimeout(() => {
          setSelectedSample(preset);
          setIsAnalyzing(false);
          playVerificationComplete(preset.isAuthentic);
        }, 500);
      } else {
        setScanProgress(prog);
        playScanBlip(Math.floor(prog / 20));
        if (prog === 20) {
          setCurrentScanAction("Stage 1/5: Parsing cryptographic metadata and provenance...");
          setReasoningLogs((prev) => [...prev, "Stage 1: Metadata sanitization and EXIF integrity verified."]);
        } else if (prog === 40) {
          setCurrentScanAction("Stage 2/5: Calculating Error Level Analysis (ELA) quantization delta...");
          setReasoningLogs((prev) => [...prev, `Stage 2: ELA compression table disparity scored at ${preset.elaScore}%.`]);
        } else if (prog === 60) {
          setCurrentScanAction("Stage 3/5: Computing 2D Fast Fourier Transform frequency harmonics...");
          setReasoningLogs((prev) => [...prev, `Stage 3: FFT harmonic lattice anomaly scored at ${preset.fftAnomalyScore}%.`]);
        } else if (prog === 80) {
          setCurrentScanAction("Stage 4/5: Extracting Poisson-Gaussian sensor noise residuals...");
          setReasoningLogs((prev) => [...prev, `Stage 4: Latent noise PRNU scored at ${preset.latentNoiseScore}%.`]);
        }
      }
    }, 180);
  };

  const handleReset = () => {
    playClick(1200);
    setSelectedSample(null);
    setActiveFilePreviewUrl(null);
  };

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
              <span className="text-[#64646E]">FASTAPI AGENT (GROQ):</span>
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
        {/* State 1: Upload Ingestion Deck (when no sample is analyzed) */}
        {!selectedSample && (
          <ForensicUploader
            onStartAnalysis={handleStartUploadAnalysis}
            onSelectPreset={handleSelectPreset}
            selectedSample={selectedSample}
            isAnalyzing={isAnalyzing}
          />
        )}

        {/* Deep Machine Scanner Modal */}
        <DeepScanner
          isOpen={isAnalyzing}
          progress={scanProgress}
          currentAction={currentScanAction}
          imagePreviewUrl={activeFilePreviewUrl}
          fileName={activeFileName}
          reasoningLogs={reasoningLogs}
        />

        {/* State 2: Analysis Results View (When media is analyzed) */}
        {selectedSample && !isAnalyzing && (
          <AnalysisStudio
            sample={selectedSample}
            onReset={handleReset}
          />
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
