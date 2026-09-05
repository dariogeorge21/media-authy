import type { Metadata } from "next";
import { Space_Grotesk, Instrument_Serif, JetBrains_Mono, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Media Authy — Autonomous AI Media Verification & Synthetic Forensics",
  description:
    "An editorial-grade computational forensics platform for detecting, investigating, and understanding synthetic media, deepfakes, and generative anomalies. Verify Before You Trust.",
  keywords: [
    "MediaAuth",
    "Media Authy",
    "Deepfake Detection",
    "AI Media Verification",
    "Synthetic Media Forensics",
    "C2PA Provenance",
    "Error Level Analysis",
    "FFT Frequency Analysis",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        "scroll-smooth",
        spaceGrotesk.variable,
        instrumentSerif.variable,
        jetbrainsMono.variable,
        geist.variable
      )}
    >
      <body className="min-h-full flex flex-col bg-[#FBFBFA] text-[#0A0A0C] font-sans selection:bg-[#FF3B00] selection:text-white relative overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
