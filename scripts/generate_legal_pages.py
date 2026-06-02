#!/usr/bin/env python3
"""Generate shared legal pages for each practice preview."""

from __future__ import annotations

import html
import json
import os
import sys
from pathlib import Path
from typing import Any

TEMPLATE_DIR = Path("templates")
PAGES = {
    "privacy": TEMPLATE_DIR / "privacy.html",
    "accessibility": TEMPLATE_DIR / "accessibility.html",
}


def normalized_site_url(config: dict[str, Any]) -> str:
    return str((config.get("seo") or {}).get("siteUrl") or "").rstrip("/")


def canonical_url(config: dict[str, Any], page_path: str) -> str:
    site_url = normalized_site_url(config)
    if not site_url:
        return ""
    return f"{site_url}/{page_path.strip('/')}/"


def robots_meta(config: dict[str, Any]) -> str:
    if os.environ.get("FRONTDOOR_BUILD_ENV") != "production":
        return '<meta name="robots" content="noindex,nofollow" />'
    if (config.get("seo") or {}).get("allowIndexing") is True:
        return ""
    return '<meta name="robots" content="noindex,nofollow" />'


def render_template(template: str, config: dict[str, Any], slug: str) -> str:
    practice = config.get("practice") or {}
    canonical = canonical_url(config, slug)
    canonical_link = f'<link rel="canonical" href="{html.escape(canonical, quote=True)}" />' if canonical else ""
    values = {
        "{{ practice.name }}": html.escape(str(practice.get("name", "")), quote=True),
        "{{ practice.phone }}": html.escape(str(practice.get("phone", "")), quote=True),
        "{{ practice.email }}": html.escape(str(practice.get("email", "")), quote=True),
    }
    for placeholder, value in values.items():
        template = template.replace(placeholder, value)
    template = template.replace('  <meta name="robots" content="noindex, nofollow" />\n', f"  {robots_meta(config)}\n" if robots_meta(config) else "")
    template = template.replace('  <link rel="stylesheet"', f"  {canonical_link}\n  <link rel=\"stylesheet\"" if canonical_link else '  <link rel="stylesheet"')
    return template


def generate_for_practice(practice_dir: Path) -> None:
    config_path = practice_dir / "practice.json"
    if not config_path.exists():
        return
    config = json.loads(config_path.read_text(encoding="utf-8"))
    for slug, template_path in PAGES.items():
        target_dir = practice_dir / slug
        target_dir.mkdir(parents=True, exist_ok=True)
        template = template_path.read_text(encoding="utf-8")
        (target_dir / "index.html").write_text(render_template(template, config, slug), encoding="utf-8")


def main() -> int:
    root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("dist")
    if (root / "practice.json").exists():
        generate_for_practice(root)
        return 0
    for practice_dir in sorted(root.iterdir()):
        if practice_dir.is_dir():
            generate_for_practice(practice_dir)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
