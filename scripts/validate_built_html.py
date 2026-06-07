#!/usr/bin/env python3
"""Validate built static HTML for basic structure and SEO smoke checks."""

from __future__ import annotations

import argparse
import json
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse

VOID_TAGS = {
    "area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta",
    "param", "source", "track", "wbr",
}

ALLOWED_LINK_SCHEMES = {"http", "https", "mailto", "tel"}
SKIP_ASSET_SCHEMES = {*ALLOWED_LINK_SCHEMES, "data"}
ALLOWED_ROOT_ASSETS = {"/shared/analytics.js"}


class BuiltHtmlParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=False)
        self.stack: list[tuple[str, int]] = []
        self.errors: list[str] = []
        self.ids: dict[str, int] = {}
        self.title_count = 0
        self.h1_count = 0
        self.meta_description = False
        self.assets: list[tuple[str, int, str]] = []
        self.json_ld_blocks: list[tuple[str, int]] = []
        self.classes: list[tuple[str, int]] = []
        self._in_title = False
        self._script_type = ""
        self._script_data: list[str] = []
        self._script_line = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attrs_dict = dict(attrs)
        line = self.getpos()[0]
        if tag == "title":
            self.title_count += 1
            self._in_title = True
        if tag == "h1":
            self.h1_count += 1
        if tag == "meta" and attrs_dict.get("name") == "description" and attrs_dict.get("content"):
            self.meta_description = True
        if attrs_dict.get("class"):
            for class_name in (attrs_dict.get("class") or "").split():
                self.classes.append((class_name, line))
        if "id" in attrs_dict and attrs_dict["id"]:
            element_id = attrs_dict["id"] or ""
            if element_id in self.ids:
                self.errors.append(f"line {line}: duplicate id '{element_id}' first seen on line {self.ids[element_id]}")
            else:
                self.ids[element_id] = line
        for attr in ("src", "href", "poster"):
            value = attrs_dict.get(attr)
            if value:
                self.assets.append((value, line, attr))
        if tag == "script":
            self._script_type = attrs_dict.get("type") or ""
            self._script_data = []
            self._script_line = line
        if tag not in VOID_TAGS:
            self.stack.append((tag, line))

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self.handle_starttag(tag, attrs)
        if tag not in VOID_TAGS:
            self.handle_endtag(tag)

    def handle_endtag(self, tag: str) -> None:
        line = self.getpos()[0]
        if tag == "title":
            self._in_title = False
        if tag == "script":
            if self._script_type == "application/ld+json":
                self.json_ld_blocks.append(("".join(self._script_data).strip(), self._script_line))
            self._script_type = ""
            self._script_data = []
        if tag in VOID_TAGS:
            return
        if not self.stack:
            self.errors.append(f"line {line}: unexpected closing </{tag}>")
            return
        open_tag, open_line = self.stack.pop()
        if open_tag != tag:
            self.errors.append(f"line {line}: closing </{tag}> does not match <{open_tag}> opened on line {open_line}")

    def handle_data(self, data: str) -> None:
        if self._script_type == "application/ld+json":
            self._script_data.append(data)

    def close(self) -> None:
        super().close()
        for tag, line in reversed(self.stack):
            self.errors.append(f"line {line}: unclosed <{tag}>")


def is_local_asset(value: str) -> bool:
    parsed = urlparse(value)
    if parsed.scheme in SKIP_ASSET_SCHEMES:
        return False
    if value.startswith("#") or value == "":
        return False
    return True


def validate_link_scheme(value: str, line: int, attr: str) -> str | None:
    parsed = urlparse(value)
    if not parsed.scheme:
        return None
    if attr == "href" and parsed.scheme in ALLOWED_LINK_SCHEMES:
        return None
    if attr != "href" and parsed.scheme in {"http", "https", "data"}:
        return None
    return f"line {line}: unsupported {attr} scheme is not allowed: {value}"


def asset_target(page: Path, value: str) -> Path | None:
    parsed = urlparse(value)
    clean = parsed.path
    if not clean:
        return None
    return (page.parent / clean).resolve()


def validate_page(path: Path, root: Path) -> list[str]:
    parser = BuiltHtmlParser()
    try:
        parser.feed(path.read_text(encoding="utf-8"))
        parser.close()
    except Exception as error:  # HTMLParser can raise on malformed declarations.
        return [f"{path}: parse error: {error}"]

    errors = [f"{path}: {error}" for error in parser.errors]
    if parser.title_count != 1:
        errors.append(f"{path}: expected exactly one <title>, found {parser.title_count}")
    if not parser.meta_description:
        errors.append(f"{path}: missing meta description")
    if parser.h1_count != 1:
        errors.append(f"{path}: expected exactly one <h1>, found {parser.h1_count}")

    for value, line, attr in parser.assets:
        link_error = validate_link_scheme(value, line, attr)
        if link_error:
            errors.append(f"{path}: {link_error}")
            continue
        if not is_local_asset(value):
            continue
        if urlparse(value).path.startswith("/"):
            if value in ALLOWED_ROOT_ASSETS:
                target = (root / value.lstrip("/")).resolve()
                if not target.exists():
                    errors.append(f"{path}: line {line}: missing root asset {value}")
                continue
            errors.append(f"{path}: line {line}: root-relative {attr} is not allowed: {value}")
            continue
        target = asset_target(path, value)
        if target is not None and not target.exists():
            errors.append(f"{path}: line {line}: missing local asset {value}")

    uses_practice_styles = any(value.endswith("assets/styles.css") for value, _, _ in parser.assets)
    disallowed_color_prefixes = (
        "bg-[#", "text-[#", "border-[#", "from-[#", "via-[#", "to-[#",
        "bg-[rgb", "text-[rgb", "border-[rgb", "from-[rgb", "via-[rgb", "to-[rgb",
        "bg-emerald", "text-emerald", "border-emerald",
    )
    if uses_practice_styles:
        for class_name, line in parser.classes:
            if class_name.startswith(disallowed_color_prefixes):
                errors.append(f"{path}: line {line}: off-palette color class is not allowed: {class_name}")

    for block, line in parser.json_ld_blocks:
        try:
            json.loads(block)
        except json.JSONDecodeError as error:
            errors.append(f"{path}: line {line}: invalid JSON-LD: {error}")

    if "/providers/" in path.as_posix() and not parser.json_ld_blocks:
        errors.append(f"{path}: provider page missing JSON-LD")

    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate built HTML files.")
    parser.add_argument("root", nargs="?", default="dist", type=Path)
    args = parser.parse_args()

    errors: list[str] = []
    root = args.root.resolve()
    for path in sorted(root.rglob("*.html")):
        errors.extend(validate_page(path, root))

    if errors:
        print("built HTML validation failed:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
