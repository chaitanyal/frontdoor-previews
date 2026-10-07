# Kletz Psychiatry Assessment

- Assessment date: October 2, 2026
- Website: <https://www.kletzpsychiatry.com/>
- Practice: Ned Kletz, MD, MFT; psychiatry and marriage/family therapy credentials presented on the About page
- Practice model: Inferred solo-provider private-pay practice; one clinician identified
- Location: Marin County based, explicitly serving all of California; office city and street address not confirmed
- Overall FrontDoor fit: High for provider presentation, mobile conversion, and trust cleanup; purchasing intent unknown

## Practice Overview

The practice describes a holistic approach combining life experience and biological factors. Listed expertise includes ADHD, depression, anxiety, bipolar spectrum disorders, panic, autism spectrum disorders, trauma, relationship concerns, OCD, learning difficulties, grief, insomnia, and addiction. Services describe medication treatment, interventional psychiatry including TMS and ketamine, and nutraceuticals. Treatment delivery locations, age eligibility, and whether these interventions are delivered directly or through partners are not confirmed.

An authentic clinician portrait, an About page, six unattributed testimonials, and psychiatry articles provide useful material for a stronger site. The homepage displays the practice name and portrait but does not identify Ned Kletz by name, explain his credentials, or summarize his care approach.

Sources: [About](https://www.kletzpsychiatry.com/about), [Services](https://www.kletzpsychiatry.com/services), [Reviews](https://www.kletzpsychiatry.com/reviews), and [homepage](https://www.kletzpsychiatry.com/). Retained HTML is indexed in [sources/README.md](sources/README.md).

## Domain & Infrastructure

| Item | Finding |
| --- | --- |
| Domain | `kletzpsychiatry.com`; canonical website uses `www` |
| Registrar — detected | Squarespace Domains LLC |
| Creation date / age | February 2, 2025; approximately 1 year, 8 months |
| Registry expiration | February 2, 2028 |
| Nameservers | `ns-cloud-a1.googledomains.com` through `ns-cloud-a4.googledomains.com` |
| Website DNS | `www` CNAME: `ext-sq.squarespace.com`; addresses: `198.185.159.144`, `198.49.23.144`, `198.185.159.145`, `198.49.23.145` |
| Hosting / delivery — detected | Squarespace, supported by DNS, server headers, scripts, and asset hosts; separate CDN vendor not confirmed |
| Redirects | `http://kletzpsychiatry.com` redirects to `https://www.kletzpsychiatry.com/`, which returns 200 |
| Security headers | HSTS, `X-Content-Type-Options: nosniff`, and `X-Frame-Options: SAMEORIGIN` detected |
| DNSSEC | WHOIS reports unsigned |

Evidence: [helper evidence](sources/evidence.json), with the manual redirect check recorded in [source notes](sources/README.md). Domain age does not establish practice age.

## Email Infrastructure

- **MX / SPF / DMARC — not detected:** No answers in the checked apex MX/TXT and `_dmarc` TXT queries. The helper originally queried `www`; separate apex checks are retained in [apex-email-dns.json](sources/apex-email-dns.json).
- **DKIM — not confirmed:** No answers for the checked Microsoft-style `selector1`/`selector2` CNAME names or `google` TXT selector. Other selectors and actual message signing were not tested.
- **Published contact — detected:** `DrKletz@KletzPsychiatry.sprucecare.com` appears on the homepage/footer and Contact page. This supports Spruce-hosted contact addressing, not a conclusion about the practice's own-domain mailbox platform or EHR.
- **Assessment:** Own-domain email configuration is not evident. Spruce delivery, authentication, and security were not evaluated; missing apex records do not establish weakness in that separate service.

## Technology Stack & Patient Workflow

| Capability | Finding |
| --- | --- |
| CMS / framework | Squarespace with Fluid Engine/component scripts detected |
| Scheduling | Acuity component, embed script, and scheduling iframe detected on `/appointments`; availability and completed booking not tested |
| Contact form | Native Squarespace form on `/contact-1`, with required Name, Email, and Message fields and a Send button; configured recipient/storage destination is not publicly exposed. Delivery to Spruce Health is not confirmed; submission and delivery not tested |
| Communication | Spruce-address contact detected; portal access and messaging workflow not confirmed |
| EHR / practice management | Not confirmed |
| Analytics / marketing | Squarespace platform scripts detected; no Google Analytics, GTM, or Meta Pixel identifiers detected in inspected HTML; runtime integrations not exhaustively audited |
| Acquisition listings | WebMD profile link detected; Zocdoc and Psychology Today buttons do not link to their advertised profiles: both have empty `href` values. The user also reports that both links do not work |
| Social links | Contact page links point to Squarespace's Facebook, Instagram, and Twitter accounts |

Sources: [Appointments](https://www.kletzpsychiatry.com/appointments), [Contact](https://www.kletzpsychiatry.com/contact-1), and retained HTML. No forms were submitted and no appointments were booked.

The [user-supplied contact-form screenshot](sources/contact_form.png) shows the visible fields. Retained page configuration identifies Squarespace form `67aee72554fe60668c010c83` (`New Form 2`). The nearby Spruce email address does not establish the form's delivery destination. Confirm the connected recipient in the form's Squarespace Storage settings before migrating or claiming a Spruce integration.

## Blog & Content Publishing

- **Detected:** Integrated Squarespace blog, linked as [Psychiatry Tips](https://www.kletzpsychiatry.com/short-form-psychiatry-1).
- **Visible posts:** Four. Dates shown are April 14, 2025; April 3, 2025 (two posts); and May 28, 2019. The 2019 date predates this domain's registration; original publishing history is not confirmed.
- **Representative article:** [Paxil for Anxiety and Depression](https://www.kletzpsychiatry.com/short-form-psychiatry-1/paxil-for-anxiety-and-depression). Article schema confirms publication and modification on April 14, 2025.
- **Publishing signals:** Article canonical, description, Open Graph metadata, Article JSON-LD, author label `Ned .`, topic tags, next-article navigation, and an RSS alternate link detected. No index pagination observed. RSS content and CMS export were not tested.
- **Assets:** Article imagery uses `static1.squarespace.com`; homepage imagery uses `images.squarespace-cdn.com`.
- **Freshness:** Latest visible post is approximately 17 months old. These dates do not establish an ongoing publishing cadence. Public attribution is `Ned .`; full editorial ownership is not confirmed.
- **Migration:** Preserve the four article URLs or redirect them individually, retain metadata/tags/dates and licensed imagery, and confirm author identity. Article Open Graph coordinates (`40.7207559`, `-74.0007613`) need review against the stated California coverage before reuse.

Evidence: [blog index HTML](sources/psychiatry-tips.html) and [article HTML](sources/article-paxil.html). Manual inspection extends the helper, whose blog analysis did not identify an index or article.

## Website Assessment

### Design & Provider Presentation

The site has a recognizable logo and authentic portrait, but the mountain background, oversized header, sparse homepage copy, and low-contrast black heading over imagery weaken the presentation. The About page contains a useful care philosophy but little visible training or credential detail beyond MD/MFT. The homepage portrait has empty alt text despite its role in identifying the provider. These are qualitative observations, not a formal accessibility audit.

### Conversion & Mobile

Desktop navigation exposes Book now. At a 390 × 844 mobile viewport, the visible header contains the logo and hamburger; booking and appointment navigation are inside the collapsed menu. No booking CTA appears in the homepage body. The portrait is visible, but the first screen does not name the clinician, state his credentials, or make the next step explicit. The layout stacks without apparent horizontal overflow in the retained screenshot; no full cross-device audit was performed.

Trust and routing fixes are concrete: the footer lists **(415) 320-6524**, while Contact lists **(415) 236-5509**. Confirm which number serves which purpose before changing either. The empty directory links and Squarespace social links should be repaired or removed. Existing Acuity scheduling should be preserved if it meets the practice's needs.

### Technical / SEO

The five core pages have canonical and social metadata but empty meta descriptions. Repeated LocalBusiness JSON-LD has empty address/opening-hours fields and does not meaningfully describe the clinician or service area. Contact's title is `Contact 1 — Kletz Psychiatry`. Article metadata is more complete. Improve verified provider/service metadata and clarify geographic positioning; do not invent an office address or treatment availability.

Evidence: [mobile screenshot](sources/mobile.png), [desktop screenshot](sources/desktop.png), and saved page HTML.

## Business & Geographic Signals

- **Insurance — explicit:** The practice states it does not take insurance. No accepted plans or superbill policy detected.
- **Published rates:** Initial consultation, 60 minutes, $600; follow-up, 30 minutes, $300; ADHD evaluation/treatment, 60 minutes, $700. Appointments repeats the first two rates and describes two complimentary phone check-ins per paid appointment.
- **Commercial inference:** Private-pay rates support positioning around patient confidence and qualified inquiries. They do not prove revenue, marketing budget, or willingness to purchase.
- **Marketing maturity:** A branded site, portrait, testimonials, booking integration, and four articles exist; incomplete links and sparse provider messaging suggest an unfinished implementation.
- **Operational maturity:** Acuity and Spruce signals suggest existing tools; intake, clinical records, and internal processes remain unknown.
- **Geography — explicit, practice-wide:** Homepage/footer and Contact say Marin County based and serving all of California. No office city, street address, additional communities, or ZIP coverage detected. Statewide wording alone does not establish telehealth modality, licensing status, or an in-person service network.
- **Migration implication:** Preserve the stated Marin County/California distinction; confirm office and telehealth details before adding local SEO claims.

Sources: [Services](https://www.kletzpsychiatry.com/services), [Appointments](https://www.kletzpsychiatry.com/appointments), and [Contact](https://www.kletzpsychiatry.com/contact-1).

## FrontDoor Health Opportunity & Outreach Notes

1. Bring Ned Kletz's name, MD/MFT credentials, authentic portrait, and combined therapeutic/medical approach onto the first screen, with a visible mobile booking button.
2. Reconcile the two published phone numbers, repair the nonworking Zocdoc and Psychology Today links, and replace Squarespace social destinations with verified practice profiles.
3. Make the private-pay model, appointment rates, and included phone check-ins easier to evaluate before booking.
4. Improve page descriptions and provider/service schema while preserving Acuity and clarifying Spruce contact expectations. Verify the Squarespace contact form's recipient/storage destination and preserve its delivery workflow during migration; a connection to Spruce is unconfirmed. Assess intake handoff only after learning the current workflow.
5. Preserve the psychiatry articles and their URLs; improve attribution and agree on a realistic publishing plan if the practice wants ongoing content support.

Suggested outreach angle: A focused website refresh that helps California patients understand Dr. Kletz's approach and reach the existing appointment flow confidently from a phone.

## FrontDoor Health Score

Scores describe the observed website, not clinical quality or security certification. Higher is stronger.

| Category | Score / 5 | Basis |
| --- | --- | --- |
| Design quality | 2 | Authentic assets; sparse messaging and contrast concerns |
| Conversion flow | 2 | Booking embed exists; mobile CTA hidden and contact/link inconsistencies |
| Mobile experience | 2 | Responsive stacking; provider identity and booking need improvement |
| Provider presentation | 3 | Portrait, credentials, philosophy, testimonials; limited homepage explanation |
| Technical maturity | 3 | Managed HTTPS site, canonicals, article schema; incomplete core metadata |
| Email infrastructure | 2 | Limited own-domain signals; separate Spruce service not assessed |
| **Total** | **14 / 30** | Email score reflects limited observable evidence |

## Estimated Project Fit

- **Fit:** High for a focused website modernization project; moderate for additional automation until discovery confirms unmet needs.
- **Replacement difficulty:** Low to moderate, inferred from the small page set and integrated blog; scheduling, contact form, article assets, and redirects need deliberate migration.
- **Likelihood of paying:** Unknown. Published private-pay rates are a positioning signal, not purchasing evidence.
- **Discovery questions:** Correct phone routing; preferred Spruce contact path; Acuity/intake workflow; office versus telehealth details; intervention delivery model; verified directory profiles; article ownership; modernization budget.
