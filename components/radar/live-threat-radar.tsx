"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Radio, ShieldAlert, Globe, Server, ArrowUpRight, Play, Pause } from "lucide-react";
import { playClick, playScanBlip } from "@/lib/audio-synth";

interface InterceptEvent {
  id: string;
  time: string;
  location: string;
  type: string;
  model: string;
  risk: "CRITICAL" | "ELEVATED" | "MODERATE";
  score: string;
}

export function LiveThreatRadar() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [events, setEvents] = useState<InterceptEvent[]>([
    {
      id: "INT-8491",
      time: "10:31:02",
      location: "Frankfurt, DE (EU-CENTRAL-1)",
      type: "Audio Clone Infiltration",
      model: "ElevenLabs-v3",
      risk: "CRITICAL",
      score: "99.8%",
    },
    {
      id: "INT-8492",
      time: "10:30:48",
      location: "Tokyo, JP (AP-NORTHEAST-1)",
      type: "Diffusion Crisis Imagery",
      model: "Midjourney-v6.1",
      risk: "ELEVATED",
      score: "98.4%",
    },
    {
      id: "INT-8493",
      time: "10:29:15",
      location: "Ashburn, US (US-EAST-1)",
      type: "DeepFace Live Reenactment",
      model: "SimSwap-HD",
      risk: "CRITICAL",
      score: "99.2%",
    },
    {
      id: "INT-8494",
      time: "10:28:40",
      location: "London, UK (EU-WEST-2)",
      type: "Synthetic Financial Statement",
      model: "GPT-4o OCR Inpainting",
      risk: "MODERATE",
      score: "94.6%",
    },
  ]);

  // Periodically add new simulated intercepts
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      const cities = ["Singapore, SG", "Sydney, AU", "São Paulo, BR", "Toronto, CA", "Zurich, CH", "Seoul, KR"];
      const types = ["Sora-2 Video Manipulation", "Neural Voice Wire Fraud", "Synthetic Identity Creation", "Diffusion Biometric Spoofing"];
      const models = ["Sora-v2", "ElevenLabs-v3", "Flux.1 Latent", "DeepFaceLive-v2", "Hailuo-Minimax"];
      const risks: ("CRITICAL" | "ELEVATED" | "MODERATE")[] = ["CRITICAL", "ELEVATED", "MODERATE"];

      const now = new Date();
      const timeStr = now.toTimeString().split(" ")[0];

      const newEvent: InterceptEvent = {
        id: `INT-${Math.floor(8000 + Math.random() * 2000)}`,
        time: timeStr,
        location: cities[Math.floor(Math.random() * cities.length)],
        type: types[Math.floor(Math.random() * types.length)],
        model: models[Math.floor(Math.random() * models.length)],
        risk: risks[Math.floor(Math.random() * risks.length)],
        score: `${(95 + Math.random() * 4.9).toFixed(1)}%`,
      };

      setEvents((prev) => [newEvent, ...prev.slice(0, 5)]);
    }, 4500);

    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <section id="threat-radar" className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-8 hairline-b gap-4">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs text-[#FF3B00] font-bold uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-[#FF3B00] animate-ping" />
            <span>[SECTION 06] // GLOBAL SYNTHESIS INTERCEPT RADAR</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-extrabold uppercase tracking-tight text-[#0A0A0C] mt-2">
            Live Global Intercepts
          </h2>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <button
            onClick={() => {
              playClick(1100);
              setIsPlaying(!isPlaying);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E5E5DE] hover:border-[#0A0A0C] transition-colors cursor-pointer"
          >
            {isPlaying ? <Pause size={12} className="text-[#FF3B00]" /> : <Play size={12} />}
            <span>{isPlaying ? "STREAM ACTIVE" : "PAUSED"}</span>
          </button>
          <span className="text-[#9898A4]">8,419 NODES SYNCHRONIZED</span>
        </div>
      </div>

      {/* Threat Stream Table */}
      <div className="mt-8 bg-white hairline-all overflow-x-auto shadow-sm">
        <table className="w-full text-left font-mono text-xs border-collapse">
          <thead>
            <tr className="bg-[#F2F2EE] text-[#64646E] hairline-b text-[10px] uppercase tracking-wider">
              <th className="p-4">INTERCEPT ID</th>
              <th className="p-4">TIME (UTC)</th>
              <th className="p-4">ORIGIN NODE</th>
              <th className="p-4">VECTOR / TYPE</th>
              <th className="p-4">IDENTIFIED MODEL</th>
              <th className="p-4">SEVERITY</th>
              <th className="p-4 text-right">CONFIDENCE</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E5DE]">
            {events.map((ev, idx) => (
              <tr
                key={ev.id}
                className="hover:bg-[#FBFBFA] transition-colors duration-150 group"
              >
                <td className="p-4 font-bold text-[#0A0A0C] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF3B00]" />
                  {ev.id}
                </td>
                <td className="p-4 text-[#64646E]">{ev.time}</td>
                <td className="p-4 text-[#0A0A0C]">{ev.location}</td>
                <td className="p-4 font-medium text-[#0A0A0C]">{ev.type}</td>
                <td className="p-4 text-[#64646E]">{ev.model}</td>
                <td className="p-4">
                  <span
                    className={`px-2 py-0.5 text-[9px] font-bold uppercase ${
                      ev.risk === "CRITICAL"
                        ? "bg-[#FF3B00]/15 text-[#FF3B00] border border-[#FF3B00]/30"
                        : ev.risk === "ELEVATED"
                        ? "bg-amber-100 text-amber-900 border border-amber-300"
                        : "bg-zinc-100 text-zinc-800 border border-zinc-300"
                    }`}
                  >
                    {ev.risk}
                  </span>
                </td>
                <td className="p-4 text-right font-bold text-[#FF3B00]">
                  {ev.score}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

