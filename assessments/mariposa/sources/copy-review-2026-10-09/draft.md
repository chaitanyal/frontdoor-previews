# Mariposa copy review — step 2

Status: approved by the user and applied to `practice.json` on October 9, 2026. Local preview generated; shared layout/theme changes remain step 3. The approved hero remains selected locally.

## Working approach

Write useful, original copy from a small set of reliable facts. A polished source website or interview is not required. For Mariposa, the core facts are adult psychiatry, psychodynamic psychotherapy, medication management, Dr. Lara's professional background, primarily online care, and a practice inquiry process. Current official materials were used to check accuracy, not as prose to imitate.

Voice: clear third person, naming Dr. Lara rather than implying a multi-provider team. Short, welcoming transitions; concrete descriptions instead of generic praise. An interview can enrich a later version. No interview skill is part of this step.

Evidence IDs below refer to [source and correction notes](sources.md). `safe_paraphrase` means a new expression of supported facts; `editorial_framing` means a heading or transition that adds no care claim. These labels are internal and must not appear on the site.

## Homepage draft

### Hero

`hero.title`

> Psychiatry and psychotherapy for adults.

`hero.copy`

> Dr. Alba Lara offers psychodynamic psychotherapy and medication management, with care primarily online and limited in-person appointments in Austin.

`hero.primaryCta`: **Inquire about care**
`hero.secondaryCta`: **Meet Dr. Lara**

Support: S1/S3/S4, `safe_paraphrase`; CTA wording is `editorial_framing`. The hero's existing primary link scrolls to the contact section, where the inquiry process is explained. The headline establishes the care category; the supporting sentence introduces the physician, treatment approach, and access. Avoid the longer proposed “deeper understanding” headline for this first pass.

### Provider introduction

`home.navProvidersLabel`: **Meet Dr. Lara**
`home.providerEyebrow`: **Your psychiatrist**
`home.providerTitle`: **Meet Dr. Alba Lara**

`home.providerCopy`

> Dr. Lara is board-certified in psychiatry and consultation-liaison psychiatry, the area of care where mental and physical health meet.

`providers[0].tagline`

> Her clinical focus includes mood disorders and the emotional effects of medical illness.

Support: S2/S3, `safe_paraphrase`. The introduction establishes professional background; the tagline supplies clinical focus. Together they replace the current repetition of insight, stability, and meaningful change. The tagline is used on both the homepage card and provider profile, so it remains understandable in either context.

`providers[0].heroTrustItems`: retain **Private-Pay Psychiatry**, **Psychodynamic Psychotherapy**, **Primarily Telehealth**. These add access and treatment information without repeating the proposed board-certification sentence.

### Areas of care

`conditionsIntro`

> Care may address mood and anxiety concerns, relationship patterns, self-esteem, and the emotional impact of medical illness. Dr. Lara reviews each inquiry to determine whether the practice is an appropriate fit.

Support: S3/S4/S5, `safe_paraphrase`. Keep detailed condition labels separate from this introductory sentence. Before application, reconcile the condition/service lists against current sources as described in the correction notes; do not infer that every inquiry is eligible.

Recommended future heading: **Concerns Dr. Lara works with** (`editorial_framing`). The current “Conditions We Treat” heading is hard-coded in `Conditions.astro`; this change belongs to step 3. No unsupported JSON field is proposed.

### Appointment transition

`appointmentSection.heading`

> Considering care with Dr. Lara?

`appointmentSection.summary`

> Start with the practice inquiry form. Dr. Lara will review your inquiry and contact you about next steps. For general questions, contact the office by phone or email.

Support: S4/S5, `safe_paraphrase`; heading is `editorial_framing`. Do not promise acceptance, a booked appointment, a free consultation, or an inquiry turnaround time. A response policy for existing patients' phone or portal messages is not necessarily the inquiry response policy.

The appointment component's form-link label is currently “New Patient Appointment.” Recommend **Submit a practice inquiry** during step 3 so the label matches its destination. No form submissions are part of this work.

### Access to care

`location.title`: **Online care and Austin appointments**

`location.summary`

> Appointments are primarily online. Limited in-person appointments are available in Northwest Austin on Tuesdays. The practice sees patients by appointment on Tuesdays and Thursdays.

Support: S4/S5, `safe_paraphrase`. The section's hard-coded “Visit the office” eyebrow, image treatment, and hours/status behavior require step 3 attention. This wording is ready for review but should not be applied alongside the stale weekday 9–5 schedule.

### FAQs

Suggested replacement for the current `faqs` array. Support: S4/S5, `safe_paraphrase` throughout.

**Who does Dr. Lara see?**

> Dr. Lara works with adults ages 18–64. Her practice focuses on psychodynamic psychotherapy, mood disorders, and mental health concerns that overlap with medical illness.

**Is she accepting new patients?**

> Yes, for care that fits the practice's clinical focus. Patients seeking both psychotherapy and psychiatric care with Dr. Lara are prioritized. Submit an inquiry to explore whether the practice is a fit for your needs.

**Are appointments online or in person?**

> Most appointments are online, with limited in-person availability in Northwest Austin on Tuesdays. Telehealth is available to patients located in Texas, California, Arizona, New Mexico, Missouri, or New York.

**Does the practice accept insurance?**

> Mariposa Psychiatry is private-pay and out of network with all insurance plans. The practice does not accept Medicare or Medicaid patients.

**How does payment work?**

> A credit card must be kept on file and is charged on the day of the appointment. Visit fees are listed in the Private Pay section.

**What happens after I submit an inquiry?**

> Dr. Lara reviews the information to assess whether she can provide the care you need and contacts you about next steps. Submitting an inquiry does not confirm an appointment or acceptance into the practice.

Remove the current superbill FAQ from the proposed replacement unless the policy is confirmed; the current reviewed official pages do not establish it. Absence from those pages does not mean superbills are unavailable.

## Provider profile draft

`providers[0].bioParagraphs`

> Dr. Alba Lara is a board-certified psychiatrist and psychotherapist. She completed psychiatry residency at UT Austin Dell Medical School and a consultation-liaison psychiatry fellowship at Columbia University.

> Her work includes psychiatric care for mood disorders and for people whose mental health is affected by medical illness. She also offers psychodynamic psychotherapy, which explores patterns in emotional life and relationships.

Support: S2/S3, `safe_paraphrase`. This short bio is intentionally usable without a personal interview. Keep detailed credentials in Education & Training. Correct the existing fellowship labeling using S2 rather than repeating it in this new bio. Do not retain an unverified “bilingual” claim solely because it appears in the old preview.

`providers[0].whatToExpect`

1. An initial consultation to review your concerns, discuss options, and assess whether the practice is a fit.
2. Psychotherapy, medication management, or a combination, depending on the agreed treatment plan.
3. Private-pay appointments, with a card on file charged on the day of your visit.

Support: S3/S5, `safe_paraphrase`. Keep service selection conditional rather than implying every patient receives both treatments.

## Metadata

`seo.description`

> Adult psychiatry and psychodynamic psychotherapy with Dr. Alba Lara in Austin and via telehealth. Explore care, fees, and the practice inquiry process.

`providers[0].seo.description`

> Meet Dr. Alba Lara, a psychiatrist offering psychodynamic psychotherapy and medication management for adults in Austin and via telehealth.

Support: S1/S3/S4, `safe_paraphrase`. Existing page titles can remain. Remove website-production language from the current homepage description.

## Implementation boundaries and review

- No new standalone philosophy section is needed to make this draft useful. More distinctive personal voice can be developed through a later interview workflow.
- Keep hero v2 and the existing theme during the copy stage.
- Resolve the sourced factual corrections together with applying the approved copy; do not introduce conflicting contact, fees, or hours statements.
- Destination checks used `HomeHero.astro`, `ProviderTeam.astro`, `ProviderCard.astro`, `ProviderProfile.astro`, `Conditions.astro`, `AppointmentSection.astro`, `LocationFaq.astro`, and `practice-view.mjs`. No draft-specific fields were added to the schema.
- The installed copywriting skill passed its validator. After approval, site configuration and factual updates were applied with evidence recorded in `sites/mariposa/source_extraction.md`.
- `npm run verify:site -- mariposa` passed after reviewing and accepting the expected metadata changes in the practice and dependent marketing output contracts. `npm run build:marketing` regenerated `dist/previews/mariposa/`.
- Inspected the built homepage at 1440px and 390px and the provider profile at 390px. Copy fits the existing layout. Full-page captures leave the offscreen office image unloaded because it is lazy-loaded; they do not verify that image's rendering after scrolling.
- Next checkpoint: review the local copy preview. Layout-specific labels and presentation remain step 3. No commit, push, or deployment performed.
