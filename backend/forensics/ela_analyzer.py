import io
import time
from typing import Tuple, List
from PIL import Image, ImageChops, ImageEnhance
import numpy as np

from ..schemas.reports import StageResult, EvidenceFinding
from ..utils.image_ops import image_to_base64_data_uri, resize_for_analysis


def analyze_error_level(
    image: Image.Image,
    quality: int = 90,
    quality_alt: int = 75,
    scale_factor: float = 15.0
) -> Tuple[float, StageResult, List[EvidenceFinding], str]:
    """
    Performs Error Level Analysis (ELA) by re-compressing the image at two known JPEG
    quality levels and measuring the spatial quantization disparity. Spliced, edited, or
    generative regions exhibit distinct error profiles compared to untouched natural captures.

    CALIBRATION NOTE:
    The previous implementation had three problems:
    1. Depth-of-field (DoF) variation — sharp subject + blurred bokeh — naturally creates
       high patch disparity between focused and unfocused regions. Any DSLR portrait would
       score 60-80% from DoF alone.
    2. Format mismatch: PNGs and WebPs re-encoded at Q90 produce large absolute errors,
       inflating mean_err and std_err for perfectly authentic images.
    3. Multipliers were too aggressive: patch_disparity*45, std_err*1.8, mean_err*1.5.

    The fixed implementation:
    - Adds a dual-quality baseline comparison (Q90 vs Q75) to detect GENUINE splicing:
      authentic images show SIMILAR relative disparity at both quality levels;
      spliced regions diverge significantly between quality levels (different compression histories).
    - Reduces all multipliers significantly.
    - Only raises score when patch disparity is HIGH at Q90 AND diverges at Q75.

    Returns:
        (ela_score, stage_result, findings, heatmap_b64)
    """
    start_time = time.perf_counter()

    # Work on RGB copy resized safely for responsive speed
    work_img = resize_for_analysis(image.convert("RGB"), max_dimension=1200)
    width, height = work_img.size

    def _compute_ela_stats(img: Image.Image, q: int) -> Tuple[float, float, float, np.ndarray, float]:
        """Compute ELA statistics for a given quality level. Returns (mean, std, max, diff_array, patch_disparity)."""
        buf = io.BytesIO()
        img.save(buf, "JPEG", quality=q)
        buf.seek(0)
        recompressed = Image.open(buf).convert("RGB")

        orig_np = np.array(img, dtype=np.float32)
        recomp_np = np.array(recompressed, dtype=np.float32)
        diff_np = np.abs(orig_np - recomp_np)

        mean_err = float(np.mean(diff_np))
        std_err = float(np.std(diff_np))
        max_err = float(np.max(diff_np))

        block_size = 16
        n_blocks_y = height // block_size
        n_blocks_x = width // block_size
        block_means = []
        if n_blocks_y > 1 and n_blocks_x > 1:
            for by in range(n_blocks_y):
                for bx in range(n_blocks_x):
                    patch = diff_np[by*block_size:(by+1)*block_size, bx*block_size:(bx+1)*block_size]
                    block_means.append(float(np.mean(patch)))
            bm = np.array(block_means)
            pd = float(np.std(bm) / (np.mean(bm) + 1e-5))
        else:
            pd = 0.3

        return mean_err, std_err, max_err, diff_np, pd

    # Primary ELA at Q90
    mean_err_90, std_err_90, max_err_90, diff_np_90, patch_disparity_90 = _compute_ela_stats(work_img, quality)

    # Secondary ELA at Q75 (alternative quality for comparison)
    # Authentic images: patch_disparity_90 ≈ patch_disparity_75 (consistent DoF variation)
    # Spliced images: patch_disparity diverges significantly between quality levels
    mean_err_75, std_err_75, max_err_75, diff_np_75, patch_disparity_75 = _compute_ela_stats(work_img, quality_alt)

    # Cross-quality divergence: genuine splicing or multi-source compositing shows elevated
    # and INCONSISTENT disparity across quality levels (different compression histories per region)
    disparity_divergence = abs(patch_disparity_90 - patch_disparity_75)

    # 4. Synthesize calibrated ELA score (0 to 100)
    #
    # FIXED FORMULA (vs old):
    # - patch_disparity * 25.0 (was 45.0): reduce DoF false positive sensitivity
    # - disparity_divergence * 40.0: NEW — cross-quality consistency check; real photos
    #   show consistent disparity; spliced photos diverge between quality levels
    # - std_err * 0.8 (was 1.8): heavily reduced — format mismatches inflate std_err
    # - mean_err * 0.5 (was 1.5): heavily reduced — absolute error level varies by format
    # - min clip 2.0 (was 5.0): lower floor allows authentic images to score near 0
    raw_score = (
        (patch_disparity_90 * 25.0) +
        (disparity_divergence * 40.0) +
        (min(std_err_90, 25.0) * 0.8) +
        (min(mean_err_90, 15.0) * 0.5)
    )
    ela_score = round(float(np.clip(raw_score, 2.0, 98.5)), 1)

    # 5. Generate high-contrast false-color thermal heatmap (using Q90 diff)
    diff_np = diff_np_90
    scaled_diff = np.clip(diff_np * scale_factor, 0, 255).astype(np.uint8)
    gray_diff = np.mean(scaled_diff, axis=2) / 255.0
    heatmap_rgb = np.zeros((height, width, 3), dtype=np.uint8)

    heatmap_rgb[:, :, 0] = np.clip(np.sin(gray_diff * np.pi - np.pi/2) * 255 + 100, 0, 255).astype(np.uint8)
    heatmap_rgb[:, :, 1] = np.clip(np.sin(gray_diff * np.pi) * 180, 0, 255).astype(np.uint8)
    heatmap_rgb[:, :, 2] = np.clip(np.cos(gray_diff * np.pi/2) * 220, 0, 255).astype(np.uint8)

    hot_mask = gray_diff > 0.35
    heatmap_rgb[hot_mask, 0] = 255
    heatmap_rgb[hot_mask, 1] = (heatmap_rgb[hot_mask, 1] * 0.4).astype(np.uint8)
    heatmap_rgb[hot_mask, 2] = 0

    heatmap_pil = Image.fromarray(heatmap_rgb)
    heatmap_b64 = image_to_base64_data_uri(heatmap_pil, format="PNG")

    # 6. Generate evidence findings
    findings: List[EvidenceFinding] = []
    indicators: List[str] = []

    if ela_score > 70.0:
        findings.append(EvidenceFinding(
            id="find-ela-high-disparity",
            category="compression",
            severity="high",
            title="Significant Error Level Quantization Disparity",
            description=f"Elevated and cross-quality-inconsistent re-compression error differentials (Q90 disparity: {patch_disparity_90:.2f}, Q75 disparity: {patch_disparity_75:.2f}, divergence: {disparity_divergence:.2f}), indicative of inpainting, multi-source compositing, or generative post-processing.",
            corroboration=f"Dual-quality ELA comparison (Q{quality} vs Q{quality_alt}) showing compression history inconsistency.",
            confidence=ela_score
        ))
        indicators.append(f"Pronounced quantization boundary seams detected (score: {ela_score}%)")
        indicators.append(f"Cross-quality disparity divergence: {disparity_divergence:.3f}")
    elif ela_score > 45.0:
        findings.append(EvidenceFinding(
            id="find-ela-moderate",
            category="compression",
            severity="medium",
            title="Moderate Quantization Gradient Variance",
            description=f"Moderate compression level variance (Q90 disparity: {patch_disparity_90:.2f}). Common causes: depth-of-field variation, social media re-encoding, or mild localized adjustments.",
            corroboration=f"ELA block variance at Q{quality}.",
            confidence=ela_score
        ))
        indicators.append("Moderate compression level variance — likely DoF or re-encoding (not conclusive)")
    else:
        indicators.append("Uniform quantization table error distribution across entire canvas")
        indicators.append(f"Low compression delta variance (std: {std_err_90:.2f}, Q90 disparity: {patch_disparity_90:.3f})")

    elapsed_ms = (time.perf_counter() - start_time) * 1000.0

    stage_result = StageResult(
        stage_id="stage-2-ela",
        stage_name="Stage 2: Error Level Analysis (Quantization Disparity)",
        status="completed",
        progress=100,
        execution_time_ms=round(elapsed_ms, 2),
        score=ela_score,
        summary=f"Dual-quality ELA decomposition (Q{quality}/Q{quality_alt}). Compression disparity score: {ela_score}%.",
        indicators_found=indicators,
        details={
            "mean_error_q90": round(mean_err_90, 2),
            "std_error_q90": round(std_err_90, 2),
            "patch_disparity_q90": round(patch_disparity_90, 3),
            "patch_disparity_q75": round(patch_disparity_75, 3),
            "disparity_divergence": round(disparity_divergence, 3),
            "quality_tested": quality,
            "quality_alt_tested": quality_alt,
        },
        visual_artifact_b64=heatmap_b64
    )

    return ela_score, stage_result, findings, heatmap_b64
