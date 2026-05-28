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
    if path.startswith("http"):
        return path
    if path.startswith("/"):
        return "../../" + path.lstrip("/")
    if path.startswith("./"):
        return "../../" + path[2:]
    if path.startswith("../"):
        return "../../" + path
    return "../../" + path


def chips(values: list[str] | None, cls: str = "badge-brand") -> str:
    return "".join(f'<span class="{cls}">{esc(value)}</span>' for value in (values or []))


def list_cards(values: list[str] | None) -> str:
    return "".join(
        f'<li class="rounded-2xl bg-white/80 px-4 py-3 text-base font-semibold text-slate-800 shadow-sm">{esc(value)}</li>'
        for value in (values or [])
    )


def care_steps(values: list[str] | None) -> str:
    return "".join(
        f'<li class="flex gap-3 text-base leading-7 text-slate-700 md:text-lg md:leading-8">'
        f'<span class="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand-accent" aria-hidden="true"></span>'
        f'<span>{esc(value)}</span></li>'
        for value in (values or [])
    )


def is_psychiatry(config: dict[str, Any], provider: dict[str, Any]) -> bool:
    haystack = " ".join([
        provider.get("specialty", ""),
        provider.get("credentials", ""),
    ]).lower()
    return "psychiat" in haystack


def default_expectations(config: dict[str, Any], provider: dict[str, Any]) -> list[str]:
    if is_psychiatry(config, provider):
        return [
            "Thoughtful conversations about symptoms, stressors, and goals",
            "A clear treatment plan that may include medication and follow-up care",
            "A supportive setting for questions from patients and families",
        ]
    return [
        "Thorough evaluation of breathing, sleep, and respiratory symptoms",
        "Clear communication about diagnosis, testing, and next steps",
        "Long-term treatment planning for chronic lung conditions",
    ]


def education_rows(provider: dict[str, Any]) -> str:
    education = provider.get("education") or {}
    labels = [
        ("Board Certification", provider.get("certifications")),
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
            f'<div class="rounded-2xl bg-white/70 p-5 shadow-sm">'
            f'<p class="text-xs font-semibold uppercase tracking-wide text-brand-accent">{esc(label)}</p>'
            f'<div class="mt-2 space-y-1.5 text-base leading-7 text-slate-700">{"".join(f"<p>{esc(v)}</p>" for v in values)}</div>'
            f'</div>'
        )
    return "".join(rows)


def provider_profile_labels(config: dict[str, Any], provider_name: str) -> dict[str, str]:
    last_name = provider_name.split()[-1]
    defaults = {
        "bookAppointment": "Book Appointment",
        "callOffice": "Call Office",
        "providers": "Providers",
        "conditions": "Conditions",
        "requestCare": "Request care",
        "requestAppointment": "Request Appointment",
        "conditionsTreated": "Conditions Treated",
        "treatmentServices": "Treatment Services",
        "educationTraining": "Education & Training",
        "hospitalAffiliations": "Hospital Affiliations",
        "professionalAffiliations": "Professional Affiliations",
        "howProviderHelps": f"How Dr. {last_name} helps",
        "telehealthAvailable": "Telehealth available",
    }
    return {**defaults, **(config.get("providerProfileLabels") or {})}


def hero_trust_items(config: dict[str, Any], provider: dict[str, Any]) -> list[str]:
    if provider.get("heroTrustItems"):
        return provider.get("heroTrustItems", [])[:3]

    specialty = provider.get("specialty") or provider.get("credentials", "").split("·")[-1].strip()
    items: list[str] = []
    certifications = provider.get("certifications") or []
    affiliations = provider.get("hospitalAffiliations") or provider.get("Hospital Affiliations") or provider.get("affiliations") or []

    if certifications:
        if is_psychiatry(config, provider):
            items.append("Board Certified Psychiatrist")
        else:
            items.append(certifications[0])
    elif specialty:
        items.append(specialty)

    if affiliations and not is_psychiatry(config, provider):
        items.append(affiliations[0])
    elif provider.get("telehealth") is True:
        items.append("Telehealth Available")

    if provider.get("acceptsNewPatients", True):
        items.append("Accepting New Patients")

    return items[:3]


def provider_page(config: dict[str, Any], provider: dict[str, Any], practice_slug: str) -> str:
    practice = config["practice"]
    theme = THEMES.get(config.get("theme"), THEMES["psychiatry"])
    name = provider.get("name", "Provider")
    title = f"{name} | {practice['name']}"
    labels = provider_profile_labels(config, name)
    hero_title = provider.get("heroTitle") or ""
    description = provider.get("tagline") or provider.get("cardDescription") or config.get("seo", {}).get("description", "")
    hero_title_html = f'<p class="mt-3 text-lg font-semibold text-brand-primary">{esc(hero_title)}</p>' if hero_title else ""
    conditions = (provider.get("conditions") or provider.get("specialties") or config.get("conditions", []))[:6]
    services = (provider.get("services") or ["Evaluation", "Treatment Planning", "Ongoing Care"])[:6]
    bio_paragraphs = provider.get("bioParagraphs") or []
    expectations = provider.get("whatToExpect") or default_expectations(config, provider)
    hospital_affiliations = provider.get("hospitalAffiliations") or provider.get("Hospital Affiliations") or []
    professional_affiliations = provider.get("affiliations") or []
    academic = provider.get("academicAppointments") or []
    awards = provider.get("awards") or []
    professional_credentials = [*professional_affiliations, *academic, *awards]
    languages = provider.get("languages") or ["English"]
    phone = provider.get("phone") or practice.get("phone")
    phone_href = provider.get("phoneHref") or practice.get("phoneHref")
    office_lines = provider.get("officeLines") or practice.get("addressLines", [])
    office = provider.get("office") or ", ".join(office_lines)
    office_html = "".join(f"<p>{esc(line)}</p>" for line in office_lines) or f"<p>{esc(office)}</p>"
    cta_title = provider.get("ctaTitle") or f"Ready to schedule with {name}?"
    cta_copy = provider.get("ctaCopy") or "Call the office or request an appointment to confirm availability, insurance, and next steps."
    specialty = provider.get("specialty") or provider.get("credentials", "").split("·")[-1].strip()
    about_heading = provider.get("aboutHeading") or ("Personalized Psychiatric Care" if is_psychiatry(config, provider) else "Individualized Pulmonary Care")
    affiliation_section = ""
    if hospital_affiliations:
        affiliation_section = f'''\n    <section class="bg-[#F8F7F4] px-6 py-14 md:py-20 lg:px-8"><div class="mx-auto max-w-5xl"><div class="soft-card p-7 md:p-8"><h2 class="text-3xl font-semibold leading-tight tracking-tight text-slate-950 md:text-5xl">{esc(labels['hospitalAffiliations'])}</h2><ul class="mt-7 grid grid-cols-1 gap-3 md:grid-cols-2">{list_cards(hospital_affiliations)}</ul></div></div></section>'''
    elif professional_credentials and not is_psychiatry(config, provider):
        affiliation_section = f'''\n    <section class="bg-[#F8F7F4] px-6 py-14 md:py-20 lg:px-8"><div class="mx-auto max-w-5xl"><div class="soft-card p-7 md:p-8"><h2 class="text-3xl font-semibold leading-tight tracking-tight text-slate-950 md:text-5xl">{esc(labels['professionalAffiliations'])}</h2><ul class="mt-7 grid grid-cols-1 gap-3 md:grid-cols-2">{list_cards(professional_credentials)}</ul></div></div></section>'''

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
      <nav class="hidden items-center gap-8 md:flex" aria-label="Provider navigation"><a href="../../#providers" class="nav-link">{esc(labels['providers'])}</a><a href="../../#conditions" class="nav-link">{esc(labels['conditions'])}</a><a href="#appointment" class="btn-primary px-4 py-2.5 text-sm">{esc(labels['bookAppointment'])}</a></nav>
      <a href="{esc(phone_href)}" class="btn-secondary min-h-[44px] px-3 py-2 text-sm md:hidden">{esc(labels['callOffice'])}</a>
    </div>
  </header>
  <main id="main-content" tabindex="-1">
    <section class="section bg-warm-50">
      <div class="section-shell">
        <nav class="mb-8 text-sm font-medium text-slate-500" aria-label="Breadcrumb"><a class="hover:text-slate-950" href="../../">Home</a><span class="mx-2">/</span><a class="hover:text-slate-950" href="../../#providers">Providers</a><span class="mx-2">/</span><span class="text-slate-800">{esc(name)}</span></nav>
        <div class="grid grid-cols-1 gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div class="mx-auto w-full max-w-md lg:max-w-none"><div class="aspect-[4/5] overflow-hidden rounded-[36px] bg-white shadow-soft"><img src="{esc(rel(provider.get('image')))}" alt="Portrait of {esc(name)}" class="image-treatment h-full w-full object-cover object-top" width="720" height="900" /></div></div>
          <div class="soft-card gentle-gradient p-7 md:p-10">
            <h1 class="text-4xl font-semibold leading-tight tracking-tight text-slate-950 md:text-6xl">{esc(name)}</h1>
            {hero_title_html}
            <p class="mt-6 max-w-2xl text-lg leading-8 text-slate-700">{esc(provider.get('tagline') or provider.get('cardDescription') or description)}</p>
            <div class="mt-7 flex flex-wrap gap-2">{chips(hero_trust_items(config, provider), 'inline-flex rounded-full bg-white/85 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm')}</div>
            <div class="mt-8 flex flex-col gap-3 sm:flex-row"><a href="#appointment" class="btn-primary">{esc(labels['bookAppointment'])}</a><a href="{esc(phone_href)}" class="btn-secondary">{esc(labels['callOffice'])}</a></div>
          </div>
        </div>
      </div>
    </section>
    <section class="bg-white px-6 py-14 md:py-24 lg:px-8"><div class="mx-auto max-w-5xl"><h2 class="max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-slate-950 md:text-5xl">{esc(about_heading)}</h2><div class="mt-7 max-w-4xl space-y-5 text-lg leading-9 text-slate-700 md:text-xl md:leading-10">{"".join(f'<p>{esc(p)}</p>' for p in bio_paragraphs[:2])}</div><div class="mt-10 max-w-4xl rounded-[28px] bg-[#FAF8F6] p-6 md:p-8"><h3 class="text-xl font-semibold tracking-tight text-slate-950 md:text-2xl">{esc(labels['howProviderHelps'])}</h3><ul class="mt-5 space-y-4">{care_steps(expectations)}</ul></div></div></section>
    <section class="bg-[#FAF8F6] px-6 py-14 md:py-20 lg:px-8"><div class="mx-auto max-w-6xl"><h2 class="text-3xl font-semibold leading-tight tracking-tight text-slate-950 md:text-5xl">{esc(labels['conditionsTreated'])}</h2><ul class="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{list_cards(conditions)}</ul></div></section>
    <section class="bg-white px-6 py-14 md:py-20 lg:px-8"><div class="mx-auto max-w-6xl"><h2 class="text-3xl font-semibold leading-tight tracking-tight text-slate-950 md:text-5xl">{esc(labels['treatmentServices'])}</h2><ul class="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{list_cards(services)}</ul></div></section>
    <section class="bg-[#FAF8F6] px-6 py-14 md:py-20 lg:px-8"><div class="mx-auto max-w-5xl"><h2 class="text-3xl font-semibold leading-tight tracking-tight text-slate-950 md:text-5xl">{esc(labels['educationTraining'])}</h2><div class="mt-7 grid grid-cols-1 gap-4 md:grid-cols-2">{education_rows(provider) or '<div class="soft-card p-6 text-lg leading-8 text-slate-700">Please contact the office for additional training details.</div>'}</div></div></section>{affiliation_section}
    <section id="appointment" class="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-primary px-6 py-16 md:py-24 lg:px-8"><div class="mx-auto grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-2 lg:items-center"><div><p class="text-sm font-semibold uppercase tracking-wide text-sage-100">{esc(labels['requestCare'])}</p><h2 class="mt-4 text-3xl font-semibold leading-tight tracking-tight text-white md:text-5xl">{esc(cta_title)}</h2><p class="mt-6 text-lg leading-8 text-slate-300">{esc(cta_copy)}</p></div><div class="soft-card bg-white/95 p-7"><p class="text-lg font-semibold text-slate-950">{esc(practice['name'])}</p><div class="mt-3 text-base leading-7 text-slate-600">{office_html}</div><div class="mt-6 flex flex-col gap-3 sm:flex-row"><a href="{esc(phone_href)}" class="btn-primary">{esc(phone)}</a><a href="../../#contact" class="btn-secondary">{esc(labels['requestAppointment'])}</a></div>{f'<p class="mt-4 text-sm font-semibold text-brand-accent">{esc(labels["telehealthAvailable"])}</p>' if provider.get('telehealth') is True else ''}</div></div></section>
  </main>
  <div class="fixed inset-x-0 bottom-0 z-50 border-t border-white/60 bg-white/90 p-3 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur md:hidden"><div class="mx-auto grid max-w-md grid-cols-2 gap-3"><a href="#appointment" class="btn-primary min-h-[44px] px-3 py-2 text-sm">{esc(labels['bookAppointment'])}</a><a href="{esc(phone_href)}" class="btn-secondary min-h-[44px] px-3 py-2 text-sm">{esc(labels['callOffice'])}</a></div></div>
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
