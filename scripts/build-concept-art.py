#!/usr/bin/env python3
"""Derive square concept plates from the Grok stills in public/art/source.

Sources are the clear stills (shadows opened once, highlights held).
This script only crops them. It does not grade the files again.
Plates are square and centered on the face, hand, or sparkler so a
circular object-cover mask keeps the subject.

Usage: python3 scripts/build-concept-art.py
"""

from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public" / "art" / "source"
PLATES = ROOT / "public" / "art" / "plates"
SIZE = 1080
QUALITY = 88

# Horizontal position of the full-height square inside each 16:9 frame.
# 0 is flush left, 1 is flush right. Chosen so the subject sits inside
# the circular mask, not in the clipped corners.
CONCEPT_CROPS = {
    "sunday-scaries.jpg": {
        "sunday-scaries-lamp.jpg": 0.28,
        "sunday-scaries-window.jpg": 0.42,
    },
    "leftover-sparkler.jpg": {
        "leftover-sparkler-hand.jpg": 0.75,
        "leftover-sparkler-flare.jpg": 0.86,
        "leftover-sparkler-room.jpg": 0.64,
    },
    "fusion-scaries-sparkler.jpg": {
        "fusion-scaries-sparkler.jpg": 0.50,
    },
}

# Tighter square, centered on the head rather than the top of the frame.
SUBJECT_CROPS = {
    "sunday-scaries-close.jpg": {
        "source": "sunday-scaries.jpg",
        "cx": 0.40,
        "cy": 0.42,
        "scale": 1.26,
    },
}


def square_crop(image, x_frac):
    width, height = image.size
    side = height
    max_x = width - side
    x = int(round(max_x * x_frac))
    x = max(0, min(max_x, x))
    return image.crop((x, 0, x + side, height))


def subject_square(image, cx_frac, cy_frac, scale):
    width, height = image.size
    side = int(round(min(width, height) / scale))
    side = max(1, min(side, width, height))
    left = int(round(width * cx_frac - side / 2))
    top = int(round(height * cy_frac - side / 2))
    left = max(0, min(width - side, left))
    top = max(0, min(height - side, top))
    return image.crop((left, top, left + side, top + side))


def save_jpeg(image, path, size=None):
    plate = image
    if size:
        plate = image.resize(size, Image.Resampling.LANCZOS)
    plate.save(path, "JPEG", quality=QUALITY, optimize=True, progressive=True)


def letterbox(image):
    """Full fusion frame on a soft cover of itself. Not a crushed vignette."""
    background = image.resize((SIZE, SIZE), Image.Resampling.LANCZOS)
    background = background.filter(ImageFilter.GaussianBlur(radius=14))
    background = ImageEnhance.Brightness(background).enhance(0.9)
    frame_width = int(SIZE * 0.94)
    frame_height = int(round(frame_width * image.height / image.width))
    frame = image.resize((frame_width, frame_height), Image.Resampling.LANCZOS)
    background.paste(frame, ((SIZE - frame_width) // 2, (SIZE - frame_height) // 2))
    return background


def load_frame(source_name, cache):
    if source_name in cache:
        return cache[source_name]
    source_path = SOURCE / source_name
    if not source_path.exists():
        raise SystemExit(f"Missing source still: {source_path}")
    with Image.open(source_path) as image:
        frame = image.convert("RGB")
    cache[source_name] = frame
    return frame


def main():
    PLATES.mkdir(parents=True, exist_ok=True)
    cache = {}
    for source_name, crops in CONCEPT_CROPS.items():
        frame = load_frame(source_name, cache)
        for plate_name, x_frac in crops.items():
            save_jpeg(square_crop(frame, x_frac), PLATES / plate_name, (SIZE, SIZE))
        if source_name.startswith("fusion-"):
            wide = letterbox(frame)
            save_jpeg(wide, PLATES / "fusion-scaries-sparkler-wide.jpg")

    for plate_name, spec in SUBJECT_CROPS.items():
        frame = load_frame(spec["source"], cache)
        cropped = subject_square(frame, spec["cx"], spec["cy"], spec["scale"])
        save_jpeg(cropped, PLATES / plate_name, (SIZE, SIZE))

    written = sorted(path.name for path in PLATES.glob("*.jpg"))
    print(f"Wrote {len(written)} plates to {PLATES}")
    for name in written:
        path = PLATES / name
        with Image.open(path) as plate:
            print(f"  {name} {plate.size} {path.stat().st_size}")


if __name__ == "__main__":
    main()
