"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Film,
  Mic,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  CornerDownRight,
  Scan,
  RefreshCw,
  Zap,
  ShieldCheck,
  Binary
} from "lucide-react";
import { FORENSIC_PRESETS, ForensicSample } from "./sample-presets";
import { playClick, playScanBlip } from "@/lib/audio-synth";

interface ForensicUploaderProps {
  onStartAnalysis: (file: File) => void;
  onSelectPreset: (preset: ForensicSample) => void;
  selectedSample: ForensicSample | null;
  isAnalyzing: boolean;
}

export function ForensicUploader({
  onStartAnalysis,
  onSelectPreset,
  selectedSample,
  isAnalyzing,
}: ForensicUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
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
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    setPendingFile(file);
    playClick(1400);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleClearSelected = (e: React.MouseEvent) => {
    e.stopPropagation();
    playClick(1100);
    setPendingFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleTriggerAnalysis = () => {
    if (!pendingFile) return;
    playClick(1600);
    onStartAnalysis(pendingFile);
  };

  return (
    <section id="upload-deck" className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
      {/* Editorial Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-6 hairline-b gap-4">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs text-[#FF3B00] font-bold uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-[#FF3B00] animate-pulse" />
            <span>[STAGE 01] // INGESTION & DISSECTION DECK</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-extrabold uppercase tracking-tight text-[#0A0A0C] mt-2">
            Upload Suspect Media
          </h2>
        </div>
        <div className="font-mono text-xs text-[#64646E] max-w-sm">
          Select any image to initiate deep 5-stage spectral ELA, 2D Fourier harmonics, and sensor PRNU verification.
        </div>
      </div>

      {/* Main Dropzone & Preset Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8 items-stretch">
        {/* Left 7 Columns: Interactive Upload Receptor */}
        <div className="lg:col-span-7 flex flex-col">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileInputChange}
            accept="image/*,video/*,audio/*"
            className="hidden"
          />

          {!pendingFile ? (
            /* State A: Ready for drop / click */
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => {
                playClick(1300);
                fileInputRef.current?.click();
              }}
              data-cursor="UPLOAD"
              className={`crosshair-corner relative group flex flex-col items-center justify-center p-8 sm:p-14 text-center cursor-pointer transition-all duration-300 min-h-[380px] sm:min-h-[440px] hairline-all flex-1 ${
                isDragging
                  ? "bg-[#FF3B00]/10 border-[#FF3B00] scale-[0.99]"
                  : "bg-white hover:bg-[#F8F8F5] border-[#E5E5DE] hover:border-[#0A0A0C]"
              }`}
            >
              {/* Corner Coordinates */}
              <div className="absolute top-3 left-3 font-mono text-[9px] text-[#9898A4] tracking-widest uppercase">
                INPUT_BUFFER: ARMED // SHA-256
              </div>
              <div className="absolute top-3 right-3 font-mono text-[9px] text-[#9898A4] tracking-widest uppercase">
                MAX: 100MB / RAW / PNG / JPG / WEBP
              </div>
              <div className="absolute bottom-3 left-3 font-mono text-[9px] text-[#9898A4] tracking-widest uppercase">
                GROQ_LPU_REASONER: STANDBY
              </div>
              <div className="absolute bottom-3 right-3 font-mono text-[9px] text-[#FF3B00] tracking-widest uppercase font-bold">
                ● RECEPTOR_ONLINE
              </div>

              {/* Central Graphic & Copy */}
              <div className="space-y-6 max-w-md">
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
                  <h3 className="text-2xl sm:text-3xl font-display font-bold uppercase tracking-tight text-[#0A0A0C]">
                    {isDragging ? "Release to Ingest Payload" : "Drop Target Image Here"}
                  </h3>
                  <p className="text-sm text-[#64646E] font-sans">
                    or <span className="text-[#FF3B00] font-semibold underline underline-offset-4">browse your filesystem</span> to inspect
                  </p>
                </div>

                {/* Supported Format Pills */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2 font-mono text-[10px] text-[#64646E]">
                  <span className="px-2.5 py-1 bg-[#F2F2EE] border border-[#E5E5DE] flex items-center gap-1">
                    <ImageIcon size={11} className="text-[#0A0A0C]" /> PNG / JPG / WEBP / TIFF
                  </span>
                  <span className="px-2.5 py-1 bg-[#F2F2EE] border border-[#E5E5DE] flex items-center gap-1">
                    <Film size={11} className="text-[#0A0A0C]" /> MP4 / MOV
                  </span>
                  <span className="px-2.5 py-1 bg-[#F2F2EE] border border-[#E5E5DE] flex items-center gap-1">
                    <Mic size={11} className="text-[#0A0A0C]" /> WAV / MP3
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* State B: File Loaded -> Ready to Trigger Analysis */
            <div className="crosshair-corner relative bg-white hairline-all p-6 sm:p-8 flex flex-col justify-between flex-1 space-y-6">
              {/* Top Details */}
              <div className="flex items-start justify-between pb-4 hairline-b">
                <div className="space-y-1">
                  <span className="font-mono text-[10px] text-[#059669] uppercase font-bold flex items-center gap-1.5">
                    <CheckCircle2 size={13} />
                    <span>PAYLOAD LOADED IN-MEMORY (EPHEMERAL)</span>
                  </span>
                  <h3 className="text-xl sm:text-2xl font-display font-bold uppercase text-[#0A0A0C] truncate max-w-md">
                    {pendingFile.name}
                  </h3>
                  <p className="font-mono text-xs text-[#64646E]">
                    {(pendingFile.size / (1024 * 1024)).toFixed(2)} MB // {pendingFile.type || "image/raster"}
                  </p>
                </div>

                <button
                  onClick={handleClearSelected}
                  className="px-3 py-1.5 bg-[#F2F2EE] hover:bg-[#0A0A0C] hover:text-white transition-colors font-mono text-xs uppercase cursor-pointer"
                >
                  Change File
                </button>
              </div>

              {/* Center Preview */}
              <div className="relative w-full aspect-[16/9] bg-[#0A0A0C] overflow-hidden flex items-center justify-center border border-[#E5E5DE]">
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt="Pending Media"
                    className="w-full h-full object-contain"
                  />
                )}
                {/* Cyber coordinates watermark */}
                <div className="absolute top-2 left-2 bg-black/70 px-2 py-0.5 font-mono text-[9px] text-[#FF3B00]">
                  ORACLE_READY // SHA-256 PENDING
                </div>
              </div>

              {/* Big Command Trigger Button: ANALYSE */}
              <button
                onClick={handleTriggerAnalysis}
                disabled={isAnalyzing}
                data-cursor="EXECUTE"
                className="w-full py-4 bg-[#FF3B00] hover:bg-[#0A0A0C] text-white font-mono text-sm uppercase tracking-widest font-extrabold flex items-center justify-center gap-3 transition-all duration-300 shadow-lg cursor-pointer group"
              >
                <Zap size={18} className="text-white group-hover:text-[#FF3B00] transition-colors animate-pulse" />
                <span>ANALYSE MEDIA NOW [INITIATE 05-STAGE DEEP SCAN]</span>
                <ArrowRight size={16} className="group-hover:translate-x-1.5 transition-transform" />
              </button>
            </div>
          )}
        </div>

        {/* Right 5 Columns: Curated Forensic Preset Studies */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between font-mono text-xs text-[#64646E] pb-2 hairline-b">
            <span className="uppercase text-[10px] tracking-widest font-bold text-[#0A0A0C]">
              OR TEST VERIFIED CASE STUDY:
            </span>
            <span className="text-[10px] text-[#FF3B00] font-bold">04 PRELOADED SAMPLES</span>
          </div>

          <div className="space-y-3 flex-1 flex flex-col justify-between">
            {FORENSIC_PRESETS.map((sample) => {
              const isSelected = selectedSample?.id === sample.id;
              return (
                <div
                  key={sample.id}
                  onClick={() => {
                    playClick(1300);
                    onSelectPreset(sample);
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
                              : sample.isAuthentic
                              ? "bg-emerald-100 text-emerald-900"
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
                          sample.isAuthentic ? "text-[#059669]" : "text-[#FF3B00]"
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
