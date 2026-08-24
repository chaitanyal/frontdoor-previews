# Source Extraction

## Source Inventory

- User-supplied copy and affiliation correction, received 2026-08-22.
- Hillcroft Medical Center pulmonology page: https://hmcdoctors.com/find-doctor-by-specialty/pulmonology/, observed 2026-08-22. The page lists Goutham Dronavalli, M.D. as an HMC pulmonologist in Sugar Land.
- User-supplied Google Maps screenshots, received 2026-08-23. The physician-specific listing is named “Dr. Goutham Dronavalli, MD” and displays a 4.8 rating from 17 reviews.
- User-supplied Google Place ID `ChIJHVog23DAQIYRG8UCQY0AE5Q`, received 2026-08-23.

## Field Evidence Ledger

| Field | Proposed value | Status | Source | Observed | Notes |
|---|---|---|---|---|---|
| `providers[0].bioParagraphs[0]` | States that Dr. Dronavalli provides care through Hillcroft Medical Center at its Sugar Land location | confirmed | User correction; HMC pulmonology page | 2026-08-22 | User supplied the final wording |
| `providers[0].bioLinks[0]` | Hillcroft Medical Center pulmonology page | confirmed | HMC pulmonology page | 2026-08-22 | Public informational affiliation link |
| `location.googleReviewSummary.placeId` | `ChIJHVog23DAQIYRG8UCQY0AE5Q` | confirmed | User-supplied Google Place ID | 2026-08-23 | Physician-specific listing; the ID is stored but the rating is retrieved live |
| `location.googleReviewSummary.url` | `https://maps.app.goo.gl/52RpZsPXu8jd1cwK8` | confirmed | User-supplied Google Maps share link | 2026-08-23 | Public physician listing; no review text is republished |

## Practice Facts

No other practice facts were changed in this targeted update.

## Providers

Dr. Goutham Dronavalli is listed by Hillcroft Medical Center as a pulmonologist in Sugar Land.

## Services and Conditions

No services or conditions were changed in this targeted update.

## Insurance and Payment

Not evaluated for this targeted update.

## Location, Hours, and Contact

The HMC pulmonology page identifies its pulmonology service and Dr. Dronavalli with the Sugar Land location. Existing hours and contact information were not changed.

## Links, Portals, Forms, and Resources

- Provider biography affiliation link: https://hmcdoctors.com/find-doctor-by-specialty/pulmonology/
- Google rating links to the public physician-specific Google Maps listing through the user-supplied share URL. The observed 4.8 rating from 17 reviews is evidence only; neither value is stored in `practice.json`, and the site does not display the review count.

## Images and Asset Candidates

No image changes were requested.

## Content and SEO Migration

Not evaluated for this targeted update.

## Conflicts or Uncertainty

None identified for the requested biography affiliation statement.
