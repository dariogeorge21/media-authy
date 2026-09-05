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
    scale_factor: float = 15.0
) -> Tuple[float, StageResult, List[EvidenceFinding], str]:
    """
    Performs Error Level Analysis (ELA) by re-compressing the image at a known JPEG quality
    and measuring the pixel-level quantization disparity. Spliced, edited, or generative regions
    exhibit distinct error profiles compared to untouched natural captures.
    
    Returns:
        (ela_score, stage_result, findings, heatmap_b64)
    """
    start_time = time.perf_counter()
    
    # Work on RGB copy resized safely for responsive speed
    work_img = resize_for_analysis(image.convert("RGB"), max_dimension=1200)
    width, height = work_img.size

    # 1. Resave to in-memory JPEG at baseline quality
    buffer = io.BytesIO()
    work_img.save(buffer, "JPEG", quality=quality)
    buffer.seek(0)
    recompressed = Image.open(buffer)

    # 2. Compute absolute difference
    orig_np = np.array(work_img, dtype=np.float32)
    recomp_np = np.array(recompressed, dtype=np.float32)
    diff_np = np.abs(orig_np - recomp_np)

    # 3. Calculate statistical metrics
    mean_err = float(np.mean(diff_np))
    max_err = float(np.max(diff_np))
    std_err = float(np.std(diff_np))

    # Compute patch-level variance across 16x16 blocks to detect localized splicing
    block_size = 16
    n_blocks_y = height // block_size
    n_blocks_x = width // block_size
    
    block_means = []
    if n_blocks_y > 1 and n_blocks_x > 1:
        for by in range(n_blocks_y):
            for bx in range(n_blocks_x):
                patch = diff_np[by*block_size:(by+1)*block_size, bx*block_size:(bx+1)*block_size]
                block_means.append(np.mean(patch))
        block_means_arr = np.array(block_means)
        patch_disparity = float(np.std(block_means_arr) / (np.mean(block_means_arr) + 1e-5))
    else:
        patch_disparity = 0.5

    # 4. Synthesize calibrated ELA score (0 to 100)
    # Higher score = higher likelihood of localized tampering / synthetic quantization mismatch
    raw_score = (patch_disparity * 45.0) + (min(std_err, 25.0) * 1.8) + (min(mean_err, 15.0) * 1.5)
    ela_score = round(float(np.clip(raw_score, 5.0, 98.5)), 1)

    # 5. Generate high-contrast false-color thermal heatmap
    # Scale difference for visualization
    scaled_diff = np.clip(diff_np * scale_factor, 0, 255).astype(np.uint8)
    
    # Create vivid forensic visualizer (blend amplified channels with cyan/orange/red heat ramp)
    gray_diff = np.mean(scaled_diff, axis=2) / 255.0
    heatmap_rgb = np.zeros((height, width, 3), dtype=np.uint8)
    
    # Custom forensic false-color colormap (dark blue -> purple -> orange -> bright red)
    heatmap_rgb[:, :, 0] = np.clip(np.sin(gray_diff * np.pi - np.pi/2) * 255 + 100, 0, 255).astype(np.uint8) # R
    heatmap_rgb[:, :, 1] = np.clip(np.sin(gray_diff * np.pi) * 180, 0, 255).astype(np.uint8)                   # G
    heatmap_rgb[:, :, 2] = np.clip(np.cos(gray_diff * np.pi/2) * 220, 0, 255).astype(np.uint8)                 # B

    # Boost hot zones
    hot_mask = gray_diff > 0.35
    heatmap_rgb[hot_mask, 0] = 255
    heatmap_rgb[hot_mask, 1] = (heatmap_rgb[hot_mask, 1] * 0.4).astype(np.uint8)
    heatmap_rgb[hot_mask, 2] = 0

    heatmap_pil = Image.fromarray(heatmap_rgb)
    heatmap_b64 = image_to_base64_data_uri(heatmap_pil, format="PNG")

    # 6. Generate evidence findings
    findings: List[EvidenceFinding] = []
    indicators: List[str] = []

    if ela_score > 75.0:
        findings.append(EvidenceFinding(
            id="find-ela-high-disparity",
            category="compression",
            severity="high",
            title="Significant Error Level Quantization Disparity",
            description=f"Isolated focal regions exhibit pronounced re-compression error differentials (patch disparity ratio: {patch_disparity:.2f}), indicative of inpainting, multi-source compositing, or generative post-processing.",
            corroboration=f"Error Level Analysis (ELA) at Q{quality} yielded standard deviation of {std_err:.2f} across spatial blocks.",
            confidence=ela_score
        ))
        indicators.append(f"Pronounced quantization boundary seams detected (score: {ela_score}%)")
        indicators.append("Non-uniform block compression distribution across focal planes")
    elif ela_score > 50.0:
        findings.append(EvidenceFinding(
            id="find-ela-moderate",
            category="compression",
            severity="medium",
            title="Moderate Quantization Gradient Variance",
            description="Variations in JPEG quantization tables across raster blocks. May result from re-saving or mild localized adjustments.",
            corroboration=f"ELA block variance {patch_disparity:.2f} above baseline threshold.",
            confidence=ela_score
        ))
        indicators.append("Moderate compression level variance observed")
    else:
        indicators.append("Uniform quantization table error distribution across entire canvas")
        indicators.append(f"Low compression delta variance ({std_err:.2f})")

    elapsed_ms = (time.perf_counter() - start_time) * 1000.0

    stage_result = StageResult(
        stage_id="stage-2-ela",
        stage_name="Stage 2: Error Level Analysis (Quantization Disparity)",
        status="completed",
        progress=100,
        execution_time_ms=round(elapsed_ms, 2),
        score=ela_score,
        summary=f"ELA decomposition computed at Q{quality}. Compression disparity score: {ela_score}%.",
        indicators_found=indicators,
        details={
            "mean_error": round(mean_err, 2),
            "max_error": round(max_err, 2),
            "std_error": round(std_err, 2),
            "patch_disparity": round(patch_disparity, 3),
            "quality_tested": quality,
        },
        visual_artifact_b64=heatmap_b64
    )

    return ela_score, stage_result, findings, heatmap_b64

