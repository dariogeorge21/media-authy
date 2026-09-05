"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Eye, Search, Award, Shield, Cpu, Activity, Lock, ArrowRight, CornerRightDown, CheckCircle2 } from "lucide-react";
import { playClick } from "@/lib/audio-synth";

export function ForensicPillars() {
  const [activePillar, setActivePillar] = useState(0);

  const pillars = [
    {
      num: "01",
      title: "DETECT",
      subtitle: "Instantaneous Surface & Spectral Anomaly Interception",
      tagline: "Uncovering the subtle math behind neural approximations",
      icon: Eye,
      description:
        "Generative models leave distinct mathematical footprints at the sub-pixel level. Media Authy's real-time detection pipeline immediately isolates high-frequency FFT harmonics, Error Level Analysis (ELA) compression quantization seams, and chromatic aberration inconsistencies that betray synthetic origins.",
      capabilities: [
        "Fourier Domain (FFT) periodic checkerboard pattern extraction",
        "Error Level Analysis (ELA) localized compression variance",
        "Corneal specular highlight environmental vector matching",
        "Latent diffusion high-frequency noise variance scoring",
      ],
      codeSnippet: `// FFT Harmonic Anomaly Extraction
const spectrum = fft2D(rasterBuffer);
const checkerboardIndex = detectPeriodicPeaks(spectrum, { threshold: 0.88 });
if (checkerboardIndex > 0.75) {
  flagSyntheticArtifact({ model: "GAN/Latent-Diffusion", confidence: 0.994 });
}`,
      graphicType: "detect",
    },
    {
      num: "02",
      title: "INVESTIGATE",
      subtitle: "Deep Biometric, Temporal & Multimodal Cross-Referencing",
      tagline: "Correlating biological signals against physical reality",
      icon: Search,
      description:
        "When static detection is insufficient, the engine initiates multimodal forensic dissection. For video and audio streams, it extracts remote photoplethysmography (rPPG) to track biological subcutaneous blood flow, glottal vocal tract resonance, and temporal micro-flutter between consecutive video frames.",
      capabilities: [
        "Remote Photoplethysmography (rPPG) micro-vascular pulse recovery",
        "Facial landmark jitter & temporal corneal consistency tracking",
        "Vocal formant phase synchronization & breath turbulence analysis",
        "Reverse diffusion trajectory & latent prompt reconstruction",
      ],
      codeSnippet: `// Remote rPPG Vascular Pulse Extraction
const facialRegion = isolateFaceTZone(videoFrames);
const rppgSignal = extractColorPerfusionRate(facialRegion);
const heartRateBPM = computeFourierPeak(rppgSignal);
if (!isValidBiologicalPulse(heartRateBPM)) {
  flagDeepfakeFaceReenactment({ reason: "Zero Subcutaneous Perfusion" });
}`,
      graphicType: "investigate",
    },
    {
      num: "03",
      title: "UNDERSTAND",
      subtitle: "Cryptographic Attribution, C2PA Provenance & Truth Ledger",
      tagline: "Attributing source origins and delivering verifiable proof",
      icon: Award,
      description:
        "Verification without actionable provenance is incomplete. Media Authy integrates with C2PA and the Content Authenticity Initiative (CAI) to validate hardware-signed cryptographic manifests, reconstruct asset lineage, and generate court-admissible forensic dossiers signed by decentralized oracles.",
      capabilities: [
        "C2PA / CAI hardware security enclave manifest validation",
        "SHA-256 deterministic proof hash with zero-knowledge attestation",
        "Automated court-grade forensic dossier export (JSON / PDF)",
        "Generative model family classification (Sora, Midjourney, ElevenLabs)",
      ],
      codeSnippet: `// C2PA Hardware Enclave Signature Validation
const manifest = extractC2PAManifest(rawPayload);
const enclaveCert = verifyHardwareRoot(manifest.certChain);
if (enclaveCert.isValid && !manifest.tampered) {
  certifyAuthenticCapture({ standard: "C2PA-v2.1", issuer: enclaveCert.issuer });
}`,
      graphicType: "understand",
    },
  ];

  return (
    <section id="methodology" className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-20">
      {/* Chapter Title & Manifesto Banner */}
      <div className="pb-12 hairline-b">
        <div className="flex items-center gap-2 font-mono text-xs text-[#FF3B00] font-bold uppercase tracking-widest">
          <span className="w-2 h-2 bg-[#FF3B00]" />
          <span>[SECTION 04] // THE THREE PILLARS OF FORENSICS</span>
        </div>
        <h2 className="text-4xl sm:text-6xl md:text-7xl font-display font-extrabold uppercase tracking-tight text-[#0A0A0C] mt-3">
          Detect <span className="font-serif italic font-normal text-[#64646E]">→</span> Investigate <span className="font-serif italic font-normal text-[#64646E]">→</span> Understand
        </h2>
        <p className="font-mono text-xs sm:text-sm text-[#64646E] max-w-2xl mt-4">
          A tri-layered deterministic architecture engineered to expose synthetic anomalies from raw pixels to cryptographic provenance.
        </p>
      </div>

      {/* Interactive Chapter Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-12 items-start">
        {/* Left Column: Numbered Pillar Selector Tabs */}
        <div className="lg:col-span-4 space-y-4">
          <span className="font-mono text-xs text-[#9898A4] uppercase tracking-widest block">
            // SELECT CHAPTER
          </span>

          <div className="space-y-3">
            {pillars.map((pillar, idx) => {
              const isSelected = activePillar === idx;
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.num}
                  onClick={() => {
                    playClick(1300);
                    setActivePillar(idx);
                  }}
                  data-cursor="CHAPTER"
                  className={`group p-6 hairline-all cursor-pointer transition-all duration-300 ${
                    isSelected
                      ? "bg-[#0A0A0C] text-white border-[#0A0A0C] shadow-lg"
                      : "bg-white hover:bg-[#F8F8F5] text-[#0A0A0C] border-[#E5E5DE]"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 font-mono text-xs">
                        <span className={`font-bold ${isSelected ? "text-[#FF3B00]" : "text-[#9898A4]"}`}>
                          [{pillar.num}]
                        </span>
                        <span className="uppercase text-[10px] tracking-widest opacity-80">PILLAR</span>
                      </div>
                      <h3 className="text-2xl font-display font-bold uppercase tracking-tight">
                        {pillar.title}
                      </h3>
                      <p
                        className={`text-xs font-sans mt-2 line-clamp-2 ${
                          isSelected ? "text-white/70" : "text-[#64646E]"
                        }`}
                      >
                        {pillar.tagline}
                      </p>
                    </div>

                    <div
                      className={`p-2 border transition-colors ${
                        isSelected
                          ? "border-white/20 bg-white/10 text-[#FF3B00]"
                          : "border-[#E5E5DE] text-[#0A0A0C] group-hover:border-[#0A0A0C]"
                      }`}
                    >
                      <Icon size={18} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Deep-Dive Editorial Spread for Active Pillar */}
        <div className="lg:col-span-8 bg-white p-6 sm:p-10 hairline-all space-y-8">
          {/* Active Pillar Header */}
          <div className="space-y-3 pb-6 hairline-b">
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="px-2 py-0.5 bg-[#FF3B00] text-white font-bold uppercase tracking-widest">
                CHAPTER {pillars[activePillar].num}
              </span>
              <span className="text-[#9898A4]">MEDIA AUTHY FORENSIC PROTOCOL</span>
            </div>
            <h3 className="text-3xl sm:text-4xl font-display font-extrabold uppercase tracking-tight text-[#0A0A0C]">
              {pillars[activePillar].title} // {pillars[activePillar].subtitle}
            </h3>
            <p className="text-base text-[#383838] leading-relaxed font-sans pt-2">
              {pillars[activePillar].description}
            </p>
          </div>

          {/* Capabilities List */}
          <div className="space-y-4">
            <span className="font-mono text-xs uppercase tracking-widest text-[#0A0A0C] font-bold block">
              // FORENSIC CAPABILITIES & ALGORITHMIC PIPELINE
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {pillars[activePillar].capabilities.map((cap, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-[#FBFBFA] hairline-all text-xs">
                  <CheckCircle2 size={15} className="text-[#FF3B00] shrink-0 mt-0.5" />
                  <span className="text-[#242428] font-sans font-medium">{cap}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Algorithmic Engine Code Block / Live Matrix */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between font-mono text-[11px] text-[#64646E]">
              <span>ALGORITHMIC EXECUTION KERNEL</span>
              <span className="text-[#FF3B00]">RUST / WEBASSEMBLY ENGINE</span>
            </div>
            <div className="p-4 bg-[#0A0A0C] text-[#FBFBFA] font-mono text-xs leading-relaxed overflow-x-auto hairline-dark-all shadow-inner">
              <pre className="text-[11px] text-zinc-300">
                <code>{pillars[activePillar].codeSnippet}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

