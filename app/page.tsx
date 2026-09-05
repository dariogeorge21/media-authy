"use client";

import React, { useState } from "react";
import { EditorialHeader } from "@/components/layout/editorial-header";
import { TelemetryBar } from "@/components/hero/telemetry-bar";
import { HeroSection } from "@/components/hero/hero-section";
import { ForensicUploader } from "@/components/upload/forensic-uploader";
import { FORENSIC_PRESETS, ForensicSample } from "@/components/upload/sample-presets";
import { AnalysisStudio } from "@/components/analysis/analysis-studio";
import { DeepScanner } from "@/components/analysis/deep-scanner";
import { ForensicPillars } from "@/components/pillars/forensic-pillars";
import { CaseArchive } from "@/components/archive/case-archive";
import { LiveThreatRadar } from "@/components/radar/live-threat-radar";
import { ManifestoSection } from "@/components/manifesto/manifesto-section";
import { EditorialFooter } from "@/components/layout/editorial-footer";
import { NoiseOverlay, GridLinesBackground } from "@/components/layout/noise-overlay";
import { CustomCursor } from "@/components/cursor/custom-cursor";
import { streamMediaAnalysis, StreamEvent } from "@/lib/forensic-api";
import { playScanBlip, playVerificationComplete, playClick } from "@/lib/audio-synth";

export default function HomePage() {
  const [selectedSample, setSelectedSample] = useState<ForensicSample | null>(FORENSIC_PRESETS[0]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [currentScanAction, setCurrentScanAction] = useState("Initializing deep forensic pipeline...");
  const [activeFilePreviewUrl, setActiveFilePreviewUrl] = useState<string | null>(null);
  const [activeFileName, setActiveFileName] = useState<string>("suspect_media.jpg");
  const [reasoningLogs, setReasoningLogs] = useState<string[]>([]);

  // Paced analysis for user-uploaded custom files
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
      // Stream analysis from FastAPI backend
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

      // Paced finish transition
      setScanProgress(100);
      setTimeout(() => {
        setSelectedSample(result);
        setIsAnalyzing(false);
        playVerificationComplete(result.isAuthentic);

        // Smooth scroll to analysis studio report
        const element = document.getElementById("analysis-studio");
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 600);
    } catch (e) {
      console.error("Upload analysis error:", e);
      setIsAnalyzing(false);
    }
  };

  // Preset sample click handler with progressive machine scan simulation
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

          const element = document.getElementById("analysis-studio");
          if (element) {
            element.scrollIntoView({ behavior: "smooth" });
          }
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
    const element = document.getElementById("upload-deck");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <main className="min-h-screen bg-[#FBFBFA] text-[#0A0A0C] flex flex-col relative selection:bg-[#FF3B00] selection:text-white">
      {/* Ambient Grain & Grid Overlay */}
      <NoiseOverlay />
      <GridLinesBackground />
      <CustomCursor />

      {/* Global Minimal Navigation */}
      <EditorialHeader />

      {/* Live Forensic Telemetry Ticker Marquee */}
      <TelemetryBar />

      {/* Hero: "Verify Before You Trust" */}
      <HeroSection />

      {/* Stage 1: Natural Ingestion Deck & File Dropper */}
      <ForensicUploader
        onStartAnalysis={handleStartUploadAnalysis}
        onSelectPreset={handleSelectPreset}
        selectedSample={selectedSample}
        isAnalyzing={isAnalyzing}
      />

      {/* Deep Machine Scanner Modal (Visible during active analysis) */}
      <DeepScanner
        isOpen={isAnalyzing}
        progress={scanProgress}
        currentAction={currentScanAction}
        imagePreviewUrl={activeFilePreviewUrl}
        fileName={activeFileName}
        reasoningLogs={reasoningLogs}
      />

      {/* Stage 2: Multi-Spectrum Analysis Studio & Intuitive Report */}
      {selectedSample && !isAnalyzing && (
        <div id="analysis-studio">
          <AnalysisStudio
            sample={selectedSample}
            onReset={handleReset}
          />
        </div>
      )}

      {/* The Three Pillars: Detect -> Investigate -> Understand */}
      <ForensicPillars />

      {/* Curated Deconstructed Cases Archive */}
      <CaseArchive />

      {/* Real-time Global Intercept Threat Radar */}
      <LiveThreatRadar />

      {/* Typographic Manifesto on Synthetic Reality */}
      <ManifestoSection />

      {/* Refined High-Fashion Editorial Footer */}
      <EditorialFooter />
    </main>
  );
}
