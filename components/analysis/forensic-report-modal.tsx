"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Printer, CheckCircle2, ShieldAlert, FileCode, Hash, Share2, Copy, Check } from "lucide-react";
import { ForensicSample } from "../upload/sample-presets";
import { playClick } from "@/lib/audio-synth";

interface ForensicReportModalProps {
  sample: ForensicSample;
  isOpen: boolean;
  onClose: () => void;
}

export function ForensicReportModal({ sample, isOpen, onClose }: ForensicReportModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyHash = () => {
    playClick(1500);
    navigator.clipboard.writeText(sample.hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    playClick(1200);
    window.print();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="relative w-full max-w-4xl bg-[#FBFBFA] text-[#0A0A0C] hairline-all shadow-2xl p-6 sm:p-10 my-8 max-h-[90vh] overflow-y-auto"
        >
          {/* Top Bar / Actions */}
          <div className="flex items-center justify-between pb-6 hairline-b">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF3B00]" />
              <span className="font-mono text-xs uppercase tracking-widest text-[#64646E]">
                MEDIA AUTHY // OFFICIAL FORENSIC DOSSIER № {sample.id.toUpperCase()}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handlePrint}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F2F2EE] hover:bg-[#0A0A0C] hover:text-white transition-colors font-mono text-xs border border-[#E5E5DE] cursor-pointer"
              >
                <Printer size={13} />
                <span>PRINT</span>
              </button>
              <button
                onClick={onClose}
                className="p-1.5 border border-[#0A0A0C] hover:bg-[#0A0A0C] hover:text-white transition-colors cursor-pointer"
                aria-label="Close dossier"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Dossier Header */}
          <div className="pt-8 pb-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            <div className="md:col-span-8 space-y-2">
              <div className="flex items-center gap-2">
                <span
                  className={`font-mono text-xs font-bold px-2 py-0.5 uppercase ${
                    sample.isAuthentic
                      ? "bg-[#059669] text-white"
                      : "bg-[#FF3B00] text-white"
                  }`}
                >
                  {sample.isAuthentic ? "VERIFIED AUTHENTIC" : "CONFIRMED SYNTHETIC MEDIA"}
                </span>
                <span className="font-mono text-xs text-[#9898A4]">TIMESTAMP: 2026-09-05 10:30 UTC</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-display font-extrabold uppercase tracking-tight text-[#0A0A0C]">
                {sample.title}
              </h2>
              <p className="text-sm font-sans text-[#64646E]">{sample.subtitle}</p>
            </div>

            {/* Verdict Stamp */}
            <div className="md:col-span-4 p-4 bg-[#F2F2EE] hairline-all font-mono text-xs space-y-2 text-right md:text-left">
              <span className="text-[10px] text-[#9898A4] uppercase">TAMPER CONFIDENCE SCORE</span>
              <p
                className={`text-4xl font-display font-extrabold ${
                  sample.isAuthentic ? "text-[#059669]" : "text-[#FF3B00]"
                }`}
              >
                {sample.isAuthentic ? "0.8%" : `${sample.tamperConfidence}%`}
              </p>
              <p className="text-[10px] text-[#64646E]">
                {sample.isAuthentic
                  ? "Zero synthetic residuals detected"
                  : "High statistical likelihood of generative model"}
              </p>
            </div>
          </div>

          {/* Technical Metadata Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 hairline-t hairline-b font-mono text-xs bg-[#F8F8F5] p-4">
            <div>
              <span className="text-[10px] text-[#9898A4] uppercase">IDENTIFIED MODEL FAMILY</span>
              <p className="font-bold text-[#0A0A0C] mt-0.5">{sample.modelSource}</p>
            </div>
            <div>
              <span className="text-[10px] text-[#9898A4] uppercase">SOURCE RESOLUTION</span>
              <p className="font-bold text-[#0A0A0C] mt-0.5">{sample.resolution}</p>
            </div>
            <div>
              <span className="text-[10px] text-[#9898A4] uppercase">PAYLOAD SIZE</span>
              <p className="font-bold text-[#0A0A0C] mt-0.5">{sample.fileSize}</p>
            </div>
            <div>
              <span className="text-[10px] text-[#9898A4] uppercase">C2PA PROVENANCE</span>
              <p className={`font-bold mt-0.5 ${sample.c2paStatus === "valid" ? "text-[#059669]" : "text-[#FF3B00]"}`}>
                {sample.c2paStatus.toUpperCase()}
              </p>
            </div>
          </div>

          {/* Forensic Spectral Metrics Breakdown */}
          <div className="py-6 space-y-4">
            <h4 className="font-mono text-xs uppercase tracking-widest text-[#0A0A0C] font-bold">
              // SPECTRAL DECOMPOSITION METRICS
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-white hairline-all space-y-2">
                <div className="flex justify-between font-mono text-xs">
                  <span className="text-[#64646E]">Error Level Analysis (ELA)</span>
                  <span className="font-bold text-[#0A0A0C]">{sample.elaScore}%</span>
                </div>
                <div className="w-full h-1.5 bg-[#F2F2EE] overflow-hidden">
                  <div
                    className={`h-full ${sample.elaScore > 50 ? "bg-[#FF3B00]" : "bg-[#059669]"}`}
                    style={{ width: `${sample.elaScore}%` }}
                  />
                </div>
                <p className="text-[10px] text-[#9898A4] font-mono">Quantization table compression differential</p>
              </div>

              <div className="p-4 bg-white hairline-all space-y-2">
                <div className="flex justify-between font-mono text-xs">
                  <span className="text-[#64646E]">FFT Frequency Domain Anomaly</span>
                  <span className="font-bold text-[#0A0A0C]">{sample.fftAnomalyScore}%</span>
                </div>
                <div className="w-full h-1.5 bg-[#F2F2EE] overflow-hidden">
                  <div
                    className={`h-full ${sample.fftAnomalyScore > 50 ? "bg-[#FF3B00]" : "bg-[#059669]"}`}
                    style={{ width: `${sample.fftAnomalyScore}%` }}
                  />
                </div>
                <p className="text-[10px] text-[#9898A4] font-mono">Checkerboard upsampling harmonic peaks</p>
              </div>

              <div className="p-4 bg-white hairline-all space-y-2">
                <div className="flex justify-between font-mono text-xs">
                  <span className="text-[#64646E]">Latent Noise Variance Residuals</span>
                  <span className="font-bold text-[#0A0A0C]">{sample.latentNoiseScore}%</span>
                </div>
                <div className="w-full h-1.5 bg-[#F2F2EE] overflow-hidden">
                  <div
                    className={`h-full ${sample.latentNoiseScore > 50 ? "bg-[#FF3B00]" : "bg-[#059669]"}`}
                    style={{ width: `${sample.latentNoiseScore}%` }}
                  />
                </div>
                <p className="text-[10px] text-[#9898A4] font-mono">Sensor Poisson-Gaussian deviation</p>
              </div>

              <div className="p-4 bg-white hairline-all space-y-2">
                <div className="flex justify-between font-mono text-xs">
                  <span className="text-[#64646E]">Biometric / Micro-tremor Pulse</span>
                  <span className="font-bold text-[#0A0A0C]">{sample.biometricScore}%</span>
                </div>
                <div className="w-full h-1.5 bg-[#F2F2EE] overflow-hidden">
                  <div
                    className={`h-full ${sample.biometricScore > 50 ? "bg-[#FF3B00]" : "bg-[#059669]"}`}
                    style={{ width: `${sample.biometricScore}%` }}
                  />
                </div>
                <p className="text-[10px] text-[#9898A4] font-mono">Facial rPPG blood perfusion consistency</p>
              </div>
            </div>
          </div>

          {/* Forensic Observations List */}
          <div className="py-4 space-y-3">
            <h4 className="font-mono text-xs uppercase tracking-widest text-[#0A0A0C] font-bold">
              // FORENSIC EVIDENCE FINDINGS
            </h4>
            <div className="space-y-2">
              {sample.forensicSummary.map((finding, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-white hairline-all text-xs">
                  <span className="font-mono text-[#FF3B00] font-bold">[{idx + 1}]</span>
                  <span className="text-[#383838] font-sans leading-relaxed">{finding}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Cryptographic Proof Hash & Verification Seal */}
          <div className="mt-6 pt-6 hairline-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono text-xs">
            <div className="space-y-1">
              <span className="text-[10px] text-[#9898A4] uppercase">DETERMINISTIC SHA-256 PROOF HASH</span>
              <div className="flex items-center gap-2">
                <code className="px-2 py-1 bg-[#F2F2EE] border border-[#E5E5DE] text-[11px] text-[#0A0A0C] font-bold">
                  {sample.hash}
                </code>
                <button
                  onClick={handleCopyHash}
                  className="p-1 hover:text-[#FF3B00] transition-colors cursor-pointer"
                  title="Copy Hash"
                >
                  {copied ? <Check size={14} className="text-[#059669]" /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-[#9898A4] uppercase">ATTESTATION AUTHORITY</span>
              <p className="text-xs font-bold text-[#0A0A0C]">MEDIA AUTHY FORENSIC ORACLE // ENCLAVE #442</p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
