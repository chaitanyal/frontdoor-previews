#!/usr/bin/env python3
"""Create WebP copies of raster images and optionally update HTML references.

By default, this scans the repository for folders named `images`, converts JPG/JPEG/PNG
files to sibling `.webp` files, and skips SVG/WebP files. It ignores generated/vendor
folders such as `dist`, `.git`, and `node_modules`, plus retained research and archives.

Usage:
  python3 scripts/convert_images_to_webp.py
  python3 scripts/convert_images_to_webp.py --update-html
"""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image

RASTER_EXTENSIONS = {".jpg", ".jpeg", ".png"}
SKIP_DIRS = {".git", ".tmp", ".astro", ".wrangler", "dist", "node_modules", "__pycache__", "assessments", "docs"}


def should_skip(path: Path) -> bool:
    return any(part in SKIP_DIRS for part in path.parts)


def find_image_files(root: Path) -> list[Path]:
    image_files: list[Path] = []
    for images_dir in root.rglob("images"):
      if should_skip(images_dir) or not images_dir.is_dir():
          continue
      for path in images_dir.rglob("*"):
          if path.is_file() and not should_skip(path) and path.suffix.lower() in RASTER_EXTENSIONS:
              image_files.append(path)
    return sorted(image_files)


def convert_to_webp(path: Path, quality: int, force: bool) -> tuple[Path, bool]:
    output_path = path.with_suffix(".webp")
    if output_path.exists() and not force and output_path.stat().st_mtime >= path.stat().st_mtime:
        return output_path, False

    with Image.open(path) as image:
        if image.mode not in {"RGB", "RGBA"}:
            image = image.convert("RGBA" if "A" in image.getbands() else "RGB")
        image.save(output_path, "WEBP", quality=quality, method=6)

    return output_path, True


def update_html_references(root: Path, converted: dict[Path, Path]) -> int:
    replacements = 0
    relative_pairs = [
        (old.relative_to(root).as_posix(), new.relative_to(root).as_posix())
        for old, new in converted.items()
    ]

    for html_path in root.rglob("*.html"):
        if should_skip(html_path):
            continue
        original = html_path.read_text(encoding="utf-8")
        updated = original
        html_dir = html_path.parent

        for old_rel, new_rel in relative_pairs:
            old_path = root / old_rel
            new_path = root / new_rel
            old_from_html = old_path.relative_to(html_dir).as_posix() if old_path.is_relative_to(html_dir) else old_rel
            new_from_html = new_path.relative_to(html_dir).as_posix() if new_path.is_relative_to(html_dir) else new_rel

            candidates = {
                old_rel,
                f"./{old_rel}",
                old_from_html,
                f"./{old_from_html}",
            }
            for candidate in candidates:
                replacement = f"./{new_from_html}" if candidate.startswith("./") else new_from_html
                count = updated.count(candidate)
                if count:
                    updated = updated.replace(candidate, replacement)
                    replacements += count

        if updated != original:
            html_path.write_text(updated, encoding="utf-8")

    return replacements


def main() -> None:
    parser = argparse.ArgumentParser(description="Convert source raster images to WebP.")
    parser.add_argument("--root", type=Path, default=Path.cwd(), help="Repository root to scan.")
    parser.add_argument("--quality", type=int, default=82, help="WebP quality, 1-100. Default: 82.")
    parser.add_argument("--force", action="store_true", help="Regenerate WebP files even if current.")
    parser.add_argument("--update-html", action="store_true", help="Update HTML references to use generated WebP files.")
    args = parser.parse_args()

    root = args.root.resolve()
    image_files = find_image_files(root)
    converted: dict[Path, Path] = {}
    created = 0
    skipped = 0

    for image_path in image_files:
        webp_path, did_create = convert_to_webp(image_path, args.quality, args.force)
        converted[image_path] = webp_path
        if did_create:
            created += 1
            print(f"created {webp_path.relative_to(root)}")
        else:
            skipped += 1
            print(f"skipped {webp_path.relative_to(root)}")

    replacements = update_html_references(root, converted) if args.update_html else 0
    print(f"Done. Images scanned: {len(image_files)}. WebP created: {created}. Up-to-date: {skipped}. HTML replacements: {replacements}.")


if __name__ == "__main__":
    main()
