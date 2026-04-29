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
