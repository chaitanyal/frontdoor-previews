#!/usr/bin/env python3
"""Generate static provider profile pages from each practice.json."""

from __future__ import annotations

import json
from html import escape
from pathlib import Path
from typing import Any


THEMES = json.loads(Path("shared/themes.json").read_text(encoding="utf-8"))


def theme_css(theme: dict[str, str]) -> str:
    return "".join([
        f"--color-primary:{theme['primary']};",
        f"--color-primary-hover:{theme['primaryHover']};",
        f"--color-sage:{theme['secondarySage']};",
        f"--color-surface:{theme['surfaceWarm']};",
        f"--color-card:{theme['cardBackground']};",
        f"--color-text-primary:{theme['textPrimary']};",
        f"--color-text-secondary:{theme['textSecondary']};",
        f"--color-border:{theme['border']};",
        f"--color-success:{theme['success']};",
        f"--brand-primary:{theme['primary']};",
        f"--brand-accent:{theme['success']};",
        f"--brand-800:{theme['primaryHover']};",
        f"--brand-900:{theme['textPrimary']};",
        f"--surface:{theme['surfaceWarm']};",
        f"--font-heading:{theme['fontHeading']};",
        f"--font-body:{theme['fontBody']};",
    ])


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


def normalized_site_url(config: dict[str, Any]) -> str:
    return str((config.get("seo") or {}).get("siteUrl") or "").rstrip("/")


def canonical_url(config: dict[str, Any], page_path: str = "") -> str:
    site_url = normalized_site_url(config)
    if not site_url:
        return ""
    normalized_path = page_path.strip("/")
    return f"{site_url}/{normalized_path}/" if normalized_path else f"{site_url}/"


def absolute_url(config: dict[str, Any], value: str | None) -> str:
    if not value:
        return ""
    if value.startswith("http"):
        return value
    site_url = normalized_site_url(config)
    if not site_url:
        return value
    return f"{site_url}/{value.lstrip('./')}"


def robots_meta(config: dict[str, Any]) -> str:
    if (config.get("seo") or {}).get("allowIndexing") is True:
        return ""
    return '  <meta name="robots" content="noindex, nofollow">\n'


def chips(values: list[str] | None, cls: str = "badge-brand") -> str:
    return "".join(f'<span class="{cls}">{esc(value)}</span>' for value in (values or []))


def check_chips(values: list[str] | None, cls: str = "badge-brand") -> str:
    return "".join(
        f'<span class="{cls}"><i data-lucide="CheckCircle" class="h-3.5 w-3.5" aria-hidden="true"></i> {esc(value)}</span>'
        for value in (values or [])
    )


def list_cards(values: list[str] | None) -> str:
    return "".join(
        f'<li class="flex min-h-[72px] items-center rounded-2xl border border-slate-200 bg-white p-5 text-base font-semibold leading-6 text-slate-800">{esc(value)}</li>'
        for value in (values or [])
    )


def care_steps(values: list[str] | None) -> str:
    return "".join(
        f'<li class="flex gap-3 text-base leading-7 text-slate-700 md:text-lg md:leading-8">'
        f'<span class="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand-accent" aria-hidden="true"></span>'
        f'<span>{esc(value)}</span></li>'
        for value in (values or [])
    )


def contact_card(kind: str, label: str, value: str, href: str = "") -> str:
    icon_name = "Mail" if kind == "email" else "Phone"
    value_class = "text-base font-medium text-slate-700" if kind == "email" else "text-lg font-semibold text-slate-950"
    content = (
        f'<span class="icon-chip shrink-0 bg-warm-50"><i data-lucide="{icon_name}" class="h-4 w-4" aria-hidden="true"></i></span>'
        f'<span class="min-w-0"><span class="block text-sm font-semibold uppercase tracking-wide text-slate-500">{esc(label)}</span>'
        f'<span class="mt-1 block break-words {value_class}">{esc(value)}</span></span>'
    )
    classes = "group flex min-h-[72px] w-full min-w-0 items-center gap-4 rounded-[24px] border border-slate-200 bg-white/85 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-brand-primary hover:bg-white hover:shadow-md focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-300"
    if kind == "email":
        return f'<button type="button" data-copy-email="{esc(value)}" class="{classes}" aria-label="Copy email {esc(value)}">{content}</button>'
    return f'<a href="{esc(href)}" class="{classes}" aria-label="{esc(label)} {esc(value)}">{content}</a>'


def appointment_section(*, appointment_url: str, patient_portal_url: str, phone: str, phone_href: str, email: str, emergency_notice: str) -> str:
    actions = []
    if appointment_url:
        actions.append(('<i data-lucide="CalendarCheck" class="h-4 w-4" aria-hidden="true"></i>', 'New Patient Appointment', appointment_url, 'btn-primary'))
    if patient_portal_url:
        actions.append(('<i data-lucide="LogIn" class="h-4 w-4" aria-hidden="true"></i>', 'Existing Patient Portal', patient_portal_url, 'btn-secondary'))
    actions_html = ''.join(
        f'<a href="{esc(url)}" target="_blank" rel="noopener noreferrer" class="{cls} w-full justify-center px-5 py-4 text-base">{icon_html} {esc(label)} <i data-lucide="ExternalLink" class="h-3.5 w-3.5" aria-hidden="true"></i></a>'
        for icon_html, label, url, cls in actions
    )
    actions_block = f'<div class="space-y-3">{actions_html}</div>' if actions_html else ''
    contact_class = 'mt-8 border-t border-slate-200 pt-7' if actions_html else ''
    notice = f'<p class="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium leading-6 text-amber-900">{esc(emergency_notice)}</p>' if emergency_notice else ''
    return f'''<section id="appointment" class="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-primary px-6 py-16 md:py-24 lg:px-8"><div class="mx-auto grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-2 lg:items-center"><div><p class="text-sm font-semibold uppercase tracking-wide text-sage-100">REQUEST CARE</p><h2 class="mt-4 text-3xl font-semibold leading-tight tracking-tight text-white md:text-5xl">Ready to schedule a visit?</h2><p class="mt-6 text-lg leading-8 text-slate-300">Contact the office directly or request an appointment online.</p></div><div class="dark-section-card p-7 md:p-8">{actions_block}<div class="{contact_class}"><h3 class="text-2xl font-semibold tracking-tight text-slate-950">Contact the Office</h3><div class="mt-5 grid gap-3">{contact_card('phone', 'Call Office', phone, phone_href)}{contact_card('email', 'Email', email)}</div></div>{notice}</div></div></section>'''


def copy_email_script() -> str:
    return '''<script>
+(() => {
+  async function copyText(value) {
+    if (navigator.clipboard?.writeText && window.isSecureContext) {
+      await navigator.clipboard.writeText(value);
+      return true;
+    }
+    const textarea = document.createElement('textarea');
+    textarea.value = value;
+    textarea.setAttribute('readonly', '');
+    textarea.style.position = 'fixed';
+    textarea.style.top = '-9999px';
+    document.body.appendChild(textarea);
+    textarea.select();
+    textarea.setSelectionRange(0, textarea.value.length);
+    const copied = document.execCommand('copy');
+    textarea.remove();
+    return copied;
+  }
+  function showCopyToast() {
+    const toast = document.querySelector('[data-copy-toast]');
+    if (!toast) return;
+    toast.classList.remove('hidden');
+    window.clearTimeout(showCopyToast.timeoutId);
+    showCopyToast.timeoutId = window.setTimeout(() => toast.classList.add('hidden'), 2500);
+  }
+  document.querySelectorAll('[data-copy-email]').forEach(button => {
+    button.addEventListener('click', async () => {
+      const email = button.getAttribute('data-copy-email') || '';
+      try {
+        if (!await copyText(email)) throw new Error('Copy command failed');
+        showCopyToast();
+      } catch (_error) {
+        window.prompt('Copy email address:', email);
+      }
+    });
+  });
+})();
+</script>'''.replace('\n+', '\n')


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
            f'<div class="rounded-3xl border border-slate-200 bg-white p-6 md:p-7">'
            f'<p class="text-xs font-semibold uppercase tracking-wide text-brand-accent">{esc(label)}</p>'
            f'<div class="mt-3 space-y-1.5 text-base leading-7 text-slate-700">{"".join(f"<p>{esc(v)}</p>" for v in values)}</div>'
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
        "hospitalAffiliationsIntro": "Hospital and clinical affiliations.",
        "professionalAffiliations": "Professional Affiliations",
        "howProviderHelps": f"How Dr. {last_name} helps",
        "telehealthAvailable": "Telehealth available",
    }
    return {**defaults, **(config.get("providerProfileLabels") or {})}


def practice_telehealth_available(config: dict[str, Any]) -> bool:
    location = config.get("location") or {}
    if location.get("telehealthNotice"):
        return True
    return any(day.get("telehealthOnly") is True for day in (location.get("weeklyHours") or {}).values())


def provider_telehealth_available(config: dict[str, Any], provider: dict[str, Any]) -> bool:
    if isinstance(provider.get("telehealthOverride"), bool):
        return provider["telehealthOverride"]
    return practice_telehealth_available(config)


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
    elif provider_telehealth_available(config, provider):
        items.append("Telehealth Available")

    if provider.get("acceptsNewPatients", True):
        items.append("Accepting New Patients")

    return items[:3]


def provider_page(config: dict[str, Any], provider: dict[str, Any], practice_slug: str) -> str:
    practice = config["practice"]
    contact_override = provider.get("contactOverride") or {}
    theme = THEMES[config.get("theme")]
    name = provider.get("name", "Provider")
    title = f"{name} | {practice['name']}"
    labels = provider_profile_labels(config, name)
    hero_title = provider.get("heroTitle") or ""
    description = provider.get("tagline") or config.get("seo", {}).get("description", "")
    hero_title_html = f'<p class="mt-4 text-lg font-semibold text-brand-primary">{esc(hero_title)}</p>' if hero_title else ""
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
    phone = contact_override.get("phone") or practice.get("phone")
    phone_href = contact_override.get("phoneHref") or practice.get("phoneHref")
    email = contact_override.get("email") or practice.get("email")
    office_lines = contact_override.get("addressLines") or practice.get("addressLines", [])
    office = ", ".join(office_lines)
    appointment_url = provider.get("appointmentUrl") or practice.get("defaultAppointmentUrl", "")
    patient_portal_url = practice.get("patientPortalUrl", "")
    emergency_notice = practice.get("emergencyNotice", "")
    specialty = provider.get("specialty") or provider.get("credentials", "").split("·")[-1].strip()
    about_heading = provider.get("aboutHeading") or ("Personalized Psychiatric Care" if is_psychiatry(config, provider) else "Individualized Pulmonary Care")
    affiliation_section = ""
    if hospital_affiliations:
        affiliation_section = f'''\n    <section class="bg-warm-50 px-6 py-12 lg:px-8 lg:py-20"><div class="mx-auto max-w-6xl"><div class="soft-card rounded-3xl p-6 md:p-8"><h2 class="text-4xl font-bold leading-tight tracking-tight text-slate-950 md:text-5xl">{esc(labels['hospitalAffiliations'])}</h2><p class="mt-3 text-base text-slate-600">{esc(labels['hospitalAffiliationsIntro'])}</p><ul class="mt-7 grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">{list_cards(hospital_affiliations)}</ul></div></div></section>'''
    elif professional_credentials and not is_psychiatry(config, provider):
        affiliation_section = f'''\n    <section class="bg-warm-50 px-6 py-12 lg:px-8 lg:py-20"><div class="mx-auto max-w-6xl"><div class="soft-card rounded-3xl p-6 md:p-8"><h2 class="text-4xl font-bold leading-tight tracking-tight text-slate-950 md:text-5xl">{esc(labels['professionalAffiliations'])}</h2><ul class="mt-7 grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">{list_cards(professional_credentials)}</ul></div></div></section>'''

    provider_slug = provider.get("slug", "")
    canonical = canonical_url(config, f"providers/{provider_slug}")
    canonical_link = f'  <link rel="canonical" href="{esc(canonical)}" />\n' if canonical else ""
    schema = {
        "@context": "https://schema.org",
        "@type": "Physician",
        "name": name,
        "url": canonical,
        "medicalSpecialty": specialty,
        "image": absolute_url(config, provider.get("image")),
        "telephone": phone,
        "email": email,
        "address": office,
        "worksFor": {"@type": "MedicalClinic", "name": practice.get("name"), "url": canonical_url(config)},
    }

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{esc(title)}</title>
  <meta name="description" content="{esc(description)}" />
{robots_meta(config)}{canonical_link}  <link rel="stylesheet" href="../../assets/styles.css" />
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>:root{{{theme_css(theme)}}}</style>
</head>
<body class="bg-surface pb-24 font-sans text-slate-950 antialiased md:pb-0">
  <a href="#main-content" class="skip-link">Skip to main content</a>
  <header class="sticky top-0 z-50 border-b border-slate-200 bg-white/95">
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
          <div class="mx-auto w-full max-w-md lg:max-w-none"><div class="aspect-[4/5] overflow-hidden rounded-[36px] border border-slate-200 bg-white"><img src="{esc(rel(provider.get('image')))}" alt="Portrait of {esc(name)}" class="image-treatment h-full w-full object-cover object-top" width="720" height="900" /></div></div>
          <div class="soft-card rounded-3xl p-8 md:p-10">
            <h1 class="text-4xl font-bold leading-tight tracking-tight text-slate-950 md:text-6xl">{esc(name)}</h1>
            {hero_title_html}
            <p class="mt-6 max-w-2xl text-lg leading-8 text-slate-700">{esc(provider.get('tagline') or description)}</p>
            <div class="mt-8 flex flex-wrap gap-2">{check_chips(hero_trust_items(config, provider))}</div>
            <div class="mt-8 flex flex-col gap-3 sm:flex-row"><a href="#appointment" class="btn-primary">{esc(labels['bookAppointment'])}</a><a href="{esc(phone_href)}" class="btn-secondary">{esc(labels['callOffice'])}</a></div>
          </div>
        </div>
      </div>
    </section>
    <section class="bg-white px-6 py-12 lg:px-8 lg:py-20"><div class="mx-auto max-w-6xl"><h2 class="max-w-3xl text-4xl font-bold leading-tight tracking-tight text-slate-950 md:text-5xl">{esc(about_heading)}</h2><div class="mt-7 max-w-3xl space-y-5 text-lg leading-9 text-slate-700 md:text-xl md:leading-10">{"".join(f'<p>{esc(p)}</p>' for p in bio_paragraphs[:2])}</div><div class="mt-10 max-w-3xl rounded-3xl bg-warm-50 p-6 md:p-8"><h3 class="text-xl font-bold tracking-tight text-slate-950 md:text-2xl">{esc(labels['howProviderHelps'])}</h3><ul class="mt-5 space-y-4">{care_steps(expectations)}</ul></div></div></section>
    <section class="bg-warm-50 px-6 py-12 lg:px-8 lg:py-20"><div class="mx-auto max-w-6xl"><h2 class="text-4xl font-bold leading-tight tracking-tight text-slate-950 md:text-5xl">{esc(labels['conditionsTreated'])}</h2><ul class="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-3">{list_cards(conditions)}</ul></div></section>
    <section class="bg-white px-6 py-12 lg:px-8 lg:py-20"><div class="mx-auto max-w-6xl"><h2 class="text-4xl font-bold leading-tight tracking-tight text-slate-950 md:text-5xl">{esc(labels['treatmentServices'])}</h2><ul class="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-3">{list_cards(services)}</ul></div></section>
    <section class="bg-warm-50 px-6 py-12 lg:px-8 lg:py-20"><div class="mx-auto max-w-6xl"><h2 class="text-4xl font-bold leading-tight tracking-tight text-slate-950 md:text-5xl">{esc(labels['educationTraining'])}</h2><div class="mt-7 grid grid-cols-1 gap-4 md:grid-cols-2">{education_rows(provider) or '<div class="soft-card rounded-3xl p-6 text-lg leading-8 text-slate-700 md:p-7">Please contact the office for additional training details.</div>'}</div></div></section>{affiliation_section}
    {appointment_section(appointment_url=appointment_url, patient_portal_url=patient_portal_url, phone=phone, phone_href=phone_href, email=email, emergency_notice=emergency_notice)}
  </main>
  <div class="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white p-3 md:hidden"><div class="mx-auto grid max-w-md grid-cols-2 gap-3"><a href="#appointment" class="btn-primary min-h-[44px] px-3 py-2 text-sm">{esc(labels['bookAppointment'])}</a><a href="{esc(phone_href)}" class="btn-secondary min-h-[44px] px-3 py-2 text-sm">{esc(labels['callOffice'])}</a></div></div>
  <div data-copy-toast class="pointer-events-none fixed inset-x-4 bottom-24 z-[60] mx-auto hidden max-w-sm rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-950 shadow-lg md:bottom-6" role="status" aria-live="polite">✓ Email copied</div>
  <script type="application/ld+json">{json.dumps(schema).replace('<', '\\u003c')}</script>
  {copy_email_script()}
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
        (page_dir / "index.html").write_text(provider_page(config, provider, practice_dir.name), encoding="utf-8")


def main() -> None:
    dist = Path("dist")
    if (dist / "practice.json").exists():
        generate_for_practice(dist)
        return
    for config_path in sorted(dist.rglob("practice.json")):
        generate_for_practice(config_path.parent)


if __name__ == "__main__":
    main()
