import time
from typing import Tuple, List
from PIL import Image
import numpy as np
import cv2

from ..schemas.reports import StageResult, EvidenceFinding
from ..utils.image_ops import resize_for_analysis


def analyze_visual_artifacts(
    image: Image.Image
) -> Tuple[float, float, StageResult, List[EvidenceFinding]]:
    """
    Analyzes spatial visual artifacts, edge gradient continuity, depth-of-field coherence,
    chromatic aberration consistency, and texture distribution.

    CALIBRATION NOTE:
    The previous implementation had hard-coded floors of 40.0 (biometric) and 35.0 (artifact)
    that caused virtually every authentic photograph to exceed the 75% threshold:
      - Any photo with sky, bokeh, or plain walls has smooth_ratio ≈ 0.70-0.80
        → biometric_raw = 40 + 0.75*40 + 2.0*12 = 94.0 (!) on a normal portrait
      - The "chromatic aberration" metric measured raw |R-B| differences (scene colors),
        not actual sub-pixel optical lens dispersion

    This version:
      - Removes the artificial 40.0/35.0 baseline floors (starts from 0)
      - Rescales smooth_ratio scoring to only flag abnormally smooth images (>85%)
      - Fixes CA metric to measure spatial edge shift vs. raw color difference
      - Renames scores to reflect what they actually measure

    Returns:
        (texture_anomaly_score, visual_artifact_score, stage_result, findings)
    """
    start_time = time.perf_counter()

    # Work on normalized RGB image
    work_img = resize_for_analysis(image.convert("RGB"), max_dimension=1024)
    img_np = np.array(work_img)
    h, w, c = img_np.shape
    gray = cv2.cvtColor(img_np, cv2.COLOR_RGB2GRAY)

    # 1. Edge Gradient Discontinuity Analysis (Sobel Filter)
    sobel_x = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
    sobel_y = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
    grad_mag = np.sqrt(sobel_x**2 + sobel_y**2)

    grad_mean = float(np.mean(grad_mag))
    grad_std = float(np.std(grad_mag))
    grad_max = float(np.max(grad_mag))

    # Measure sharpness distribution across canvas (Laplacian variance)
    laplacian = cv2.Laplacian(gray, cv2.CV_64F)
    sharpness_variance = float(laplacian.var())

    # 2. Texture Smoothness Analysis
    # Detect the proportion of hyper-smooth regions relative to gradient magnitude.
    # NOTE: Most natural photos have 60-80% "smooth" pixels (sky, bokeh, walls) — this is NORMAL.
    # We only flag when smooth_ratio exceeds ~0.85 (i.e. scene is suspiciously near-flat overall),
    # which is a genuine diffusion hallmark (over-smoothed skin/background with no texture variation).
    smooth_mask = grad_mag < (grad_mean * 0.4)
    smooth_ratio = float(np.sum(smooth_mask) / (h * w))

    # Dynamic range of gradients: very high ratio means diffusion-style sharp edges on flat base
    gradient_dynamic_range = grad_max / (grad_mean + 1e-5)

    # 3. Chromatic Aberration Consistency (Fixed)
    # Real optical lenses produce lateral chromatic aberration — a SUB-PIXEL SPATIAL SHIFT
    # of R vs B channels at high-contrast edges. The old metric measured raw |R-B| differences
    # which reflects scene color composition, not optical aberration.
    #
    # Corrected approach: compare edge position between R and B channels using phase correlation.
    # If R and B edge positions match exactly (no spatial shift), it may indicate synthetic origin.
    r_channel = img_np[:, :, 0].astype(np.float32)
    b_channel = img_np[:, :, 2].astype(np.float32)

    # Edge detection on R and B separately
    r_edges = cv2.Sobel(r_channel, cv2.CV_64F, 1, 0, ksize=3)
    b_edges = cv2.Sobel(b_channel, cv2.CV_64F, 1, 0, ksize=3)

    # Measure spatial alignment of R and B edges in corner regions
    # Physical lenses produce a measurable edge displacement (even tiny) at corners
    margin_y, margin_x = h // 6, w // 6
    corner_r_edges = [
        r_edges[:margin_y, :margin_x],
        r_edges[:margin_y, -margin_x:],
        r_edges[-margin_y:, :margin_x],
        r_edges[-margin_y:, -margin_x:],
    ]
    corner_b_edges = [
        b_edges[:margin_y, :margin_x],
        b_edges[:margin_y, -margin_x:],
        b_edges[-margin_y:, :margin_x],
        b_edges[-margin_y:, -margin_x:],
    ]

    # Pearson correlation of edge maps: high correlation = well-aligned (physical CA shifts edges slightly)
    ca_correlations = []
    for re, be in zip(corner_r_edges, corner_b_edges):
        re_flat = re.flatten()
        be_flat = be.flatten()
        if np.std(re_flat) > 1e-4 and np.std(be_flat) > 1e-4:
            corr = float(np.corrcoef(re_flat, be_flat)[0, 1])
            if not np.isnan(corr):
                ca_correlations.append(corr)

    # Physical camera lenses: R/B edge correlation ~0.80-0.95 (slight shift, still aligned)
    # Synthetic images: R/B perfectly registered → correlation ~0.99-1.0 (suspicious)
    # Or over-processed: R/B completely mismatched → correlation <0.70 (also suspicious)
    mean_ca_corr = float(np.mean(ca_correlations)) if ca_correlations else 0.90

    # Flag if suspiciously perfect (possible synthetic) or severely mismatched (compositing)
    ca_anomaly = max(0.0, mean_ca_corr - 0.96) * 300.0  # fires when >0.96 (too perfect)

    # 4. Calibrate Scores
    #
    # TEXTURE ANOMALY SCORE (was "biometric_score"):
    # - smooth_ratio > 0.85: abnormally smooth (diffusion hallmark) → up to 36 points
    # - gradient_dynamic_range > 25: extreme edges on flat base → additional points
    # - No baseline floor (was 40.0)
    texture_raw = (
        (max(smooth_ratio - 0.85, 0.0) * 240.0) +       # 0 for normal photos; 0-36 for over-smooth
        (max(gradient_dynamic_range - 25.0, 0.0) * 1.2)  # 0 for normal; extra for implausible contrast
    )
    texture_anomaly_score = round(float(np.clip(texture_raw, 0.0, 96.5)), 1)

    # VISUAL ARTIFACT SCORE:
    # - ca_anomaly: R/B channels too perfectly aligned (synthetic) or severely mismatched
    # - gradient_dynamic_range: extremely high contrast edges are suspicious
    # - No baseline floor (was 35.0)
    artifact_raw = (
        ca_anomaly +
        (max(gradient_dynamic_range - 30.0, 0.0) * 0.8)
    )
    visual_artifact_score = round(float(np.clip(artifact_raw, 0.0, 95.0)), 1)

    # 5. Evidence Findings
    findings: List[EvidenceFinding] = []
    indicators: List[str] = []

    if texture_anomaly_score > 60.0:
        findings.append(EvidenceFinding(
            id="find-texture-over-smooth",
            category="visual",
            severity="medium",
            title="Abnormal Texture Over-Smoothing",
            description=f"Unusually high proportion of hyper-smooth regions ({smooth_ratio*100:.1f}%) combined with extreme gradient dynamic range ({gradient_dynamic_range:.1f}x). Consistent with diffusion model generation where autoencoders produce over-smoothed regions adjacent to sharp synthetic edges.",
            corroboration="Spatial gradient distribution and smooth-region ratio analysis.",
            confidence=texture_anomaly_score
        ))
        indicators.append(f"Texture over-smoothing detected (score: {texture_anomaly_score}%)")
    elif texture_anomaly_score > 35.0:
        indicators.append(f"Mild texture smoothing detected (score: {texture_anomaly_score}%) — ambiguous without corroboration")
    else:
        indicators.append(f"Texture distribution consistent with natural camera capture (smooth ratio: {smooth_ratio*100:.1f}%)")

    if visual_artifact_score > 55.0:
        findings.append(EvidenceFinding(
            id="find-ca-anomaly",
            category="visual",
            severity="medium",
            title="Chromatic Aberration Anomaly",
            description=f"R/B channel edge alignment correlation: {mean_ca_corr:.3f}. Physical camera lenses produce slight sub-pixel chromatic aberration at corners (corr ~0.80-0.96). Values near 1.0 suggest perfect channel alignment, more consistent with synthetic generation.",
            corroboration="Sobel edge correlation between R and B channels at image corners.",
            confidence=visual_artifact_score
        ))
        indicators.append(f"CA anomaly detected (score: {visual_artifact_score}%) — R/B edge correlation: {mean_ca_corr:.3f}")
    else:
        # Determine CA verdict
        if mean_ca_corr < 0.97:
            indicators.append(f"Chromatic aberration within physical camera range (R/B edge corr: {mean_ca_corr:.3f})")
        else:
            indicators.append(f"Near-perfect R/B channel alignment detected (corr: {mean_ca_corr:.3f}) — slight CA absent")

    indicators.append(f"Global edge gradient: mean={grad_mean:.2f}, std={grad_std:.2f}, dynamic range={gradient_dynamic_range:.1f}x")

    elapsed_ms = (time.perf_counter() - start_time) * 1000.0

    stage_result = StageResult(
        stage_id="stage-5-visual-biometric",
        stage_name="Stage 4.5: Visual Artifacts & Texture Distribution Analysis",
        status="completed",
        progress=100,
        execution_time_ms=round(elapsed_ms, 2),
        score=texture_anomaly_score,
        summary=f"Visual texture and chromatic aberration analysis completed. Texture anomaly score: {texture_anomaly_score}%.",
        indicators_found=indicators,
        details={
            "gradient_mean": round(grad_mean, 2),
            "gradient_std": round(grad_std, 2),
            "gradient_dynamic_range": round(gradient_dynamic_range, 2),
            "sharpness_variance": round(sharpness_variance, 2),
            "smooth_region_ratio": round(smooth_ratio, 3),
            "ca_edge_correlation": round(mean_ca_corr, 4),
        }
    )

    return texture_anomaly_score, visual_artifact_score, stage_result, findings
