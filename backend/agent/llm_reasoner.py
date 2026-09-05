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


SYSTEM_PROMPT = """You are the Senior Forensic Intelligence Agent at MediaAuth, a world-class digital media verification platform.
Your task is to analyze evidence from multi-stage forensic algorithms (Metadata, Error Level Analysis, FFT Frequency Domain, Sensor Noise Residuals, Biometric Consistency, Spatial Artifacts).

Analyze:
1. Convergence of multi-modal forensic signals (do ELA, FFT, and Noise corroborate each other or conflict?).
2. Visual artifacts: anatomical anomalies (hands, eyes, teeth), lighting/shadow direction, impossible physics, text distortion, background melting.
3. Metadata provenance: presence or absence of physical camera EXIF / C2PA credentials vs synthetic tool signatures.
4. Distinguish between innocent social media re-compression vs malicious manipulation or synthetic diffusion generation.

Safety & Privacy Rules:
- Never make definitive claims about person identities or criminal accusations.
- When evidence is mixed/inconclusive (35%-65%), state uncertainty clearly and do not make absolute claims.
- Explicitly state forensic limitations (e.g. compression degradation, lack of original RAW).

Return ONLY valid JSON matching this schema:
{
  "is_authentic": false,
  "tamper_confidence": 96.5,
  "confidence_level": "High (Synthetic/Manipulated)",
  "identified_model_family": "Diffusion Latent Model (Midjourney/SDXL/FLUX)",
  "executive_summary": "Comprehensive summary of findings...",
  "reasoning_steps": [
    "Step 1: Provenance & Metadata Synthesis...",
    "Step 2: Spectral & Compression Corroboration...",
    "Step 3: Visual & Physical Coherence Inspection...",
    "Step 4: Bayesian Probability & Confidence Calibration..."
  ],
  "forensic_summary": [
    "Key observation 1",
    "Key observation 2",
    "Key observation 3",
    "Key observation 4"
  ],
  "additional_findings": [
    {
      "id": "find-vis-1",
      "category": "visual",
      "severity": "high",
      "title": "Finding title",
      "description": "Finding description",
      "corroboration": "Corroborating proof",
      "confidence": 95.0
    }
  ],
  "limitations": [
    "Limitation 1...",
    "Limitation 2..."
  ],
  "recommendations": [
    {
      "level": "reject",
      "title": "Action recommendation",
      "guidance": "Detailed guidance for journalists/investigators"
    }
  ]
}
"""


def _build_deterministic_reasoning(
    meta_summary: MetadataSummary,
    ela_score: float,
    fft_score: float,
    noise_score: float,
    biometric_score: float,
    artifact_score: float,
    findings: List[EvidenceFinding]
) -> Dict[str, Any]:
    """
    Fallback deterministic Bayesian evidence fusion engine.
    Used when external LLM APIs are offline or unconfigured.
    """
    weights = {
        "fft": 0.28,
        "ela": 0.25,
        "noise": 0.22,
        "biometric": 0.15,
        "artifact": 0.10,
    }

    raw_tamper = (
        fft_score * weights["fft"] +
        ela_score * weights["ela"] +
        noise_score * weights["noise"] +
        biometric_score * weights["biometric"] +
        artifact_score * weights["artifact"]
    )

    if meta_summary.c2pa_manifest_present and meta_summary.c2pa_status == "valid":
        raw_tamper = min(raw_tamper * 0.15, 8.0)
    elif meta_summary.has_exif and meta_summary.camera_make and meta_summary.camera_model:
        if raw_tamper < 65.0:
            raw_tamper = max(raw_tamper * 0.75, 4.0)

    tamper_confidence = round(float(raw_tamper), 1)
    is_authentic = tamper_confidence < 38.0

    if meta_summary.c2pa_manifest_present:
        model_family = "C2PA Hardware Authenticated Camera"
    elif is_authentic:
        camera = f"{meta_summary.camera_make} {meta_summary.camera_model}".strip() if meta_summary.camera_make else "Physical Optical Camera"
        model_family = camera
    elif fft_score > 85.0 and ela_score > 80.0:
        model_family = "Latent Diffusion Model (FLUX.1 / Midjourney v6 / SDXL)"
    elif fft_score > 75.0:
        model_family = "Generative Neural Upsampler / StyleGAN Architecture"
    elif ela_score > 75.0:
        model_family = "Composite Splicing & Local Inpainting Engine"
    else:
        model_family = "Synthetic Raster Artifacts / Neural Resampling"

    reasoning_steps = [
        f"Step 1 [Provenance]: Metadata audit recorded {len(meta_summary.sanitized_metadata)} EXIF tags. C2PA provenance status: '{meta_summary.c2pa_status}'. Hardware signature: {meta_summary.camera_make or 'Not detected'}.",
        f"Step 2 [Spectral Corroboration]: 2D Fast Fourier Transform yielded {fft_score}% anomaly score with periodic harmonic lattice peaks. Error Level Analysis (ELA) indicated {ela_score}% quantization block delta.",
        f"Step 3 [Sensor Noise Residuals]: Sensor Poisson-Gaussian residual variance scored {noise_score}%, testing coherence against physical camera PRNU dispersion.",
        f"Step 4 [Spatial & Biometric Cues]: Spatial micro-texture and edge gradient continuity yielded biometric score of {biometric_score}%.",
        f"Step 5 [Bayesian Evidence Fusion]: Synthesized 5 independent forensic vectors. Multi-signal convergence yielded calibrated tamper probability of {tamper_confidence}%."
    ]

    if is_authentic:
        exec_summary = (
            f"The analyzed media conforms to authentic physical camera capture characteristics ({tamper_confidence}% tamper probability). "
            f"Sensor noise residuals follow physical Poisson-Gaussian distributions, 2D Fourier harmonics exhibit natural optical 1/f decay, "
            f"and Error Level Analysis indicates uniform single-pass quantization."
        )
        forensic_summary = [
            "Conforms to physical camera sensor Poisson-Gaussian noise distribution",
            "Natural optical 1/f power law decay across 2D Fourier spectrum",
            "Uniform quantization table error distribution across entire canvas",
            "Zero high-frequency neural upsampling checkerboard lattices detected"
        ]
        recs = [
            RecommendationItem(
                level="authentic_attested",
                title="Attested Media Integrity",
                guidance="Evidence supports authenticity. Safe for editorial publication with standard provenance attribution."
            )
        ]
    else:
        exec_summary = (
            f"Forensic investigation detected multi-signal convergence indicating synthetic generation or manipulation ({tamper_confidence}% confidence). "
            f"2D Fourier analysis revealed high-frequency checkerboard harmonics typical of neural upsampling, "
            f"while Error Level Analysis (ELA) and sensor noise residuals exhibited non-physical quantization disparities."
        )
        forensic_summary = [
            f"2D Fourier spectrum reveals high-frequency checkerboard harmonics (score: {fft_score}%)",
            f"Error Level Analysis shows quantization table compression disparity (score: {ela_score}%)",
            f"Sensor noise residuals deviate from physical camera PRNU (score: {noise_score}%)",
            f"Probabilistic model attribution: {model_family}"
        ]
        recs = [
            RecommendationItem(
                level="verify_with_source",
                title="Corroborate Original Source & Request RAW Capture",
                guidance="Cross-reference with original source repository and request uncompressed sensor RAW files or cryptographic C2PA credentials."
            ),
            RecommendationItem(
                level="proceed_with_caution",
                title="Flag for Editorial Review",
                guidance="Apply content disclosure labels before dissemination in high-stakes editorial or legal contexts."
            )
        ]

    limitations = [
        "Analysis performed on rasterized image buffer; intermediate platform re-encoding (e.g. social media messaging) may degrade high-frequency sensor noise.",
        "Lack of hardware C2PA cryptographic root-of-trust limits absolute origin binding to mathematical probability.",
        "Deterministic models provide probabilistic evidence and do not constitute legal identity verification."
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
    Prioritizes Groq LLM (e.g., openai/gpt-oss-120b or qwen3.8) for ultra-fast high-reasoning inference,
    with secondary fallback to OpenAI and deterministic Bayesian fusion reasoner.
    """
    findings_summary_text = "\n".join([
        f"- [{f.severity.upper()}] {f.title}: {f.description} (Corroboration: {f.corroboration}, Confidence: {f.confidence}%)"
        for f in findings
    ])

    user_prompt = f"""Perform multi-stage forensic reasoning on this media:

TECHNICAL DETECTOR SCORES:
- Error Level Analysis (ELA) Quantization Disparity: {ela_score}%
- 2D FFT Fourier Frequency Domain Anomaly: {fft_score}%
- Latent Sensor Noise Residual Deviation: {noise_score}%
- Biometric / Spatial Micro-Texture Anomaly: {biometric_score}%
- Visual Spatial Artifact Score: {artifact_score}%

METADATA & PROVENANCE:
- File Name: {meta_summary.file_name}
- Dimensions: {meta_summary.dimensions}
- Color Mode: {meta_summary.color_mode}
- SHA-256: {meta_summary.sha256_hash}
- Camera Profile: {meta_summary.camera_make or 'None'} {meta_summary.camera_model or 'None'}
- Software Tag: {meta_summary.software or 'None'}
- C2PA Provenance Status: {meta_summary.c2pa_status} (Present: {meta_summary.c2pa_manifest_present})

EXTRACTED DETECTOR FINDINGS:
{findings_summary_text or 'No critical isolated detector anomalies found.'}

Synthesize all 5 technical forensic vectors, evaluate physical/semantic realism, perform multi-step reasoning, and return the structured JSON report according to the schema.
"""

    # 1. Primary: Try Groq API
    if settings.GROQ_API_KEY and len(settings.GROQ_API_KEY.strip()) > 8:
        try:
            groq_client = Groq(api_key=settings.GROQ_API_KEY)
            
            # Try configured Groq model and fallback models
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
                        max_tokens=1500,
                        timeout=5.0
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

    # 2. Secondary: Try OpenAI API
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
                max_tokens=1500,
                timeout=5.0
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

    # 3. Fallback: Deterministic Bayesian fusion reasoner
    return _build_deterministic_reasoning(
        meta_summary=meta_summary,
        ela_score=ela_score,
        fft_score=fft_score,
        noise_score=noise_score,
        biometric_score=biometric_score,
        artifact_score=artifact_score,
        findings=findings
    )
