# New-practice contact research table

Compiled October 6, 2026 from retained evidence. This table summarizes the
[structured JSON records](../assessments/new-practice-contact-research.json).
It does not represent a fresh online verification or delivery test.

| Practice | Person and filing role | Published email | WA filing | LinkedIn | Psychology Today |
| --- | --- | --- | --- | --- | --- |
| Silent Minds Psychiatry | Jimmy Callo; executor and authorized signer (ARNP) | `jimcallo27@icloud.com` (WA filing, p. 1) | [Certificate of Formation](../assessments/silentminds/SILENTMINDS_PSYCHIATRY_CERTIFICATE_OF_FORMATION.pdf), Oct 1, 2026; UBI 606301343 | [Profile](https://www.linkedin.com/in/jimmy-callo-a18a96a1); corroborated candidate ([retained export](../assessments/silentminds/Jimmy_Callo.pdf)) | Not recorded |
| Elwell Psychiatry | Edina Wede Carr; founder (explicit title) | `elwellpsychiatry@gmail.com` (WA filing, p. 1) | [Certificate of Formation](../assessments/elwell/certificate_of_formation.pdf), Sep 24, 2026; UBI 606294169 | Not recorded | [Profile](https://www.psychologytoday.com/us/psychiatrists/edina-wede-carr-bothell-wa/1761666); corroborated candidate ([retained screenshot](../assessments/elwell/Psychology_Today.png)) |
| Mist and Meadow Psychiatry | Yvonne Boadu; governor and authorized signer | `contact@mistandmeadowpsychiatry.com` (WA filing, p. 1) | [Initial Report](../assessments/mistandmeadow/MistAndMeadows.pdf), Sep 22, 2026; UBI 606291489; formation certificate not retained | [Possible match](https://www.linkedin.com/in/yvonne-boadu-05a161130); entity connection unconfirmed ([assessment](../assessments/mistandmeadow/assessment.md)) | Not recorded |
| Good Company Mental Health | Shersha Greene; executor and authorized signer | `shersha@goodcompanymentalhealth.com` (WA filing, p. 1) | [Certificate of Formation](../assessments/GoodCompanyMentalHealth/GoodCompanyMentalHealth.pdf), Oct 2, 2026; UBI 606302045 | [Profile](https://www.linkedin.com/in/shersha-greene-61828030); corroborated candidate ([retained export](../assessments/GoodCompanyMentalHealth/ShreshaGreeneLinkedIn.pdf)); entity not named | Not recorded |
| Unknown practice | Jessica Davis; role not established | Unknown | Unknown | Not recorded | User supplied URL after agent search miss; exact URL not retained in reviewed material |

Emails are attributed to the filing, not to LinkedIn or Psychology Today. A
professional profile match is recorded separately from the filing's person/entity
relationship. All email delivery remains untested. Missing profile fields mean
unknown or not recorded, not that a profile does not exist.

## Structured record conventions

The JSON contains two related tables: `contacts` and `sources`.

The current populated records are WA examples. TX and CA intake will use
user-supplied local CSVs as described in the [intake workflow](../../frontdoor-leadgen/docs/new-practice-contact-research.md#intake-paths-by-state).
Before adding those records, generalize the WA-specific fields to jurisdiction,
entity ID, filing type, and filing date while preserving existing source references.
A TX/CA CSV source must retain its file identity, original column, and data-record
number; a CSV is not labeled as a formation certificate. Exact mappings depend on
the supplied exports and have not yet been implemented.

- `contacts`: one row per person/practice candidate, with stable `id`, practice and
  contact names, exact filing role, published email, WA identifier/document/date,
  profile URLs, profile matching status, and research gaps.
- `sources`: stable source `id`, source type, original URL when retained, repository
  path to evidence, a page/section locator, and discovery provenance.
- `field_sources`: maps each supported contact field to one or more source IDs.
  This permits an email, name, or profile URL to have its own attribution.
- `null`: unknown or not retained. Never replace it with a guessed profile/email.
- `discovered_by`: `user`, `agent`, or `not_recorded`. Historical discovery method
  remains `not_recorded` unless evidence establishes it. Opening or corroborating
  a supplied source is separate from finding it.
- `wa_filed_date`: date on the retained document; an Initial Report date is not
  silently promoted to a formation date or clinical opening date.

For a new contact, add a source before citing its ID. Add source references for
each populated factual field. Keep original profile URLs and exact spellings.
Source paths are relative to the repository root; new retained evidence goes in
`assessments/<practice-slug>/sources/`. Keep research records out of published
practice configuration until facts are approved for that purpose.

When updating existing records, change a value only with supporting evidence and
retain material contradictions in `research_gaps`. Update the readable table
alongside its JSON record. An incomplete record such as Jessica's can be completed
once the actual source URL and practice relationship are available.

Use the [contact-research workflow](../../frontdoor-leadgen/docs/new-practice-contact-research.md) for search
queries, fallback searches, source review, and the limits of automation.
