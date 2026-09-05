"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX, Menu, X, ArrowUpRight, ShieldCheck, Cpu } from "lucide-react";
import { toggleAudio, isAudioEnabled, playClick } from "@/lib/audio-synth";
import { ScrambleText } from "@/components/ui/scramble-text";

export function EditorialHeader() {
  const [soundOn, setSoundOn] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [timeUtc, setTimeUtc] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeUtc(
        now.toISOString().replace("T", " ").substring(0, 19) + " UTC"
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSoundToggle = () => {
    const nextState = toggleAudio();
    setSoundOn(nextState);
    if (nextState) {
      playClick(1600, "sine", 0.05);
    }
  };

  const navLinks = [
    { num: "00", label: "DEDICATED WORKSTATION", href: "/analyze", tag: "PURE FORENSIC ENGINE // FASTAPI READY", isRoute: true },
    { num: "01", label: "VERIFY MEDIA", href: "#upload-deck", tag: "LIVE FORENSIC LAB", isRoute: false },
    { num: "02", label: "METHODOLOGY", href: "#methodology", tag: "DETECT / INVESTIGATE / UNDERSTAND", isRoute: false },
    { num: "03", label: "CASE DOSSIER", href: "#case-archive", tag: "INTERCEPT ARCHIVE", isRoute: false },
    { num: "04", label: "THREAT RADAR", href: "#threat-radar", tag: "GLOBAL SYNTHESIS FEED", isRoute: false },
    { num: "05", label: "MANIFESTO", href: "#manifesto", tag: "EPISTEMIC SECURITY", isRoute: false },
  ];

  const handleNavClick = (link: { href: string; isRoute?: boolean }) => {
    playClick(1100, "sine", 0.03);
    setMenuOpen(false);
    if (link.isRoute) {
      window.location.href = link.href;
      return;
    }
    const element = document.querySelector(link.href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 w-full bg-[#FBFBFA]/90 backdrop-blur-md hairline-b">
        {/* Top Minimal Telemetry Bar */}
        <div className="flex items-center justify-between px-4 sm:px-8 py-2 text-[10px] font-mono tracking-widest text-[#64646E] hairline-b bg-[#F2F2EE]/60">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-[#0A0A0C] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#059669] animate-pulse" />
              SYSTEM ACTIVE
            </span>
            <span className="hidden md:inline text-[#9898A4]">|</span>
            <span className="hidden md:inline text-[#0A0A0C]">SYS_LATENCY: 4.2MS</span>
            <span className="hidden lg:inline text-[#9898A4]">|</span>
            <span className="hidden lg:inline">C2PA VALIDATOR v2.4.1</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden sm:inline font-mono text-[#0A0A0C]">{timeUtc || "2026-09-05 UTC"}</span>
            <button
              onClick={handleSoundToggle}
              className="flex items-center gap-1.5 text-[#0A0A0C] hover:text-[#FF3B00] transition-colors cursor-pointer px-1 py-0.5"
              title="Toggle audio feedback"
              aria-label="Toggle audio feedback"
            >
              {soundOn ? <Volume2 size={12} className="text-[#FF3B00]" /> : <VolumeX size={12} />}
              <span className="text-[9px] uppercase font-bold">{soundOn ? "AUDIO ON" : "MUTED"}</span>
            </button>
          </div>
        </div>

        {/* Main Editorial Bar */}
        <div className="flex items-center justify-between px-4 sm:px-8 py-4 sm:py-5">
          {/* Brand Mark */}
          <div className="flex items-baseline gap-3">
            <a
              href="#"
              className="group flex items-baseline gap-2 cursor-pointer select-none"
              onClick={() => playClick(1200)}
            >
              <span className="text-xl sm:text-2xl font-bold tracking-tighter text-[#0A0A0C] font-display uppercase group-hover:text-[#FF3B00] transition-colors">
                MediaAuth
              </span>
              <span className="hidden sm:inline text-xs font-mono tracking-widest text-[#9898A4]">
                [MEDIA AUTHY FORENSICS]
              </span>
            </a>
            <span className="hidden xl:inline-block text-[10px] font-mono uppercase px-2 py-0.5 bg-[#0A0A0C] text-white">
              ISSUE № 09
            </span>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-8 font-mono text-xs tracking-wider">
            {navLinks.slice(1, 5).map((link) => (
              <a
                key={link.num}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(link);
                }}
                className="group flex items-center gap-1.5 text-[#0A0A0C] hover:text-[#FF3B00] transition-colors py-1 cursor-pointer"
                data-cursor="GOTO"
              >
                <span className="text-[10px] text-[#9898A4] group-hover:text-[#FF3B00]">[{link.num}]</span>
                <span className="font-medium">{link.label}</span>
              </a>
            ))}
          </nav>

          {/* Right Action & Menu Toggle */}
          <div className="flex items-center gap-3 sm:gap-4">
            <a
              href="/analyze"
              onClick={() => playClick(1200)}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-[#0A0A0C] text-[#FBFBFA] hover:bg-[#FF3B00] font-mono text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-sm group"
              data-cursor="ANALYZE"
            >
              <Cpu size={14} className="text-[#FF3B00] group-hover:text-white transition-colors" />
              <span>Launch Workstation</span>
              <ArrowUpRight size={14} />
            </a>

            {/* Menu Hamburger */}
            <button
              onClick={() => {
                playClick(1300, "triangle", 0.04);
                setMenuOpen(!menuOpen);
              }}
              aria-label="Open index menu"
              className="p-2 sm:px-3.5 sm:py-2 border border-[#0A0A0C] hover:bg-[#0A0A0C] hover:text-white transition-colors font-mono text-xs flex items-center gap-2 cursor-pointer"
            >
              {menuOpen ? <X size={16} /> : <Menu size={16} />}
              <span className="hidden sm:inline font-bold uppercase">{menuOpen ? "CLOSE" : "INDEX"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Full-Screen Avant-Garde Editorial Index Drawer */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="fixed inset-0 z-20 top-[96px] bg-[#FBFBFA] flex flex-col justify-between p-6 sm:p-12 overflow-y-auto hairline-b"
          >
            <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 pt-6">
              {/* Left Column: Index Directory */}
              <div className="lg:col-span-8 flex flex-col space-y-6">
                <span className="font-mono text-xs tracking-widest text-[#9898A4] uppercase">
                  // NAVIGATION INDEX // MEDIA AUTHY v2.4
                </span>

                <div className="space-y-4">
                  {navLinks.map((link) => (
                    <div
                      key={link.num}
                      onClick={() => handleNavClick(link)}
                      className="group flex flex-col sm:flex-row sm:items-baseline justify-between py-4 hairline-b hover:border-[#FF3B00] transition-colors cursor-pointer"
                      data-cursor="OPEN"
                    >
                      <div className="flex items-baseline gap-4 sm:gap-6">
                        <span className="font-mono text-sm sm:text-base text-[#9898A4] group-hover:text-[#FF3B00] transition-colors">
                          [{link.num}]
                        </span>
                        <h3 className="text-2xl sm:text-4xl md:text-5xl font-display font-bold uppercase tracking-tight text-[#0A0A0C] group-hover:translate-x-2 transition-transform duration-300">
                          {link.label}
                        </h3>
                      </div>
                      <span className="font-mono text-xs text-[#64646E] uppercase tracking-wider mt-1 sm:mt-0">
                        {link.tag}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Platform Manifesto & Live Status */}
              <div className="lg:col-span-4 flex flex-col justify-between space-y-8 bg-[#F2F2EE] p-6 sm:p-8 hairline-all">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-mono text-[#FF3B00] font-bold uppercase">
                    <ShieldCheck size={16} />
                    <span>Epistemic Security Laboratory</span>
                  </div>
                  <p className="text-sm text-[#383838] leading-relaxed font-sans">
                    Media Authy operates deterministic neural algorithms that uncover latent noise discrepancies,
                    compression artifacts, and biometric micro-tremors in digital imagery, audio, and motion picture.
                  </p>
                </div>

                <div className="space-y-3 pt-6 hairline-t font-mono text-xs">
                  <div className="flex justify-between text-[#64646E]">
                    <span>DEPLOYED MODELS</span>
                    <span className="text-[#0A0A0C] font-bold">14 ENGINES</span>
                  </div>
                  <div className="flex justify-between text-[#64646E]">
                    <span>PROVENANCE STANDARD</span>
                    <span className="text-[#0A0A0C] font-bold">C2PA / CAI</span>
                  </div>
                  <div className="flex justify-between text-[#64646E]">
                    <span>CRYPTOGRAPHIC SIGNATURE</span>
                    <span className="text-[#0A0A0C] font-mono text-[10px]">0x7F9A...B32C</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Colophon in drawer */}
            <div className="max-w-6xl mx-auto w-full pt-8 hairline-t flex flex-col sm:flex-row justify-between text-xs font-mono text-[#9898A4]">
              <span>© 2026 MEDIA AUTHY INC. ALL RIGHTS RESERVED.</span>
              <span>VERIFY BEFORE YOU TRUST.</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
