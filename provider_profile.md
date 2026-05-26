# FrontDoor Health — Provider Profile System Prompt

# Task

Design and implement a reusable Provider Profile page system for the FrontDoor Health website.

The website targets premium small-to-medium private healthcare practices and should feel:
- modern,
- calm,
- premium,
- conversion-oriented,
- highly readable for patients,
- and visually differentiated from outdated hospital websites.

The goal is to replace dense physician biography pages with modern profile experiences optimized for:
1. patient trust,
2. conversion,
3. readability,
4. physician credibility,
5. mobile usability.

The design language should match the existing FrontDoor Health aesthetic:
- premium healthcare editorial design,
- soft typography,
- calm photography,
- muted colors,
- subtle luxury,
- whitespace-heavy layouts,
- elegant modern minimalism.

Avoid:
- corporate hospital aesthetic,
- dashboard-style UI,
- dense text walls,
- heavy borders,
- overly technical layouts,
- generic stock medical design.

---

# Existing Site Context

The practice homepage already contains:
- hero section,
- services,
- provider cards,
- contact/scheduling CTA.

Each provider card should include:
- provider photo,
- provider name,
- specialty,
- short descriptor,
- CTA button:
  "View Profile"

Clicking the CTA navigates to:
`/providers/[slug]`

Examples:
- `/providers/goutham-dronavalli`
- `/providers/rahul-vasireddy`

---

# Technical Requirements

Implement:
- reusable provider page template/component,
- reusable provider card component,
- structured provider data model,
- responsive layout,
- SEO-friendly metadata,
- semantic HTML,
- accessible typography/color contrast.

Use:
- React + Tailwind CSS
OR existing project stack if detected.

Prefer:
- component-driven architecture,
- clean reusable sections,
- highly maintainable code,
- mobile-first responsive design.

---

# Core UX Principles

Patients skim.

The page should prioritize:
1. provider photo,
2. specialty,
3. conditions treated,
4. trust signals,
5. appointment CTA.

NOT:
- long biographies,
- academic CV formatting,
- giant text blocks,
- excessive medical jargon.

Use:
- concise sections,
- strong visual hierarchy,
- chips/cards,
- whitespace,
- typography,
- short readable paragraphs.

Every provider page should have:
- clear CTA above the fold,
- sticky mobile CTA,
- trust-building without clutter.

---

# Responsive Layout Requirements

## Desktop (1280px+)
- Two-column hero layout
- Provider image left, content right
- Generous whitespace
- Maximum readable content width
- Editorial premium aesthetic

## Tablet (768px–1279px)
- Slightly compressed two-column layout
- Reduced image size proportionally
- Metadata sections may stack as needed

## Mobile (<768px)
- Fully stacked layout
- Sticky bottom CTA:
  - “Book Appointment”
- Provider image centered
- Chips wrap naturally
- Long credential sections collapsible
- Optimized typography and spacing

## Mobile Spacing
- Minimum 16px horizontal padding
- Comfortable touch targets
- Avoid dense multi-column layouts

## Performance
- Responsive images
- Lazy-loaded provider photos
- Avoid layout shifts

---

# Navigation Integration

From Practice Homepage:
- Provider cards link to provider detail pages

Provider Page Navigation:
- Breadcrumb:
  Home / Providers / Dr. X

Optional:
- “Back to Providers”
- “Other Providers You May Like”

---

# Image Requirements

Provider photos should:
- support portrait orientation,
- maintain consistent aspect ratio,
- include alt text,
- support responsive sizing,
- gracefully handle missing images.

Avoid:
- distorted crops,
- inconsistent image sizing,
- harsh masking,
- circular avatar-only layouts.

Photography style:
- warm,
- natural,
- editorial,
- approachable,
- premium.

---

# Provider Page Information Architecture

Implement sections in the following order.

---

# 1. HERO SECTION

Responsive two-column layout.

Desktop:
- photo left,
- content right.

Mobile:
- stacked vertically.

Include:
- large provider image,
- provider name,
- credentials,
- specialty,
- short positioning statement,
- conditions treated chips,
- quick facts,
- booking CTA.

Example quick facts:
- Accepting New Patients
- Telehealth Available
- Languages Spoken

CTA buttons:
- Book Appointment
- Call Office

Visual style:
- premium typography,
- whitespace-heavy,
- subtle rounded corners,
- calm muted palette.

---

# 2. CONDITIONS & SERVICES SECTION

Display using:
- chips,
- cards,
- responsive grid.

Example:
Conditions Treated:
- COPD
- Asthma
- Sleep Apnea

Services:
- Pulmonary Function Testing
- Medication Management
- Psychotherapy

This section is highly important for patient decision-making.

---

# 3. ABOUT SECTION

Short narrative section.

Rules:
- maximum 2 short paragraphs,
- readable,
- human,
- patient-friendly.

Avoid:
- dense chronology,
- resume-style writing,
- giant text walls.

Tone:
- warm,
- confident,
- modern,
- reassuring.

---

# 4. EDUCATION & TRAINING SECTION

Display as:
- timeline,
- stacked cards,
- or structured list.

Include:
- Undergraduate
- Medical School
- Residency
- Fellowship
- Board Certification

Must be visually scannable.

Avoid:
- large prose blocks.

---

# 5. AFFILIATIONS & CREDENTIALS

Optional expandable section.

Include:
- hospital affiliations,
- academic appointments,
- awards,
- publications,
- certifications.

Keep visually lightweight.

This section exists primarily for:
- physician credibility,
- trust validation,
- prestige signaling.

---

# 6. FINAL CTA FOOTER

Large conversion-focused footer.

Include:
- booking button,
- phone number,
- office location,
- telehealth availability.

Should feel:
- calm,
- premium,
- conversion-oriented.

---

# Provider Data Model

Create a structured provider schema.

Example:

```ts
{
  slug: string
  name: string
  credentials: string
  specialty: string
  tagline: string
  bio: string[]
  photo: string

  conditions: string[]
  services: string[]

  languages: string[]

  education: {
    undergraduate?: string
    medicalSchool?: string
    residency?: string[]
    fellowship?: string[]
  }

  certifications?: string[]
  affiliations?: string[]
  awards?: string[]

  acceptsNewPatients?: boolean
  telehealth?: boolean

  phone?: string
  office?: string
}