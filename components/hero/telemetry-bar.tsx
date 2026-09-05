"use client";

import React from "react";
import { AlertCircle, ShieldAlert, Cpu, Activity, Zap } from "lucide-react";

export function TelemetryBar() {
  const telemetryItems = [
    { icon: AlertCircle, label: "DEEPFAKE INTERCEPTED", value: "SORA-2.1 [99.8% SYNTHETIC]", tag: "CRITICAL" },
    { icon: ShieldAlert, label: "VOICE CLONE DETECTED", value: "ELEVENLABS-v3 LATENT ANOMALY", tag: "CONFIRMED" },
    { icon: Cpu, label: "ELA DEVIATION", value: "Δ 0.842 REGION INPAINTING", tag: "ALERT" },
    { icon: Activity, label: "GLOBAL THREAT LEVEL", value: "ELEVATED // TIER 4", tag: "LIVE" },
    { icon: Zap, label: "PROVENANCE TAMPERING", value: "C2PA METADATA STRIPPED", tag: "WARNING" },
  ];

  return (
    <div className="w-full bg-[#0A0A0C] text-[#FBFBFA] overflow-hidden py-3 font-mono text-xs hairline-b hairline-t relative select-none">
      <div className="animate-marquee flex items-center space-x-12 whitespace-nowrap">
        {/* Repeating array for seamless loop */}
        {[...telemetryItems, ...telemetryItems, ...telemetryItems].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="inline-flex items-center space-x-3 text-xs tracking-wider">
              <span className="text-[#FF3B00]">
                <Icon size={14} />
              </span>
              <span className="text-[#9898A4] text-[10px] tracking-widest uppercase">[{item.label}]</span>
              <span className="text-[#FBFBFA] font-medium">{item.value}</span>
              <span className="px-1.5 py-0.5 text-[9px] font-bold bg-[#FF3B00]/20 text-[#FF3B00] border border-[#FF3B00]/40">
                {item.tag}
              </span>
              <span className="text-[#383838] pl-6 font-thin">///</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

