"""ONNX Runtime adapter for MobileCLIP-S2 semantic embeddings.

Expected files (exported by scripts/export_mobileclip_onnx.py):
  apps/ai/models/mobileclip-s2/image_encoder.onnx
  apps/ai/models/mobileclip-s2/text_encoder.onnx

This runtime avoids torch inference. Tokenization uses HuggingFace's CLIP
TokenizerFast, which matches OpenCLIP's BPE/token layout for MobileCLIP.
"""

from __future__ import annotations

import os
from pathlib import Path

import numpy as np
import onnxruntime as ort
from PIL import Image, ImageOps
from transformers import CLIPTokenizerFast

SEMANTIC_DIMENSION = 512
DEFAULT_MODEL_DIR = Path(__file__).resolve().parent / "models" / "mobileclip-s2"
DEFAULT_TOKENIZER = "openai/clip-vit-base-patch32"
CLIP_MEAN = np.array([0.48145466, 0.4578275, 0.40821073], dtype=np.float32)
CLIP_STD = np.array([0.26862954, 0.26130258, 0.27577711], dtype=np.float32)


def _normalize(features: np.ndarray) -> np.ndarray:
    features = np.asarray(features, dtype=np.float32)
    if features.ndim == 2:
        features = features[0]
    norm = np.linalg.norm(features)
    if norm > 0:
        features = features / norm
    if features.shape[-1] != SEMANTIC_DIMENSION:
        raise RuntimeError(f"Expected {SEMANTIC_DIMENSION}D ONNX embedding, got {features.shape[-1]}D")
    return features


def _preprocess_image(image: Image.Image, size: int = 224) -> np.ndarray:
    image = ImageOps.exif_transpose(image).convert("RGB")
    w, h = image.size
    scale = size / min(w, h)
    resized = (round(w * scale), round(h * scale))
    image = image.resize(resized, Image.Resampling.BICUBIC)
    left = (image.width - size) // 2
    top = (image.height - size) // 2
    image = image.crop((left, top, left + size, top + size))
    arr = np.asarray(image).astype(np.float32) / 255.0
    arr = (arr - CLIP_MEAN) / CLIP_STD
    arr = np.transpose(arr, (2, 0, 1))[None, ...]
    return arr.astype(np.float32)


class MobileClipOnnxAdapter:
    model_name = "mobileclip-s2"
    backend = "onnx"
    dimension = SEMANTIC_DIMENSION

    def __init__(self):
        model_dir = Path(os.environ.get("SEMANTIC_ONNX_DIR", DEFAULT_MODEL_DIR))
        image_path = Path(os.environ.get("SEMANTIC_ONNX_IMAGE_PATH", model_dir / "image_encoder.onnx"))
        text_path = Path(os.environ.get("SEMANTIC_ONNX_TEXT_PATH", model_dir / "text_encoder.onnx"))
        tokenizer_name = os.environ.get("SEMANTIC_TOKENIZER", DEFAULT_TOKENIZER)

        if not image_path.exists() or not text_path.exists():
            raise RuntimeError(
                "MobileCLIP ONNX files not found. Run "
                "`python apps/ai/scripts/export_mobileclip_onnx.py` first, or set "
                "SEMANTIC_ONNX_IMAGE_PATH and SEMANTIC_ONNX_TEXT_PATH."
            )

        providers = ["CPUExecutionProvider"]
        self.image_session = ort.InferenceSession(str(image_path), providers=providers)
        self.text_session = ort.InferenceSession(str(text_path), providers=providers)
        self.image_input_name = self.image_session.get_inputs()[0].name
        self.text_input_name = self.text_session.get_inputs()[0].name
        self.tokenizer = CLIPTokenizerFast.from_pretrained(tokenizer_name)

    PROMPT_TEMPLATES = [
        "a photo of {}",
        "a picture of {}",
        "an image of {}",
        "{}",
    ]

    def _encode_text_single(self, text: str) -> np.ndarray:
        tokens = self.tokenizer(
            [text],
            padding="max_length",
            truncation=True,
            max_length=77,
            return_tensors="np",
        )["input_ids"].astype(np.int64)
        features = self.text_session.run(None, {self.text_input_name: tokens})[0]
        return _normalize(features)

    def encode_text(self, text: str) -> np.ndarray:
        embeddings = np.stack([self._encode_text_single(t.format(text)) for t in self.PROMPT_TEMPLATES])
        mean = embeddings.mean(axis=0)
        norm = np.linalg.norm(mean)
        return mean / norm if norm > 0 else mean

    def encode_image(self, image: Image.Image):
        pixels = _preprocess_image(image)
        features = self.image_session.run(None, {self.image_input_name: pixels})[0]
        return _normalize(features)
