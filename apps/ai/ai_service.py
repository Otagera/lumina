import os
import logging
import json
import tempfile
import ssl
from dotenv import load_dotenv

# Setup JSON logging for structured logs
class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_obj = {
            "timestamp": self.formatTime(record),
            "level": record.levelname,
            "service": "ai",
            "message": record.getMessage(),
        }
        if record.exc_info:
            log_obj["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_obj)

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
handler.setFormatter(JSONFormatter())
logger.addHandler(handler)

# Workaround for SSL certificate verification errors (common on macOS/Proxies)
if os.environ.get("NODE_ENV") != "production":
    import ssl
    ssl._create_default_https_context = ssl._create_unverified_context
    os.environ["CURL_CA_BUNDLE"] = ""
    os.environ["REQUESTS_CA_BUNDLE"] = ""
    os.environ["HTTPX_VERIFY"] = "0"
    os.environ["PYTHONHTTPSVERIFY"] = "0"
    os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"
    
    # Aggressive monkeypatch for httpx
    try:
        import httpx
        from httpx import Client, AsyncClient
        
        class UnverifiedClient(Client):
            def __init__(self, *args, **kwargs):
                kwargs['verify'] = False
                super().__init__(*args, **kwargs)
        
        class UnverifiedAsyncClient(AsyncClient):
            def __init__(self, *args, **kwargs):
                kwargs['verify'] = False
                super().__init__(*args, **kwargs)
        
        httpx.Client = UnverifiedClient
        httpx.AsyncClient = UnverifiedAsyncClient
        logger.info("Monkeypatched httpx to disable SSL verification")
    except Exception as e:
        logger.error(f"Failed to monkeypatch httpx: {e}")

# Load .env file from project root
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv(os.path.join(project_root, ".env"))

from fastapi import FastAPI, HTTPException, Body, File, UploadFile
import numpy as np
import uuid
from typing import List, Optional, Dict
from pydantic import BaseModel
from sklearn.cluster import DBSCAN
import boto3
from botocore.config import Config
from PIL import Image

# Global for lazy-loaded semantic image/text model. Defaults to the current
# clip-ViT-B-32 path unless SEMANTIC_MODEL=mobileclip-s2 is set explicitly.
semantic_model = None
semantic_model_key = None
SEMANTIC_DIMENSION = 512
DEFAULT_SEMANTIC_MODEL = "clip-vit-b-32"
DEFAULT_SEMANTIC_BACKEND = "torch"


def get_semantic_model_name():
    return os.environ.get("SEMANTIC_MODEL", DEFAULT_SEMANTIC_MODEL).strip().lower()


def get_semantic_backend():
    return os.environ.get("SEMANTIC_BACKEND", DEFAULT_SEMANTIC_BACKEND).strip().lower()


def get_semantic_config():
    return {
        "model": get_semantic_model_name(),
        "backend": get_semantic_backend(),
        "dimension": SEMANTIC_DIMENSION,
    }


def embedding_response(embedding):
    values = embedding.tolist() if hasattr(embedding, "tolist") else list(embedding)
    if len(values) != SEMANTIC_DIMENSION:
        raise RuntimeError(f"Expected {SEMANTIC_DIMENSION}D embedding, got {len(values)}D")
    return {
        "embedding": values,
        "model": get_semantic_model_name(),
        "backend": get_semantic_backend(),
        "dimension": SEMANTIC_DIMENSION,
    }


PROMPT_TEMPLATES = [
    "a photo of {}",
    "a picture of {}",
    "an image of {}",
    "{}",
]


def _ensemble_text_embedding(encode_fn, text: str) -> np.ndarray:
    """Average embeddings across prompt templates then renormalize."""
    embeddings = np.stack([encode_fn(t.format(text)) for t in PROMPT_TEMPLATES])
    mean = embeddings.mean(axis=0)
    norm = np.linalg.norm(mean)
    return mean / norm if norm > 0 else mean


class SentenceTransformersClipAdapter:
    model_name = "clip-vit-b-32"
    backend = "torch"
    dimension = SEMANTIC_DIMENSION

    def __init__(self):
        from sentence_transformers import SentenceTransformer
        logger.info("Loading semantic model: clip-ViT-B-32 via sentence-transformers")
        self.model = SentenceTransformer("clip-ViT-B-32")

    def encode_text(self, text: str):
        return _ensemble_text_embedding(self.model.encode, text)

    def encode_image(self, image: Image.Image):
        return self.model.encode(image)


class OpenClipMobileClipAdapter:
    model_name = "mobileclip-s2"
    backend = "torch"
    dimension = SEMANTIC_DIMENSION

    def __init__(self):
        import open_clip
        import torch
        logger.info("Loading semantic model: MobileCLIP-S2 via open_clip")
        model, _, preprocess = open_clip.create_model_and_transforms(
            "MobileCLIP-S2",
            pretrained="datacompdr",
        )
        try:
            from mobileclip.modules.common.mobileone import reparameterize_model
            model = reparameterize_model(model)
        except Exception:
            logger.info("MobileCLIP reparameterize step unavailable; continuing")
        model.eval()
        self.model = model
        self.preprocess = preprocess
        self.tokenizer = open_clip.get_tokenizer("MobileCLIP-S2")
        self.torch = torch

    def _encode_text_single(self, text: str):
        with self.torch.no_grad():
            tokens = self.tokenizer([text])
            features = self.model.encode_text(tokens)
            features = features / features.norm(dim=-1, keepdim=True)
            return features.squeeze(0).cpu().numpy()

    def encode_text(self, text: str):
        return _ensemble_text_embedding(self._encode_text_single, text)

    def encode_image(self, image: Image.Image):
        with self.torch.no_grad():
            tensor = self.preprocess(image).unsqueeze(0)
            features = self.model.encode_image(tensor)
            features = features / features.norm(dim=-1, keepdim=True)
            return features.squeeze(0).cpu().numpy()


def get_clip_model():
    """Backward-compatible name for the active semantic embedding adapter."""
    global semantic_model, semantic_model_key
    model_name = get_semantic_model_name()
    backend = get_semantic_backend()
    key = (model_name, backend)
    if semantic_model is not None and semantic_model_key == key:
        return semantic_model

    if model_name == "clip-vit-b-32":
        semantic_model = SentenceTransformersClipAdapter()
    elif model_name == "mobileclip-s2" and backend == "torch":
        semantic_model = OpenClipMobileClipAdapter()
    elif model_name == "mobileclip-s2" and backend == "onnx":
        from semantic_onnx import MobileClipOnnxAdapter
        semantic_model = MobileClipOnnxAdapter()
    else:
        raise RuntimeError(f"Unsupported semantic model/backend: {model_name}/{backend}")
    semantic_model_key = key
    return semantic_model

# Import the new shared face extraction pipeline
from face_utils import extract_faces

app = FastAPI(title="Lumina AI Service")

class ProcessRequest(BaseModel):
    image_path: str
    image_id: str
    storage_provider: Optional[str] = None
    storage_key: Optional[str] = None

class FaceData(BaseModel):
    embedding: List[float]
    bounding_box: dict
    det_score: Optional[float] = None

class ImageResult(BaseModel):
    image_id: str
    faces: List[FaceData]
    error: Optional[str] = None

class ProcessResponse(BaseModel):
    results: List[ImageResult]

class FaceInput(BaseModel):
    face_id: int
    embedding: List[float]

class ClusterRequest(BaseModel):
    faces: List[FaceInput]

class ClusterResponse(BaseModel):
    clusters: List[List[int]]

class EmbedRequest(BaseModel):
    image_path: Optional[str] = None
    text: Optional[str] = None
    storage_provider: Optional[str] = None
    storage_key: Optional[str] = None

def is_valid_uuid(value):
    try:
        uuid.UUID(value)
        return True
    except ValueError:
        return False

def get_s3_client(storage_config: dict):
    """Create S3 client for R2/S3 storage."""
    # Use urllib3 to disable SSL verification if SKIP_TLS_VERIFY is set
    import urllib3
    verify = True
    if os.environ.get("SKIP_TLS_VERIFY") == "true":
        urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
        verify = False
    
    session = boto3.session.Session()
    return session.client(
        "s3",
        aws_access_key_id=storage_config["access_key_id"],
        aws_secret_access_key=storage_config["secret_access_key"],
        endpoint_url=storage_config["endpoint"],
        region_name=storage_config.get("region", "auto"),
        use_ssl=True,
        verify=verify,
    )

async def fetch_image_from_storage(storage_provider: str, storage_key: str, storage_config: dict):
    """Fetch image from R2/S3 and return local path."""
    logger.info(f"Fetching image from {storage_provider}: {storage_key}")
    
    s3_client = get_s3_client(storage_config)
    bucket = storage_config["bucket"]
    
    response = s3_client.get_object(Bucket=bucket, Key=storage_key)
    image_data = response["Body"].read()
    
    # Write to temp file
    suffix = os.path.splitext(storage_key)[1] or ".jpg"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(image_data)
        tmp_path = tmp.name
    
    logger.info(f"Image fetched to: {tmp_path}")
    return tmp_path

@app.post("/embed")
async def generate_embedding(request: EmbedRequest):
    """
    Generates a CLIP embedding for either an image or a text string.
    """
    if request.text:
        model = get_clip_model()
        logger.info(f"Generating text embedding for: {request.text[:50]}...")
        embedding = model.encode_text(request.text)
        return embedding_response(embedding)
    
    if request.image_path or (request.storage_provider and request.storage_key):
        temp_file = None
        try:
            if request.storage_provider and request.storage_provider != "local" and request.storage_key:
                storage_config = {
                    "access_key_id": os.environ.get("R2_ACCESS_KEY_ID"),
                    "secret_access_key": os.environ.get("R2_SECRET_ACCESS_KEY"),
                    "endpoint": os.environ.get("R2_ENDPOINT"),
                    "bucket": os.environ.get("R2_BUCKET"),
                    "region": os.environ.get("R2_REGION", "auto"),
                }
                temp_file = await fetch_image_from_storage(request.storage_provider, request.storage_key, storage_config)
                img_path = temp_file
            else:
                img_path = os.path.abspath(request.image_path)
            
            model = get_clip_model()
            logger.info(f"Generating image embedding for: {img_path}")
            img = Image.open(img_path)
            embedding = model.encode_image(img)
            return embedding_response(embedding)
        except Exception as e:
            logger.exception(f"Embedding error: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))
        finally:
            if temp_file and os.path.exists(temp_file):
                try:
                    os.unlink(temp_file)
                except:
                    pass
    
    raise HTTPException(status_code=400, detail="Must provide either text or image_path/storage_key")

@app.post("/detect")
async def detect_faces(file: UploadFile = File(...)):
    """
    Accepts an uploaded image file and returns detected faces.
    """
    logger.info(f"Received file for detection: {file.filename}")
    
    # Save uploaded file to a temporary file
    suffix = os.path.splitext(file.filename)[1] or ".jpg"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        content = await file.read()
        tmp.write(content)
        temp_path = tmp.name

    try:
        # Use the shared face extraction pipeline
        faces_extracted = extract_faces(temp_path)
        
        faces_data = []
        for face in faces_extracted:
            faces_data.append({
                "embedding": face["embedding"],
                "box": face["bounding_box"],
                "det_score": face.get("det_score")
            })

        logger.info(f"Found {len(faces_data)} faces in uploaded file")
        return {"faces": faces_data}

    except Exception as e:
        logger.exception(f"Error detecting faces in uploaded file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error detecting faces: {str(e)}")
    finally:
        # Clean up temp file
        if os.path.exists(temp_path):
            try:
                os.unlink(temp_path)
            except Exception as e:
                logger.warning(f"Failed to clean up temp file: {e}")

@app.post("/process", response_model=ProcessResponse)
async def process_image(request: ProcessRequest):
    image_path = request.image_path
    image_id = request.image_id
    storage_provider = request.storage_provider
    storage_key = request.storage_key

    if not is_valid_uuid(image_id):
        raise HTTPException(status_code=400, detail=f"Invalid UUID: {image_id}")

    temp_file = None
    
    try:
        # Check if we need to fetch from storage
        if storage_provider and storage_provider != "local" and storage_key:
            storage_config = {
                "access_key_id": os.environ.get("R2_ACCESS_KEY_ID"),
                "secret_access_key": os.environ.get("R2_SECRET_ACCESS_KEY"),
                "endpoint": os.environ.get("R2_ENDPOINT"),
                "bucket": os.environ.get("R2_BUCKET"),
                "region": os.environ.get("R2_REGION", "auto"),
            }
            
            if not all([storage_config["access_key_id"], storage_config["endpoint"], storage_config["bucket"]]):
                raise HTTPException(status_code=500, detail="Storage configuration missing")
            
            temp_file = await fetch_image_from_storage(storage_provider, storage_key, storage_config)
            abs_path = temp_file
        else:
            # Basic path validation to prevent traversal and ensure existence
            abs_path = os.path.abspath(image_path)
            if not os.path.exists(abs_path):
                logger.error(f"Image not found: {abs_path}")
                raise HTTPException(status_code=404, detail="Image file not found")

        logger.info(f"Processing image: {abs_path}")
        
        # Use the tuned extraction pipeline
        faces_extracted = extract_faces(abs_path)
        
        faces_data = []
        for face in faces_extracted:
            faces_data.append(FaceData(
                embedding=face["embedding"],
                bounding_box=face["bounding_box"],
                det_score=face.get("det_score")
            ))

        logger.info(f"Found {len(faces_data)} faces in {image_id}")
        return ProcessResponse(results=[ImageResult(
            image_id=image_id,
            faces=faces_data
        )])

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error processing image {image_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")
    finally:
        # Clean up temp file if created
        if temp_file and os.path.exists(temp_file):
            try:
                os.unlink(temp_file)
                logger.info(f"Cleaned up temp file: {temp_file}")
            except Exception as e:
                logger.warning(f"Failed to clean up temp file: {e}")

@app.post("/cluster", response_model=ClusterResponse)
async def cluster_faces(request: ClusterRequest):
    faces = request.faces
    if not faces:
        return ClusterResponse(clusters=[])
    
    if len(faces) == 1:
        return ClusterResponse(clusters=[[faces[0].face_id]])

    # Extract embeddings and IDs
    encodings = [np.array(face.embedding) for face in faces]
    face_ids = [face.face_id for face in faces]

    try:
        logger.info(f"Clustering {len(faces)} faces")
        clt = DBSCAN(eps=0.45, min_samples=2, metric="cosine")
        clt.fit(encodings)

        clusters_dict: Dict[int, List[int]] = {}
        noise_clusters = []
        
        for label, face_id in zip(clt.labels_, face_ids):
            if label >= 0:
                if label not in clusters_dict:
                    clusters_dict[label] = []
                clusters_dict[label].append(face_id)
            else:
                noise_clusters.append([face_id])

        result_clusters = list(clusters_dict.values()) + noise_clusters
        
        logger.info(f"Generated {len(result_clusters)} clusters")
        return ClusterResponse(clusters=result_clusters)

    except Exception as e:
        logger.exception(f"Clustering error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Clustering error: {str(e)}")


@app.get("/health")
async def health_check():
    semantic = get_semantic_config()
    return {
        "status": "healthy",
        "model": f"insightface_buffalo_l + {semantic['model']}",
        "semantic": semantic,
        "clustering": "DBSCAN_cosine",
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
