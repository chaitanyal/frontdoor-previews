# Practice assessments and evidence

Keep research for each practice together, including prospects that do not yet have
a rendered preview:

```text
assessments/<practice-slug>/
  assessment.md          # qualification report, when available
  sources/               # source notes, screenshots, public HTML, original assets
```

Use the same slug as `sites/<practice-slug>/` when a site exists. A sources-only
folder is valid; do not invent an assessment just to fill the structure.

Record source URLs, observation dates, and uncertainty in the report or a source
inventory. Keep provider-specific evidence scoped to that provider. Retain only
relevant public or user-approved source material; do not store patient records,
credentials, or private submissions here. Temporary tools and disposable captures
belong in `.tmp/` or `/private/tmp/`.

When creating a preview, place approved facts in `practice.json`, maintain the
verified evidence ledger at `sites/<practice-slug>/source_extraction.md`, and link
that ledger to the retained sources here. Copy only selected publishable images and
patient-facing downloads into the site's `images/` and `assets/`. The builder does
not publish assessment folders. Archived originals are excluded from the default
image-conversion scan.

## Current reports

- [Central Texas Mental Health](centexmh/assessment.md)
- [North Hills Psychiatry](northhillspsychiatry/assessment.md)
- [Northwest Psychiatry](northwestpsychiatry/assessment.md)

Additional retained material: [Dr. Dronavalli](drdronavalli/sources/) and
[Mariposa](mariposa/sources/).
