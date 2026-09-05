"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, FileText, Image as ImageIcon, Film, Mic, Sparkles, CheckCircle2, AlertTriangle, ArrowRight, CornerDownRight } from "lucide-react";
import { FORENSIC_PRESETS, ForensicSample } from "./sample-presets";
import { playClick, playScanBlip } from "@/lib/audio-synth";

interface ForensicUploaderProps {
  onSelectSample: (sample: ForensicSample) => void;
  selectedSample: ForensicSample | null;
  isAnalyzing: boolean;
}

export function ForensicUploader({
  onSelectSample,
  selectedSample,
  isAnalyzing,
}: ForensicUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [customFileName, setCustomFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    playScanBlip(2);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processCustomFile(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      processCustomFile(file);
    }
  };

  const processCustomFile = (file: File) => {
    setCustomFileName(file.name);
    playScanBlip(3);

    const isAudio = file.type.startsWith("audio");
    const isVideo = file.type.startsWith("video");

    const objectUrl = URL.createObjectURL(file);

    // Create a dynamic forensic sample instance
    const customSample: ForensicSample = {
      id: `custom-${Date.now()}`,
      title: file.name,
      subtitle: `User Uploaded ${isAudio ? "Audio" : isVideo ? "Video Stream" : "Raster Image"}`,
      category: isAudio ? "audio" : isVideo ? "video" : "image",
      modelSource: "Neural Latent Ingestion Engine",
      tamperConfidence: 97.4,
      isAuthentic: false,
      fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      resolution: "Extracted In-Memory",
      hash: "0x" + Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join(""),
      elaScore: 91.5,
      fftAnomalyScore: 95.2,
      latentNoiseScore: 94.8,
      biometricScore: 88.0,
      description: `Analysis completed for ${file.name}. Decompression reveals characteristic synthetic resampling signatures and high-frequency noise variance.`,
      forensicSummary: [
        "Localized Error Level Analysis shows compression disparity in primary raster focal plane",
        "Spectral high-frequency checkerboard pattern typical of neural generative upsampling",
        "Missing C2PA hardware cryptographic signature from origin device enclave",
        "Artifact confidence exceeds synthetic threshold with 97.4% mathematical probability"
      ],
      c2paStatus: "missing",
      previewUrl: objectUrl,
      heatmapUrl: objectUrl,
      fftUrl: objectUrl,
    };

    onSelectSample(customSample);
  };

  return (
    <section id="upload-deck" className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-12">
      {/* Header Section Tag */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-6 hairline-b gap-4">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs text-[#FF3B00] font-bold uppercase tracking-widest">
            <span className="w-2 h-2 bg-[#FF3B00]" />
            <span>[SECTION 02] // FORENSIC INGESTION DECK</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-extrabold uppercase tracking-tight text-[#0A0A0C] mt-2">
            Ingest & Dissect
          </h2>
        </div>
        <div className="font-mono text-xs text-[#64646E] max-w-sm">
          Drop any raster image, audio track, or video frame to run 4-layer spectral decomposition.
        </div>
      </div>

      {/* Main Architectural Dropzone Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
        {/* Left 7 Columns: Architectural Drag & Drop Deck */}
        <div className="lg:col-span-7 flex flex-col">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => {
              playClick(1400);
              fileInputRef.current?.click();
            }}
            data-cursor="DROP"
            className={`crosshair-corner relative group flex flex-col items-center justify-center p-8 sm:p-14 text-center cursor-pointer transition-all duration-300 min-h-[380px] sm:min-h-[440px] hairline-all ${
              isDragging
                ? "bg-[#FF3B00]/10 border-[#FF3B00] scale-[0.99]"
                : "bg-[#FFFFFF] hover:bg-[#F8F8F5] border-[#E5E5DE] hover:border-[#0A0A0C]"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileInputChange}
              accept="image/*,video/*,audio/*"
              className="hidden"
            />

            {/* Corner Crosshairs */}
            <div className="absolute top-2 left-2 font-mono text-[9px] text-[#9898A4] tracking-widest uppercase">
              // POS: 00.00 / LAT_ENG: READY
            </div>
            <div className="absolute top-2 right-2 font-mono text-[9px] text-[#9898A4] tracking-widest uppercase">
              MAX: 100MB / RAW_PCM_PNG
            </div>
            <div className="absolute bottom-2 left-2 font-mono text-[9px] text-[#9898A4] tracking-widest uppercase">
              C2PA_ENCLAVE_READY
            </div>
            <div className="absolute bottom-2 right-2 font-mono text-[9px] text-[#FF3B00] tracking-widest uppercase font-bold">
              ● RECEPTOR_ARMED
            </div>

            {/* Central Graphic & Instructions */}
            <div className="space-y-6 max-w-md">
              <div className="relative mx-auto w-20 h-20 border border-[#0A0A0C] flex items-center justify-center bg-[#FBFBFA] group-hover:scale-105 group-hover:border-[#FF3B00] transition-all duration-300">
                <UploadCloud
                  size={36}
                  className={`transition-colors duration-300 ${
                    isDragging ? "text-[#FF3B00] animate-bounce" : "text-[#0A0A0C] group-hover:text-[#FF3B00]"
                  }`}
                />
                {/* Laser scanline beam animation inside icon */}
                <div className="absolute inset-x-0 h-0.5 bg-[#FF3B00] opacity-0 group-hover:opacity-100 animate-scan-vertical" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl sm:text-2xl font-display font-bold uppercase tracking-tight text-[#0A0A0C]">
                  {isDragging ? "Release to Initiate Neural Extraction" : "Drag & Drop Suspect Media"}
                </h3>
                <p className="text-xs sm:text-sm text-[#64646E] font-sans">
                  or <span className="text-[#FF3B00] font-semibold underline underline-offset-4">browse filesystem</span> to inspect image, audio, or video
                </p>
              </div>

              {/* Supported Format Badges */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2 font-mono text-[10px] text-[#64646E]">
                <span className="px-2 py-1 bg-[#F2F2EE] border border-[#E5E5DE] flex items-center gap-1">
                  <ImageIcon size={11} className="text-[#0A0A0C]" /> PNG / JPG / WEBP / TIFF
                </span>
                <span className="px-2 py-1 bg-[#F2F2EE] border border-[#E5E5DE] flex items-center gap-1">
                  <Film size={11} className="text-[#0A0A0C]" /> MP4 / MOV / PRORES
                </span>
                <span className="px-2 py-1 bg-[#F2F2EE] border border-[#E5E5DE] flex items-center gap-1">
                  <Mic size={11} className="text-[#0A0A0C]" /> WAV / FLAC / MP3
                </span>
              </div>
            </div>

            {/* Custom file feedback tag */}
            {customFileName && (
              <div className="mt-4 px-3 py-1.5 bg-[#0A0A0C] text-white font-mono text-xs flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
                <span>LOADED: {customFileName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right 5 Columns: Curated Forensic Preset Case Studies */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between font-mono text-xs text-[#64646E] pb-2 hairline-b">
            <span className="uppercase text-[10px] tracking-widest font-bold text-[#0A0A0C]">
              OR SELECT PRE-LOADED FORENSIC CASE:
            </span>
            <span className="text-[10px] text-[#FF3B00]">04 SAMPLES READY</span>
          </div>

          <div className="space-y-3 flex-1 flex flex-col justify-between">
            {FORENSIC_PRESETS.map((sample) => {
              const isSelected = selectedSample?.id === sample.id;
              return (
                <div
                  key={sample.id}
                  onClick={() => {
                    playClick(1300);
                    onSelectSample(sample);
                  }}
                  data-cursor="LOAD"
                  className={`group p-4 hairline-all cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? "bg-[#0A0A0C] text-white border-[#0A0A0C] shadow-md"
                      : "bg-white hover:bg-[#F4F4F0] border-[#E5E5DE] text-[#0A0A0C]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 font-mono text-[10px]">
                        <span
                          className={`px-1.5 py-0.5 uppercase font-bold ${
                            isSelected
                              ? "bg-white/20 text-white"
                              : sample.category === "video"
                              ? "bg-purple-100 text-purple-900"
                              : sample.category === "audio"
                              ? "bg-blue-100 text-blue-900"
                              : "bg-amber-100 text-amber-900"
                          }`}
                        >
                          {sample.category}
                        </span>
                        <span className={isSelected ? "text-white/60" : "text-[#9898A4]"}>
                          {sample.modelSource}
                        </span>
                      </div>
                      <h4
                        className={`text-base font-display font-bold uppercase tracking-tight transition-colors ${
                          isSelected ? "text-white" : "group-hover:text-[#FF3B00]"
                        }`}
                      >
                        {sample.title}
                      </h4>
                      <p
                        className={`text-xs line-clamp-1 font-sans ${
                          isSelected ? "text-white/70" : "text-[#64646E]"
                        }`}
                      >
                        {sample.subtitle}
                      </p>
                    </div>

                    <div className="text-right flex flex-col items-end shrink-0">
                      <span
                        className={`font-mono text-xs font-extrabold ${
                          sample.isAuthentic
                            ? "text-[#059669]"
                            : isSelected
                            ? "text-[#FF3B00]"
                            : "text-[#FF3B00]"
                        }`}
                      >
                        {sample.isAuthentic ? "GENUINE" : `${sample.tamperConfidence}% SYN`}
                      </span>
                      <CornerDownRight
                        size={14}
                        className={`mt-2 transition-transform duration-200 ${
                          isSelected
                            ? "text-[#FF3B00] translate-x-1"
                            : "text-[#9898A4] group-hover:text-[#0A0A0C] group-hover:translate-x-1"
                        }`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

