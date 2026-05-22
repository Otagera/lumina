#!/usr/bin/env python3
"""Export MobileCLIP-S2 image/text encoders to ONNX.

Run from repo root after installing requirements:
  python apps/ai/scripts/export_mobileclip_onnx.py

Outputs:
  apps/ai/models/mobileclip-s2/image_encoder.onnx
  apps/ai/models/mobileclip-s2/text_encoder.onnx
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import torch
import open_clip


class ImageEncoder(torch.nn.Module):
    def __init__(self, model):
        super().__init__()
        self.model = model

    def forward(self, image):
        features = self.model.encode_image(image)
        return features / features.norm(dim=-1, keepdim=True)


class TextEncoder(torch.nn.Module):
    def __init__(self, model):
        super().__init__()
        self.model = model

    def forward(self, text):
        features = self.model.encode_text(text)
        return features / features.norm(dim=-1, keepdim=True)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", default="apps/ai/models/mobileclip-s2")
    parser.add_argument("--opset", type=int, default=17)
    args = parser.parse_args()

    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)

    model, _, _ = open_clip.create_model_and_transforms(
        "MobileCLIP-S2",
        pretrained="datacompdr",
    )
    try:
        from mobileclip.modules.common.mobileone import reparameterize_model
        model = reparameterize_model(model)
    except Exception:
        pass
    model.eval()

    image = torch.randn(1, 3, 224, 224, dtype=torch.float32)
    text = torch.zeros(1, 77, dtype=torch.int64)

    torch.onnx.export(
        ImageEncoder(model),
        image,
        out / "image_encoder.onnx",
        input_names=["image"],
        output_names=["embedding"],
        dynamic_axes={"image": {0: "batch"}, "embedding": {0: "batch"}},
        opset_version=args.opset,
    )
    torch.onnx.export(
        TextEncoder(model),
        text,
        out / "text_encoder.onnx",
        input_names=["text"],
        output_names=["embedding"],
        dynamic_axes={"text": {0: "batch"}, "embedding": {0: "batch"}},
        opset_version=args.opset,
    )

    (out / "metadata.json").write_text(
        json.dumps(
            {
                "model": "mobileclip-s2",
                "backend": "onnx",
                "dimension": 512,
                "image_size": 224,
                "context_length": 77,
                "opset": args.opset,
            },
            indent=2,
        )
    )
    print(f"Exported MobileCLIP-S2 ONNX files to {out}")


if __name__ == "__main__":
    main()
