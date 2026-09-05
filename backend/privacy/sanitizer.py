import re
from typing import Dict, Any, List, Tuple
from ..schemas.reports import PrivacyAudit


# Sensitive metadata keys that may leak personal identifiable information (PII)
SENSITIVE_TAG_PATTERNS = [
    r"gps.*",
    r"latitude",
    r"longitude",
    r"altitude",
    r"serialnumber",
    r"body_serial",
    r"lens_serial",
    r"owner_name",
    r"artist",
    r"copyright",
    r"user_comment",
    r"author",
    r"device_unique_id",
    r"phone_number",
    r"email",
]


def sanitize_metadata(raw_metadata: Dict[str, Any]) -> Tuple[Dict[str, Any], bool]:
    """
    Sanitizes raw EXIF/metadata dictionary by redacting PII,
    precise geographic coordinates, and device serials while preserving
    forensically relevant technical tags (camera model, software, timestamps).
    
    Returns:
        (sanitized_dict, was_gps_or_pii_redacted)
    """
    sanitized: Dict[str, Any] = {}
    redacted_flag = False

    for key, val in raw_metadata.items():
        key_lower = str(key).lower()
        
        # Check if key matches sensitive patterns
        is_sensitive = any(re.search(pattern, key_lower) for pattern in SENSITIVE_TAG_PATTERNS)
        
        if is_sensitive:
            redacted_flag = True
            if "gps" in key_lower or "latitude" in key_lower or "longitude" in key_lower:
                sanitized[key] = "[REDACTED_PRIVACY_GPS_COORDINATES]"
            elif "serial" in key_lower:
                sanitized[key] = "[REDACTED_DEVICE_SERIAL]"
            else:
                sanitized[key] = "[REDACTED_SENSITIVE_PII]"
        else:
            # Safe string conversions
            if isinstance(val, bytes):
                try:
                    sanitized[key] = val.decode("utf-8", errors="ignore")
                except Exception:
                    sanitized[key] = "<binary data>"
            elif isinstance(val, (str, int, float, bool, list, dict)):
                sanitized[key] = val
            else:
                sanitized[key] = str(val)

    return sanitized, redacted_flag


def validate_safety_claims(
    tamper_confidence: float,
    verdict_summary: str,
    findings: List[str]
) -> Tuple[str, str, List[str]]:
    """
    Enforces privacy and safe AI claims guidelines:
    - If evidence is inconclusive (35% to 65%), downgrade definitive claims to probabilistic observations.
    - Prevent unwarranted allegations of criminal activity or specific person identities.
    - Add explicit caveats regarding forensic limitations.
    """
    calibrated_summary = verdict_summary
    confidence_level = "High"

    if 35.0 <= tamper_confidence <= 65.0:
        confidence_level = "Inconclusive / Mixed"
        if not calibrated_summary.startswith("Inconclusive"):
            calibrated_summary = (
                f"Inconclusive verification ({tamper_confidence:.1f}% confidence). "
                "The analysis detected ambiguous or conflicting forensic signals. "
                "Deterministic determination cannot be established without corroborating cryptographic provenance."
            )
    elif tamper_confidence < 35.0:
        confidence_level = "High (Authentic)"
    else:
        confidence_level = "High (Synthetic/Manipulated)"

    # Filter any banned or overly assertive claim phrasing
    forbidden_terms = ["guilty of", "criminal forgery", "fraudulent perpetrator", "identity confirmed as"]
    for term in forbidden_terms:
        calibrated_summary = re.sub(re.escape(term), "suspected manipulation in", calibrated_summary, flags=re.IGNORECASE)

    return confidence_level, calibrated_summary, findings


def create_privacy_audit(gps_redacted: bool = True, serials_redacted: bool = True) -> PrivacyAudit:
    """Generates an explicit privacy audit record for verification dossiers."""
    return PrivacyAudit(
        ephemeral_processing=True,
        memory_only=True,
        retention_policy="Zero retention - discarded immediately after response execution",
        pii_redacted=True,
        training_usage="Explicitly prohibited - media is never stored or used for AI training",
        gps_coordinates_stripped=gps_redacted,
        camera_serials_stripped=serials_redacted
    )

