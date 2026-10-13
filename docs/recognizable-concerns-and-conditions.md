# Recognizable concerns and conditions treated

Status: milestones 1 and 2 implemented and verified on October 13, 2026.

## Purpose

Patients may recognize a difficulty without knowing its medical name. A condition
list helps someone with an existing diagnosis, but may not help someone deciding
which type of clinician to see.

Use two complementary sections:

| Section | Patient question | Content |
| --- | --- | --- |
| Recognizable Concerns | “I am experiencing this. Could this kind of care help?” | Plain-language experiences and a short explanation of the specialty's role. |
| Conditions Treated | “I have this diagnosis. Does this practice treat it?” | The practice's verified conditions and areas of care. |

The internal component name can be Recognizable Concerns. Patient-facing headings
should fit the specialty and practice voice.

## Shared component and standard content

Build one shared Astro component for layout, typography, accessibility, and theme
behavior. Keep reusable specialty copy outside `practice.json`, in a shared content
directory under `shared/`. The initial catalog lives in `shared/content/care-guidance.json`.
Do not make the build consume this planning document or other `docs/`
files; Cloudflare excludes `docs/*` from build triggers.

Each standard content entry contains:

- A suggested heading and short introduction.
- Four to six recognizable concerns written in everyday language.
- A specialty catalog may offer more concerns, with four to six default IDs.
  Each practice can select a different set of four to six through `concernIds`.
- A short, general explanation of how that type of clinician can help.
- Retained authoritative references and a review date for clinical content.

Initial content keys:

| Key | Suggested heading | Content direction |
| --- | --- | --- |
| `pulmonology` | When to see a pulmonologist | Persistent cough, breathlessness, wheezing, and sleep-related breathing concerns. |
| `psychiatry` | When psychiatric care may help | Changes in mood, attention, sleep, or anxiety that affect everyday life. |
| `psychotherapy` | What might bring you to therapy? | Relationship difficulties, grief, recurring emotional patterns, or feeling stuck. |

These are draft directions, not approved clinical copy. `psychotherapy` is the
reusable category for Maya Bennett's example; do not create a Maya-specific shared
content key.

Use the [mental health terminology guidance](content/mental-health-terminology.md)
when selecting psychiatry and psychotherapy content. They can coexist when the
practice offers both. Keep professional roles and actual services explicit;
do not infer either from a clinician's title.

Explain why seeking care can matter calmly. Describe daily impact without
fear-based escalation or implying inevitable deterioration. Keep urgent concerns,
such as coughing up blood, separate from routine appointment prompts and review
the associated guidance before publishing.

## What belongs in practice.json

`practice.json` selects the shared content and retains facts about the particular
practice. The implemented selector for the Maya pilot is:

```json
"careGuidance": {
  "contentKeys": ["psychotherapy"],
  "navLabel": "How I help",
  "replaceConditions": true,
  "practiceHelp": {
    "heading": "Therapy with Dr. Bennett",
    "summary": "Practice-specific, verified or explicitly fictional care description."
  }
}
```

`careGuidance` is optional. Omit it to preserve the existing page. Supported fields:

| Field | Behavior |
| --- | --- |
| `contentKeys` | Required unique catalog keys; currently `psychiatry` and `psychotherapy`. Pulmonology remains milestone 4. |
| `heading`, `introduction`, `navLabel` | Optional wording overrides; heading and introduction are required for hybrid selection. |
| `concernIds` | Optional ordered selection of four to six unique concerns; required for hybrid selection. Shared IDs merge without duplication, with the first content key supplying wording. |
| `replaceConditions` | Optional boolean, default false. Replacement retains `#conditions`; otherwise the section uses `#care-guidance` before the condition list. |
| `practiceHelp.heading`, `practiceHelp.summary` | Optional closing block; both fields are required when the block is supplied. Omit it when care explanations already appear elsewhere. |
| `practiceHelp.treatmentSlugs` | Optional unique existing treatment slugs; link labels come from configured treatments. |

The component leaves appointment actions in existing page sections, preserving
preview and fictional-demo action restrictions. Replacement sections occupy the
existing conditions header slot. Additional sections appear in footer navigation
without crowding the header. Catalog source metadata remains internal; its review
date records source and editorial review, not clinician approval.

Local-review refinement, October 13: keep the public section concise with one
introductory sentence, six brief concerns, and a short practice-help summary.
Remove the separate “Why explore care?” and general specialty-explanation paragraphs.
The introduction incorporates the reason to explore care; practice-help copy
explains the relevant service. Do not add another appointment CTA in this section.
Centex retains its treatment information links in the existing Treatment Options section.

Maya's section ends after the six concerns. Its purpose is to help patients feel
recognized through everyday experiences. Do not repeat her treatment approach or
add another consultation prompt; those belong in the existing provider and
appointment sections. A practice-help block is optional and should add distinct
information rather than repeat the rest of the homepage.

The psychiatry entry follows the same recognition-first approach: concrete,
everyday experiences instead of clinical labels or another explanation of
psychiatric evaluation. Centex also omits the closing care-summary block because
its provider and treatment sections already explain those services. Its conditions
and TMS/Spravato content remain separate from the recognizable experiences.

Centex selects concerns for low mood, worry/panic, attention, mood/energy changes,
unwanted thoughts or repeated routines, and unusual perceptual experiences. Keep
these entries reusable in the psychiatry catalog, with authoritative sources;
the practice's explicit `concernIds` controls selection. Do not automatically infer
selection or diagnosis from a conditions list. The broad default selection retains
sleep and ongoing difficulty despite previous care for other practice contexts.

| Shared standard content | Practice-specific configuration |
| --- | --- |
| General recognizable concerns | Selected specialty content key and optional copy overrides |
| General explanation of the specialty | Verified description of how this practice helps |
| General reasons to explore evaluation or care | Actual services, tests, treatments, and patient population |
| Clinical sources and content review metadata | Conditions treated and their practice-specific evidence ledger |
| Default section wording | Provider identity, location, insurance, contact details, and appointment links |

Reuse existing provider, service, financial, and contact configuration wherever
possible. Do not duplicate those facts in the new selector. Allow small optional
overrides when the standard copy does not fit; avoid copying the entire shared
entry into every practice file.

General educational content must not imply that the practice provides every
intervention associated with its specialty. A listed condition must come from
verified practice information, not an LLM's inference about clinician scope.

## Coexistence on the homepage

For pulmonology and psychiatry, introduce recognizable concerns before the
provider section, immediately after the hero, and retain the Conditions Treated
list after providers. Keep both available without repeating the same
explanations. A suggested reading sequence is:

1. Practice introduction.
2. Recognizable concerns and the specialty's role.
3. Providers and verified descriptions of how the practice helps.
4. Conditions treated and treatment options.
5. Insurance, appointment information, and other practical details.

This sequence places Centex's concerns before its providers. Replacement concerns,
such as Maya's, retain their existing position after the provider introduction.
It does not move existing appointment actions. “How the practice helps” can be
the closing part of the new component rather than another standalone section.

Dr. Dronavalli would select `pulmonology` and retain the full existing areas-of-care
list. Psychiatry practices would select `psychiatry` where appropriate.

Maya Bennett already has a “What brings you here?” concerns section. Adapt or
replace that overlapping section with the psychotherapy version rather than add
a second similar section. Preserve any useful concern labels without forcing a
diagnosis-oriented “Conditions We Treat” heading onto psychotherapy content.

## Centex: psychiatry with advanced treatment options

Centex can use the shared `psychiatry` content while addressing two patient entry
points:

| Patient situation | Content path |
| --- | --- |
| “My mood, anxiety, sleep, or attention is affecting daily life.” | Recognizable concerns, followed by psychiatric evaluation and available care. |
| “I have depression, and previous treatment has not helped enough.” | Continued difficulties despite prior treatment, followed by evaluation of additional care options. |

Keep three complementary sections available:

- **Recognizable Concerns:** everyday experiences, including continued difficulty
  despite previous depression treatment where relevant to the practice.
- **Conditions Treated:** Centex's verified diagnoses and areas of care.
- **Treatment Options:** Centex's verified services, linking to its existing TMS
  and Spravato pages.

The shared psychiatry entry stays general. Centex's `practice.json` supplies a
small practice-specific addition explaining how the practice helps and connects
patients to advanced care. Reuse its existing `treatments` entries for TMS and
Spravato details and links; do not duplicate those treatment descriptions in the
new component or create a separate Centex specialty-content key.

Do not map a symptom or unsuccessful prior treatment directly to TMS or Spravato.
Explain that an evaluation determines which options may fit. The concerns section
helps patients recognize a reason to explore care; it does not establish a
diagnosis or treatment eligibility.

## Scope and verification

This proposal does not require individual condition pages, a blog, or a full
condition-content library. It creates a reusable entry point for patients who do
not know a diagnosis. Add deeper pages later when they answer a specific practice
question or explain a service that needs more detail.

Implementation should remain optional for existing practices. Verify theme
coverage, mobile readability, section navigation, indexing behavior, and unchanged
output for practices that do not select this component. Follow the repository's
shared-change verification workflow when implementing it.

## Milestone plan

Milestones 1 and 2 are implemented and verified. After local copy review, the user
authorized the deferred verification on October 13, 2026. Configuration regressions,
HTML validation, and all output contracts passed. Reviewed contract differences
contain only expected section-navigation additions for the pilots and their
containing builds. All 37 theme, provider, and analytics browser tests passed,
including mobile/tablet/desktop concerns checks and fictional-demo restrictions.
Captured pilot screenshots were visually reviewed. Review pages are available at
`.tmp/astro-dist/preview-all/previews/mayabennett/index.html` and
`.tmp/astro-dist/preview-all/previews/centexmh/index.html`.
Milestones 3 through 5 remain pending. This plan covers content, implementation, and local
verification. It does not authorize production deployment.

Use Maya and Centex as the first two integrations before updating all mental
health previews. Maya tests psychotherapy and replacement of an overlapping
section. Centex tests psychiatry, coexistence with conditions, and links to advanced
treatments. This catches both content patterns before the wider rollout.

### Milestone 1: Create psychotherapy and psychiatry content

Deliverables:

- Choose one simple shared content format and location under `shared/`.
- Draft the `psychotherapy` and `psychiatry` entries: heading, introduction,
  recognizable concerns, why seeking care can matter, and the specialty's role.
- Record authoritative sources and a review date. Follow the
  [mental health terminology guidance](content/mental-health-terminology.md).
- Identify where practices need to supply their own “how we help” copy. Keep
  specific services, eligibility, and appointment details out of shared defaults.

Completion target: review both entries as patient-facing copy. Confirm that they
use plain language, avoid diagnosis or outcome promises, and distinguish general
care descriptions from practice offerings. Do not implement the component yet.

### Milestone 2: Build the component and pilot Maya and Centex

Deliverables:

- Add one theme-aware component and a loader for the shared content.
- Add optional `careGuidance` selection and narrowly scoped overrides to the
  validated practice configuration. Practices without selection retain their output.
- Integrate section visibility and navigation through the existing homepage
  registry. Reuse existing contact actions and preview restrictions.
- Apply psychotherapy content to Maya. Replace or adapt her overlapping concerns
  section; retain her fictional-demo disclosures and disabled clinical actions.
- Apply psychiatry content to Centex. Retain Conditions Treated and Treatment
  Options, and connect the practice-specific explanation to existing TMS and
  Spravato pages without implying treatment eligibility.

Completion target: inspect both pilots at mobile and desktop widths using built
`file://` pages. Confirm section order, navigation, links, and absence of repeated
content. Run `npm run verify:change` with the required browser suites selected by
the repository workflow. Review intentional output-contract differences before
explicit acceptance; confirm unselected practices remain unchanged.

### Milestone 3: Roll out to all applicable mental health previews

Deliverables:

- Before rollout, update the WHOIS skill to recommend Recognizable Concerns
  content from explicit practice-service evidence. Record psychiatry,
  psychotherapy, or both, with source URLs, supporting excerpts, patient-age
  restrictions, and whether each claim applies to the practice or one provider.
  Distinguish integrated therapeutic support during medication visits from regular
  psychotherapy appointments. For hybrid practices such as the supplied Cibola
  example, recommend one combined section with a practice-specific explanation
  of the care arrangements. Keep this care model separate from an insurance/self-pay
  hybrid payment model. Mark missing or conflicting information as unresolved;
  do not infer services from titles, credentials, or educational articles.
  The assessment recommends selection; verified practice configuration controls
  what the site publishes. This is a future skill update, not work performed here.
- Review every mental health preview's verified services and patient population
  before selecting shared content. Include North Hills, Northwest, and Mariposa,
  alongside the Maya and Centex pilots.
- Use psychiatry or psychotherapy content according to actual offerings. For
  practices offering both, combine relevant wording within one section without
  duplicating it. Confirm age-specific wording where practices serve children.
- Preserve condition lists where useful. Adapt existing therapy concerns sections
  rather than stacking overlapping sections.
- Keep any practice-specific factual additions linked to their evidence ledgers.
  Document any preview left out and the missing information needed to include it.

Completion target: review the updated WHOIS guidance against psychiatry-only,
psychotherapy-only, hybrid, and insufficient-evidence examples. Confirm the
assessment records evidence and recommends content without guessing services.
Review all affected previews, including editorial,
structured-clinical, and reflective layouts. Run the applicable repository
verification for the final change scope, sequentially. Confirm provider,
treatment, appointment, and fictional-demo behavior remains intact. Dr. Dronavalli
remains unchanged until milestone 5; do not assign mental health content to him or
the starter template.

### Milestone 4: Create pulmonology content

Deliverables:

- Add `pulmonology` content using the format and component established earlier.
- Extend the WHOIS content-selection guidance to recognize verified pulmonology
  services and recommend `pulmonology`, with the same evidence and scope rules.
- Explain recognizable breathing and sleep-related concerns, why evaluation can
  matter, and the general role of a pulmonologist in plain language.
- Source and review clinical wording. Separate urgent-care guidance from routine
  appointment prompts; do not present coughing up blood as a routine booking cue.
- Keep Dr. Dronavalli's actual tests, treatments, and visit instructions out of the
  shared entry.

Completion target: review the content and references. Confirm it fits the existing
component without a new layout or practice-only styling. Run checks affected by
adding shared content; no deployment or practice activation occurs in this milestone.

### Milestone 5: Apply pulmonology content to Dr. Dronavalli

Deliverables:

- Select `pulmonology` in Dr. Dronavalli's configuration.
- Add a concise, verified description of how his practice helps, using existing
  services and contact information.
- Place the new section before Conditions Treated and retain the full existing
  areas-of-care list. Avoid duplicating descriptions or changing unrelated sections.
- Update the practice evidence ledger for any new factual claims.

Completion target: inspect the calm-healthcare layout at mobile and desktop
widths. Verify navigation and contact actions, then run
`npm run verify:site -- drdronavalli`. If shared implementation changes are needed,
use `npm run verify:change` instead and check affected mental health previews.
Production release follows only when separately authorized, using the repository's
commit, push, and automatic deployment workflow.
