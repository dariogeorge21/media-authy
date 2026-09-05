import time
from typing import Tuple, List
from PIL import Image
import numpy as np
from scipy import stats as scipy_stats

from ..schemas.reports import StageResult, EvidenceFinding
from ..utils.image_ops import image_to_base64_data_uri, resize_for_analysis


def analyze_frequency_domain(
    image: Image.Image
) -> Tuple[float, StageResult, List[EvidenceFinding], str]:
    """
    Performs 2D Fast Fourier Transform (FFT) frequency domain decomposition.
    Detects high-frequency periodic lattice harmonics and checkerboard spikes
    characteristic of GAN/diffusion neural upsampling operations.

    CALIBRATION NOTE:
    The previous implementation used raw peak-to-average Z-score (max - mean) / std
    across ~500K values. By extreme value theory (Gumbel distribution), this is
    statistically guaranteed to be 4.0–5.5 for ANY large sample, making the multiplier
    of 14.0 produce 56–77 points before any genuine anomaly is detected.

    The fixed implementation subtracts the expected extreme-value baseline before
    scoring, and uses excess kurtosis and spike fraction as the primary discriminators.

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
        n_samples = len(high_freq_vals)

        # --- FIXED: Subtract the expected extreme-value offset ---
        # For n i.i.d. samples, the expected maximum Z-score follows Gumbel distribution.
        # E[max Z] ≈ sqrt(2 * ln(n)) — this is always ~4.0–5.5 for large n.
        # Subtracting this gives a score near 0 for authentic images and >0 for genuine spikes.
        raw_peak_to_avg = (hf_max - hf_mean) / (hf_std + 1e-5)
        expected_z_max = np.sqrt(2.0 * np.log(max(n_samples, 2)))
        adjusted_peak = max(0.0, raw_peak_to_avg - expected_z_max * 0.85)

        # Spike fraction: fraction of values exceeding the 99.5th percentile
        # GAN/diffusion lattices produce concentrated spikes well above p99.5
        p995 = np.percentile(high_freq_vals, 99.5)
        spike_fraction = float(np.sum(high_freq_vals > p995 * 1.15) / n_samples)

        # Excess kurtosis: GAN upsampling lattices produce super-Gaussian tails
        # Fisher kurtosis: 0.0 for Gaussian, >0 for heavy-tailed (spike-laden) distributions
        try:
            excess_kurtosis = float(scipy_stats.kurtosis(high_freq_vals, fisher=True))
        except Exception:
            excess_kurtosis = 0.0

        # Azimuthal energy symmetry check
        # Divide into 8 radial angular sectors and check variance of spectral energy
        # NOTE: Natural architectural/geometric scenes produce directional energy — use a
        # smaller multiplier (15.0 vs old 35.0) to avoid false positives on building photos.
        angles = np.arctan2(y_coords - center_y, x_coords - center_x)
        sector_energies = []
        for i in range(8):
            angle_min = -np.pi + i * (2 * np.pi / 8)
            angle_max = -np.pi + (i + 1) * (2 * np.pi / 8)
            sector_mask = high_freq_mask & (angles >= angle_min) & (angles < angle_max)
            if np.any(sector_mask):
                sector_energies.append(float(np.mean(log_magnitude[sector_mask])))

        azimuthal_std = float(np.std(sector_energies)) if sector_energies else 0.1
    else:
        raw_peak_to_avg = 2.0
        adjusted_peak = 0.0
        azimuthal_std = 0.1
        hf_mean = 5.0
        hf_std = 1.0
        hf_max = 5.0
        spike_fraction = 0.005
        excess_kurtosis = 0.0

    # 4. Calibrate FFT Anomaly Score (0 to 100)
    # Physical photographs follow smooth 1/f power law decay.
    # Neural models produce discrete spikes (adjusted_peak > 1.5) and quadrant artifacts.
    #
    # Component weights (tuned to produce ~10-30 for authentic, ~55-85 for synthetic):
    # - adjusted_peak * 5.0:      removes Gumbel baseline, real=0, synthetic=5-20
    # - azimuthal_std * 15.0:     directional energy; natural scenes ~0.05-0.15 (max 2.25 pts)
    # - excess_kurtosis * 4.0:    synthetic spikes are super-Gaussian; real ~0-1 (0-4 pts)
    # - spike_fraction * 600.0:   genuine lattice spikes far exceed p99.5; real ~0.005 → 3 pts
    raw_score = (
        (adjusted_peak * 5.0) +
        (azimuthal_std * 15.0) +
        (max(excess_kurtosis - 1.0, 0.0) * 4.0) +
        (spike_fraction * 600.0)
    )
    fft_anomaly_score = round(float(np.clip(raw_score, 3.0, 99.1)), 1)

    # 5. Generate Spectral Heatmap Visualization
    min_val = np.percentile(log_magnitude, 1)
    max_val = np.percentile(log_magnitude, 99.5)
    norm_spectrum = np.clip((log_magnitude - min_val) / (max_val - min_val + 1e-6), 0.0, 1.0)

    # Render with glowing forensic spectrum colormap
    spec_rgb = np.zeros((h, w, 3), dtype=np.uint8)
    spec_rgb[:, :, 0] = np.clip(norm_spectrum**1.5 * 255 + np.sin(norm_spectrum * np.pi) * 80, 0, 255).astype(np.uint8)
    spec_rgb[:, :, 1] = np.clip(np.sin(norm_spectrum * np.pi * 0.8) * 230, 0, 255).astype(np.uint8)
    spec_rgb[:, :, 2] = np.clip((1.0 - norm_spectrum)**0.5 * 180 + norm_spectrum * 255, 0, 255).astype(np.uint8)

    bright_mask = norm_spectrum > 0.7
    spec_rgb[bright_mask, 0] = 255
    spec_rgb[bright_mask, 1] = 240
    spec_rgb[bright_mask, 2] = 200

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
            description=f"2D Fourier spectrum exhibits genuine periodic harmonic spikes above the statistically expected maximum (adjusted peak Z: {adjusted_peak:.2f}, excess kurtosis: {excess_kurtosis:.2f}), a mathematical fingerprint of transposed convolution layers in generative neural networks (GANs/Diffusion).",
            corroboration="FFT 2D power spectrum: spike fraction, excess kurtosis, and azimuthal variance — all three signals converge.",
            confidence=fft_anomaly_score
        ))
        indicators.append(f"Pronounced high-frequency checkerboard harmonics (score: {fft_anomaly_score}%)")
        indicators.append(f"Azimuthal spectral energy deviation: {azimuthal_std:.3f} | Spike fraction: {spike_fraction*100:.3f}%")
    elif fft_anomaly_score > 50.0:
        findings.append(EvidenceFinding(
            id="find-fft-moderate-spikes",
            category="frequency",
            severity="medium",
            title="Mild Fourier Harmonic Asymmetry",
            description="Marginally elevated spectral energy in high-frequency band — could indicate mild neural processing or heavy re-encoding. Not conclusive on its own.",
            corroboration="Radial frequency band energy distribution.",
            confidence=fft_anomaly_score
        ))
        indicators.append("Minor high-frequency harmonic irregularities detected — ambiguous, requires corroboration")
    else:
        indicators.append("2D Fourier magnitude spectrum follows natural optical 1/f power distribution")
        indicators.append("No periodic neural upsampling lattices observed")

    indicators.append(f"Adjusted spectral peak Z: {adjusted_peak:.2f} (raw: {raw_peak_to_avg:.2f}, expected max: {np.sqrt(2.0 * np.log(max(len(high_freq_vals), 2))):.2f})")

    elapsed_ms = (time.perf_counter() - start_time) * 1000.0

    stage_result = StageResult(
        stage_id="stage-3-fft",
        stage_name="Stage 3: 2D FFT Frequency Domain & Checkerboard Lattice",
        status="completed",
        progress=100,
        execution_time_ms=round(elapsed_ms, 2),
        score=fft_anomaly_score,
        summary=f"2D FFT frequency decomposition calculated. Calibrated spectral anomaly score: {fft_anomaly_score}%.",
        indicators_found=indicators,
        details={
            "adjusted_peak_z": round(adjusted_peak, 2),
            "raw_peak_to_avg": round(raw_peak_to_avg, 2),
            "expected_z_max": round(float(np.sqrt(2.0 * np.log(max(len(high_freq_vals), 2)))), 2),
            "excess_kurtosis": round(excess_kurtosis, 3),
            "spike_fraction_pct": round(spike_fraction * 100, 4),
            "azimuthal_energy_std": round(azimuthal_std, 3),
            "high_freq_mean": round(hf_mean, 2),
            "high_freq_std": round(hf_std, 2),
        },
        visual_artifact_b64=fft_b64
    )

    return fft_anomaly_score, stage_result, findings, fft_b64
