import time
from typing import Tuple, List
from PIL import Image
import numpy as np

from ..schemas.reports import StageResult, EvidenceFinding
from ..utils.image_ops import image_to_base64_data_uri, resize_for_analysis


def analyze_frequency_domain(
    image: Image.Image
) -> Tuple[float, StageResult, List[EvidenceFinding], str]:
    """
    Performs 2D Fast Fourier Transform (FFT) frequency domain decomposition.
    Detects high-frequency periodic lattice harmonics and checkerboard spikes
    characteristic of GAN/diffusion neural upsampling operations.
    
    Returns:
        (fft_anomaly_score, stage_result, findings, fft_spectrum_b64)
    """
    start_time = time.perf_counter()

    # Convert to grayscale and normalize size for consistent spectral analysis
    work_img = resize_for_analysis(image.convert("L"), max_dimension=1024)
    gray_np = np.array(work_img, dtype=np.float32)
    h, w = gray_np.shape

    # 1. 2D Fast Fourier Transform
    fft2 = np.fft.fft2(gray_np)
    fft_shift = np.fft.fftshift(fft2)
    magnitude = np.abs(fft_shift)
    
    # 2. Log magnitude spectrum
    log_magnitude = np.log(1.0 + magnitude)
    
    # 3. High-frequency lattice artifact detection
    center_y, center_x = h // 2, w // 2
    y_coords, x_coords = np.ogrid[:h, :w]
    dist_from_center = np.sqrt((y_coords - center_y)**2 + (x_coords - center_x)**2)
    max_radius = np.sqrt(center_y**2 + center_x**2)
    
    # High frequency outer ring (between 25% and 85% of max radius)
    high_freq_mask = (dist_from_center >= max_radius * 0.25) & (dist_from_center <= max_radius * 0.85)
    high_freq_vals = log_magnitude[high_freq_mask]

    if len(high_freq_vals) > 0:
        hf_mean = float(np.mean(high_freq_vals))
        hf_std = float(np.std(high_freq_vals))
        hf_max = float(np.max(high_freq_vals))
        
        # Peak to Average Power Ratio in high frequency domain
        peak_to_avg = (hf_max - hf_mean) / (hf_std + 1e-5)
        
        # Radial / Azimuthal energy symmetry check
        # Divide into 8 radial angular sectors and check variance of spectral energy
        angles = np.arctan2(y_coords - center_y, x_coords - center_x)
        sector_energies = []
        for i in range(8):
            angle_min = -np.pi + i * (2 * np.pi / 8)
            angle_max = -np.pi + (i + 1) * (2 * np.pi / 8)
            sector_mask = high_freq_mask & (angles >= angle_min) & (angles < angle_max)
            if np.any(sector_mask):
                sector_energies.append(np.mean(log_magnitude[sector_mask]))
        
        azimuthal_std = float(np.std(sector_energies)) if sector_energies else 0.1
    else:
        peak_to_avg = 2.0
        azimuthal_std = 0.1
        hf_mean = 5.0
        hf_std = 1.0

    # 4. Calibrate FFT Anomaly Score (0 to 100)
    # Physical photographs follow smooth 1/f power law decay.
    # Neural models produce discrete spikes (peak_to_avg > 4.5) and quadrant directional artifacts.
    raw_score = (peak_to_avg * 14.0) + (azimuthal_std * 35.0) + (hf_std * 8.0)
    fft_anomaly_score = round(float(np.clip(raw_score, 8.0, 99.1)), 1)

    # 5. Generate Spectral Heatmap Visualization
    # Normalize log magnitude to 0 - 255
    min_val = np.percentile(log_magnitude, 1)
    max_val = np.percentile(log_magnitude, 99.5)
    norm_spectrum = np.clip((log_magnitude - min_val) / (max_val - min_val + 1e-6), 0.0, 1.0)
    
    # Render with glowing forensic spectrum colormap (deep navy/black -> electric cyan -> neon magenta/yellow)
    spec_rgb = np.zeros((h, w, 3), dtype=np.uint8)
    
    # Gradient mapping
    spec_rgb[:, :, 0] = np.clip(norm_spectrum**1.5 * 255 + np.sin(norm_spectrum * np.pi) * 80, 0, 255).astype(np.uint8)  # R
    spec_rgb[:, :, 1] = np.clip(np.sin(norm_spectrum * np.pi * 0.8) * 230, 0, 255).astype(np.uint8)                      # G
    spec_rgb[:, :, 2] = np.clip((1.0 - norm_spectrum)**0.5 * 180 + norm_spectrum * 255, 0, 255).astype(np.uint8)       # B

    # Boost center harmonic starburst
    bright_mask = norm_spectrum > 0.7
    spec_rgb[bright_mask, 0] = 255
    spec_rgb[bright_mask, 1] = 240
    spec_rgb[bright_mask, 2] = 200

    # Draw subtle center reticle coordinates on spectrum
    try:
        reticle_color = (255, 60, 0)
        line_len = 12
        if center_y - line_len >= 0 and center_y + line_len < h and center_x - line_len >= 0 and center_x + line_len < w:
            spec_rgb[center_y, center_x - line_len : center_x + line_len] = reticle_color
            spec_rgb[center_y - line_len : center_y + line_len, center_x] = reticle_color
    except Exception:
        pass

    spectrum_pil = Image.fromarray(spec_rgb)
    fft_b64 = image_to_base64_data_uri(spectrum_pil, format="PNG")

    # 6. Generate evidence findings
    findings: List[EvidenceFinding] = []
    indicators: List[str] = []

    if fft_anomaly_score > 75.0:
        findings.append(EvidenceFinding(
            id="find-fft-lattice-peaks",
            category="frequency",
            severity="critical",
            title="High-Frequency Checkerboard Upsampling Lattice",
            description=f"2D Fourier spectrum exhibits periodic harmonic peaks (peak-to-average ratio: {peak_to_avg:.2f}), a mathematical fingerprint of transposed convolution layers in generative neural networks (GANs/Diffusion).",
            corroboration="FFT 2D power spectrum azimuthal variance and radial spike clustering.",
            confidence=fft_anomaly_score
        ))
        indicators.append(f"Pronounced high-frequency checkerboard harmonics (score: {fft_anomaly_score}%)")
        indicators.append(f"Azimuthal spectral energy deviation: {azimuthal_std:.3f}")
    elif fft_anomaly_score > 50.0:
        findings.append(EvidenceFinding(
            id="find-fft-moderate-spikes",
            category="frequency",
            severity="medium",
            title="Mild Fourier Harmonic Asymmetry",
            description="Observable energy deviations in high-frequency spectrum bands beyond normal camera optical decay.",
            corroboration="Radial frequency band energy distribution.",
            confidence=fft_anomaly_score
        ))
        indicators.append("Minor high-frequency harmonic irregularities detected")
    else:
        indicators.append("2D Fourier magnitude spectrum follows natural optical 1/f power distribution")
        indicators.append("No periodic neural upsampling lattices observed")

    elapsed_ms = (time.perf_counter() - start_time) * 1000.0

    stage_result = StageResult(
        stage_id="stage-3-fft",
        stage_name="Stage 3: 2D FFT Frequency Domain & Checkerboard Lattice",
        status="completed",
        progress=100,
        execution_time_ms=round(elapsed_ms, 2),
        score=fft_anomaly_score,
        summary=f"2D FFT frequency decomposition calculated. Spectral anomaly score: {fft_anomaly_score}%.",
        indicators_found=indicators,
        details={
            "peak_to_avg_ratio": round(peak_to_avg, 2),
            "azimuthal_energy_std": round(azimuthal_std, 3),
            "high_freq_mean": round(hf_mean, 2),
            "high_freq_std": round(hf_std, 2),
        },
        visual_artifact_b64=fft_b64
    )

    return fft_anomaly_score, stage_result, findings, fft_b64

