import io
import pytest
from httpx import AsyncClient, ASGITransport
from PIL import Image, ImageDraw
from backend.main import app


def create_test_image_bytes() -> bytes:
    img = Image.new("RGB", (200, 200), color=(100, 150, 200))
    draw = ImageDraw.Draw(img)
    draw.rectangle([40, 40, 160, 160], fill=(255, 100, 50))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


@pytest.mark.asyncio
async def test_health_check_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "healthy"
        assert "detectors" in data
        assert "privacy_guarantees" in data


@pytest.mark.asyncio
async def test_analyze_sync_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        img_data = create_test_image_bytes()
        files = {"file": ("suspect.jpg", img_data, "image/jpeg")}
        
        res = await ac.post("/api/analyze", files=files)
        assert res.status_code == 200
        data = res.json()
        
        assert data["title"] == "suspect.jpg"
        assert "tamper_confidence" in data
        assert "is_authentic" in data
        assert "ela_score" in data
        assert "fft_anomaly_score" in data
        assert "latent_noise_score" in data
        assert "stages" in data
        assert len(data["stages"]) >= 4
        assert "privacy_audit" in data
        assert data["privacy_audit"]["memory_only"] is True


@pytest.mark.asyncio
async def test_analyze_stream_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        img_data = create_test_image_bytes()
        files = {"file": ("suspect_stream.jpg", img_data, "image/jpeg")}
        
        res = await ac.post("/api/analyze/stream", files=files)
        assert res.status_code == 200
        assert "text/event-stream" in res.headers["content-type"]
        text = res.text
        assert "analysis_started" in text
        assert "final_verdict" in text
