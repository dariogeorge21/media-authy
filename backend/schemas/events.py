from enum import Enum
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from .reports import StageResult, EvidenceFinding, ForensicReport, MetadataSummary


class AnalysisEventType(str, Enum):
    ANALYSIS_STARTED = "analysis_started"
    CHECK_PROGRESS = "check_progress"
    STAGE_COMPLETED = "stage_completed"
    FINDINGS_EXTRACTED = "findings_extracted"
    REASONING_STEP = "reasoning_step"
    FINAL_VERDICT = "final_verdict"
    ERROR = "error"


class BaseAnalysisEvent(BaseModel):
    event: AnalysisEventType
    timestamp: str
    session_id: str


class AnalysisStartEvent(BaseAnalysisEvent):
    event: AnalysisEventType = AnalysisEventType.ANALYSIS_STARTED
    file_name: str
    file_size_formatted: str
    file_type: str
    sha256_hash: str
    total_stages: int = 5
    stages: List[str] = [
        "Stage 1: Cryptographic Integrity & Metadata Sanitation",
        "Stage 2: Error Level Analysis (Quantization Disparity)",
        "Stage 3: 2D FFT Frequency Domain & Checkerboard Lattice",
        "Stage 4: Latent Noise Residuals & Spatial Artifacts",
        "Stage 5: Multi-Modal LLM Evidence Fusion & Verdict Synthesis"
    ]


class CheckProgressEvent(BaseAnalysisEvent):
    event: AnalysisEventType = AnalysisEventType.CHECK_PROGRESS
    stage_id: str
    stage_name: str
    progress_percentage: int
    current_action: str
    elapsed_ms: float


class StageCompletedEvent(BaseAnalysisEvent):
    event: AnalysisEventType = AnalysisEventType.STAGE_COMPLETED
    stage_result: StageResult


class FindingsExtractedEvent(BaseAnalysisEvent):
    event: AnalysisEventType = AnalysisEventType.FINDINGS_EXTRACTED
    findings: List[EvidenceFinding]


class ReasoningStepEvent(BaseAnalysisEvent):
    event: AnalysisEventType = AnalysisEventType.REASONING_STEP
    step_number: int
    step_title: str
    thought_process: str
    accumulated_confidence: float


class FinalVerdictEvent(BaseAnalysisEvent):
    event: AnalysisEventType = AnalysisEventType.FINAL_VERDICT
    report: ForensicReport


class ErrorEvent(BaseAnalysisEvent):
    event: AnalysisEventType = AnalysisEventType.ERROR
    error_code: str
    message: str
    details: Optional[Dict[str, Any]] = None
