#!/usr/bin/env python3
"""Create web-sized WebP copies for sale item photos."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageOps

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png"}


def optimized_path(source: Path, output_dir: Path) -> Path:
    return output_dir / f"{source.stem}.webp"


def should_convert(source: Path, target: Path, force: bool) -> bool:
    if force or not target.exists():
        return True
    return source.stat().st_mtime > target.stat().st_mtime


def convert_image(source: Path, target: Path, max_size: int, quality: int) -> None:
    image = Image.open(source)
    image = ImageOps.exif_transpose(image)
    image.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
    if image.mode not in ("RGB", "L"):
        image = image.convert("RGB")
    target.parent.mkdir(parents=True, exist_ok=True)
    image.save(target, "WEBP", quality=quality, method=6)


def iter_source_images(images_dir: Path):
    for path in sorted(images_dir.iterdir()):
        if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS and not path.name.startswith("."):
            yield path


def main() -> int:
    parser = argparse.ArgumentParser(description="Optimize item photos into images/web/*.webp")
    parser.add_argument("--images-dir", type=Path, default=Path("images"), help="Folder with original item photos")
    parser.add_argument("--output-dir", type=Path, default=Path("images/web"), help="Folder for optimized WebP files")
    parser.add_argument("--max-size", type=int, default=1600, help="Maximum width/height in pixels")
    parser.add_argument("--quality", type=int, default=82, help="WebP quality, 1-100")
    parser.add_argument("--force", action="store_true", help="Regenerate existing optimized images")
    args = parser.parse_args()

    if not args.images_dir.exists():
        raise SystemExit(f"Images folder not found: {args.images_dir}")

    converted = 0
    skipped = 0
    for source in iter_source_images(args.images_dir):
        target = optimized_path(source, args.output_dir)
        if should_convert(source, target, args.force):
            convert_image(source, target, args.max_size, args.quality)
            converted += 1
            print(f"converted {source} -> {target} ({target.stat().st_size / 1024:.0f} KB)")
        else:
            skipped += 1
            print(f"skipped   {source} -> {target}")

    print(f"Done. Converted {converted}, skipped {skipped}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
