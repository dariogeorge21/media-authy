"use client";

import React, { useState } from "react";
import { EditorialHeader } from "@/components/layout/editorial-header";
import { TelemetryBar } from "@/components/hero/telemetry-bar";
import { HeroSection } from "@/components/hero/hero-section";
import { ForensicUploader } from "@/components/upload/forensic-uploader";
import { FORENSIC_PRESETS, ForensicSample } from "@/components/upload/sample-presets";
import { AnalysisStudio } from "@/components/analysis/analysis-studio";
import { ForensicPillars } from "@/components/pillars/forensic-pillars";
import { CaseArchive } from "@/components/archive/case-archive";
import { LiveThreatRadar } from "@/components/radar/live-threat-radar";
import { ManifestoSection } from "@/components/manifesto/manifesto-section";
import { EditorialFooter } from "@/components/layout/editorial-footer";
import { NoiseOverlay, GridLinesBackground } from "@/components/layout/noise-overlay";
import { CustomCursor } from "@/components/cursor/custom-cursor";

export default function HomePage() {
  // Default to the first preloaded high-profile forensic sample
  const [selectedSample, setSelectedSample] = useState<ForensicSample>(FORENSIC_PRESETS[0]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleSelectSample = (sample: ForensicSample) => {
    setSelectedSample(sample);
    // Smooth scroll to analysis studio if not already visible
    const element = document.getElementById("analysis-studio");
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

      {/* Massive Editorial Hero: "Verify Before You Trust" */}
      <HeroSection />

      {/* Natural Ingestion Deck & File Dropper */}
      <ForensicUploader
        onSelectSample={handleSelectSample}
        selectedSample={selectedSample}
        isAnalyzing={isAnalyzing}
      />

      {/* Multi-Spectrum Analysis Studio */}
      <div id="analysis-studio">
        <AnalysisStudio sample={selectedSample} />
      </div>

      {/* The Three Pillars: Detect -> Investigate -> Understand */}
      <ForensicPillars />

      {/* Curated Deconstructed Cases Archive */}
      <CaseArchive />

      {/* Real-time Global Intercept Threat Radar */}
      <LiveThreatRadar />

      {/* Bold Typographic Manifesto on Synthetic Reality */}
      <ManifestoSection />

      {/* Refined High-Fashion Editorial Footer */}
      <EditorialFooter />
    </main>
  );
}

