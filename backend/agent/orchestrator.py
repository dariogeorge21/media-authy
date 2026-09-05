import time
import uuid
import asyncio
from datetime import datetime, timezone
from typing import AsyncGenerator, Tuple, List, Dict, Any
from PIL import Image

from ..config import settings
from ..schemas.events import (
    AnalysisEventType,
    AnalysisStartEvent,
    CheckProgressEvent,
    StageCompletedEvent,
    FindingsExtractedEvent,
    ReasoningStepEvent,
    FinalVerdictEvent,
    ErrorEvent,
)
from ..schemas.reports import (
    ForensicReport,
    ForensicMetrics,
    StageResult,
    EvidenceFinding,
    MetadataSummary,
    RecommendationItem,
)
from ..forensics.metadata_parser import parse_metadata_and_provenance
from ..forensics.ela_analyzer import analyze_error_level
from ..forensics.fft_analyzer import analyze_frequency_domain
from ..forensics.noise_analyzer import analyze_sensor_noise
from ..forensics.visual_analyzer import analyze_visual_artifacts
from ..agent.llm_reasoner import reason_over_forensic_evidence
from ..privacy.sanitizer import create_privacy_audit
from ..utils.image_ops import (
    load_image_from_bytes,
    calculate_sha256,
    format_file_size,
    image_to_base64_data_uri,
)


class ForensicPipelineOrchestrator:
    """
    Coordinates multi-stage forensic analysis across deterministic vision algorithms
    and the multi-modal LLM reasoning agent. Emits progressive structured events.
    """

    @classmethod
    async def stream_analysis(
        cls,
        image_bytes: bytes,
        file_name: str,
        mime_type: str = "image/jpeg"
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Asynchronously executes the multi-stage forensic verification pipeline,
        yielding structured real-time lifecycle events.
        """
        session_id = f"case-{uuid.uuid4().hex[:12]}"
        start_wall_time = time.perf_counter()
        iso_timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
        
        all_findings: List[EvidenceFinding] = []
        all_stages: List[StageResult] = []

        try:
            # 0. Initial Verification & Cryptographic Stamp
            sha256 = calculate_sha256(image_bytes)
            file_size_fmt = format_file_size(len(image_bytes))

            start_event = AnalysisStartEvent(
                timestamp=iso_timestamp,
                session_id=session_id,
                file_name=file_name,
                file_size_formatted=file_size_fmt,
                file_type=mime_type,
                sha256_hash=sha256,
            )
            yield start_event.model_dump()
            await asyncio.sleep(0.05)

            # Load in-memory PIL image
            pil_image = load_image_from_bytes(image_bytes)
            
            # -------------------------------------------------------------
            # STAGE 1: Cryptographic Integrity & Metadata Parsing
            # -------------------------------------------------------------
            yield CheckProgressEvent(
                timestamp=iso_timestamp,
                session_id=session_id,
                stage_id="stage-1-metadata",
                stage_name="Stage 1: Cryptographic Integrity & Metadata Sanitation",
                progress_percentage=20,
                current_action="Parsing EXIF/IPTC/XMP headers and inspecting C2PA Content Credentials...",
                elapsed_ms=(time.perf_counter() - start_wall_time) * 1000
            ).model_dump()
            await asyncio.sleep(0.08)

            meta_summary, stage1_result, stage1_findings = parse_metadata_and_provenance(
                image_bytes=image_bytes,
                file_name=file_name,
                mime_type=mime_type
            )
            all_stages.append(stage1_result)
            all_findings.extend(stage1_findings)

            yield StageCompletedEvent(
                timestamp=iso_timestamp,
                session_id=session_id,
                stage_result=stage1_result
            ).model_dump()
            await asyncio.sleep(0.05)

            # -------------------------------------------------------------
            # STAGE 2: Error Level Analysis (ELA)
            # -------------------------------------------------------------
            yield CheckProgressEvent(
                timestamp=iso_timestamp,
                session_id=session_id,
                stage_id="stage-2-ela",
                stage_name="Stage 2: Error Level Analysis (Quantization Disparity)",
                progress_percentage=40,
                current_action="Computing spatial JPEG re-compression delta and inpainting quantization seams...",
                elapsed_ms=(time.perf_counter() - start_wall_time) * 1000
            ).model_dump()
            await asyncio.sleep(0.08)

            ela_score, stage2_result, stage2_findings, heatmap_b64 = analyze_error_level(
                image=pil_image,
                quality=settings.ELA_JPEG_QUALITY,
                scale_factor=settings.ELA_SCALE_FACTOR
            )
            all_stages.append(stage2_result)
            all_findings.extend(stage2_findings)

            yield StageCompletedEvent(
                timestamp=iso_timestamp,
                session_id=session_id,
                stage_result=stage2_result
            ).model_dump()
            await asyncio.sleep(0.05)

            # -------------------------------------------------------------
            # STAGE 3: 2D FFT Frequency Domain Analysis
            # -------------------------------------------------------------
            yield CheckProgressEvent(
                timestamp=iso_timestamp,
                session_id=session_id,
                stage_id="stage-3-fft",
                stage_name="Stage 3: 2D FFT Frequency Domain & Checkerboard Lattice",
                progress_percentage=60,
                current_action="Decomposing 2D Fourier power spectrum and detecting periodic GAN/diffusion harmonics...",
                elapsed_ms=(time.perf_counter() - start_wall_time) * 1000
            ).model_dump()
            await asyncio.sleep(0.08)

            fft_score, stage3_result, stage3_findings, fft_b64 = analyze_frequency_domain(
                image=pil_image
            )
            all_stages.append(stage3_result)
            all_findings.extend(stage3_findings)

            yield StageCompletedEvent(
                timestamp=iso_timestamp,
                session_id=session_id,
                stage_result=stage3_result
            ).model_dump()
            await asyncio.sleep(0.05)

            # -------------------------------------------------------------
            # STAGE 4: Latent Noise Residuals & Spatial Artifacts
            # -------------------------------------------------------------
            yield CheckProgressEvent(
                timestamp=iso_timestamp,
                session_id=session_id,
                stage_id="stage-4-noise",
                stage_name="Stage 4: Latent Noise Residuals & Sensor Distribution",
                progress_percentage=75,
                current_action="Extracting Poisson-Gaussian sensor noise residuals and measuring PRNU coherence...",
                elapsed_ms=(time.perf_counter() - start_wall_time) * 1000
            ).model_dump()
            await asyncio.sleep(0.08)

            noise_score, stage4_result, stage4_findings, noise_b64 = analyze_sensor_noise(
                image=pil_image
            )
            all_stages.append(stage4_result)
            all_findings.extend(stage4_findings)

            # Stage 4.5: Visual / Biometrics
            bio_score, art_score, stage_vis_result, vis_findings = analyze_visual_artifacts(
                image=pil_image
            )
            all_stages.append(stage_vis_result)
            all_findings.extend(vis_findings)

            yield StageCompletedEvent(
                timestamp=iso_timestamp,
                session_id=session_id,
                stage_result=stage4_result
            ).model_dump()
            await asyncio.sleep(0.05)

            # -------------------------------------------------------------
            # STAGE 4.8: Emit Aggregated Findings
            # -------------------------------------------------------------
            yield FindingsExtractedEvent(
                timestamp=iso_timestamp,
                session_id=session_id,
                findings=all_findings
            ).model_dump()
            await asyncio.sleep(0.05)

            # -------------------------------------------------------------
            # STAGE 5: Multi-Modal LLM Evidence Fusion & Reasoning
            # -------------------------------------------------------------
            yield CheckProgressEvent(
                timestamp=iso_timestamp,
                session_id=session_id,
                stage_id="stage-5-reasoning",
                stage_name="Stage 5: Multi-Modal LLM Evidence Fusion & Verdict Synthesis",
                progress_percentage=90,
                current_action="Synthesizing multi-modal vision inspection with multi-spectral forensic vectors...",
                elapsed_ms=(time.perf_counter() - start_wall_time) * 1000
            ).model_dump()
            await asyncio.sleep(0.05)

            reasoning_synthesis = reason_over_forensic_evidence(
                image=pil_image,
                meta_summary=meta_summary,
                ela_score=ela_score,
                fft_score=fft_score,
                noise_score=noise_score,
                biometric_score=bio_score,
                artifact_score=art_score,
                findings=all_findings
            )

            # Stream out reasoning steps progressively
            reasoning_steps = reasoning_synthesis.get("reasoning_steps", [])
            for idx, step_text in enumerate(reasoning_steps):
                step_title = step_text.split(":")[0] if ":" in step_text else f"Step {idx+1}"
                yield ReasoningStepEvent(
                    timestamp=iso_timestamp,
                    session_id=session_id,
                    step_number=idx + 1,
                    step_title=step_title,
                    thought_process=step_text,
                    accumulated_confidence=reasoning_synthesis.get("tamper_confidence", 50.0)
                ).model_dump()
                await asyncio.sleep(0.04)

            # Compile Recommendations
            recs_data = reasoning_synthesis.get("recommendations", [])
            recommendations: List[RecommendationItem] = []
            for r in recs_data:
                if isinstance(r, dict):
                    recommendations.append(RecommendationItem(**r))
                elif isinstance(r, RecommendationItem):
                    recommendations.append(r)

            # Compile Privacy Audit
            privacy_audit = create_privacy_audit(
                gps_redacted=meta_summary.gps_redacted,
                serials_redacted=True
            )

            # Build Full Final Forensic Report
            is_auth = reasoning_synthesis.get("is_authentic", False)
            tamper_conf = reasoning_synthesis.get("tamper_confidence", 95.0)
            model_src = reasoning_synthesis.get("identified_model_family", "FastAPI Forensic Neural Agent")
            exec_summary = reasoning_synthesis.get("executive_summary", "")
            forensic_summary = reasoning_synthesis.get("forensic_summary", [])
            limitations = reasoning_synthesis.get("limitations", [])

            preview_b64 = image_to_base64_data_uri(pil_image, format="JPEG", quality=85)

            final_report = ForensicReport(
                id=session_id,
                title=file_name,
                subtitle=f"Neural Multi-Spectral Forensic Dissection [{mime_type}]",
                timestamp=iso_timestamp,
                media_category="image",
                model_source=model_src,
                is_authentic=is_auth,
                tamper_confidence=tamper_conf,
                confidence_level=reasoning_synthesis.get("confidence_level", "High"),
                ela_score=ela_score,
                fft_anomaly_score=fft_score,
                latent_noise_score=noise_score,
                biometric_score=bio_score,
                executive_summary=exec_summary,
                description=exec_summary,
                forensic_summary=forensic_summary,
                stages=all_stages,
                findings=all_findings,
                reasoning_steps=reasoning_steps,
                limitations=limitations,
                recommendations=recommendations,
                metadata=meta_summary,
                privacy_audit=privacy_audit,
                heatmap_url=heatmap_b64,
                fft_url=fft_b64,
                noise_url=noise_b64,
                attestation_hash=sha256,
            )

            yield FinalVerdictEvent(
                timestamp=iso_timestamp,
                session_id=session_id,
                report=final_report
            ).model_dump()

        except Exception as e:
            yield ErrorEvent(
                timestamp=iso_timestamp,
                session_id=session_id,
                error_code="PIPELINE_EXECUTION_ERROR",
                message=str(e),
                details={"stage_count": len(all_stages)}
            ).model_dump()

    @classmethod
    async def run_analysis_sync(
        cls,
        image_bytes: bytes,
        file_name: str,
        mime_type: str = "image/jpeg"
    ) -> ForensicReport:
        """
        Executes full forensic pipeline synchronously and returns the final ForensicReport.
        """
        final_report: ForensicReport = None
        async for event in cls.stream_analysis(image_bytes, file_name, mime_type):
            if event.get("event") == AnalysisEventType.FINAL_VERDICT:
                final_report = ForensicReport(**event["report"])
            elif event.get("event") == AnalysisEventType.ERROR:
                raise RuntimeError(f"Analysis pipeline failed: {event.get('message')}")
        
        if not final_report:
            raise RuntimeError("Analysis pipeline finished without producing a final verdict")
        
        return final_report

