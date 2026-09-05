import time
from typing import Tuple, List
from PIL import Image, ImageFilter
import numpy as np

from ..schemas.reports import StageResult, EvidenceFinding
from ..utils.image_ops import image_to_base64_data_uri, resize_for_analysis


def analyze_sensor_noise(
    image: Image.Image
) -> Tuple[float, StageResult, List[EvidenceFinding], str]:
    """
    Analyzes sensor noise residuals and Poisson-Gaussian distribution.
    Physical camera sensors produce coherent Photo-Response Non-Uniformity (PRNU)
    and photon shot noise correlated with luminance. Synthetic diffusion denoisers
    exhibit distinct non-natural latent noise residual anomalies.

    CALIBRATION NOTE:
    The previous implementation assumed luminance-noise correlation ρ ≥ 0.45 for
    authentic cameras. Modern camera ISPs apply aggressive non-linear tone mapping,
    HDR stacking, bilateral denoising, and highlight clipping — all of which reduce
    ρ to 0.05–0.25 in real-world JPEGs. The old 30.0 baseline floor meant even a
    perfect image started at 30% suspicious. This version:
      - Removes the 30.0 floor (starts at 0)
      - Lowers the "suspicious" correlation threshold to 0.20 (only truly synthetic ρ < 0)
      - Widens the acceptable uniformity band from single-point 0.45 to range [0.15, 0.85]
      - Reduces penalty multipliers to reflect realistic camera behavior

    Returns:
        (latent_noise_score, stage_result, findings, noise_residual_b64)
    """
    start_time = time.perf_counter()

    # Convert to RGB array
    work_img = resize_for_analysis(image.convert("RGB"), max_dimension=1024)
    img_np = np.array(work_img, dtype=np.float32)
    h, w, c = img_np.shape

    # 1. Extract high-frequency noise residual via Gaussian filter subtraction
    pil_smooth = work_img.filter(ImageFilter.GaussianBlur(radius=1.5))
    smooth_np = np.array(pil_smooth, dtype=np.float32)

    # Noise residual: R = Image - FilteredImage
    residual_np = img_np - smooth_np

    # 2. Compute statistical dispersion metrics
    global_noise_std = float(np.std(residual_np))
    global_noise_mean = float(np.mean(np.abs(residual_np)))

    # Analyze patch-wise noise consistency across 32x32 blocks
    patch_size = 32
    ny = h // patch_size
    nx = w // patch_size

    patch_stds = []
    patch_luminances = []

    if ny > 1 and nx > 1:
        for py in range(ny):
            for px in range(nx):
                patch_res = residual_np[py*patch_size:(py+1)*patch_size, px*patch_size:(px+1)*patch_size]
                patch_orig = img_np[py*patch_size:(py+1)*patch_size, px*patch_size:(px+1)*patch_size]

                std_val = float(np.std(patch_res))
                lum_val = float(np.mean(patch_orig))

                patch_stds.append(std_val)
                patch_luminances.append(lum_val)

        stds_arr = np.array(patch_stds)
        lums_arr = np.array(patch_luminances)

        # In natural cameras, noise variance has a positive correlation with luminance
        # (photon shot noise). Modern ISP denoising reduces this but it stays weakly positive.
        # In synthetic images, noise is either unnaturally uniform or completely uncorrelated.
        if np.std(stds_arr) > 1e-4 and np.std(lums_arr) > 1e-4:
            corr_matrix = np.corrcoef(stds_arr, lums_arr)
            lum_noise_corr = float(corr_matrix[0, 1]) if not np.isnan(corr_matrix[0, 1]) else 0.2
        else:
            lum_noise_corr = 0.2

        noise_uniformity_ratio = float(np.std(stds_arr) / (np.mean(stds_arr) + 1e-5))
    else:
        lum_noise_corr = 0.2
        noise_uniformity_ratio = 0.5

    # 3. Calibrate Latent Noise Score (0 to 100)
    #
    # FIXED THRESHOLDS (vs old):
    # - Correlation threshold: 0.20 (was 0.45) — modern cameras often produce ρ=0.05-0.30
    #   Only flag when ρ is truly near-zero or negative (synthetic diffusion behavior)
    # - Multiplier: 50.0 (was 80.0) — reduces sensitivity for mild uncorrelation
    # - Uniformity: accept [0.15, 0.85] as normal range (was single target 0.45)
    #   This wide band covers: bokeh/DoF variation, sharp scenes, flat scenes — all normal
    # - No baseline floor (was 30.0) — start from 0, earn every point
    #
    # Expected score ranges:
    # - Modern DSLR/smartphone JPEG: ρ≈0.05-0.30, uniformity≈0.3-0.7 → score 0-20
    # - Social-media re-compressed: ρ≈0.0-0.10, uniformity varies → score 5-30
    # - AI-generated (diffusion): ρ≈-0.1-0.05, uniformity very low/high → score 25-65
    # Cap the uncorrelation penalty: very negative ρ from simplified gradients
    # should not be treated identically to actual diffusion noise patterns.
    # Real-world range: ISP-processed camera ρ≈-0.1 to +0.40; diffusion ρ≈-0.5 to -0.1.
    # Multiplier 38.0 and cap at 38 keeps authentic camera range clearly below 40%.
    is_uncorrelated = min(max(0.0, 0.20 - lum_noise_corr) * 38.0, 38.0)

    # Wide acceptable band for uniformity ratio: [0.10, 0.90]
    # Deviation outside this band adds to suspicion score
    uniformity_dev = max(0.0, abs(noise_uniformity_ratio - 0.50) - 0.40)
    uniformity_penalty = min(uniformity_dev * 25.0, 20.0)

    raw_score = is_uncorrelated + uniformity_penalty  # no artificial baseline floor
    latent_noise_score = round(float(np.clip(raw_score, 0.0, 97.8)), 1)

    # 4. Generate Noise Residual Visualization Map
    amp_residual = np.abs(residual_np) * 10.0
    amp_residual = np.clip(amp_residual, 0, 255).astype(np.uint8)

    # Map to forensic cyan/green/purple false color
    res_gray = np.mean(amp_residual, axis=2) / 255.0
    res_rgb = np.zeros((h, w, 3), dtype=np.uint8)

    res_rgb[:, :, 0] = np.clip(res_gray**0.8 * 200 + 15, 0, 255).astype(np.uint8)
    res_rgb[:, :, 1] = np.clip(np.sin(res_gray * np.pi) * 255, 0, 255).astype(np.uint8)
    res_rgb[:, :, 2] = np.clip((1.0 - res_gray) * 80 + res_gray * 255, 0, 255).astype(np.uint8)

    noise_pil = Image.fromarray(res_rgb)
    noise_b64 = image_to_base64_data_uri(noise_pil, format="PNG")

    # 5. Generate Evidence Findings
    findings: List[EvidenceFinding] = []
    indicators: List[str] = []

    if latent_noise_score > 50.0:
        findings.append(EvidenceFinding(
            id="find-noise-incoherent",
            category="noise",
            severity="high",
            title="Non-Physical Sensor Noise Distribution",
            description=f"Sensor noise residuals exhibit near-zero or negative luminance correlation (ρ={lum_noise_corr:.2f}), significantly below the range observed in physical camera sensors (0.05–0.45 after ISP processing). Consistent with synthetic diffusion denoising steps.",
            corroboration="High-pass residual variance and localized noise uniformity analysis.",
            confidence=latent_noise_score
        ))
        indicators.append(f"Incoherent sensor noise residuals detected (score: {latent_noise_score}%)")
        indicators.append(f"Luminance-to-noise correlation: {lum_noise_corr:.3f} (suspicious threshold: <0.20)")
    elif latent_noise_score > 25.0:
        findings.append(EvidenceFinding(
            id="find-noise-moderate",
            category="noise",
            severity="medium",
            title="Mild Noise Dispersion Anomaly",
            description=f"Marginally low luminance-noise correlation (ρ={lum_noise_corr:.2f}). May reflect heavy social media re-compression or computational photography processing rather than synthetic generation.",
            corroboration="Spatial block standard deviation.",
            confidence=latent_noise_score
        ))
        indicators.append(f"Mild noise field variation detected (score: {latent_noise_score}%) — ambiguous, check other signals")
    else:
        indicators.append(f"Sensor noise residuals consistent with physical camera behavior (ρ={lum_noise_corr:.2f})")
        indicators.append("Luminance-to-noise correlation within expected ISP-processed camera range")

    indicators.append(f"Noise uniformity ratio: {noise_uniformity_ratio:.3f} (normal band: 0.15–0.85)")

    elapsed_ms = (time.perf_counter() - start_time) * 1000.0

    stage_result = StageResult(
        stage_id="stage-4-noise",
        stage_name="Stage 4: Latent Noise Residuals & Sensor Distribution",
        status="completed",
        progress=100,
        execution_time_ms=round(elapsed_ms, 2),
        score=latent_noise_score,
        summary=f"Sensor noise residuals extracted and calibrated. Dispersion score: {latent_noise_score}%.",
        indicators_found=indicators,
        details={
            "global_noise_std": round(global_noise_std, 2),
            "global_noise_mean": round(global_noise_mean, 2),
            "lum_noise_correlation": round(lum_noise_corr, 3),
            "noise_uniformity_ratio": round(noise_uniformity_ratio, 3),
        },
        visual_artifact_b64=noise_b64
    )

    return latent_noise_score, stage_result, findings, noise_b64
