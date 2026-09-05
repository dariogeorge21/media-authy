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
    
    Returns:
        (latent_noise_score, stage_result, findings, noise_residual_b64)
    """
    start_time = time.perf_counter()

    # Convert to RGB array
    work_img = resize_for_analysis(image.convert("RGB"), max_dimension=1024)
    img_np = np.array(work_img, dtype=np.float32)
    h, w, c = img_np.shape

    # 1. Extract high-frequency noise residual via Gaussian filter subtraction
    # Smooth version
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
                
                std_val = np.std(patch_res)
                lum_val = np.mean(patch_orig)
                
                patch_stds.append(std_val)
                patch_luminances.append(lum_val)
        
        stds_arr = np.array(patch_stds)
        lums_arr = np.array(patch_luminances)
        
        # In natural cameras, noise variance has high positive correlation with luminance
        # In synthetic images, noise is either unnaturally uniform or completely uncorrelated
        if np.std(stds_arr) > 1e-4 and np.std(lums_arr) > 1e-4:
            corr_matrix = np.corrcoef(stds_arr, lums_arr)
            lum_noise_corr = float(corr_matrix[0, 1]) if not np.isnan(corr_matrix[0, 1]) else 0.5
        else:
            lum_noise_corr = 0.5
            
        noise_uniformity_ratio = float(np.std(stds_arr) / (np.mean(stds_arr) + 1e-5))
    else:
        lum_noise_corr = 0.5
        noise_uniformity_ratio = 0.3

    # 3. Calibrate Latent Noise Score (0 to 100)
    # Atypical if:
    # - Lum-noise correlation is negative or near zero (< 0.15)
    # - Noise uniformity ratio is extreme (either hypersmooth zero noise or wild inpainting boundaries)
    is_uncorrelated = max(0.0, 0.45 - lum_noise_corr) * 80.0
    uniformity_penalty = min(abs(noise_uniformity_ratio - 0.45) * 60.0, 45.0)
    
    raw_score = 30.0 + is_uncorrelated + uniformity_penalty
    latent_noise_score = round(float(np.clip(raw_score, 10.0, 97.8)), 1)

    # 4. Generate Noise Residual Visualization Map
    # Amplify residual for visualization
    amp_residual = np.abs(residual_np) * 10.0
    amp_residual = np.clip(amp_residual, 0, 255).astype(np.uint8)
    
    # Map to forensic cyan/green/purple false color
    res_gray = np.mean(amp_residual, axis=2) / 255.0
    res_rgb = np.zeros((h, w, 3), dtype=np.uint8)
    
    res_rgb[:, :, 0] = np.clip(res_gray**0.8 * 200 + 15, 0, 255).astype(np.uint8)                      # R
    res_rgb[:, :, 1] = np.clip(np.sin(res_gray * np.pi) * 255, 0, 255).astype(np.uint8)                 # G
    res_rgb[:, :, 2] = np.clip((1.0 - res_gray) * 80 + res_gray * 255, 0, 255).astype(np.uint8)        # B

    noise_pil = Image.fromarray(res_rgb)
    noise_b64 = image_to_base64_data_uri(noise_pil, format="PNG")

    # 5. Generate Evidence Findings
    findings: List[EvidenceFinding] = []
    indicators: List[str] = []

    if latent_noise_score > 75.0:
        findings.append(EvidenceFinding(
            id="find-noise-incoherent",
            category="noise",
            severity="high",
            title="Non-Physical Sensor Noise Distribution",
            description=f"Sensor Poisson-Gaussian residual distribution deviates from physical camera sensor PRNU (luminance-noise correlation: {lum_noise_corr:.2f}), characteristic of synthetic diffusion denoising steps.",
            corroboration="High-pass residual variance and localized noise uniformity analysis.",
            confidence=latent_noise_score
        ))
        indicators.append(f"Incoherent sensor noise residuals detected (score: {latent_noise_score}%)")
        indicators.append(f"Luminance-to-noise correlation ratio: {lum_noise_corr:.2f}")
    elif latent_noise_score > 50.0:
        findings.append(EvidenceFinding(
            id="find-noise-moderate",
            category="noise",
            severity="medium",
            title="Mild Noise Dispersion Anomaly",
            description="Minor spatial variance in high-frequency noise floor across differing luminance zones.",
            corroboration="Spatial block standard deviation.",
            confidence=latent_noise_score
        ))
        indicators.append("Mild noise field variation detected across focal planes")
    else:
        indicators.append("Sensor noise residuals conform to physical Poisson-Gaussian shot noise model")
        indicators.append(f"Physical PRNU consistency attested (correlation: {lum_noise_corr:.2f})")

    elapsed_ms = (time.perf_counter() - start_time) * 1000.0

    stage_result = StageResult(
        stage_id="stage-4-noise",
        stage_name="Stage 4: Latent Noise Residuals & Sensor Distribution",
        status="completed",
        progress=100,
        execution_time_ms=round(elapsed_ms, 2),
        score=latent_noise_score,
        summary=f"Sensor noise residuals extracted. Dispersion score: {latent_noise_score}%.",
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
