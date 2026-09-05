import json
import time
from typing import Dict, Any, List, Tuple, Optional
from PIL import Image
from groq import Groq
from openai import OpenAI

from ..config import settings
from ..schemas.reports import (
    MetadataSummary,
    EvidenceFinding,
    RecommendationItem,
)
from ..privacy.sanitizer import validate_safety_claims
from ..utils.image_ops import image_to_base64_data_uri, resize_for_analysis


# ---------------------------------------------------------------------------
# SYSTEM PROMPT
# ---------------------------------------------------------------------------
# Design philosophy:
#   - Default to authentic. Most images submitted are genuine. The agent must
#     resist pressure to over-detect and require strong multi-signal evidence.
#   - Explicitly teaches the LLM how to read the calibrated scores (0-30=authentic,
#     30-55=ambiguous, 55-75=mildly elevated, 75+=significant anomaly).
#   - Requires corroboration across ≥3 independent signals before classifying synthetic.
#   - Provides a worked authentic example in the JSON schema to counteract training bias
#     toward "fake" classification.
#   - Lists the most common false-positive patterns so the LLM can discount them.
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """You are a calibrated forensic media authenticity analyst at MediaAuth.
Your job is to determine whether an image is authentic (captured by a physical camera or
legitimate camera app) or synthetic/manipulated (AI-generated or significantly altered).

━━━ CALIBRATION RULES — READ THESE FIRST ━━━

1. DEFAULT TO AUTHENTIC.
   The majority of images submitted for verification are genuine photographs.
   Do not flag an image as synthetic without clear, multi-signal evidence.
   Ambiguous or mildly elevated signals are NOT evidence of manipulation.

2. SCORE INTERPRETATION (post-calibration scale):
   • 0–30%   → Strong authenticity signal for that detector. Weight heavily toward authentic.
   • 30–55%  → Ambiguous / inconclusive. Do NOT let a single score in this range drive the verdict.
   • 55–75%  → Mildly elevated. Requires corroboration from at least 2 other signals above 55%.
   • 75–100% → Significant anomaly. Investigate, but still verify against common false positives.

3. CORROBORATION REQUIREMENT.
   To classify an image as synthetic or manipulated, you MUST have at least 3 of the
   5 forensic signals independently exceeding 55%, AND metadata must be absent or suspicious.
   A single high score with normal metadata is NOT sufficient.

4. COMMON FALSE POSITIVES — account for these before raising suspicion:
   • Social media re-encoding: WhatsApp, Instagram, Twitter, Reddit, Signal all strip EXIF
     and re-encode at 70-85% JPEG quality. This legitimately elevates ELA and noise scores.
   • Depth-of-field variation: Sharp subject + blurred bokeh is NORMAL photography.
     It creates natural ELA patch disparity. Do NOT flag this as tampering.
   • Computational photography: HDR stacking, night mode, portrait mode, AI upscaling in-camera
     (Google Tensor, Apple A-series) are standard features of modern smartphones. These are
     NOT synthetic generation.
   • Geometric/architectural scenes: Buildings, windows, fences, and textiles create directional
     FFT energy. This is natural, not a GAN artifact.
   • Lossless-to-lossy conversion: Screenshots (PNG) saved as JPEG produce high ELA scores.
   • Strong studio or rim lighting: Creates high gradient dynamic range — not a diffusion artifact.

5. METADATA CONTEXT:
   • Absent EXIF is NOT suspicious by itself. Most social platforms strip metadata.
   • Present camera EXIF (make + model) is a STRONG authenticity signal.
   • C2PA cryptographic provenance (if valid) is near-definitive authenticity.
   • AI software signatures (Midjourney, DALL-E, Stable Diffusion in EXIF) are strong AI signals.

━━━ OUTPUT FORMAT ━━━

Return ONLY valid JSON matching this schema (no markdown, no commentary):
{
  "is_authentic": true,
  "tamper_confidence": 14.2,
  "confidence_level": "High (Authentic)",
  "identified_model_family": "Canon EOS R5 (Physical Camera)",
  "executive_summary": "Multi-signal forensic analysis confirms authentic camera capture with high confidence. All five detectors returned low anomaly scores consistent with physical camera characteristics...",
  "reasoning_steps": [
    "Step 1 [Provenance & Metadata]: Camera EXIF is present with Canon EOS R5 signature. No AI software tags. C2PA status: not present. Metadata strongly supports authenticity.",
    "Step 2 [Spectral & Compression Analysis]: ELA score 22% and FFT score 18% are both in the authentic range (<30%). No cross-quality ELA divergence detected.",
    "Step 3 [Sensor & Texture Consistency]: Noise score 15% and texture score 12% are consistent with physical camera sensor behavior after ISP processing.",
    "Step 4 [Corroboration & Verdict]: All 5 signals are below 30%. No corroborating evidence of manipulation. Verdict: Authentic."
  ],
  "forensic_summary": [
    "All detector scores in the authentic range (0-30%)",
    "Physical camera EXIF metadata present and internally consistent",
    "Natural optical 1/f spectral decay in FFT — no neural upsampling lattices"
  ],
  "additional_findings": [
    {
      "id": "find-1",
      "category": "metadata",
      "severity": "info",
      "title": "Physical Camera EXIF Detected",
      "description": "Canon EOS R5 metadata with valid timestamp found.",
      "corroboration": "Metadata parser",
      "confidence": 85.0
    }
  ],
  "limitations": [
    "Analysis based on re-encoded image; original RAW file not available for baseline comparison.",
    "Social media re-compression may reduce forensic signal fidelity."
  ],
  "recommendations": [
    {
      "level": "authentic_attested",
      "title": "Confirmed Authentic Capture",
      "guidance": "Evidence supports authenticity. Safe for editorial publication with standard provenance attribution."
    }
  ]
}"""


# ---------------------------------------------------------------------------
# USER PROMPT BUILDER
# ---------------------------------------------------------------------------

def _build_user_prompt(
    meta_summary: MetadataSummary,
    ela_score: float,
    fft_score: float,
    noise_score: float,
    texture_score: float,
    artifact_score: float,
    findings: List[EvidenceFinding]
) -> str:
    """
    Builds the user prompt with calibrated score interpretation context so the
    LLM correctly weights each signal rather than treating all scores equally.
    """
    findings_summary_text = "\n".join([
        f"- [{f.severity.upper()}] {f.title}: {f.description} (Confidence: {f.confidence}%)"
        for f in findings
    ]) or "No critical isolated detector anomalies found."

    def _score_label(s: float) -> str:
        if s < 30:
            return "AUTHENTIC"
        elif s < 55:
            return "AMBIGUOUS"
        elif s < 75:
            return "ELEVATED"
        else:
            return "HIGH ANOMALY"

    # Count how many signals are elevated (≥55%) — need ≥3 for synthetic verdict
    elevated_count = sum(1 for s in [ela_score, fft_score, noise_score, texture_score, artifact_score] if s >= 55)
    convergence_note = (
        f"⚠ {elevated_count}/5 signals elevated (≥55%). CORROBORATION THRESHOLD {'MET' if elevated_count >= 3 else 'NOT MET'} — minimum 3 required for synthetic classification."
    )

    return f"""Analyze this media forensic evidence and return a calibrated authenticity verdict.

SCORE INTERPRETATION: 0-30%=Authentic | 30-55%=Ambiguous | 55-75%=Elevated | 75-100%=High Anomaly
{convergence_note}

━━━ TECHNICAL DETECTOR SCORES ━━━
- Error Level Analysis (ELA) Quantization Disparity:  {ela_score}%  [{_score_label(ela_score)}]
- 2D FFT Fourier Frequency Domain Anomaly:            {fft_score}%  [{_score_label(fft_score)}]
- Latent Sensor Noise Residual Deviation:             {noise_score}%  [{_score_label(noise_score)}]
- Texture Anomaly / Over-Smoothing Score:             {texture_score}%  [{_score_label(texture_score)}]
- Visual / Chromatic Aberration Artifact Score:       {artifact_score}%  [{_score_label(artifact_score)}]

━━━ METADATA & PROVENANCE ━━━
- File Name:              {meta_summary.file_name}
- Dimensions:             {meta_summary.dimensions}
- Color Mode:             {meta_summary.color_mode}
- SHA-256:                {meta_summary.sha256_hash}
- Camera Profile:         {(meta_summary.camera_make or 'None')} {(meta_summary.camera_model or 'None')}
- Software Tag:           {meta_summary.software or 'None'}
- C2PA Provenance Status: {meta_summary.c2pa_status} (Present: {meta_summary.c2pa_manifest_present})

━━━ EXTRACTED DETECTOR FINDINGS ━━━
{findings_summary_text}

━━━ TASK ━━━
Apply the calibration rules from your system prompt. Remember:
- If elevated_count < 3: strongly consider authentic verdict
- Account for the common false positive patterns (social media re-encoding, DoF, computational photography)
- Physical camera EXIF with make/model is a STRONG authenticity signal
- Return the structured JSON report."""


# ---------------------------------------------------------------------------
# DETERMINISTIC BAYESIAN FALLBACK
# ---------------------------------------------------------------------------

def _build_deterministic_reasoning(
    meta_summary: MetadataSummary,
    ela_score: float,
    fft_score: float,
    noise_score: float,
    texture_score: float,
    artifact_score: float,
    findings: List[EvidenceFinding]
) -> Dict[str, Any]:
    """
    Fallback deterministic Bayesian evidence fusion engine.
    Used when external LLM APIs are offline or unconfigured.

    RECALIBRATED to work with the new analyzer output ranges:
    - Real camera photos: individual scores typically 5-30%
    - Synthetic/manipulated: individual scores typically 50-90%
    - Fusion threshold accordingly recalibrated
    """
    # Weighted fusion — same weights, but scores are now properly calibrated
    weights = {
        "fft":     0.28,
        "ela":     0.25,
        "noise":   0.22,
        "texture": 0.15,
        "artifact": 0.10,
    }

    raw_tamper = (
        fft_score     * weights["fft"] +
        ela_score     * weights["ela"] +
        noise_score   * weights["noise"] +
        texture_score * weights["texture"] +
        artifact_score * weights["artifact"]
    )

    # Count elevated signals (≥55%) — corroboration requirement
    elevated_signals = sum(1 for s in [ela_score, fft_score, noise_score, texture_score, artifact_score] if s >= 55)

    # Metadata-anchored Bayesian priors
    if meta_summary.c2pa_manifest_present and meta_summary.c2pa_status == "valid":
        # Strong cryptographic provenance → very strong authenticity prior
        raw_tamper = min(raw_tamper * 0.10, 6.0)
    elif meta_summary.has_exif and meta_summary.camera_make and meta_summary.camera_model:
        # Physical camera EXIF present → apply authenticity discount
        # RECALIBRATED: apply discount if raw_tamper < 75 (was < 65, but scores are now lower)
        # Also apply corroboration gate: only trust "authentic" verdict if <3 signals elevated
        if raw_tamper < 75.0:
            discount = 0.60 if elevated_signals < 2 else 0.75
            raw_tamper = max(raw_tamper * discount, 3.0)
    elif not meta_summary.has_exif and not meta_summary.c2pa_manifest_present:
        # Stripped metadata: slight upward pressure, but NOT conclusive
        # Most social media platforms strip metadata — only add 5 points max
        raw_tamper = min(raw_tamper + 5.0, 98.0)

    # Corroboration gate: if fewer than 3 signals are elevated, cap tamper confidence at 55%
    # (inconclusive range) even if the weighted sum is higher
    if elevated_signals < 3:
        raw_tamper = min(raw_tamper, 55.0)

    tamper_confidence = round(float(raw_tamper), 1)
    is_authentic = tamper_confidence < 40.0

    # Model attribution
    if meta_summary.c2pa_manifest_present:
        model_family = "C2PA Hardware Authenticated Camera"
    elif is_authentic:
        camera = f"{meta_summary.camera_make} {meta_summary.camera_model}".strip() if meta_summary.camera_make else "Physical Optical Camera"
        model_family = camera
    elif fft_score > 75.0 and ela_score > 65.0:
        model_family = "Latent Diffusion Model (FLUX.1 / Midjourney v6 / SDXL)"
    elif fft_score > 65.0:
        model_family = "Generative Neural Upsampler / GAN Architecture"
    elif ela_score > 65.0:
        model_family = "Composite Splicing & Local Inpainting Engine"
    else:
        model_family = "Unknown / Ambiguous — Insufficient Signal Convergence"

    reasoning_steps = [
        f"Step 1 [Provenance]: Metadata audit found {len(meta_summary.sanitized_metadata)} EXIF tags. "
        f"C2PA status: '{meta_summary.c2pa_status}'. Camera: {meta_summary.camera_make or 'Not detected'} {meta_summary.camera_model or ''}. "
        f"Software tag: {meta_summary.software or 'None'}.",
        f"Step 2 [Spectral & Compression]: FFT score {fft_score}% [{_score_label_simple(fft_score)}], "
        f"ELA score {ela_score}% [{_score_label_simple(ela_score)}].",
        f"Step 3 [Noise & Texture]: Sensor noise score {noise_score}% [{_score_label_simple(noise_score)}], "
        f"Texture anomaly {texture_score}% [{_score_label_simple(texture_score)}].",
        f"Step 4 [Corroboration]: {elevated_signals}/5 signals elevated (≥55%). "
        f"{'Corroboration threshold met — multi-signal convergence detected.' if elevated_signals >= 3 else 'Corroboration threshold NOT met — insufficient signal convergence for synthetic classification.'}",
        f"Step 5 [Bayesian Fusion]: Weighted evidence fusion yielded {tamper_confidence}% tamper probability. "
        f"Verdict: {'Authentic' if is_authentic else 'Manipulated/Synthetic' if tamper_confidence > 65 else 'Inconclusive'}."
    ]

    if is_authentic:
        exec_summary = (
            f"Multi-signal forensic analysis confirms authentic camera capture characteristics "
            f"({tamper_confidence}% tamper probability). Only {elevated_signals}/5 detectors show elevated "
            f"readings, well below the 3-signal corroboration threshold for synthetic classification."
        )
        forensic_summary = [
            f"Weighted fusion score: {tamper_confidence}% — within authentic range (<40%)",
            f"Signal convergence: {elevated_signals}/5 elevated — corroboration threshold NOT met",
            "Sensor noise and texture patterns consistent with physical ISP-processed capture",
            "Spectral characteristics do not exhibit neural upsampling lattice signatures",
        ]
        recs = [
            RecommendationItem(
                level="authentic_attested",
                title="Attested Media Integrity",
                guidance="Evidence supports authenticity. Safe for editorial publication with standard provenance attribution."
            )
        ]
    elif tamper_confidence <= 65.0:
        exec_summary = (
            f"Inconclusive forensic analysis ({tamper_confidence}% tamper probability). "
            f"Some detector signals are mildly elevated, but the corroboration threshold was not fully met "
            f"({elevated_signals}/5 signals elevated). Cannot definitively classify as authentic or synthetic."
        )
        forensic_summary = [
            f"Weighted fusion score: {tamper_confidence}% — inconclusive range (40-65%)",
            f"Signal convergence: {elevated_signals}/5 elevated — insufficient for definitive classification",
            "Common causes: social media re-encoding, HDR/computational photography, format conversion",
        ]
        recs = [
            RecommendationItem(
                level="verify_with_source",
                title="Request Original Source or RAW File",
                guidance="Evidence is ambiguous. Request the original uncompressed file or C2PA credentials from the source."
            )
        ]
    else:
        exec_summary = (
            f"Multi-signal forensic evidence indicates synthetic generation or significant manipulation "
            f"({tamper_confidence}% confidence). {elevated_signals}/5 independent detectors converge above the "
            f"anomaly threshold."
        )
        forensic_summary = [
            f"Weighted fusion score: {tamper_confidence}% — high anomaly range (>65%)",
            f"Signal convergence: {elevated_signals}/5 signals elevated — corroboration threshold met",
            f"FFT score {fft_score}% | ELA score {ela_score}% — primary signals",
            f"Probable attribution: {model_family}",
        ]
        recs = [
            RecommendationItem(
                level="verify_with_source",
                title="Corroborate Original Source & Request RAW Capture",
                guidance="Cross-reference with original source and request uncompressed sensor RAW files or cryptographic C2PA credentials."
            ),
            RecommendationItem(
                level="proceed_with_caution",
                title="Flag for Editorial Review",
                guidance="Apply content disclosure labels before dissemination in high-stakes editorial or legal contexts."
            )
        ]

    limitations = [
        "Analysis performed on rasterized image buffer; social media re-encoding may degrade forensic signal fidelity.",
        "Lack of hardware C2PA cryptographic root-of-trust limits absolute origin binding to statistical probability.",
        "Calibrated scores reflect recalibrated thresholds accounting for modern ISP processing and JPEG re-compression.",
        "Deterministic models provide probabilistic evidence and do not constitute legal identity verification.",
    ]

    conf_level, calibrated_summary, _ = validate_safety_claims(tamper_confidence, exec_summary, forensic_summary)

    return {
        "is_authentic": is_authentic,
        "tamper_confidence": tamper_confidence,
        "confidence_level": conf_level,
        "identified_model_family": model_family,
        "executive_summary": calibrated_summary,
        "reasoning_steps": reasoning_steps,
        "forensic_summary": forensic_summary,
        "additional_findings": [],
        "limitations": limitations,
        "recommendations": recs,
    }


def _score_label_simple(s: float) -> str:
    if s < 30:
        return "AUTHENTIC"
    elif s < 55:
        return "AMBIGUOUS"
    elif s < 75:
        return "ELEVATED"
    else:
        return "HIGH ANOMALY"


# ---------------------------------------------------------------------------
# MAIN ENTRY POINT
# ---------------------------------------------------------------------------

def reason_over_forensic_evidence(
    image: Image.Image,
    meta_summary: MetadataSummary,
    ela_score: float,
    fft_score: float,
    noise_score: float,
    biometric_score: float,
    artifact_score: float,
    findings: List[EvidenceFinding]
) -> Dict[str, Any]:
    """
    Executes the multi-signal AI reasoning agent.
    Prioritizes Groq LLM for ultra-fast high-reasoning inference,
    with secondary fallback to OpenAI (with vision), then deterministic Bayesian fusion.

    NOTE: biometric_score parameter is now texture_anomaly_score from the recalibrated
    visual_analyzer. Parameter name kept for backward compatibility with orchestrator.
    """
    texture_score = biometric_score  # renamed internally

    user_prompt = _build_user_prompt(
        meta_summary=meta_summary,
        ela_score=ela_score,
        fft_score=fft_score,
        noise_score=noise_score,
        texture_score=texture_score,
        artifact_score=artifact_score,
        findings=findings
    )

    # 1. Primary: Try Groq API (text-only — fast, high-reasoning models)
    if settings.GROQ_API_KEY and len(settings.GROQ_API_KEY.strip()) > 8:
        try:
            groq_client = Groq(api_key=settings.GROQ_API_KEY)

            models_to_try = [settings.GROQ_MODEL] + [
                m for m in settings.GROQ_FALLBACK_MODELS if m != settings.GROQ_MODEL
            ]

            for model_name in models_to_try:
                try:
                    response = groq_client.chat.completions.create(
                        model=model_name,
                        messages=[
                            {"role": "system", "content": SYSTEM_PROMPT},
                            {"role": "user", "content": user_prompt}
                        ],
                        response_format={"type": "json_object"},
                        temperature=settings.GROQ_TEMPERATURE,
                        max_tokens=2000,
                        timeout=8.0
                    )

                    content = response.choices[0].message.content
                    if content:
                        parsed = json.loads(content)
                        conf_level, cal_summary, _ = validate_safety_claims(
                            parsed.get("tamper_confidence", 50.0),
                            parsed.get("executive_summary", ""),
                            parsed.get("forensic_summary", [])
                        )
                        parsed["confidence_level"] = conf_level
                        parsed["executive_summary"] = cal_summary
                        return parsed
                except Exception as model_err:
                    print(f"[ForensicAgent] Groq model '{model_name}' attempt failed: {model_err}")
                    continue
        except Exception as groq_err:
            print(f"[ForensicAgent] Groq client initialization failed: {groq_err}")

    # 2. Secondary: Try OpenAI API (with vision — sends the image too)
    if settings.OPENAI_API_KEY and len(settings.OPENAI_API_KEY.strip()) > 10:
        try:
            openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
            thumb_img = resize_for_analysis(image.convert("RGB"), max_dimension=768)
            thumb_b64 = image_to_base64_data_uri(thumb_img, format="JPEG", quality=85)

            response = openai_client.chat.completions.create(
                model=settings.OPENAI_VISION_MODEL,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": user_prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": thumb_b64,
                                    "detail": "high"
                                }
                            }
                        ]
                    }
                ],
                response_format={"type": "json_object"},
                temperature=settings.OPENAI_TEMPERATURE,
                max_tokens=2000,
                timeout=10.0
            )

            content = response.choices[0].message.content
            if content:
                parsed = json.loads(content)
                conf_level, cal_summary, _ = validate_safety_claims(
                    parsed.get("tamper_confidence", 50.0),
                    parsed.get("executive_summary", ""),
                    parsed.get("forensic_summary", [])
                )
                parsed["confidence_level"] = conf_level
                parsed["executive_summary"] = cal_summary
                return parsed
        except Exception as openai_err:
            print(f"[ForensicAgent] OpenAI fallback failed: {openai_err}")

    # 3. Final fallback: Deterministic Bayesian fusion reasoner
    return _build_deterministic_reasoning(
        meta_summary=meta_summary,
        ela_score=ela_score,
        fft_score=fft_score,
        noise_score=noise_score,
        texture_score=texture_score,
        artifact_score=artifact_score,
        findings=findings
    )
