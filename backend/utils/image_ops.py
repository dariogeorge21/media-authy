import io
import base64
import hashlib
from typing import Tuple, Optional
from PIL import Image, ImageOps
import numpy as np


def calculate_sha256(data: bytes) -> str:
    """Calculate cryptographic SHA-256 hash of byte array."""
    return "0x" + hashlib.sha256(data).hexdigest()


def format_file_size(size_bytes: int) -> str:
    """Convert bytes to human-readable format."""
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.2f} KB"
    else:
        return f"{size_bytes / (1024 * 1024):.2f} MB"


def load_image_from_bytes(data: bytes) -> Image.Image:
    """Safely loads an image from byte buffer and normalizes orientation."""
    image = Image.open(io.BytesIO(data))
    try:
        # Transpose based on EXIF orientation if present
        image = ImageOps.exif_transpose(image)
    except Exception:
        pass
    return image


def resize_for_analysis(image: Image.Image, max_dimension: int = 1536) -> Image.Image:
    """Resize image to reasonable analysis dimensions if excessively large."""
    width, height = image.size
    if max_dimension and max(width, height) > max_dimension:
        scale = max_dimension / max(width, height)
        new_size = (int(width * scale), int(height * scale))
        return image.resize(new_size, Image.Resampling.LANCZOS)
    return image


def image_to_base64_data_uri(image: Image.Image, format: str = "JPEG", quality: int = 90) -> str:
    """Encodes PIL Image to Base64 data URI."""
    buffered = io.BytesIO()
    if image.mode in ("RGBA", "LA") and format.upper() == "JPEG":
        # Convert RGBA to RGB for JPEG compatibility
        bg = Image.new("RGB", image.size, (255, 255, 255))
        bg.paste(image, mask=image.split()[3])
        bg.save(buffered, format=format, quality=quality)
    elif image.mode != "RGB" and format.upper() == "JPEG":
        image.convert("RGB").save(buffered, format=format, quality=quality)
    else:
        image.save(buffered, format=format, quality=quality)
    
    encoded = base64.b64encode(buffered.getvalue()).decode("utf-8")
    mime_type = f"image/{format.lower()}"
    return f"data:{mime_type};base64,{encoded}"


def numpy_to_base64_data_uri(arr: np.ndarray, format: str = "PNG") -> str:
    """Encodes numpy uint8 array (H, W) or (H, W, 3) to Base64 data URI."""
    if arr.dtype != np.uint8:
        # Normalize to 0-255 uint8
        norm = (arr - arr.min()) / (arr.max() - arr.min() + 1e-8) * 255.0
        arr = norm.astype(np.uint8)
    
    img = Image.fromarray(arr)
    return image_to_base64_data_uri(img, format=format)

