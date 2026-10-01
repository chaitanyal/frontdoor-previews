# Centex treatment-page copy and evidence

Observed October 1, 2026. Editorial-healthcare theme. Published text is maintained
in `sites/centexmh/practice.json`; this document records source mapping and exclusions.

## Sources

- **T1** User-supplied [NeuroStar HTML](NeuroStarTMSTherapy.html), corresponding to
  [the official clinic TMS page](https://www.centexmh.com/tms/index.htm).
  Supports clinic offering, adult depression focus, office treatment and contact.
  No publication date visible; references and marketing figures are historical.
- **T2** User-supplied [Spravato HTML](spravato.html), corresponding to
  [the official clinic Spravato page](https://www.centexmh.com/spravato/index.htm).
  Supports the clinic offering and treatment-resistant depression positioning.
  Supplied HTML is authoritative for retained clinic content; web extraction of
  the live URL failed on the observation date.
- **T3** [NeuroStar safety and prescribing information](https://neurostar.com/safety/):
  adult MDD indication after insufficient prior antidepressant improvement;
  magnetic stimulation, treatment-site discomfort, rare seizure risk and metal
  contraindication. Manufacturer resource, not evidence of this clinic's exact
  device generation, protocol, additional indications or outcomes.
- **T4** [NeuroStar treatment overview](https://neurostar.com/what-is-neurostar-advanced-therapy/):
  awake office treatment without sedation/anesthesia. Protocol durations vary;
  no current manufacturer duration is assigned to Centex.
- **T5** [Spravato prescribing information and Medication Guide](https://www.janssenlabels.com/package-insert/product-monograph/prescribing-information/SPRAVATO-pi.pdf),
  revised March 2026, reviewed October 1, 2026. Supports adult TRD with/without
  an oral antidepressant, healthcare-professional supervision, monitoring for
  at least two hours, transportation/driving restrictions, REMS and safety warnings.
  Also cross-checked against the [FDA label revised April 2025](https://www.accessdata.fda.gov/drugsatfda_docs/label/2025/211243s019lbl.pdf).
  The March 2026 manufacturer label is the newer reference used for the page.
- **T6** Existing clinic ledger S2/S3: verified Round Rock office and phone.

## Field mapping

| Published field | Status | Evidence | Scope |
| --- | --- | --- | --- |
| `treatments[tms].name`, service existence and location | confirmed | T1, T6 | Practice-level offering; no named clinician. |
| TMS description and evaluation rationale | confirmed | T1, T3 | Adult depression after insufficient medication response. |
| TMS visit expectations and safety | confirmed | T1, T3, T4 | General treatment education; exact protocol omitted. |
| `treatments[spravato].name`, service existence and location | confirmed | T2, T6 | Practice-level offering; no certification claim. |
| Spravato indication, supervised administration and monitoring | confirmed | T2, T5 | Adult treatment-resistant depression. |
| Spravato transportation and safety | confirmed | T5 | General labeled requirements, not bespoke clinic policy. |
| Page CTAs and planning instructions | editorial organization | T1, T2, T6 | Contact the office; no guarantee of scheduling, eligibility or coverage. |

## Editorial decisions and unknowns

- Use direct practice voice and concise education; no research qualifiers in
  patient-facing text. Link full clinical guidance as ordinary public resources.
- TMS page omits the historical 18,000-patient count, remission percentages,
  comparison table against antidepressant side effects and the 37-minute schedule.
- Spravato page describes essential safety and practical expectations without
  reproducing dosing instructions or claiming guaranteed improvement.
- Additional manufacturer indications (adolescent treatment, OCD and depression
  with acute suicidal ideation) do not establish clinic services. These are not
  marketed on the new pages. Centex remains an adult practice.
- No embedded manufacturer videos, stock people, copied promotional graphics,
  new patient-form workflow, free consultation, treatment price or plan-specific
  coverage is invented.
- Current equipment/protocol, treatment personnel, intake/referral process,
  Spravato REMS certification and coverage remain internal follow-up items in the
  [fact-check checklist](../fact-check-checklist.md).
- Legacy URL redirects are production-migration scope, not activated in previews.
