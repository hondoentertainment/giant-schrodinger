#!/usr/bin/env python3
"""Derive square concept plates from the exact stills in public/art/source.

The source files are the attached Grok frames, stored byte-for-byte
(JPEG data, even though the uploads used a .png name). This script only
writes public/art/plates/. It does not recompress the source files.

Usage: python3 scripts/build-concept-art.py
"""

from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public" / "art" / "source"
PLATES = ROOT / "public" / "art" / "plates"
SIZE = 1080
QUALITY = 84

# Horizontal position of the square window inside each 16:9 frame.
# 0 is flush left, 1 is flush right. Chosen so the subject stays inside
# the circular concept mask and the square fusion card.
CONCEPT_CROPS = {
    "sunday-scaries.jpg": {
        "sunday-scaries-lamp.jpg": 0.22,
        "sunday-scaries-window.jpg": 0.50,
    },
    "leftover-sparkler.jpg": {
        "leftover-sparkler-hand.jpg": 0.50,
        "leftover-sparkler-flare.jpg": 0.72,
        "leftover-sparkler-room.jpg": 0.22,
    },
    "fusion-scaries-sparkler.jpg": {
        "fusion-scaries-sparkler.jpg": 0.50,
    },
}


def square_crop(image, x_frac):
    width, height = image.size
    side = height
    max_x = width - side
    x = int(round(max_x * x_frac))
    x = max(0, min(max_x, x))
    return image.crop((x, 0, x + side, height))


def save_plate(image, path):
    plate = image.resize((SIZE, SIZE), Image.Resampling.LANCZOS)
    plate.save(path, "JPEG", quality=QUALITY, optimize=True, progressive=True)


def tight_crop(image, scale=1.22):
    """Closer still that keeps the head and crops the lower couch."""
    width, height = image.size
    side = int(min(width, height) / scale)
    left = (width - side) // 2
    top = 0
    return image.crop((left, top, left + side, top + side))


def letterbox(image):
    """Full fusion frame, centered on a darkened cover of itself."""
    background = image.resize((SIZE, SIZE), Image.Resampling.LANCZOS)
    background = background.filter(ImageFilter.GaussianBlur(radius=22))
    background = ImageEnhance.Brightness(background).enhance(0.48)
    frame_width = int(SIZE * 0.92)
    frame_height = int(round(frame_width * image.height / image.width))
    frame = image.resize((frame_width, frame_height), Image.Resampling.LANCZOS)
    background.paste(frame, ((SIZE - frame_width) // 2, (SIZE - frame_height) // 2))
    return background


def main():
    PLATES.mkdir(parents=True, exist_ok=True)
    for source_name, crops in CONCEPT_CROPS.items():
        source_path = SOURCE / source_name
        if not source_path.exists():
            raise SystemExit(f"Missing source still: {source_path}")
        with Image.open(source_path) as image:
            frame = image.convert("RGB")
            for plate_name, x_frac in crops.items():
                cropped = square_crop(frame, x_frac)
                save_plate(cropped, PLATES / plate_name)
                if plate_name == "sunday-scaries-lamp.jpg":
                    save_plate(tight_crop(cropped), PLATES / "sunday-scaries-close.jpg")
            if source_name.startswith("fusion-"):
                wide = letterbox(frame)
                wide.save(
                    PLATES / "fusion-scaries-sparkler-wide.jpg",
                    "JPEG",
                    quality=QUALITY,
                    optimize=True,
                    progressive=True,
                )
    written = sorted(path.name for path in PLATES.glob("*.jpg"))
    print(f"Wrote {len(written)} plates to {PLATES}")
    for name in written:
        path = PLATES / name
        with Image.open(path) as plate:
            print(f"  {name} {plate.size} {path.stat().st_size}")


if __name__ == "__main__":
    main()
