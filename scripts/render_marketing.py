#!/usr/bin/env python3
import html
import json
import re
import shutil
import sys
from pathlib import Path


def load_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def text_from_first_h1(path):
    if not path.exists():
        return ""
    match = re.search(r"<h1\b[^>]*>(.*?)</h1>", path.read_text(encoding="utf-8"), re.DOTALL | re.IGNORECASE)
    if not match:
        return ""
    text = re.sub(r"<[^>]+>", "", match.group(1))
    return " ".join(html.unescape(text).split())


def featured_practice_name(practice_config):
    practice_name = practice_config.get("practice", {}).get("name", "")
    providers = practice_config.get("providers") or []
    if len(providers) == 1:
        provider_name = providers[0].get("name", "")
        suffix = ""
        if "," in practice_name:
            suffix = practice_name.split(",", 1)[1].strip()
        if provider_name and suffix and suffix not in provider_name:
            return f"{provider_name}, {suffix}"
    return practice_name


def main():
    if len(sys.argv) != 2:
        print("Usage: render_marketing.py <dist-dir>", file=sys.stderr)
        return 2

    dist = Path(sys.argv[1])
    config = load_json(Path("marketing/marketing.json"))
    site_id = config.get("featuredPractice")
    if not site_id:
        print("Missing marketing.featuredPractice", file=sys.stderr)
        return 1

    practice_path = Path("sites") / site_id / "practice.json"
    if not practice_path.exists():
        print(f"Unknown featured practice: {site_id}", file=sys.stderr)
        return 1

    practice_config = load_json(practice_path)
    site_url = (practice_config.get("seo") or {}).get("siteUrl", "").rstrip("/")
    hero_image = (practice_config.get("hero") or {}).get("image", "")
    if not site_url:
        print(f"Missing seo.siteUrl in {practice_path}", file=sys.stderr)
        return 1
    if not hero_image:
        print(f"Missing hero.image in {practice_path}", file=sys.stderr)
        return 1

    source_hero = (practice_path.parent / hero_image).resolve()
    if not source_hero.exists():
        print(f"Missing featured practice hero image: {source_hero}", file=sys.stderr)
        return 1

    hero_dir = dist / "assets" / "featured-practice"
    hero_dir.mkdir(parents=True, exist_ok=True)
    hero_target = hero_dir / source_hero.name
    shutil.copy2(source_hero, hero_target)

    description = text_from_first_h1(Path("marketing") / "case-studies" / site_id / "index.html")
    if not description:
        description = (practice_config.get("seo") or {}).get("description", "")

    featured = {
        "practiceName": featured_practice_name(practice_config),
        "specialty": (practice_config.get("practice") or {}).get("tagline", ""),
        "heroImage": f"./assets/featured-practice/{hero_target.name}",
        "domain": site_url,
        "description": description,
    }

    replacements = {
        "{{FEATURED_PRACTICE_URL}}": featured["domain"],
        "{{FEATURED_PRACTICE_ARIA_LABEL}}": f"View {featured['practiceName']} practice website",
        "{{FEATURED_PRACTICE_HERO_IMAGE}}": featured["heroImage"],
        "{{FEATURED_PRACTICE_NAME}}": featured["practiceName"],
        "{{FEATURED_PRACTICE_SPECIALTY}}": featured["specialty"],
        "{{FEATURED_PRACTICE_DESCRIPTION}}": featured["description"],
    }

    page = dist / "index.html"
    html_text = page.read_text(encoding="utf-8")
    for placeholder, value in replacements.items():
        html_text = html_text.replace(placeholder, html.escape(value, quote=True))
    if "{{FEATURED_PRACTICE_" in html_text:
        print("Unresolved featured practice placeholder in marketing homepage", file=sys.stderr)
        return 1
    page.write_text(html_text, encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
