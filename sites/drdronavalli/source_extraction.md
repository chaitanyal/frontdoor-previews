# Source Extraction

## Source Inventory

- User-supplied copy and affiliation correction, received 2026-08-22.
- Hillcroft Medical Center pulmonology page: https://hmcdoctors.com/find-doctor-by-specialty/pulmonology/, observed 2026-08-22. The page lists Goutham Dronavalli, M.D. as an HMC pulmonologist in Sugar Land.
- User-supplied Google Maps screenshots, received 2026-08-23. The physician-specific listing is named “Dr. Goutham Dronavalli, MD” and displays a 4.8 rating from 17 reviews.
- User-supplied Google Place ID `ChIJHVog23DAQIYRG8UCQY0AE5Q`, received 2026-08-23.
- User-supplied Google Maps share link, resolved 2026-08-26. The physician-specific listing resolves to coordinates `29.6042864, -95.6318986`.
- User-supplied Memorial Hermann physician-profile screenshot, received 2026-08-26. The visible profile names Sugar Land and nine surrounding Houston-area communities under “Cities Served.”

## Field Evidence Ledger

| Field | Proposed value | Status | Source | Observed | Notes |
|---|---|---|---|---|---|
| `providers[0].bioParagraphs[0]` | States that Dr. Dronavalli provides care through Hillcroft Medical Center at its Sugar Land location | confirmed | User correction; HMC pulmonology page | 2026-08-22 | User supplied the final wording |
| `providers[0].bioLinks[0]` | Hillcroft Medical Center pulmonology page | confirmed | HMC pulmonology page | 2026-08-22 | Public informational affiliation link |
| `location.googleReviewSummary.placeId` | `ChIJHVog23DAQIYRG8UCQY0AE5Q` | confirmed | User-supplied Google Place ID | 2026-08-23 | Physician-specific listing; the ID is stored but the rating is retrieved live |
| `location.googleReviewSummary.url` | `https://maps.app.goo.gl/52RpZsPXu8jd1cwK8` | confirmed | User-supplied Google Maps share link | 2026-08-23 | Public physician listing; no review text is republished |
| `practice.geo` | Latitude `29.6042864`, longitude `-95.6318986` | confirmed | User-supplied Google Maps share link | 2026-08-26 | Coordinates resolved from the physician-specific listing and emitted in the `MedicalClinic` JSON-LD |
| `practice.serviceArea` | Greater Houston area; Missouri City, Stafford, Richmond, Pearland, Bellaire, and Alief | confirmed | User-supplied Memorial Hermann physician-profile screenshot | 2026-08-26 | Conservative subset of the visibly listed cities; rendered as practice-level homepage copy and `MedicalClinic.areaServed` |

## Practice Facts

No other practice facts were changed in this targeted update.

## Providers

Dr. Goutham Dronavalli is listed by Hillcroft Medical Center as a pulmonologist in Sugar Land.

## Services and Conditions

No services or conditions were changed in this targeted update.

## Insurance and Payment

Not evaluated for this targeted update.

## Location, Hours, and Contact

The HMC pulmonology page identifies its pulmonology service and Dr. Dronavalli with the Sugar Land location. The physician-specific Google Maps share link resolves to `29.6042864, -95.6318986`; these coordinates are used only for the office's `MedicalClinic` structured data. A Memorial Hermann physician-profile screenshot visibly lists Alief, Bellaire, Galena Park, Houston, Missouri City, Pearland, Richmond, South Houston, Stafford, and Sugar Land as cities served. The homepage uses a conservative six-community subset as practice-level service-area copy; it does not publish the profile's large ZIP-code list. Existing hours and contact information were not changed.

## Links, Portals, Forms, and Resources

- Provider biography affiliation link: https://hmcdoctors.com/find-doctor-by-specialty/pulmonology/
- Google rating links to the public physician-specific Google Maps listing through the user-supplied share URL. The observed 4.8 rating from 17 reviews is evidence only; neither value is stored in `practice.json`, and the site does not display the review count.

## Images and Asset Candidates

No image changes were requested.

## Content and SEO Migration

Not evaluated for this targeted update.

## Conflicts or Uncertainty

None identified for the requested biography affiliation statement.

## Recognizable concerns integration — October 13, 2026

Selected the reusable `pulmonology` entry from
[`shared/content/care-guidance.json`](../../shared/content/care-guidance.json).
Six concerns describe breathlessness with activity, persistent cough, wheezing,
ongoing phlegm, breathing interruptions during sleep, and daytime sleepiness.
The shared catalog retains clinical sources and its review date; these experiences
are general educational framing, not diagnoses or additional practice services.

The [official HMC physician profile](https://hmcdoctors.com/find-a-doctor-by-name-2/goutham-dronavalli-pulmonology/),
observed October 13, 2026, names Dr. Goutham Dronavalli in its visible heading and
lists bronchitis, asthma, COPD, emphysema, shortness of breath, and “Sleep Apnea and
Sleep Disorders.” This supports the pulmonary and sleep scope of the selected
concerns. Its browser title incorrectly names another physician; the visible
heading, body, phone, and linked pulmonology directory identify Dr. Dronavalli.
Do not use that title as evidence for provider identity.

The new section follows the hero, before the provider introduction. Conditions
We Treat retains the existing complete list. No closing practice-help paragraph
was added because the existing provider section already explains his care.
Existing appointment, portal, and emergency instructions remain. Coughing up
blood and severe acute symptoms are excluded from routine concerns; see
[separate urgent-symptom guidance](../../docs/content/pulmonology.md).

Local verification: configuration regressions, HTML validation, and all output
contracts passed. Accepted contract differences add only concerns-navigation
links. All 37 theme, provider, and analytics browser tests passed; new assertions
check six concerns, section order, and condition-list preservation at 390, 768,
and 1440 pixels. Mobile and desktop screenshots were visually inspected. No
production deployment was performed for this integration.

## Provider biography refinement — October 13, 2026

At the user's request, shortened the first provider biography paragraph while
preserving fellowship training at Baylor College of Medicine, subsequent lung
transplantation work at St. Luke’s Medical Center, the Associate Professor role
at UTHealth Houston, and pulmonary/sleep care through HMC in Sugar Land. The
official HMC physician profile linked above supports the training, transplant,
and academic background. Only `providers[0].bioParagraphs[0]` changed; the homepage
tagline and second biography paragraph remain unchanged.

## Testing FAQ correction — October 13, 2026

Removed allergy immunotherapy from `faqs[1].answer` because it is treatment,
not diagnostic testing. The [American College of Allergy, Asthma & Immunology](https://acaai.org/allergies/management-treatment/allergy-immunotherapy/)
supports this distinction. The answer retains the existing testing options,
uses “breathing tests” for pulmonary function testing, and removes internal
source-attribution wording. This correction does not change the practice's
service offerings.

## Appointment wording alignment — October 13, 2026

At the user's request, aligned home/provider appointment actions to “Request
Appointment.” The appointment heading, summary, and FAQ now describe the existing
Healow route and office phone option. The scheduling section uses the optional
`appointmentSection.primaryCtaLabel`; its destination and tracking remain unchanged.
The public Healow page identifies Dr. Dronavalli, but the full booking/confirmation
process was not tested. Request wording avoids asserting immediate confirmation.

The FAQ no longer recommends email for appointment requests. Retained original
contact notes describe email as unmonitored; its current role has not been
confirmed. The existing email contact remains available without a new promise
about response times. Emergency guidance remains distinct from routine requests.

## Persuasive copy refinement — October 13, 2026

Applied the user-approved tagline to the homepage card and provider page. It
names Baylor fellowship training, lung-transplant experience, and academic
medicine before describing the purpose of care. The official HMC physician
profile linked above supports that experience. “Helps patients overcome” remains
benefit framing, not a guarantee of cure or a reported treatment outcome.

Simplified three provider service labels to “Breathing tests (pulmonary function
testing),” “Home testing for sleep apnea,” and “CPAP / BiPAP treatment management.”
These paraphrase the existing services without changing their scope. The expert
headline, biography, concerns, and appointment instructions remain unchanged.
