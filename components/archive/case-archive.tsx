"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, CheckCircle2, ArrowUpRight, Filter, Calendar, Cpu, Sparkles } from "lucide-react";
import { playClick } from "@/lib/audio-synth";

interface CaseItem {
  id: string;
  code: string;
  title: string;
  date: string;
  category: "VIDEO" | "AUDIO" | "IMAGE";
  modelSource: string;
  verdict: "CONFIRMED SYNTHETIC" | "VERIFIED AUTHENTIC";
  tamperScore: string;
  summary: string;
  imageUrl: string;
  impactLevel: "HIGH SEVERITY" | "CRITICAL" | "AUTHENTIC DISPATCH";
}

export function CaseArchive() {
  const [filter, setFilter] = useState<"ALL" | "VIDEO" | "AUDIO" | "IMAGE">("ALL");
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);

  const cases: CaseItem[] = [
    {
      id: "case-01",
      code: "CASE-№8849",
      title: "Viral Head of State Emergency Speech",
      date: "2026-08-14",
      category: "VIDEO",
      modelSource: "DeepFaceLive-v2 / LatentDiffusion HD",
      verdict: "CONFIRMED SYNTHETIC",
      tamperScore: "99.4%",
      summary: "Broadcast-quality video claiming military mobilization. Dissection revealed missing rPPG vascular pulse in facial capillary bed and mismatched corneal reflections.",
      imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop",
      impactLevel: "CRITICAL",
    },
    {
      id: "case-02",
      code: "CASE-№9021",
      title: "Executive Voice Clone $2.4M Wire Transfer",
      date: "2026-07-29",
      category: "AUDIO",
      modelSource: "ElevenLabs v3 Custom Neural Voice",
      verdict: "CONFIRMED SYNTHETIC",
      tamperScore: "98.9%",
      summary: "High-fidelity audio note sent to CFO authorizing urgent acquisition payment. Fourier analysis demonstrated abnormal phase locking in upper harmonic formants.",
      imageUrl: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=800&auto=format&fit=crop",
      impactLevel: "HIGH SEVERITY",
    },
    {
      id: "case-03",
      code: "CASE-№9184",
      title: "Frontline Photojournalism Pulitzer Candidate",
      date: "2026-06-12",
      category: "IMAGE",
      modelSource: "Leica M11-P (C2PA Signed RAW)",
      verdict: "VERIFIED AUTHENTIC",
      tamperScore: "0.2%",
      summary: "Contested frontline photograph subject to viral disinformation claims. Cryptographic verification validated hardware enclave signature and continuous provenance.",
      imageUrl: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=800&auto=format&fit=crop",
      impactLevel: "AUTHENTIC DISPATCH",
    },
    {
      id: "case-04",
      code: "CASE-№9340",
      title: "Synthetic Natural Disaster Satellite Feed",
      date: "2026-05-03",
      category: "IMAGE",
      modelSource: "Midjourney v6.1 / Sora Inpainting",
      verdict: "CONFIRMED SYNTHETIC",
      tamperScore: "99.1%",
      summary: "High-resolution satellite imagery depicting non-existent flooding in industrial corridor. Error Level Analysis isolated localized tiling boundaries.",
      imageUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=800&auto=format&fit=crop",
      impactLevel: "CRITICAL",
    },
  ];

  const filteredCases = filter === "ALL" ? cases : cases.filter((c) => c.category === filter);

  return (
    <section id="case-archive" className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-20">
      {/* Header & Filter Row */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-8 hairline-b gap-6">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs text-[#FF3B00] font-bold uppercase tracking-widest">
            <span className="w-2 h-2 bg-[#FF3B00]" />
            <span>[SECTION 05] // FORENSIC INVESTIGATION ARCHIVE</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-extrabold uppercase tracking-tight text-[#0A0A0C] mt-2">
            Deconstructed Cases
          </h2>
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-[#9898A4] mr-2 hidden sm:inline">FILTER:</span>
          {(["ALL", "VIDEO", "AUDIO", "IMAGE"] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => {
                playClick(1400);
                setFilter(cat);
              }}
              className={`px-3 py-1.5 transition-colors uppercase tracking-wider cursor-pointer ${
                filter === cat
                  ? "bg-[#0A0A0C] text-white font-bold"
                  : "bg-white text-[#0A0A0C] hover:bg-[#F2F2EE] border border-[#E5E5DE]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Case Studies Editorial Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
        {filteredCases.map((item) => (
          <div
            key={item.id}
            onClick={() => {
              playClick(1200);
              setSelectedCase(item);
            }}
            data-cursor="INSPECT"
            className="group bg-white hairline-all cursor-pointer transition-all duration-300 hover:border-[#0A0A0C] flex flex-col justify-between"
          >
            {/* Top Image Preview with Metadata Overlay */}
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#0A0A0C]">
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105 opacity-90 group-hover:opacity-100"
                style={{ backgroundImage: `url(${item.imageUrl})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

              {/* Status and Category Badges */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between font-mono text-[10px]">
                <span className="px-2 py-0.5 bg-black/80 text-white backdrop-blur-sm border border-white/20">
                  {item.code}
                </span>
                <span
                  className={`px-2 py-0.5 font-bold uppercase ${
                    item.verdict === "VERIFIED AUTHENTIC"
                      ? "bg-[#059669] text-white"
                      : "bg-[#FF3B00] text-white"
                  }`}
                >
                  {item.verdict} [{item.tamperScore}]
                </span>
              </div>

              {/* Bottom model stamp inside image */}
              <div className="absolute bottom-3 left-4 right-4 flex justify-between items-center text-white/90 font-mono text-[10px]">
                <span>MODEL: {item.modelSource}</span>
                <span className="flex items-center gap-1 text-[#FF3B00] group-hover:translate-x-1 transition-transform">
                  INSPECT DOSSIER <ArrowUpRight size={12} />
                </span>
              </div>
            </div>

            {/* Case Content */}
            <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between font-mono text-[10px] text-[#9898A4]">
                  <span>DATE OF INTERCEPT: {item.date}</span>
                  <span className="text-[#FF3B00] font-bold">{item.impactLevel}</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-display font-bold uppercase tracking-tight text-[#0A0A0C] group-hover:text-[#FF3B00] transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#64646E] font-sans leading-relaxed line-clamp-3">
                  {item.summary}
                </p>
              </div>

              <div className="pt-4 hairline-t flex items-center justify-between font-mono text-xs text-[#9898A4]">
                <span>CATEGORY: {item.category}</span>
                <span className="text-[#0A0A0C] font-semibold group-hover:underline">VIEW FULL EVIDENCE →</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Case Detail Drawer / Modal */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-[#FBFBFA] p-6 sm:p-8 hairline-all space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 hairline-b font-mono text-xs">
              <span className="text-[#FF3B00] font-bold">{selectedCase.code} // DECLASSIFIED FORENSIC DOSSIER</span>
              <button
                onClick={() => setSelectedCase(null)}
                className="px-2 py-1 bg-[#0A0A0C] text-white hover:bg-[#FF3B00] transition-colors cursor-pointer"
              >
                CLOSE
              </button>
            </div>

            <div className="space-y-3">
              <h3 className="text-2xl font-display font-extrabold uppercase text-[#0A0A0C]">
                {selectedCase.title}
              </h3>
              <div className="flex flex-wrap gap-2 font-mono text-xs">
                <span className="px-2 py-0.5 bg-[#F2F2EE] text-[#0A0A0C] border border-[#E5E5DE]">
                  MODEL: {selectedCase.modelSource}
                </span>
                <span className="px-2 py-0.5 bg-[#FF3B00] text-white font-bold">
                  {selectedCase.verdict} ({selectedCase.tamperScore})
                </span>
              </div>
              <p className="text-sm font-sans text-[#383838] leading-relaxed pt-2">
                {selectedCase.summary}
              </p>
            </div>

            <div className="p-4 bg-[#F2F2EE] hairline-all font-mono text-xs space-y-2">
              <span className="text-[10px] text-[#9898A4] uppercase block font-bold">PRIMARY EVIDENCE RECONSTRUCTION:</span>
              <ul className="space-y-1.5 text-[#383838] list-disc list-inside text-xs">
                <li>Spatial discrete cosine transform (DCT) frequency misalignment detected.</li>
                <li>Biometric pulse micro-flutter variance fails human physiological baseline.</li>
                <li>Signed C2PA provenance manifest was absent from payload headers.</li>
              </ul>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedCase(null)}
                className="px-6 py-2.5 bg-[#0A0A0C] text-white hover:bg-[#FF3B00] transition-colors font-mono text-xs uppercase tracking-wider cursor-pointer"
              >
                Acknowledge & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

