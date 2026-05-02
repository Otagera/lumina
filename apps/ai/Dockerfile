FROM python:3.11-slim

WORKDIR /app

# Install system dependencies required for OpenCV and InsightFace
RUN apt-get update && apt-get install -y \
    curl \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
# We assume the context is the root of the project to allow accessing requirements.txt
COPY requirements.txt .
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements.txt

# Copy the AI service code
COPY apps/ai /app/apps/ai

# Set PYTHONPATH so absolute imports work
ENV PYTHONPATH=/app

EXPOSE 8000

# Start the FastAPI app
CMD ["uvicorn", "ai_service:app", "--host", "0.0.0.0", "--port", "8000", "--app-dir", "apps/ai"]
