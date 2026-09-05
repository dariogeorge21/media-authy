from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class ForensicMetrics(BaseModel):
    tamper_confidence: float = Field(..., description="Overall confidence that media is tampered/synthetic (0-100%)")
    is_authentic: bool = Field(..., description="Binary determination based on calibrated confidence threshold")
    ela_score: float = Field(..., description="Error Level Analysis compression disparity score (0-100%)")
    fft_anomaly_score: float = Field(..., description="Fast Fourier Transform frequency domain anomaly score (0-100%)")
    latent_noise_score: float = Field(..., description="Sensor Poisson-Gaussian noise deviation score (0-100%)")
    biometric_score: float = Field(..., description="Biometric and visual consistency anomaly score (0-100%)")
    visual_artifact_score: float = Field(default=0.0, description="Spatial edge and visual artifact score (0-100%)")


class StageResult(BaseModel):
    stage_id: str
    stage_name: str
    status: str = "completed"  # pending, running, completed, failed, skipped
    progress: int = 100
    execution_time_ms: float
    score: Optional[float] = None
    summary: str
    indicators_found: List[str] = Field(default_factory=list)
    details: Dict[str, Any] = Field(default_factory=dict)
    visual_artifact_b64: Optional[str] = None  # Heatmap / Spectrum / Residual image data URI


class EvidenceFinding(BaseModel):
    id: str
    category: str  # metadata, compression, frequency, noise, visual, semantic
    severity: str  # info, low, medium, high, critical
    title: str
    description: str
    corroboration: str
    confidence: float


class MetadataSummary(BaseModel):
    file_name: str
    file_type: str
    file_size_bytes: int
    file_size_formatted: str
    dimensions: str
    color_mode: str
    sha256_hash: str
    c2pa_status: str  # valid, invalid, missing, tampered
    c2pa_manifest_present: bool = False
    camera_make: Optional[str] = None
    camera_model: Optional[str] = None
    software: Optional[str] = None
    datetime_original: Optional[str] = None
    has_exif: bool = False
    gps_redacted: bool = False
    sanitized_metadata: Dict[str, Any] = Field(default_factory=dict)


class PrivacyAudit(BaseModel):
    ephemeral_processing: bool = True
    memory_only: bool = True
    retention_policy: str = "Zero retention - discarded immediately after response"
    pii_redacted: bool = True
    training_usage: str = "Explicitly prohibited - media never used for model training"
    gps_coordinates_stripped: bool = True
    camera_serials_stripped: bool = True


class RecommendationItem(BaseModel):
    level: str  # proceed_with_caution, verify_with_source, reject, authentic_attested
    title: str
    guidance: str


class ForensicReport(BaseModel):
    id: str
    title: str
    subtitle: str
    timestamp: str
    media_category: str = "image"
    model_source: str = "FastAPI Multi-Modal Forensic Agent"
    
    # Core Verdict & Metrics
    is_authentic: bool
    tamper_confidence: float
    confidence_level: str  # High, Moderate, Inconclusive
    
    # Forensic Scores
    ela_score: float
    fft_anomaly_score: float
    latent_noise_score: float
    biometric_score: float
    
    # Descriptions & Summaries
    executive_summary: str
    description: str
    forensic_summary: List[str]
    
    # Detailed Evidence & Stages
    stages: List[StageResult] = Field(default_factory=list)
    findings: List[EvidenceFinding] = Field(default_factory=list)
    reasoning_steps: List[str] = Field(default_factory=list)
    limitations: List[str] = Field(default_factory=list)
    recommendations: List[RecommendationItem] = Field(default_factory=list)
    
    # Metadata & Provenance
    metadata: MetadataSummary
    privacy_audit: PrivacyAudit
    
    # Visual Output URIs
    heatmap_url: Optional[str] = None
    fft_url: Optional[str] = None
    noise_url: Optional[str] = None
    
    # Cryptographic attestation
    attestation_hash: str
    attestation_authority: str = "MEDIA AUTHY FORENSIC ORACLE // ENCLAVE v2.4"
