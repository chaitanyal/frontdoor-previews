# Reusable pulmonology concerns

Created and source-reviewed October 13, 2026. Publishable copy lives in
[`shared/content/care-guidance.json`](../../shared/content/care-guidance.json), under
`pulmonology`. This document records its scope and integration guidance; builds do
not consume it. Source review is not clinician approval.

## Patient-facing copy

**When to see a pulmonologist**

Breathing and sleep problems can show up in everyday ways.

- Getting winded walking or climbing stairs
- A cough that won't go away
- Wheezing or noisy breathing
- Frequently coughing up mucus
- Waking up gasping or being told you snore
- Feeling sleepy despite a full night's rest

Keep each concern to one recognizable phrase without a repeating description.
These describe experiences, not diagnoses, thresholds for waiting, or treatment eligibility.
The section stays focused on patient recognition rather than a repetitive
closing explanation of care. Any practice-specific care explanation belongs in practice.json.

## Clinical coverage and source mapping

- **COPD:** breathlessness with activity, ongoing cough, mucus, and wheezing cover
  common experiences described by [NHLBI](https://www.nhlbi.nih.gov/health/copd/symptoms).
  These also occur with other conditions. Retain COPD explicitly in a practice's
  verified Conditions Treated list; do not label these concerns as a COPD test.
- **Other breathing concerns:** the [American Lung Association](https://www.lung.org/lung-health-diseases/warning-signs-of-lung-disease)
  supports evaluation of persistent cough, breathlessness, mucus, and noisy breathing.
- **Breathing-related sleep concerns:** [NHLBI](https://www.nhlbi.nih.gov/health/sleep-apnea/symptoms)
  describes snoring, observed breathing pauses, gasping, and daytime sleepiness.
  Sleepiness alone does not establish sleep apnea. Select these concerns only when
  the practice's relevant sleep services are verified. Lung-only practices can
  select the four breathing concerns through `concernIds`.
- **Specialty role:** the [National Cancer Institute](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/pulmonologist)
  defines the pulmonologist's role in diagnosing and treating lung disease.
  This does not verify a particular practice's tests, treatments, or referral rules.

## Urgent symptoms remain separate

Do not place coughing up blood, severe sudden breathlessness, or acute chest pain
among routine appointment concerns. Do not imply that waiting for a specialist
appointment is the appropriate response to these symptoms.

For a future US practice integration, retain this separate, source-supported draft:

> If you cough up blood, seek medical advice promptly rather than wait for a routine appointment. Call 911 for severe difficulty breathing, or coughing up blood with chest pain or significant difficulty breathing.

[MedlinePlus](https://medlineplus.gov/ency/article/003073.htm) advises contacting a
clinician whenever blood is coughed up and immediate help with associated serious
symptoms. [NHLBI](https://www.nhlbi.nih.gov/health/copd/symptoms) identifies severe
breathing difficulty as a reason to call 911. Review this separate notice in the
actual practice layout before publishing; it is not currently rendered by the
Recognizable Concerns component. The notice is brief guidance, not exhaustive triage.

## Integration boundary

Dr. Dronavalli now selects all six concerns, supported by his official HMC profile's
pulmonary and sleep-disorder scope. The section follows the hero and retains his
existing Conditions We Treat list. His practice services and appointment
instructions remain unchanged; his evidence ledger records the selection.
WHOIS content-selection guidance also remains pending;
its scheduling/telehealth detection updates do not perform that selection.
