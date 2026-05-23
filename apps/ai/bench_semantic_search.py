"""
Semantic search optimization bench.

Compares the current `clip-ViT-B-32` (sentence-transformers, torch backend)
against lighter alternatives (MobileCLIP-S0/S2 via open_clip) on:
  - cold-start time (first model load)
  - image encode latency (p50, p95)
  - text encode latency (p50, p95)
  - peak resident memory delta
  - embedding dimension (must remain 512 to fit `images.embedding vector(512)`)

Usage:
  python apps/ai/bench_semantic_search.py --images path/to/sample/dir [--runs 20]

Notes:
  - Models that aren't installed are SKIPPED with a print, not a hard fail.
  - Install candidates ad-hoc:
        pip install open_clip_torch timm        # MobileCLIP, SigLIP via open_clip
        pip install modern-onnx-clip            # pure-onnx CLIP path
"""

import argparse
import gc
import os
import statistics
import time
from typing import Callable, Optional

from PIL import Image

try:
    import psutil  # type: ignore
except ImportError:  # pragma: no cover - bench-only dependency
    psutil = None

SAMPLE_TEXTS = [
    "a wedding photo at sunset",
    "a group of friends smiling at the camera",
    "a child blowing out birthday candles",
    "two people dancing on a dance floor",
    "a bride holding a bouquet",
]


def _rss_mb() -> float:
    if psutil is None:
        return 0.0
    return psutil.Process(os.getpid()).memory_info().rss / (1024 * 1024)


def _percentiles(samples: list[float]) -> dict[str, float]:
    if not samples:
        return {"p50_ms": 0.0, "p95_ms": 0.0, "mean_ms": 0.0}
    s = sorted(samples)
    p95 = s[max(0, int(0.95 * len(s)) - 1)]
    return {
        "p50_ms": round(statistics.median(s) * 1000, 2),
        "p95_ms": round(p95 * 1000, 2),
        "mean_ms": round(statistics.mean(s) * 1000, 2),
    }


def _bench(name: str, load: Callable, encode_image, encode_text, images: list[Image.Image], runs: int):
    print(f"\n=== {name} ===")
    rss_before = _rss_mb()
    t0 = time.perf_counter()
    try:
        ctx = load()
    except Exception as e:
        print(f"  SKIPPED — load failed: {e}")
        return None
    cold_ms = (time.perf_counter() - t0) * 1000
    rss_after_load = _rss_mb()

    # Warm up once
    try:
        _ = encode_image(ctx, images[0])
        _ = encode_text(ctx, SAMPLE_TEXTS[0])
    except Exception as e:
        print(f"  SKIPPED — warmup failed: {e}")
        return None

    img_samples, txt_samples = [], []
    for i in range(runs):
        img = images[i % len(images)]
        t = time.perf_counter(); _ = encode_image(ctx, img); img_samples.append(time.perf_counter() - t)
        txt = SAMPLE_TEXTS[i % len(SAMPLE_TEXTS)]
        t = time.perf_counter(); emb = encode_text(ctx, txt); txt_samples.append(time.perf_counter() - t)

    dim = int(emb.shape[-1]) if hasattr(emb, "shape") else len(emb)
    result = {
        "model": name, "cold_load_ms": round(cold_ms, 1),
        "rss_load_delta_mb": round(rss_after_load - rss_before, 1),
        "rss_total_mb": round(rss_after_load, 1),
        "embedding_dim": dim, "image": _percentiles(img_samples), "text": _percentiles(txt_samples),
    }
    print(f"  cold_load_ms={result['cold_load_ms']} rss_delta_mb={result['rss_load_delta_mb']} dim={dim}")
    print(f"  image: {result['image']}")
    print(f"  text:  {result['text']}")
    del ctx; gc.collect()
    return result


def bench_sentence_transformers_clip_b32(images, runs):
    def load():
        from sentence_transformers import SentenceTransformer
        return SentenceTransformer("clip-ViT-B-32")
    return _bench("clip-ViT-B-32 (sentence-transformers, baseline)", load,
                  encode_image=lambda m, img: m.encode(img),
                  encode_text=lambda m, txt: m.encode(txt), images=images, runs=runs)


def bench_open_clip(images, runs, variant: str, pretrained: str):
    def load():
        import open_clip, torch
        model, _, preprocess = open_clip.create_model_and_transforms(variant, pretrained=pretrained)
        model.eval()
        try:
            from mobileclip.modules.common.mobileone import reparameterize_model  # type: ignore
            model = reparameterize_model(model)
        except Exception:
            pass
        tokenizer = open_clip.get_tokenizer(variant)
        return (model, preprocess, tokenizer, torch)

    def enc_img(ctx, img):
        model, preprocess, _, torch = ctx
        with torch.no_grad():
            return model.encode_image(preprocess(img).unsqueeze(0)).squeeze(0).cpu().numpy()

    def enc_txt(ctx, text):
        model, _, tokenizer, torch = ctx
        with torch.no_grad():
            return model.encode_text(tokenizer([text])).squeeze(0).cpu().numpy()

    return _bench(f"open_clip:{variant} ({pretrained})", load, enc_img, enc_txt, images, runs)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--images", required=True, help="Directory of sample .jpg/.png images")
    ap.add_argument("--runs", type=int, default=20)
    args = ap.parse_args()

    files = sorted([p for p in os.listdir(args.images) if p.lower().endswith((".jpg", ".jpeg", ".png"))])[:10]
    if not files:
        raise SystemExit(f"No images found in {args.images}")
    images = [Image.open(os.path.join(args.images, f)).convert("RGB") for f in files]
    print(f"Loaded {len(images)} sample images, {args.runs} runs per model.")

    results = []
    for r in (
        bench_sentence_transformers_clip_b32(images, args.runs),
        bench_open_clip(images, args.runs, "MobileCLIP-S0", "datacompdr"),
        bench_open_clip(images, args.runs, "MobileCLIP-S2", "datacompdr"),
    ):
        if r is not None:
            results.append(r)

    import json
    print("\n=== JSON SUMMARY ===")
    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
