FROM python:3.11-slim

WORKDIR /app

ARG SEMANTIC_MODEL=clip-vit-b-32
ARG SEMANTIC_BACKEND=torch
ARG SEMANTIC_ONNX_QUANTIZE=false
ENV SEMANTIC_MODEL=${SEMANTIC_MODEL}
ENV SEMANTIC_BACKEND=${SEMANTIC_BACKEND}
ENV SEMANTIC_ONNX_QUANTIZE=${SEMANTIC_ONNX_QUANTIZE}
ENV SEMANTIC_ONNX_DIR=/app/apps/ai/models/mobileclip-s2-runtime

# Install system dependencies required for OpenCV and InsightFace
# build-essential is required for insightface cython extensions
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
# We assume the context is the root of the project to allow accessing requirements.txt
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the AI service code before semantic model preparation so Docker builds
# can run the export/quantize scripts and bake ONNX artifacts into the image.
COPY apps/ai /app/apps/ai

# Prepare the selected semantic backend during image build:
# - torch backend: pre-downloads the chosen torch model into the image cache.
# - onnx backend: exports MobileCLIP-S2 ONNX artifacts into SEMANTIC_ONNX_DIR.
# - onnx + SEMANTIC_ONNX_QUANTIZE=true: additionally bakes dynamic INT8 files.
RUN --mount=type=cache,target=/root/.cache/huggingface \
    --mount=type=cache,target=/root/.cache/torch \
    python - <<'PY'
import os
import shutil
import subprocess
import sys

model = os.environ.get("SEMANTIC_MODEL", "clip-vit-b-32")
backend = os.environ.get("SEMANTIC_BACKEND", "torch")
onnx_dir = os.environ.get("SEMANTIC_ONNX_DIR", "/app/apps/ai/models/mobileclip-s2-runtime")
quantize = os.environ.get("SEMANTIC_ONNX_QUANTIZE", "false").lower() == "true"

if backend == "onnx":
    if model != "mobileclip-s2":
        raise SystemExit("ONNX backend currently supports only SEMANTIC_MODEL=mobileclip-s2")
    fp32_dir = "/tmp/mobileclip-s2-fp32" if quantize else onnx_dir
    subprocess.check_call([
        sys.executable,
        "/app/apps/ai/scripts/export_mobileclip_onnx.py",
        "--out",
        fp32_dir,
    ])
    if quantize:
        subprocess.check_call([
            sys.executable,
            "/app/apps/ai/scripts/quantize_mobileclip_onnx.py",
            "--src",
            fp32_dir,
            "--out",
            onnx_dir,
        ])
        shutil.rmtree(fp32_dir, ignore_errors=True)
elif model == "clip-vit-b-32":
    from sentence_transformers import SentenceTransformer
    SentenceTransformer("clip-ViT-B-32")
elif model == "mobileclip-s2":
    import open_clip
    open_clip.create_model_and_transforms("MobileCLIP-S2", pretrained="datacompdr")
else:
    raise SystemExit(f"Unsupported SEMANTIC_MODEL={model}")
PY

# Set PYTHONPATH so absolute imports work
ENV PYTHONPATH=/app

EXPOSE 8000

# Start the FastAPI app
CMD ["uvicorn", "ai_service:app", "--host", "0.0.0.0", "--port", "8000", "--app-dir", "apps/ai"]
