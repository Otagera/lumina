# Lumina - AI Service

This service provides the core machine learning and computer vision capabilities for Lumina. It processes images to detect faces and generate embeddings used for facial recognition and matching.

## Tech Stack

- **Framework**: [FastAPI](https://fastapi.tiangolo.com/)
- **Server**: Uvicorn
- **Language**: Python 3
- **ML/CV Libraries**: (Specified in `requirements.txt`, typically utilizing models optimized for facial detection and embedding generation).

## Features

- **Face Detection**: Identifies the bounding boxes of faces within an uploaded image.
- **Embedding Generation**: Creates high-dimensional vectors (embeddings) for each detected face, allowing the API to perform similarity searches via PostgreSQL/`pgvector`.

## Getting Started

### Prerequisites

Ensure you have Python 3 installed. It is recommended to use a virtual environment.

### Installation

1. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate
   ```
2. Install dependencies (from the root `requirements.txt` or a local one if present):
   ```bash
   pip install -r requirements.txt
   ```

### Development

To start the FastAPI server:

```bash
uvicorn ai_service:app --reload --port 8000
```

Alternatively, from the root of the monorepo:

```bash
bun run dev:ai
```

The service typically runs on port `8000` and is called internally by the main Elysia API.

## Semantic embedding model rollout

The `/embed` endpoint is feature-flagged by environment variables:

- `SEMANTIC_MODEL=clip-vit-b-32` (default, legacy `sentence-transformers` path)
- `SEMANTIC_MODEL=mobileclip-s2` with `SEMANTIC_BACKEND=torch` (Phase 1 rollout)
- `SEMANTIC_MODEL=mobileclip-s2` with `SEMANTIC_BACKEND=onnx` (Phase 2 runtime)

Both models return 512-dimensional embeddings for the existing
`images.embedding vector(512)` column. Do not mix query embeddings and stored
image embeddings across model families: the API now tags generated vectors with
`model`, and semantic search filters `images.embedding_model` to match.

To test MobileCLIP locally:

```bash
python3 -m pip install open_clip_torch timm
SEMANTIC_MODEL=mobileclip-s2 uvicorn ai_service:app --reload --port 8000
```

### Docker deployment builds

Docker now prepares the selected semantic backend during image build. No manual
post-build export/quantize step is needed for deployments.

MobileCLIP torch backend:

```bash
docker build \
  --build-arg SEMANTIC_MODEL=mobileclip-s2 \
  --build-arg SEMANTIC_BACKEND=torch \
  -f apps/ai/Dockerfile .
```

MobileCLIP ONNX FP32 backend (exports ONNX into the image):

```bash
docker build \
  --build-arg SEMANTIC_MODEL=mobileclip-s2 \
  --build-arg SEMANTIC_BACKEND=onnx \
  -f apps/ai/Dockerfile .
```

MobileCLIP ONNX dynamic INT8 backend (exports + quantizes into the image):

```bash
docker build \
  --build-arg SEMANTIC_MODEL=mobileclip-s2 \
  --build-arg SEMANTIC_BACKEND=onnx \
  --build-arg SEMANTIC_ONNX_QUANTIZE=true \
  -f apps/ai/Dockerfile .
```

The Dockerfile bakes runtime artifacts into
`/app/apps/ai/models/mobileclip-s2-runtime` and sets `SEMANTIC_ONNX_DIR` to that
directory.

### Local ONNX backend

Export MobileCLIP-S2 ONNX artifacts:

```bash
python apps/ai/scripts/export_mobileclip_onnx.py
```

Run the AI service with ONNX Runtime:

```bash
SEMANTIC_MODEL=mobileclip-s2 \
SEMANTIC_BACKEND=onnx \
SEMANTIC_ONNX_DIR=apps/ai/models/mobileclip-s2 \
uvicorn ai_service:app --reload --port 8000 --app-dir apps/ai
```

### Local INT8 quantization

Create dynamic INT8 ONNX artifacts:

```bash
python apps/ai/scripts/quantize_mobileclip_onnx.py
```

Then point the ONNX runtime at the INT8 directory:

```bash
SEMANTIC_MODEL=mobileclip-s2 \
SEMANTIC_BACKEND=onnx \
SEMANTIC_ONNX_DIR=apps/ai/models/mobileclip-s2-int8 \
uvicorn ai_service:app --reload --port 8000 --app-dir apps/ai
```

After applying the `images.embedding_model` migration, backfill semantic-enabled
albums before switching search traffic to MobileCLIP:

```bash
# dry-run
bun apps/worker/src/scripts/backfillSemanticEmbeddings.ts --model mobileclip-s2

# enqueue jobs
SEMANTIC_MODEL=mobileclip-s2 bun apps/worker/src/scripts/backfillSemanticEmbeddings.ts --enqueue
```
