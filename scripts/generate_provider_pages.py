#!/usr/bin/env python3
"""Generate static provider profile pages from each practice.json."""

from __future__ import annotations

import json
from html import escape
from pathlib import Path
from typing import Any


THEMES = {
    "psychiatry": {"primary": "#1E3A5F", "accent": "#2F855A", "brand800": "#16304F", "brand900": "#0F172A", "surface": "#FAF8F5"},
    "acupuncture": {"primary": "#315C45", "accent": "#5F7F62", "brand800": "#274A3A", "brand900": "#20382D", "surface": "#F7F4ED"},
    "wellness": {"primary": "#4A5568", "accent": "#7C6F64", "brand800": "#3B4556", "brand900": "#2D3748", "surface": "#FAF8F4"},
}


def esc(value: Any) -> str:
    return escape(str(value or ""), quote=True)


def rel(path: str | None) -> str:
    if not path:
        return ""
    if path.startswith("http") or path.startswith("/"):
        return path
    if path.startswith("./"):
        return "../../" + path[2:]
    if path.startswith("../"):
        return "../../" + path
    return "../../" + path


def items(values: list[str] | None, cls: str = "badge-brand") -> str:
    return "".join(f'<span class="{cls}">{esc(value)}</span>' for value in (values or []))


def list_cards(values: list[str] | None) -> str:
    return "".join(
        f'<li class="rounded-[24px] border border-white/70 bg-white/80 px-5 py-4 text-base font-semibold text-slate-800 shadow-sm">{esc(value)}</li>'
        for value in (values or [])
    )


def education_rows(education: dict[str, Any]) -> str:
    labels = [
        ("Undergraduate", education.get("undergraduate")),
        ("Medical School", education.get("medicalSchool")),
        ("Residency", education.get("residency")),
        ("Fellowship", education.get("fellowship")),
    ]
    rows: list[str] = []
    for label, value in labels:
        if not value:
            continue
        values = value if isinstance(value, list) else [value]
        rows.append(
            f'<div class="rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-sm">'
            f'<p class="eyebrow">{esc(label)}</p>'
            f'<div class="mt-3 space-y-2 text-lg leading-8 text-slate-700">{"".join(f"<p>{esc(v)}</p>" for v in values)}</div>'
            f'</div>'
        )
    return "".join(rows)


def provider_page(config: dict[str, Any], provider: dict[str, Any], practice_slug: str) -> str:
    practice = config["practice"]
    theme = THEMES.get(config.get("theme"), THEMES["psychiatry"])
    name = provider.get("name", "Provider")
    title = f"{name} | {practice['name']}"
    description = provider.get("tagline") or provider.get("philosophy") or provider.get("bio") or config.get("seo", {}).get("description", "")
    conditions = provider.get("conditions") or provider.get("specialties") or config.get("conditions", [])[:6]
    services = provider.get("services") or ["Evaluation & diagnosis", "Personalized treatment planning", "Ongoing follow-up care"]
    bio = provider.get("bio")
    bio_paragraphs = provider.get("bioParagraphs") or ([bio] if isinstance(bio, str) and bio else [])
    education = provider.get("education") or {}
    credentials = [*provider.get("certifications", []), *provider.get("affiliations", []), *provider.get("awards", [])]
    languages = provider.get("languages") or ["English"]
    phone = provider.get("phone") or practice.get("phone")
    phone_href = provider.get("phoneHref") or practice.get("phoneHref")
    office = provider.get("office") or ", ".join(practice.get("addressLines", []))
    specialty = provider.get("specialty") or provider.get("credentials", "").split("·")[-1].strip()
    quick_facts = []
    if provider.get("acceptsNewPatients", True):
        quick_facts.append("Accepting New Patients")
    if provider.get("telehealth", True):
        quick_facts.append("Telehealth Available")
    if languages:
        quick_facts.append("Languages: " + ", ".join(languages))

    schema = {
        "@context": "https://schema.org",
        "@type": "Physician",
        "name": name,
        "medicalSpecialty": specialty,
        "image": rel(provider.get("image")),
        "telephone": phone,
        "address": office,
        "worksFor": {"@type": "MedicalClinic", "name": practice.get("name")},
    }

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{esc(title)}</title>
  <meta name="description" content="{esc(description)}" />
  <meta name="robots" content="noindex, nofollow" />
  <link rel="stylesheet" href="../../assets/styles.css" />
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>:root{{--brand-primary:{theme['primary']};--brand-accent:{theme['accent']};--brand-800:{theme['brand800']};--brand-900:{theme['brand900']};--surface:{theme['surface']};--font-heading:Inter;--font-body:Inter;}}</style>
</head>
<body class="bg-surface pb-24 font-sans text-slate-950 antialiased md:pb-0">
  <a href="#main-content" class="skip-link">Skip to main content</a>
  <header class="sticky top-0 z-50 border-b border-white/60 bg-white/90 shadow-[0_1px_20px_rgba(15,23,42,0.04)] backdrop-blur">
    <div class="page-shell flex items-center justify-between py-3 md:py-4">
      <a href="../../" class="flex items-center gap-3" aria-label="{esc(practice['name'])} home"><div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-primary text-base font-semibold text-white shadow-sm">{esc(practice['name'][0])}</div><div><p class="text-base font-semibold text-slate-950">{esc(practice['name'])}</p><p class="text-xs leading-5 text-slate-500">{esc(practice['tagline'])}</p></div></a>
      <nav class="hidden items-center gap-8 md:flex" aria-label="Provider navigation"><a href="../../#providers" class="nav-link">Providers</a><a href="../../#conditions" class="nav-link">Conditions</a><a href="#appointment" class="btn-primary px-4 py-2.5 text-sm">Book Appointment</a></nav>
      <a href="{esc(phone_href)}" class="btn-secondary min-h-[44px] px-3 py-2 text-sm md:hidden">Call</a>
    </div>
  </header>
  <main id="main-content" tabindex="-1">
    <section class="section bg-warm-50">
      <div class="section-shell">
        <nav class="mb-8 text-sm font-medium text-slate-500" aria-label="Breadcrumb"><a class="hover:text-slate-950" href="../../">Home</a><span class="mx-2">/</span><a class="hover:text-slate-950" href="../../#providers">Providers</a><span class="mx-2">/</span><span class="text-slate-800">{esc(name)}</span></nav>
        <div class="grid grid-cols-1 gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div class="mx-auto w-full max-w-md lg:max-w-none"><div class="aspect-[4/5] overflow-hidden rounded-[36px] border border-white/70 bg-white shadow-soft"><img src="{esc(rel(provider.get('image')))}" alt="Portrait of {esc(name)}" class="image-treatment h-full w-full object-cover object-top" width="720" height="900" /></div></div>
          <div class="soft-card gentle-gradient p-7 md:p-10">
            <p class="eyebrow">Provider Profile</p>
            <h1 class="mt-4 text-4xl font-semibold leading-tight tracking-tight text-slate-950 md:text-6xl">{esc(name)}</h1>
            <p class="mt-3 text-lg font-semibold text-brand-primary">{esc(provider.get('credentials'))}</p>
            <p class="mt-2 text-xl leading-8 text-slate-700">{esc(specialty)}</p>
            <p class="mt-6 max-w-2xl text-lg leading-8 text-slate-700">{esc(provider.get('tagline') or provider.get('philosophy') or description)}</p>
            <div class="mt-6 flex flex-wrap gap-2">{items(conditions[:6])}</div>
            <dl class="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">{"".join(f'<div class="rounded-2xl bg-white/80 p-4"><dt class="text-xs font-semibold uppercase tracking-wide text-slate-500">Quick fact</dt><dd class="mt-1 text-sm font-semibold leading-6 text-slate-800">{esc(fact)}</dd></div>' for fact in quick_facts)}</dl>
            <div class="mt-8 flex flex-col gap-3 sm:flex-row"><a href="#appointment" class="btn-primary">Book Appointment</a><a href="{esc(phone_href)}" class="btn-secondary">Call Office</a></div>
          </div>
        </div>
      </div>
    </section>
    <section class="section border-t border-white/60 bg-[#FAF8F6]"><div class="section-shell grid grid-cols-1 gap-10 lg:grid-cols-2"><div><p class="eyebrow">Conditions Treated</p><h2 class="section-title">Care areas patients ask about most</h2><ul class="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">{list_cards(conditions)}</ul></div><div><p class="eyebrow">Services</p><h2 class="section-title">How appointments can help</h2><ul class="mt-8 grid grid-cols-1 gap-3">{list_cards(services)}</ul></div></div></section>
    <section class="section border-t border-white/60 bg-white"><div class="section-shell max-w-4xl"><p class="eyebrow">About</p><h2 class="section-title">A more human way to understand care</h2><div class="mt-8 space-y-5 text-xl leading-9 text-slate-700">{"".join(f'<p>{esc(p)}</p>' for p in bio_paragraphs[:2])}</div></div></section>
    <section class="section border-t border-white/60 bg-sage-100"><div class="section-shell"><p class="eyebrow">Education & Training</p><h2 class="section-title">Credentials at a glance</h2><div class="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2">{education_rows(education) or '<div class="soft-card p-6 text-lg leading-8 text-slate-700">Please contact the office for additional credential details.</div>'}</div></div></section>
    <section class="section border-t border-white/60 bg-[#F8F7F4]"><div class="section-shell max-w-4xl"><details class="soft-card p-7"><summary class="flex min-h-[44px] cursor-pointer list-none items-center justify-between text-xl font-semibold text-slate-950">Affiliations & Credentials<span class="icon-chip" aria-hidden="true">+</span></summary><div class="mt-6 flex flex-wrap gap-2">{items(credentials, 'badge-brand') or '<p class="text-base leading-7 text-slate-600">Additional credentials are available through the practice office.</p>'}</div></details></div></section>
    <section id="appointment" class="section relative overflow-hidden border-t border-white/60 bg-gradient-to-br from-brand-900 via-brand-800 to-brand-primary"><div class="section-shell grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-center"><div><p class="text-sm font-semibold uppercase tracking-wide text-sage-100">Request care</p><h2 class="mt-4 text-3xl font-semibold leading-tight tracking-tight text-white md:text-5xl">Ready to schedule with {esc(name)}?</h2><p class="mt-6 text-lg leading-8 text-slate-300">Call the office or request an appointment to confirm availability, insurance, and next steps.</p></div><div class="soft-card bg-white/95 p-7"><p class="text-lg font-semibold text-slate-950">{esc(practice['name'])}</p><p class="mt-3 text-base leading-7 text-slate-600">{esc(office)}</p><div class="mt-6 flex flex-col gap-3 sm:flex-row"><a href="{esc(phone_href)}" class="btn-primary">{esc(phone)}</a><a href="../../#contact" class="btn-secondary">Request Appointment</a></div>{'<p class="mt-4 text-sm font-semibold text-brand-accent">Telehealth available</p>' if provider.get('telehealth', True) else ''}</div></div></section>
  </main>
  <div class="fixed inset-x-0 bottom-0 z-50 border-t border-white/60 bg-white/90 p-3 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur md:hidden"><div class="mx-auto grid max-w-md grid-cols-2 gap-3"><a href="#appointment" class="btn-primary min-h-[44px] px-3 py-2 text-sm">Book Appointment</a><a href="{esc(phone_href)}" class="btn-secondary min-h-[44px] px-3 py-2 text-sm">Call Office</a></div></div>
  <script type="application/ld+json">{json.dumps(schema).replace('<', '\\u003c')}</script>
  <script>lucide.createIcons();</script>
</body>
</html>
"""


def generate_for_practice(practice_dir: Path) -> None:
    json_path = practice_dir / "practice.json"
    if not json_path.exists():
        return
    config = json.loads(json_path.read_text())
    providers = config.get("providers") or []
    providers_dir = practice_dir / "providers"
    providers_dir.mkdir(exist_ok=True)
    for provider in providers:
        slug = provider.get("slug")
        if not slug:
            continue
        page_dir = providers_dir / slug
        page_dir.mkdir(parents=True, exist_ok=True)
        (page_dir / "index.html").write_text(provider_page(config, provider, practice_dir.name))


def main() -> None:
    dist = Path("dist")
    for practice_dir in dist.iterdir():
        if practice_dir.is_dir():
            generate_for_practice(practice_dir)


if __name__ == "__main__":
    main()
