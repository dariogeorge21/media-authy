"use client";

import React, { useState } from "react";
import { ArrowUpRight, ShieldCheck, Mail, Send, CheckCircle2, Terminal } from "lucide-react";
import { playClick } from "@/lib/audio-synth";

export function EditorialFooter() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    playClick(1600);
    setSubscribed(true);
  };

  return (
    <footer className="w-full bg-[#0A0A0C] text-[#FBFBFA] hairline-dark-t font-sans relative overflow-hidden">
      {/* Top Dispatch & Newsletter Strip */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-16 sm:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pb-16 hairline-dark-b">
          {/* Left Column: Dispatch Headline */}
          <div className="lg:col-span-6 space-y-4">
            <div className="flex items-center gap-2 font-mono text-xs text-[#FF3B00] font-bold uppercase tracking-widest">
              <Terminal size={14} />
              <span>FORENSIC DISPATCH NEWSLETTER</span>
            </div>
            <h3 className="text-3xl sm:text-5xl font-display font-extrabold uppercase tracking-tight text-white leading-tight">
              Receive Declassified <br />
              <span className="font-serif italic font-normal text-[#FF3B00]">Synthetic Media</span> Briefings.
            </h3>
            <p className="text-xs sm:text-sm text-[#9898A4] font-sans max-w-md">
              Bi-weekly analysis of emerging generative AI threats, deepfake vectors, and cryptographic verification standards.
            </p>
          </div>

          {/* Right Column: High-Fashion Terminal Input */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            {subscribed ? (
              <div className="p-6 bg-white/5 border border-[#059669] text-white font-mono text-xs flex items-center gap-3">
                <CheckCircle2 size={18} className="text-[#059669]" />
                <div>
                  <p className="font-bold text-[#059669]">SUBSCRIPTION REGISTERED</p>
                  <p className="text-[#9898A4] text-[11px]">You are now subscribed to the Media Authy Forensic Dispatch.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ENTER OFFICIAL WORK EMAIL..."
                    required
                    className="flex-1 px-4 py-3.5 bg-white/5 border border-white/20 text-white placeholder-white/40 font-mono text-xs uppercase tracking-wider focus:outline-none focus:border-[#FF3B00] transition-colors"
                  />
                  <button
                    type="submit"
                    data-cursor="DISPATCH"
                    className="px-6 py-3.5 bg-[#FF3B00] hover:bg-[#E03400] text-white font-mono text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <span>SUBSCRIBE</span>
                    <Send size={13} />
                  </button>
                </div>
                <p className="font-mono text-[10px] text-[#64646E]">
                  ENCRYPTED TRANSMISSION // ZERO THIRD-PARTY TRACKING
                </p>
              </form>
            )}
          </div>
        </div>

        {/* Directory Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-8 py-14 font-mono text-xs">
          <div className="space-y-3">
            <span className="text-[10px] text-[#FF3B00] uppercase tracking-widest font-bold block">
              // ARCHITECTURE
            </span>
            <ul className="space-y-2 text-[#9898A4]">
              <li><a href="#upload-deck" className="hover:text-white transition-colors">Spectral ELA Engine</a></li>
              <li><a href="#methodology" className="hover:text-white transition-colors">FFT Fourier Domain</a></li>
              <li><a href="#methodology" className="hover:text-white transition-colors">Remote rPPG Biometrics</a></li>
              <li><a href="#methodology" className="hover:text-white transition-colors">C2PA Enclave Ledger</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <span className="text-[10px] text-[#FF3B00] uppercase tracking-widest font-bold block">
              // REPOSITORIES
            </span>
            <ul className="space-y-2 text-[#9898A4]">
              <li><a href="#case-archive" className="hover:text-white transition-colors">Case Investigation Archive</a></li>
              <li><a href="#threat-radar" className="hover:text-white transition-colors">Live Global Threat Feed</a></li>
              <li><a href="#manifesto" className="hover:text-white transition-colors">The Epistemic Manifesto</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Model Fingerprint Index</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <span className="text-[10px] text-[#FF3B00] uppercase tracking-widest font-bold block">
              // SPECIFICATIONS
            </span>
            <ul className="space-y-2 text-[#9898A4]">
              <li className="text-white">API Version: v2.4.1</li>
              <li className="text-white">C2PA Standard: 2.1</li>
              <li className="text-white">Inference Engine: Rust/Wasm</li>
              <li className="text-white">SLA Uptime: 99.998%</li>
            </ul>
          </div>

          <div className="space-y-3">
            <span className="text-[10px] text-[#FF3B00] uppercase tracking-widest font-bold block">
              // LAB LOCATIONS
            </span>
            <div className="text-[#9898A4] space-y-1 text-[11px]">
              <p className="text-white font-semibold">Media Authy Forensics Group</p>
              <p>52.5200° N, 13.4050° E (Berlin)</p>
              <p>37.7749° N, 122.4194° W (San Francisco)</p>
              <p className="pt-2 text-[#FF3B00]">SEC_NODE // ORACLE #442</p>
            </div>
          </div>
        </div>

        {/* Bottom Colophon & Copyright */}
        <div className="pt-10 hairline-dark-t flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px] text-[#64646E]">
          <div className="flex items-center gap-3">
            <span className="text-white font-bold tracking-tight">MEDIA AUTH // MEDIA AUTHY</span>
            <span>© 2026. ALL RIGHTS RESERVED.</span>
          </div>

          <div className="flex items-center gap-6">
            <span className="hover:text-white transition-colors cursor-pointer">PRIVACY PROTOCOL</span>
            <span className="hover:text-white transition-colors cursor-pointer">CRYPTOGRAPHIC AUDIT</span>
            <span className="hover:text-white transition-colors cursor-pointer">TERMS OF FORENSIC USE</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

