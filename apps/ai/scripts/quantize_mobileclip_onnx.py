#!/usr/bin/env python3
"""Create dynamic INT8 MobileCLIP-S2 ONNX artifacts.

Run after export_mobileclip_onnx.py:
  python apps/ai/scripts/quantize_mobileclip_onnx.py

Then test with:
  SEMANTIC_MODEL=mobileclip-s2 SEMANTIC_BACKEND=onnx \
  SEMANTIC_ONNX_DIR=apps/ai/models/mobileclip-s2-int8 python ...
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from onnxruntime.quantization import QuantType, quantize_dynamic


def quantize(src: Path, dst: Path):
    if not src.exists():
        raise SystemExit(f"Missing source ONNX file: {src}")
    quantize_dynamic(
        model_input=str(src),
        model_output=str(dst),
        weight_type=QuantType.QInt8,
    )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--src", default="apps/ai/models/mobileclip-s2")
    parser.add_argument("--out", default="apps/ai/models/mobileclip-s2-int8")
    args = parser.parse_args()

    src = Path(args.src)
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)

    quantize(src / "image_encoder.onnx", out / "image_encoder.onnx")
    quantize(src / "text_encoder.onnx", out / "text_encoder.onnx")

    metadata = {
        "model": "mobileclip-s2",
        "backend": "onnx",
        "quantization": "dynamic-int8",
        "dimension": 512,
    }
    src_metadata = src / "metadata.json"
    if src_metadata.exists():
        metadata.update(json.loads(src_metadata.read_text()))
        metadata["quantization"] = "dynamic-int8"
    (out / "metadata.json").write_text(json.dumps(metadata, indent=2))
    print(f"Quantized MobileCLIP-S2 ONNX files to {out}")


if __name__ == "__main__":
    main()
