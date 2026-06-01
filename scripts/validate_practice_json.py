#!/usr/bin/env python3
"""Validate practice.json files used by the static preview build."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

THEMES_PATH = Path("shared/themes.json")


class ValidationError(Exception):
    pass


def fail(message: str) -> None:
    raise ValidationError(message)


def require_mapping(value: Any, path: str) -> dict[str, Any]:
    if not isinstance(value, dict):
        fail(f"{path} must be an object")
    return value


def require_list(value: Any, path: str) -> list[Any]:
    if not isinstance(value, list):
        fail(f"{path} must be an array")
    return value


def require_string(value: Any, path: str) -> str:
    if not isinstance(value, str) or not value.strip():
        fail(f"{path} must be a non-empty string")
    return value


def require_key(mapping: dict[str, Any], key: str, path: str) -> Any:
    if key not in mapping:
        fail(f"{path}.{key} is required")
    return mapping[key]


def require_string_key(mapping: dict[str, Any], key: str, path: str) -> str:
    return require_string(require_key(mapping, key, path), f"{path}.{key}")


def validate_asset_path(value: Any, path: str) -> None:
    asset_path = require_string(value, path)
    if asset_path.startswith("/"):
        fail(f"{path} must be relative, not root-relative: {asset_path}")


def validate_string_list(value: Any, path: str, *, min_items: int = 0) -> None:
    items = require_list(value, path)
    if len(items) < min_items:
        fail(f"{path} must contain at least {min_items} item(s)")
    for index, item in enumerate(items):
        require_string(item, f"{path}[{index}]")


def validate_labeled_string_list(value: Any, path: str, *, min_items: int = 0) -> None:
    items = require_list(value, path)
    if len(items) < min_items:
        fail(f"{path} must contain at least {min_items} item(s)")
    for index, item in enumerate(items):
        pair = require_list(item, f"{path}[{index}]")
        if len(pair) != 2:
            fail(f"{path}[{index}] must contain exactly 2 strings")
        require_string(pair[0], f"{path}[{index}][0]")
        require_string(pair[1], f"{path}[{index}][1]")


def validate_financial_policy(value: Any) -> None:
    policy = require_mapping(value, "financialPolicy")
    payment_model = require_string_key(policy, "paymentModel", "financialPolicy")
    if payment_model not in {"insurance", "out_of_network", "cash_only", "hybrid"}:
        fail("financialPolicy.paymentModel must be one of insurance, out_of_network, cash_only, hybrid")
    pricing_display = require_string_key(policy, "pricingDisplay", "financialPolicy")
    if pricing_display not in {"hidden", "contact_for_rates", "published"}:
        fail("financialPolicy.pricingDisplay must be one of hidden, contact_for_rates, published")

    if "insurancePlans" in policy:
        plans = require_list(policy["insurancePlans"], "financialPolicy.insurancePlans")
        for index, plan_value in enumerate(plans):
            if isinstance(plan_value, str):
                require_string(plan_value, f"financialPolicy.insurancePlans[{index}]")
                continue
            plan = require_mapping(plan_value, f"financialPolicy.insurancePlans[{index}]")
            require_string_key(plan, "name", f"financialPolicy.insurancePlans[{index}]")
            if "logo" in plan:
                validate_asset_path(plan["logo"], f"financialPolicy.insurancePlans[{index}].logo")
    if "paymentMethods" in policy:
        validate_string_list(policy["paymentMethods"], "financialPolicy.paymentMethods")
    if "superbillAvailable" in policy and not isinstance(policy["superbillAvailable"], bool):
        fail("financialPolicy.superbillAvailable must be a boolean")
    if "contactForRatesMessage" in policy:
        require_string(policy["contactForRatesMessage"], "financialPolicy.contactForRatesMessage")
    if "rates" in policy:
        rates = require_list(policy["rates"], "financialPolicy.rates")
        for index, rate_value in enumerate(rates):
            rate = require_mapping(rate_value, f"financialPolicy.rates[{index}]")
            require_string_key(rate, "name", f"financialPolicy.rates[{index}]")
            if "durationMinutes" in rate and not isinstance(rate["durationMinutes"], int):
                fail(f"financialPolicy.rates[{index}].durationMinutes must be an integer")
            if "price" not in rate or not isinstance(rate["price"], (int, float)):
                fail(f"financialPolicy.rates[{index}].price must be a number")


def valid_theme_names() -> set[str]:
    try:
        themes = json.loads(THEMES_PATH.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError) as error:
        fail(f"Unable to read {THEMES_PATH}: {error}")
    if not isinstance(themes, dict) or not themes:
        fail(f"{THEMES_PATH} must contain at least one theme")
    return set(themes)


def validate_practice_config(config: dict[str, Any], source: Path) -> None:
    theme = require_string_key(config, "theme", "root")
    themes = valid_theme_names()
    if theme not in themes:
        fail(f"root.theme must be one of {', '.join(sorted(themes))}")

    seo = require_mapping(require_key(config, "seo", "root"), "seo")
    require_string_key(seo, "title", "seo")
    require_string_key(seo, "description", "seo")
    if "ogImage" in seo:
        validate_asset_path(seo["ogImage"], "seo.ogImage")

    practice = require_mapping(require_key(config, "practice", "root"), "practice")
    for key in ["name", "tagline", "locationLabel", "phone", "phoneHref", "email"]:
        require_string_key(practice, key, "practice")
    validate_string_list(require_key(practice, "addressLines", "practice"), "practice.addressLines", min_items=1)

    hero = require_mapping(require_key(config, "hero", "root"), "hero")
    for key in ["image", "imageAlt", "title", "copy", "primaryCta", "secondaryCta"]:
        require_string_key(hero, key, "hero")
    validate_asset_path(hero["image"], "hero.image")

    providers = require_list(require_key(config, "providers", "root"), "providers")
    for index, provider_value in enumerate(providers):
        provider = require_mapping(provider_value, f"providers[{index}]")
        provider_path = f"providers[{index}]"
        for key in ["slug", "name", "image", "tagline", "cardDescription"]:
            require_string_key(provider, key, provider_path)
        validate_asset_path(provider["image"], f"{provider_path}.image")

    validate_string_list(require_key(config, "conditions", "root"), "conditions", min_items=1)
    require_string_key(config, "conditionsIntro", "root")

    if "financialPolicy" in config:
        validate_financial_policy(config["financialPolicy"])

    insurance = require_mapping(require_key(config, "insurance", "root"), "insurance")
    if "enabled" not in insurance or not isinstance(insurance["enabled"], bool):
        fail("insurance.enabled must be a boolean")
    if insurance["enabled"]:
        for key in ["section_label", "headline", "summary"]:
            require_string_key(insurance, key, "insurance")
        if "disclaimer" in insurance:
            require_string_key(insurance, "disclaimer", "insurance")
        validate_string_list(require_key(insurance, "coverage_types", "insurance"), "insurance.coverage_types", min_items=1)
        if "carrier_sentence" in insurance:
            require_string_key(insurance, "carrier_sentence", "insurance")
        verification = require_mapping(require_key(insurance, "verification", "insurance"), "insurance.verification")
        if "enabled" not in verification or not isinstance(verification["enabled"], bool):
            fail("insurance.verification.enabled must be a boolean")
        if verification["enabled"]:
            require_string_key(verification, "description", "insurance.verification")

    faqs = require_list(require_key(config, "faqs", "root"), "faqs")
    for index, faq_value in enumerate(faqs):
        faq = require_mapping(faq_value, f"faqs[{index}]")
        require_string_key(faq, "question", f"faqs[{index}]")
        require_string_key(faq, "answer", f"faqs[{index}]")

    contact = require_mapping(require_key(config, "contact", "root"), "contact")
    for key in ["eyebrow", "title", "copy", "disclaimer"]:
        require_string_key(contact, key, "contact")

    location = require_mapping(require_key(config, "location", "root"), "location")
    for key in ["title", "officeImage", "officeImageAlt", "directionsHref", "timeZone"]:
        require_string_key(location, key, "location")
    validate_asset_path(location["officeImage"], "location.officeImage")
    validate_labeled_string_list(require_key(location, "hours", "location"), "location.hours", min_items=1)

    footer = require_mapping(require_key(config, "footer", "root"), "footer")
    validate_string_list(require_key(footer, "links", "footer"), "footer.links", min_items=1)


def validate_file(path: Path) -> list[str]:
    try:
        config = json.loads(path.read_text(encoding="utf-8"))
        require_mapping(config, "root")
        validate_practice_config(config, path)
    except (json.JSONDecodeError, OSError, ValidationError) as error:
        return [f"{path}: {error}"]
    return []


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate practice.json files for required preview fields.")
    parser.add_argument("paths", nargs="+", type=Path, help="practice.json file(s) to validate")
    args = parser.parse_args()

    errors: list[str] = []
    for path in args.paths:
        errors.extend(validate_file(path))

    if errors:
        print("practice.json validation failed:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
