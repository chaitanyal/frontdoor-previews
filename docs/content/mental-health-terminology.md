# Mental health terminology for FrontDoor content

Reference scope: United States. Sources checked October 13, 2026.
This document guides content authoring; it is not a build input or a licensing rules engine.

## Psychiatry and psychotherapy

**Psychiatry is a medical specialty.** Psychiatrists are physicians (MD or DO)
who evaluate and treat mental health conditions. Their care can include medication,
psychotherapy, and other interventions. Psychiatry is not synonymous with medication
management. [American Psychiatric Association](https://www.psychiatry.org/patients-families/what-is-psychiatry)

**Psychotherapy is a treatment method**, often called talk therapy. It uses
structured conversations and therapeutic techniques to address emotions, thoughts,
behaviors, and relationships. Multiple professional disciplines provide it.
[National Institute of Mental Health](https://www.nimh.nih.gov/health/topics/psychotherapies)

These terms describe different things and can coexist on a practice website.
Psychotherapy is not restricted to psychologists, and psychiatric care is not
restricted to medication appointments.

## Professional roles

The following summarizes common roles. Actual services depend on training,
licensure, jurisdiction, and what the practice offers.

| Role | Psychotherapy | Medication prescribing |
| --- | --- | --- |
| Psychiatrist (MD/DO) | Can provide it; confirm actual offering | Yes |
| Psychiatric mental health nurse practitioner (PMHNP) | Can provide it within training and scope | Yes, subject to state requirements |
| Licensed clinical psychologist (commonly PhD/PsyD) | Can provide it | Usually no; some jurisdictions permit specially trained and authorized psychologists |
| Licensed clinical social worker (LCSW or equivalent) | Can provide it | No authority from this license alone |
| Licensed professional counselor (LPC/LMHC or equivalent) | Can provide it | No authority from this license alone |
| Licensed marriage and family therapist (LMFT) | Can provide it | No authority from this license alone |

Sources: [American Psychiatric Association](https://www.psychiatry.org/patients-families/what-is-psychiatry),
[NIMH's psychotherapy provider overview](https://www.nimh.nih.gov/health/topics/psychotherapies),
[APNA's psychiatric nursing FAQ](https://www.apna.org/about-psychiatric-nursing/faqs/),
[SAMHSA's provider overview](https://www.samhsa.gov/find-support/learn-about-treatment/types-of-providers),
and [American Psychological Association's psychotherapy guide](https://www.apa.org/topics/psychotherapy/understanding).

This table is not exhaustive. Psychiatric teams can also include physician
assistants. Preserve their verified role and offered services; do not label every
member of a psychiatric practice a psychiatrist.

“Dr.” alone does not establish that someone is a physician. State the verified
professional role alongside the name. A doctoral degree alone does not establish
clinical licensure, psychotherapy competence, or prescribing authority.

## Relevance to FrontDoor Health

FrontDoor reuses layouts and content across practices with different clinician
types. Correct terminology helps patients understand who they will see and what
kind of care they can arrange.

- **Provider identity:** distinguish psychiatrists, psychologists, nurse
  practitioners, physician assistants, and therapists on cards and profile pages.
  Preserve credentials and specialty fields; use existing shared identity formatting.
- **Recognizable Concerns:** select general psychiatry or psychotherapy content
  based on verified care offerings. These are content choices, not mutually
  exclusive classifications of a practice.
- **How the practice helps:** describe actual services rather than infer them
  from a degree, title, or specialty. Do not add psychotherapy automatically to a
  psychiatrist's profile or medication management to a psychologist's profile.
- **Conditions and treatments:** separate the concerns a practice treats from
  the methods it offers. Do not imply that every clinician provides every practice
  treatment or that a concern establishes eligibility for an intervention.
- **Patient actions:** match appointment labels and expectations to the actual
  service. Do not promise a therapy session when the destination schedules a
  medication-management visit.

### Existing practice examples

**Maya Bennett** is a fictional clinical psychologist offering psychotherapy in
the current configuration. Use the shared `psychotherapy` direction. Keep her
psychologist role explicit and retain fictional-demo disclosures. Do not imply
physician status or medication prescribing because her name uses “Dr.”

**Centex** combines a psychiatrist and physician assistants in its current roster,
with configured TMS and Spravato treatment pages. The shared `psychiatry` direction
can explain the general role of psychiatric care. Practice-specific content should
describe verified services and link to those treatment pages. Add psychotherapy
only if the practice confirms that offering. Do not call the entire team psychiatrists.

These examples reflect repository configuration, not an independent licensure audit.

## Content and configuration boundaries

| Location | Responsibility |
| --- | --- |
| This document | Terminology, authoring guidance, and source references |
| Future shared content under `shared/` | General descriptions of psychiatric care and psychotherapy; recognizable concerns |
| `sites/<practice>/practice.json` | Verified provider roles, credentials, actual services, conditions, treatment entries, and contact actions |
| Practice `source_extraction.md` | Evidence for practice-specific claims and unresolved factual questions |

Use this guidance when drafting or reviewing content. Do not encode the table as
automatic permission logic or infer services from credentials in the builder.
Check current jurisdiction-specific requirements when making a specific scope claim.
Keep proposed shared content outside `docs/`; Cloudflare excludes `docs/*` from build triggers.

See [Recognizable concerns and conditions treated](../recognizable-concerns-and-conditions.md)
for the proposed component and homepage arrangement.
