export interface ForensicSample {
  id: string;
  title: string;
  subtitle: string;
  category: "image" | "video" | "audio";
  modelSource: string;
  tamperConfidence: number; // 0 to 100
  isAuthentic: boolean;
  fileSize: string;
  resolution: string;
  hash: string;
  elaScore: number; // 0 to 100
  fftAnomalyScore: number;
  latentNoiseScore: number;
  biometricScore: number;
  description: string;
  forensicSummary: string[];
  c2paStatus: "valid" | "tampered" | "missing";
  previewUrl: string; // High-quality editorial SVG or image
  heatmapUrl: string; // ELA / Heatmap view
  fftUrl: string; // Fourier spectrum view
}

export const FORENSIC_PRESETS: ForensicSample[] = [
  {
    id: "sample-face-swap",
    title: "Executive Deepfake Reenactment",
    subtitle: "High-level geopolitical speech with neural face swap",
    category: "video",
    modelSource: "DeepFaceLive-v2 / SimSwap HD",
    tamperConfidence: 98.7,
    isAuthentic: false,
    fileSize: "14.2 MB",
    resolution: "3840 x 2160 (4K)",
    hash: "0x8fa3e91b2c4d8e77a112fc99b40091aa4",
    elaScore: 94.2,
    fftAnomalyScore: 97.8,
    latentNoiseScore: 92.5,
    biometricScore: 99.1,
    description: "Neural face-swap reenactment detected in official press room briefing. The synthetic overlay shows boundary blend seams and temporal corneal flickering.",
    forensicSummary: [
      "Corneal specular reflection fails to match environmental key light vector (Δ 38°)",
      "Photoplethysmography (rPPG) vascular pulse missing across facial T-zone",
      "Bilinear warping residuals present around jawline segmentation boundary",
      "FFT shows high-frequency checkerboard noise signature at 120Hz harmonics"
    ],
    c2paStatus: "tampered",
    previewUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1200&auto=format&fit=crop",
    heatmapUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1200&auto=format&fit=crop",
    fftUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop"
  },
  {
    id: "sample-diffusion-art",
    title: "Generative Crisis Photograph",
    subtitle: "Synthetic disaster documentation generated for viral propaganda",
    category: "image",
    modelSource: "Midjourney v6.1 / Flux.1 Latent Diffusion",
    tamperConfidence: 99.4,
    isAuthentic: false,
    fileSize: "8.6 MB",
    resolution: "4096 x 2730",
    hash: "0x39cd88f4a1236be091177bafc4892019b",
    elaScore: 98.1,
    fftAnomalyScore: 96.5,
    latentNoiseScore: 99.8,
    biometricScore: 84.0,
    description: "Photorealistic image exhibiting extreme detail in primary subjects but distinct statistical anomalies in latent diffusion noise residuals and text typography.",
    forensicSummary: [
      "Latent diffusion high-frequency noise variance is statistically uniform across all depths",
      "Error Level Analysis demonstrates abnormal quantization table mismatch in background",
      "Bayer color filter array pattern absent from camera raw reconstruction",
      "No original EXIF hardware encryption signature found"
    ],
    c2paStatus: "missing",
    previewUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=1200&auto=format&fit=crop",
    heatmapUrl: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=1200&auto=format&fit=crop",
    fftUrl: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1200&auto=format&fit=crop"
  },
  {
    id: "sample-voice-clone",
    title: "Financial Wire Authorization Audio",
    subtitle: "Cloned voice audio note demanding emergency $2.4M transfer",
    category: "audio",
    modelSource: "ElevenLabs v3 Neural Voice Engine",
    tamperConfidence: 99.2,
    isAuthentic: false,
    fileSize: "2.1 MB",
    resolution: "48kHz / 24-bit PCM",
    hash: "0x66a19f88c399b1e5509a27d14b4802c77",
    elaScore: 89.0,
    fftAnomalyScore: 99.6,
    latentNoiseScore: 98.4,
    biometricScore: 99.5,
    description: "Synthetic audio clone replicating an executive's vocal cadence with robotic phase alignment in glottal pulses and missing biological breath turbulence.",
    forensicSummary: [
      "Vocal tract resonance lacks biological micro-tremor (jitter < 0.01% - unnaturally flat)",
      "Zero phase randomized distortion in high formant regions (8kHz - 14kHz)",
      "Synthesizer vocoder phase discontinuity detected at 1.42s and 3.89s timestamps",
      "Harmonic-to-Noise Ratio (HNR) matches known neural autoregressive diffusion models"
    ],
    c2paStatus: "missing",
    previewUrl: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=1200&auto=format&fit=crop",
    heatmapUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1200&auto=format&fit=crop",
    fftUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=1200&auto=format&fit=crop"
  },
  {
    id: "sample-authentic-provenance",
    title: "Hardware-Signed Photojournalist Dispatch",
    subtitle: "Verified authentic front-line photograph with C2PA hardware seal",
    category: "image",
    modelSource: "Leica M11-P (C2PA Enclave Hardware Authenticated)",
    tamperConfidence: 0.8,
    isAuthentic: true,
    fileSize: "24.6 MB",
    resolution: "6000 x 4000 (RAW)",
    hash: "0x11e490b82f6a73c0919248bb0174ca903",
    elaScore: 2.1,
    fftAnomalyScore: 1.4,
    latentNoiseScore: 1.8,
    biometricScore: 98.9,
    description: "Cryptographically authenticated capture directly signed by camera hardware security enclave. Perfect optical lens aberration and natural Bayer sensor noise.",
    forensicSummary: [
      "Hardware security module (HSM) C2PA manifest matches Leica root certificate",
      "Natural Poisson-Gaussian sensor noise consistent with ISO 400 35mm sensor",
      "Optical vignetting and chromatic aberration correspond to 50mm f/1.4 lens profile",
      "Zero localized ELA variance or compression quantization seams detected"
    ],
    c2paStatus: "valid",
    previewUrl: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=1200&auto=format&fit=crop",
    heatmapUrl: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=1200&auto=format&fit=crop",
    fftUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop"
  }
];

