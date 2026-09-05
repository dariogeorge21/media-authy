import io
import pytest
from PIL import Image, ImageDraw
import numpy as np

from backend.forensics.metadata_parser import parse_metadata_and_provenance
from backend.forensics.ela_analyzer import analyze_error_level
from backend.forensics.fft_analyzer import analyze_frequency_domain
from backend.forensics.noise_analyzer import analyze_sensor_noise
from backend.forensics.visual_analyzer import analyze_visual_artifacts
from backend.agent.orchestrator import ForensicPipelineOrchestrator
from backend.privacy.sanitizer import sanitize_metadata


def create_test_image_bytes(with_pattern: bool = True) -> bytes:
    """Helper to generate in-memory test image bytes."""
    img = Image.new("RGB", (400, 400), color=(120, 140, 160))
    draw = ImageDraw.Draw(img)
    
    if with_pattern:
        # Draw high-frequency checkerboard / geometric patterns typical of synthetic images
        for x in range(50, 350, 20):
            for y in range(50, 350, 20):
                color = (255, 50, 50) if (x + y) % 40 == 0 else (50, 255, 50)
                draw.rectangle([x, y, x + 10, y + 10], fill=color)
        draw.text((80, 20), "TEST SYNTHETIC SAMPLE", fill=(255, 255, 255))
    else:
        # Smooth photographic gradient
        for y in range(400):
            draw.line([(0, y), (400, y)], fill=(int(100 + y*0.3), int(120 + y*0.2), 150))
    
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=92)
    return buf.getvalue()


def test_metadata_parsing_and_sanitization():
    raw_data = create_test_image_bytes()
    summary, stage_result, findings = parse_metadata_and_provenance(raw_data, "test.jpg")
    
    assert summary.file_name == "test.jpg"
    assert summary.sha256_hash.startswith("0x")
    assert stage_result.status == "completed"
    assert stage_result.stage_id == "stage-1-metadata"
    
    # Test GPS sanitization
    raw_meta = {
        "Make": "Sony",
        "Model": "ILCE-7RM4",
        "GPSLatitude": [37, 46, 29.5],
        "GPSLongitude": [-122, 25, 9.8],
        "BodySerialNumber": "8849204",
        "Software": "Adobe Photoshop 2024"
    }
    sanitized, redacted = sanitize_metadata(raw_meta)
    assert redacted is True
    assert sanitized["GPSLatitude"] == "[REDACTED_PRIVACY_GPS_COORDINATES]"
    assert sanitized["BodySerialNumber"] == "[REDACTED_DEVICE_SERIAL]"
    assert sanitized["Make"] == "Sony"


def test_ela_analyzer():
    img_bytes = create_test_image_bytes(with_pattern=True)
    img = Image.open(io.BytesIO(img_bytes))
    
    score, stage_res, findings, heatmap_b64 = analyze_error_level(img)
    
    assert 0.0 <= score <= 100.0
    assert stage_res.status == "completed"
    assert stage_res.stage_id == "stage-2-ela"
    assert heatmap_b64.startswith("data:image/png;base64,")


def test_fft_analyzer():
    img_bytes = create_test_image_bytes(with_pattern=True)
    img = Image.open(io.BytesIO(img_bytes))
    
    score, stage_res, findings, fft_b64 = analyze_frequency_domain(img)
    
    assert 0.0 <= score <= 100.0
    assert stage_res.status == "completed"
    assert stage_res.stage_id == "stage-3-fft"
    assert fft_b64.startswith("data:image/png;base64,")


def test_noise_analyzer():
    img_bytes = create_test_image_bytes(with_pattern=True)
    img = Image.open(io.BytesIO(img_bytes))
    
    score, stage_res, findings, noise_b64 = analyze_sensor_noise(img)
    
    assert 0.0 <= score <= 100.0
    assert stage_res.status == "completed"
    assert stage_res.stage_id == "stage-4-noise"
    assert noise_b64.startswith("data:image/png;base64,")


def test_visual_artifacts_analyzer():
    img_bytes = create_test_image_bytes(with_pattern=True)
    img = Image.open(io.BytesIO(img_bytes))
    
    bio_score, art_score, stage_res, findings = analyze_visual_artifacts(img)
    
    assert 0.0 <= bio_score <= 100.0
    assert 0.0 <= art_score <= 100.0
    assert stage_res.status == "completed"


@pytest.mark.asyncio
async def test_full_pipeline_orchestrator():
    img_bytes = create_test_image_bytes(with_pattern=True)
    
    events = []
    async for ev in ForensicPipelineOrchestrator.stream_analysis(img_bytes, "synthetic_test.jpg"):
        events.append(ev)
    
    event_names = [e.get("event") for e in events]
    assert "analysis_started" in event_names
    assert "stage_completed" in event_names
    assert "findings_extracted" in event_names
    assert "reasoning_step" in event_names
    assert "final_verdict" in event_names
    
    # Verify final report
    final_event = [e for e in events if e.get("event") == "final_verdict"][0]
    report = final_event["report"]
    assert report["title"] == "synthetic_test.jpg"
    assert "ela_score" in report
    assert "fft_anomaly_score" in report
    assert "attestation_hash" in report
    assert report["privacy_audit"]["pii_redacted"] is True
