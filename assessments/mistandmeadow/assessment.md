# Mist and Meadow Psychiatry — Practice Intelligence Report

Assessed: October 5, 2026 (America/Chicago). Lightweight review of the live homepage, WHOIS/RDAP, DNS, a 390 × 844 mobile view, and retained filing evidence.

## Practice Overview

- **Legal entity:** MIST AND MEADOW PSYCHIATRY PLLC; **UBI:** `606291489`; active Washington PLLC in the [registry screenshot](./MistAndMeadow.png).
- **Formation/registration date:** September 22, 2026, from the registry screenshot. The retained [PDF](./MistAndMeadows.pdf) is an **Initial Report**, not a Certificate of Formation; its filing/effective date is also September 22. Retain the formation certificate if event-level proof is needed.
- **Governor and authorized signer:** Yvonne Boadu, named in the Initial Report; ownership percentage and founder title are not established.
- **Specialty:** Psychiatry inferred from the entity name; actual services and provider count are unconfirmed.
- **Business contact:** `contact@mistandmeadowpsychiatry.com`, published in the Initial Report. No phone is supplied there or on the homepage. Mailbox delivery has not been tested.

## Website and Technology

[The live site](https://mistandmeadowpsychiatry.com/) returns HTTP 200 with title **Coming Soon** and the message: “We're under construction. Please check back for an update soon.” This is an existing domain with a placeholder website, not an absent or purchasable domain.

- **Detected:** Squarespace hosting/platform, based on the server header, assets, and placeholder branding. A completed Squarespace site or designer engagement is not confirmed.
- **Not detected on the inspected page:** provider biography/photo, services, office details, contact email/phone, appointment CTA, forms, patient portal, booking vendor, analytics/tag manager, or patient-acquisition links.
- **Metadata:** no meta description or healthcare JSON-LD; `robots=noindex` is present. The index exclusion is appropriate for a temporary placeholder, but should be reviewed when real content launches.
- **Navigation/blog:** no first-level practice navigation, blog index, or article links exist on the homepage, so no additional pages were fetched. The helper's blog detection is a Squarespace platform false positive; no actual blog was found.
- **Mobile:** the construction message is readable at 390 × 844. The long domain heading wraps mid-word. No provider identity or next step is available; there is no hidden appointment menu either.
- **Accessibility:** a heading and readable construction message are present. This was not a full accessibility audit.

## Domain and Email Infrastructure

- **Domain:** `mistandmeadowpsychiatry.com`; registrar **Squarespace Domains LLC**.
- **Registered:** September 18, 2026, 15:36:15 UTC; approximately 17 days old at assessment. [Registry RDAP](https://rdap.verisign.com/com/v1/domain/mistandmeadowpsychiatry.com); [retained response](./sources/domain-rdap.json).
- **Nameservers:** `nse1`–`nse4.squarespacedns.com`; four A records match the Squarespace-hosted site. No separate CDN was established.
- **WHOIS:** registrant organization is listed as J & T Consultants, LLC. Its relationship to the practice is unconfirmed; do not infer the clinician owns or has contracted with this company.
- **MX:** `smtp.google.com`, indicating Google-hosted email, likely Google Workspace.
- **SPF:** `v=spf1 include:_spf.google.com -all`.
- **DMARC:** `p=reject; sp=reject; adkim=s; aspf=s`.
- **DKIM:** TXT records with a public key are present at `google._domainkey`; this does not prove messages are signing and aligning correctly. Multiple TXT records were returned at that selector, so validate the configuration before describing it as fully verified.

Domain and email setup are underway. Offer to use their existing infrastructure; a domain/email setup pitch would duplicate work already evident.

## Business and Geographic Signals

The principal-office address is 100 N Howard St, Spokane, WA, also used by the commercial registered agent (with Suite R). This is a filing address, not a confirmed patient-facing clinic. The return address is in Parsippany, New Jersey. Neither address establishes clinical coverage, telehealth availability, or Washington licensure.

A [LinkedIn profile for Yvonne Boadu](https://www.linkedin.com/in/yvonne-boadu-05a161130) describes a nurse practitioner associated with Middlesex Psychiatry and TMS in New Jersey. A [Headway profile](https://care.headway.co/providers/yvonne-boadu-2) lists a New Jersey psychiatric mental-health NP. These are possible matches; their explicit connection to Mist and Meadow is not confirmed. Do not transfer those profiles' services, insurance panels, or coverage to this new entity.

Practice model, provider count, opening date, insurance/self-pay model, rates, and scheduling/intake/EHR vendors are **not confirmed**. A recent formation does not establish that the clinician is new to independent practice.

## FrontDoor Opportunity and Outreach Notes

- The current site gives visitors no way to learn about the clinician or contact the practice. A useful immediate improvement is a branded launch page with verified provider details and a business contact or appointment next step.
- Offer help with copy, design, and launch rather than assume they need a replacement platform. Squarespace is already selected for the placeholder, and an existing builder or launch plan may be underway.
- Build provider/service/payment/FAQ content only after verification; connect the actual appointment workflow when confirmed.
- A free preview can demonstrate a complete patient-facing site. Ask whether they would like help finishing the launch; avoid criticizing a temporary construction page as a failed website.

**Project fit:** Potential launch-help candidate with a published domain email and recent formation. Replacement difficulty appears low for visible content, but account access, existing work, vendor commitments, interest, and willingness to pay are unknown. No outreach recorded.

## Current-Site Score

Scores describe the visible placeholder, not an unseen planned website: design **2/5**, conversion **1/5**, mobile experience **2/5** (readable but no patient action), provider presentation **1/5**, technical maturity **3/5**, email infrastructure **3/5** (configured authentication signals; DKIM validation remains). **Total: 12/30.** This is not a purchasing-intent score.

## Retained Technical Sources

[Homepage HTML](./sources/homepage.html), [WHOIS/DNS/HTTP evidence](./sources/website-evidence.json), and [DKIM response](./sources/dkim.txt). Checks were performed during the evening of October 5 locally; UTC timestamps may show October 6.
