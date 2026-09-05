import json
from typing import Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from sse_starlette.sse import EventSourceResponse

from .config import settings
from .agent.orchestrator import ForensicPipelineOrchestrator
from .schemas.reports import ForensicReport


app = FastAPI(
    title="MediaAuth Forensic Agent API",
    description="Deterministic Multi-Spectral Forensic & Multi-Modal AI Agent for Media Verification",
    version="2.4.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_privacy_and_security_headers(request: Request, call_next):
    """Enforces zero-retention, anti-caching, and security headers on all responses."""
    response: Response = await call_next(request)
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, private"
    response.headers["Pragma"] = "no-cache"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-MediaAuth-Privacy-Policy"] = "ZeroRetention-MemoryOnly"
    return response


@app.get("/api/health", summary="Health Check")
async def health_check():
    """Health check verifying active detectors, LLM configuration, and privacy status."""
    return {
        "status": "healthy",
        "service": "MediaAuth Forensic Agent",
        "version": "2.4.0",
        "llm_engine": "OpenAI GPT-4o Vision / Bayesian Hybrid",
        "llm_key_configured": bool(settings.OPENAI_API_KEY and len(settings.OPENAI_API_KEY) > 10),
        "detectors": [
            "Metadata & C2PA Provenance Parser (with PII Redaction)",
            "Error Level Analysis (Quantization Disparity)",
            "2D Fast Fourier Transform Frequency Domain (Checkerboard Lattice)",
            "Latent Sensor Poisson-Gaussian Noise Residuals",
            "Spatial Edge & Biometric Micro-Texture Forensics",
            "Multi-Modal LLM Evidence Fusion Agent"
        ],
        "privacy_guarantees": {
            "memory_only": settings.MEMORY_ONLY_PROCESSING,
            "zero_retention": not settings.ALLOW_PERSISTENT_STORAGE,
            "gps_redaction": settings.SCRUB_EXIF_GPS,
            "training_prohibited": True
        }
    }


@app.post("/api/analyze", response_model=ForensicReport, summary="Synchronous Deep Forensic Analysis")
async def analyze_media_sync(
    file: UploadFile = File(..., description="Target image file to verify")
):
    """
    Receives an image payload and executes the deep 5-stage forensic investigation,
    returning the complete final ForensicReport with scores, evidence findings, and recommendations.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing file name in payload")

    # Read bytes in-memory
    content = await file.read()
    
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")
    
    if len(content) > settings.MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds maximum allowed size of {settings.MAX_FILE_SIZE_BYTES // (1024*1024)}MB"
        )

    try:
        report = await ForensicPipelineOrchestrator.run_analysis_sync(
            image_bytes=content,
            file_name=file.filename,
            mime_type=file.content_type or "image/jpeg"
        )
        return report
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Forensic analysis failed: {str(e)}"
        )
    finally:
        # Zero retention: scrub reference
        del content


@app.post("/api/analyze/stream", summary="Real-Time Structured Streaming Forensic Analysis")
async def analyze_media_stream(
    file: UploadFile = File(..., description="Target image file to stream investigation")
):
    """
    Receives an image payload and returns a Server-Sent Events (SSE) structured stream.
    Emits progressive events:
    1. `analysis_started`
    2. `check_progress` (Stage 1 to 5)
    3. `stage_completed` (Metadata, ELA, FFT, Noise, Biometrics)
    4. `findings_extracted`
    5. `reasoning_step` (Agent thought chain)
    6. `final_verdict` (Full Dossier)
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing file name in payload")

    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    async def event_generator():
        async for event_data in ForensicPipelineOrchestrator.stream_analysis(
            image_bytes=content,
            file_name=file.filename,
            mime_type=file.content_type or "image/jpeg"
        ):
            yield {
                "event": event_data.get("event", "message"),
                "data": json.dumps(event_data)
            }

    return EventSourceResponse(
        event_generator(),
        media_type="text/event-stream"
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
