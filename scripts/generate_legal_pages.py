#!/usr/bin/env python3
"""Generate shared legal pages for each practice preview."""

from __future__ import annotations

import html
import json
import sys
from pathlib import Path
from typing import Any

TEMPLATE_DIR = Path("templates")
PAGES = {
    "privacy": TEMPLATE_DIR / "privacy.html",
    "accessibility": TEMPLATE_DIR / "accessibility.html",
}


def render_template(template: str, practice: dict[str, Any]) -> str:
    values = {
        "{{ practice.name }}": html.escape(str(practice.get("name", "")), quote=True),
        "{{ practice.phone }}": html.escape(str(practice.get("phone", "")), quote=True),
        "{{ practice.email }}": html.escape(str(practice.get("email", "")), quote=True),
    }
    for placeholder, value in values.items():
        template = template.replace(placeholder, value)
    return template


def generate_for_practice(practice_dir: Path) -> None:
    config_path = practice_dir / "practice.json"
    if not config_path.exists():
        return
    config = json.loads(config_path.read_text(encoding="utf-8"))
    practice = config.get("practice") or {}
    for slug, template_path in PAGES.items():
        target_dir = practice_dir / slug
        target_dir.mkdir(parents=True, exist_ok=True)
        template = template_path.read_text(encoding="utf-8")
        (target_dir / "index.html").write_text(render_template(template, practice), encoding="utf-8")


def main() -> int:
    root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("dist")
    for practice_dir in sorted(root.iterdir()):
        if practice_dir.is_dir():
            generate_for_practice(practice_dir)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
