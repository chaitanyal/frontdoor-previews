# Practice Intelligence Report

**Central Texas Mental Health · https://centexmh.com/ · Assessed September 29, 2026**

**FrontDoor assessment:** Strong website-modernization fit. A seven-clinician practice offers medication management, TMS, and Spravato through a dated, nonresponsive website. Existing telemedicine, payment, and electronic-paperwork systems should be preserved while improving mobile readability, provider discovery, and the new-patient path. Budget and willingness to change are not confirmed.

Evidence labels: **Detected** means directly observed in public pages, HTML, DNS, or headers; **inferred** indicates an interpretation; **not detected** is limited to inspected material; **not confirmed** requires additional evidence.

## Practice Overview

- **Practice:** Central Texas Mental Health (CTMH). Its published office policies identify it as a DBA of Round Rock Mental Health PLLC.
- **Specialty:** Adult psychiatry, ages 18+, primarily medication management. TMS and Spravato are advertised. The appointments page advises patients to obtain ongoing psychotherapy/counseling elsewhere.
- **Locations:** One physical address verified on the website: **1717 North IH-35, Suite 200, Round Rock, TX 78664**, One Financial Centre. Broader location claims conflict with this single-address presentation; see geographic coverage below.
- **Estimated provider count:** **Seven listed clinicians:** Michael Musgrove, MD; Julie Williams, PA-C, CAQ; Renee Moreland, PA-C, CAQ; Caitlin Keen, PA-C, CAQ; Emily Davis, PA-C, CAQ; Megan Brady, PA-C; and Rosabelle Pong, PA-C. Active staffing and individual availability are not independently confirmed.
- **Contact:** 512-964-6992; Monday–Friday, 8 a.m.–5 p.m. The contact page publishes a business-domain email and explicitly labels it **“No Soliciting.”**

Sources: [About Us](https://www.centexmh.com/about_us/index.htm), [Appointments](https://www.centexmh.com/appointments/index.htm), [Contact / Location / Hours](https://www.centexmh.com/contact_location_hours/index.htm), [Office Policies](https://www.centexmh.com/appointments/OfficePolicies.pdf).

## Domain & Infrastructure

| Item | Finding |
| --- | --- |
| Domain | `centexmh.com`; both apex and `www` content observed |
| Registrar | GoDaddy.com, LLC — detected in WHOIS |
| Creation date / age | August 5, 2008; approximately 18 years, 2 months |
| Registry expiration | August 5, 2027 |
| Nameservers | `ns47.domaincontrol.com`, `ns48.domaincontrol.com` — GoDaddy DNS |
| A record | `192.124.249.184` |
| CDN / reverse proxy | Sucuri — `Server: Sucuri/Cloudproxy`, `X-Sucuri-ID`, and cache headers detected |
| Origin hosting | Not confirmed behind Sucuri; registrar/DNS do not establish origin hosting |
| Redirects / HTTPS | `http://centexmh.com/` returned 301 to HTTPS, then 200 |
| DNSSEC | WHOIS reports unsigned |

The homepage has a title and meta description, but an unusually long keyword-heavy title. No canonical, Open Graph, JSON-LD, or microdata signals were detected in inspected HTML. Most content pages lack meta descriptions. Apex and `www` versions of `home.htm` both returned 200; select a canonical host during migration. The homepage `Last-Modified` header is May 13, 2026; this is a server timestamp, not evidence of clinical-content review.

Evidence: live WHOIS/DNS/header checks, [homepage](https://centexmh.com/), and linked page HTML.

## Email Infrastructure

- **MX provider — detected:** Proofpoint Essentials: priority 10 `mx1-us1.ppe-hosted.com`, priority 20 `mx2-us1.ppe-hosted.com`. Provider identification matches [Proofpoint’s published configuration](https://www.proofpoint.com/sites/default/files/getting_started_guide_us1-cm.pdf).
- **SPF — detected:** `v=spf1 a:dispatch-us.ppe-hosted.com include:spf.protection.outlook.com -all`.
- **Other TXT:** Microsoft verification token `MS=ms66733254`.
- **Mailbox platform — inferred:** Microsoft 365 involvement is supported by SPF and the verification token; the underlying mailbox deployment is not confirmed.
- **DMARC — not detected:** No TXT answer at `_dmarc.centexmh.com` during checks.
- **DKIM — not confirmed:** No CNAME answers for Microsoft-style `selector1` and `selector2` names. Other selectors and actual message signing were not tested; this does not establish that DKIM is absent.
- **Maturity:** Business-domain email, a filtering gateway, and restrictive SPF are positive signals. Confirm signing and alignment before introducing DMARC enforcement. No mail was sent or delivery tested.

## Technology Stack

| System | Evidence and confidence |
| --- | --- |
| CMS / framework | No modern CMS detected. Static `.htm` pages, HTML 4.01 framesets, table layouts, image navigation, inline scripts, and `.lbi` library comments indicate a legacy, likely Dreamweaver-style authoring workflow; editor attribution is inferred. |
| Website supplier | QuestMatrix Website Solutions footer credit detected; current maintenance relationship not confirmed. |
| Analytics | WebSTAT script and tracking image, account `144282`, detected. GA, GTM, Meta Pixel, and other listed marketing platforms not detected. Successful analytics collection was not tested. |
| Scheduling | Custom request form followed by an instruction to call and press option 1. No live appointment-slot booking vendor detected. |
| Telemedicine | Doxy.me waiting-room link detected: `https://ctmh.doxy.me/waitingroom`. |
| Payments | InstaMed payment-portal link detected, practice identifier `CTMH`. This is not evidence of an EHR or clinical patient portal. |
| Electronic paperwork | RightSignature link detected. Appointments copy says DocuSign, while the linked destination and published office policies identify RightSignature. Actual DocuSign use is not confirmed. |
| Request form | Same-domain HTML form posts to `new_patient_online_request_form/send_form_email.php`. Backend handling, storage, and delivery are not confirmed. |
| EHR / clinical portal | Not detected in inspected public pages. |
| Acquisition / marketing | Psychology Today link is a general therapist directory referral, not a detected practice profile or paid acquisition integration. No newsletter/CRM vendor detected. |

Sources: [visible homepage content](https://centexmh.com/home.htm), [navigation frame](https://centexmh.com/left1.htm), [Appointments](https://www.centexmh.com/appointments/index.htm), [New Patient Request](https://www.centexmh.com/new_patient_online_request_form/index.htm), [Resources](https://www.centexmh.com/resources/index.htm).

## Blog & Content Publishing

- **Blog detected:** No linked blog, news, or article index found in the inspected navigation/pages. Resources is an external-reference directory.
- **Index / representative article / latest publication date / visible post count:** Not applicable; none identified.
- **Platform, taxonomy, pagination, RSS, Article/BlogPosting schema:** Not detected. Publishing cadence and editorial ownership are not confirmed.
- **Assets:** Inspected practice images primarily use the practice domain. WebSTAT is an external tracking host, not a detected publishing platform.
- **Migration implications:** No blog archive was identified for migration. Preserve service pages, the resources directory, linked PDFs, and existing `.htm` URLs through retained routes or redirects. No public CMS export was evident. Blog production is optional future scope, not a prerequisite for replacement.

Sources: [Resources](https://www.centexmh.com/resources/index.htm), [TMS](https://www.centexmh.com/tms/), [Spravato](https://www.centexmh.com/spravato/index.htm).

## Website Assessment

### Design and Mobile

Desktop presentation is functional but dated: blue image-based navigation, raster text banners, fixed-width content, and substantial spacing. A 152-pixel sidebar and approximately 900-pixel content tables do not adapt to narrow screens. No viewport meta tag was detected.

Live Chromium checks at 1440×1000, 390×844, and with Pixel 7 mobile emulation confirmed the distinction: narrow desktop rendering clips content; mobile emulation shrinks the desktop layout and still truncates wide content. This is not a responsive mobile layout.

**Mobile CTA visibility:** Appointments, Contact, and a new-patient phone graphic remain visible in the sidebar; they are not hidden in a hamburger menu. However, image-based phone text is not itself a tap-to-call control, and scaled-down content makes the next step difficult to read. A separate `tel:` link exists lower in the homepage content. Provider photography is absent from the first screen.

**Accessibility:** Navigation images lack alt text, inspected frames lack descriptive title attributes, and heading structure is sparse. These are concrete accessibility weaknesses; no full WCAG, keyboard, contrast, or assistive-technology audit was performed.

### Conversion

The homepage emphasizes the virtual waiting room, while new patients must locate a separate appointments workflow. The request form requires demographic/contact information and asks for insurance and clinical details before the subsequent phone-scheduling step. This creates friction and a potential staff follow-up opportunity; actual abandonment and response times are unknown.

The form includes optional SSN and medication information. Its PHP action name suggests email handling, but transport beyond HTTPS and server behavior are not visible. A replacement should route clinical information through an approved intake system; a static website rebuild alone does not replace this backend. No submission or compliance conclusion was made.

### Provider and Service Content

Dr. Musgrove has a portrait and substantial biography, including training and dated certification/fellowship statements. Six PAs have names and credentials but no comparable individual biographies, photos, specialties, or linked profiles. The homepage's physician-centered introduction understates the team.

TMS and Spravato have dedicated pages. TMS includes extensive treatment education and references; verify clinical claims and treatment details with the practice before republishing. Resource links and downloadable policies add useful depth. No unsupported inference about the currency of clinical guidance is made here.

Sources: [homepage](https://centexmh.com/), [About Us](https://www.centexmh.com/about_us/index.htm), [Appointments](https://www.centexmh.com/appointments/index.htm), [request form](https://www.centexmh.com/new_patient_online_request_form/index.htm), [TMS](https://www.centexmh.com/tms/).

## Business Signals

- **Practice size/model — inferred:** Small independent multi-provider group, based on seven listed clinicians and one published street address.
- **Insurance/payment model — detected:** Insurance plus self-pay. The request form explicitly says traditional Medicare and Tricare “Standard” are accepted; it excludes Medicare Advantage, Humana Tricare PRIME, Medicaid, Scott & White, and Ambetter. These are the site's labels, not independently verified network participation.
- **Other accepted insurance:** TMS-page insurer logos and homepage keywords exist, but they do not establish exact current plans, clinician participation, or treatment coverage. A complete current commercial-plan list is not confirmed.
- **Cash-pay signals:** Published policies list **$350 new-patient / $150 established-patient visits**, with balances/copayments due at service. The policy document is dated **December 28, 2023**; rates require confirmation before reuse. No confirmed superbill or card-on-file requirement found in reviewed evidence.
- **Marketing maturity — inferred:** Low to moderate: dedicated treatments and established domain, but weak mobile presentation, limited provider discovery, and legacy analytics.
- **Operational maturity — inferred:** Moderate: telemedicine, online payments, electronic signatures, PDFs, and written procedures exist, but the patient journey crosses several disconnected steps.

Sources: [request form](https://www.centexmh.com/new_patient_online_request_form/index.htm), [Office Policies](https://www.centexmh.com/appointments/OfficePolicies.pdf), [TMS insurance image](https://www.centexmh.com/tms/images/insurance_logos.png).

## Geographic Coverage Signals

- **Physical office — high confidence:** Round Rock, at the published address above.
- **Named region — detected:** Central Texas in practice-wide visible copy; a homepage banner also positions adult psychiatry in Texas. Telemedicine is advertised, but exact geographic eligibility is not explained.
- **Named communities — detected, scope uncertain:** Contact and Resources copy claims locations in **Cedar Park, Georgetown, and Round Rock**. Only Round Rock has an address in inspected pages. Treat Cedar Park/Georgetown as unresolved practice-wide claims, not verified offices or confirmed service areas.
- **Austin:** Present in page titles/metadata and some image text; this is positioning evidence, not a verified Austin office or explicit comprehensive service-area statement.
- **ZIP coverage:** `78664` is the office ZIP. No service-area ZIP list detected.
- **Migration implication:** Resolve the location inconsistency before publishing location pages or structured data. Do not infer surrounding-city coverage or statewide telehealth eligibility from proximity, referrals, or branding.

Sources: [Contact](https://www.centexmh.com/contact_location_hours/index.htm), [Resources](https://www.centexmh.com/resources/index.htm), [homepage content](https://centexmh.com/home.htm).

## FrontDoor Health Opportunity

### Quick Wins

Clarify RightSignature versus DocuSign instructions; reconcile office-location claims; confirm fees and accepted plans; replace image-only navigation labels with accessible text; and make the appointment phone action readable and tappable on mobile.

### Website Modernization

Replace frames with responsive static pages, meaningful headings, concise metadata, and verified practice/provider structured data. Present all seven clinicians consistently. Retain TMS, Spravato, resources, PDFs, and valuable legacy routes. Preserve business email DNS and external vendor destinations during hosting changes.

### Conversion Improvements

Give new patients a clear request/call path, distinguish it from the existing-patient waiting room and payments, and explain each intake step and expected response time once confirmed. Publish a patient-readable insurance/fees summary. Retain clinical screening requirements while reviewing whether every field belongs in the initial request.

### Automation Opportunities

Confirm the current form destination and staff process, then consider secure request routing, acknowledgment, and follow-up ownership within the practice's approved systems. Measure non-PHI CTA events separately from intake. Appointment availability, vendor integration access, and backend replacement scope need discovery.

## Outreach Notes

- The seven-person team is much larger than the homepage introduction suggests; individual provider profiles would help patients understand their options.
- Existing Doxy.me and InstaMed links make a staged website refresh feasible while preserving familiar workflows.
- The mobile layout shrinks or clips content despite visible appointment navigation; a readable mobile request/call path is a concrete improvement.
- The new-patient process asks for an online request and then a phone call; clearer handoffs and intake-vendor labeling could reduce confusion.
- One listed office address conflicts with copy naming three office cities; consistent location information would improve trust.

**Channel constraint:** The published contact email explicitly says “No Soliciting.” These are research notes, not an instruction to use that address for sales outreach. No contact was made.

## FrontDoor Health Score

Scores assess the public website and visible infrastructure, not clinical quality.

| Category | Score / 5 | Basis |
| --- | ---: | --- |
| Design quality | 1 | Dated frames, image navigation, and fixed layouts |
| Conversion flow | 2 | Phone/request options exist; multiple handoffs and competing patient paths |
| Mobile experience | 1 | Observed shrink-to-fit/clipping; no responsive layout |
| Provider presentation | 2 | Stronger physician biography; six minimally presented PAs |
| Technical maturity | 2 | HTTPS and Sucuri present; legacy frontend and missing SEO/accessibility foundations |
| Email infrastructure | 3 | Proofpoint and restrictive SPF; no DMARC detected, DKIM unconfirmed |
| **Total** | **11 / 30** | |

## Estimated Project Fit

- **Fit score:** **5 / 5 for website modernization**, a qualitative assessment rather than a purchase prediction.
- **Replacement difficulty:** Low to moderate for public pages; moderate overall because the custom clinical request handler must be retained or deliberately replaced. External telehealth, signature, and payment links reduce some integration work. Ownership/access and current contracts are unconfirmed.
- **Likelihood of paying:** Unknown. A seven-clinician roster, specialized treatments, and paid operational tools suggest commercial capacity, but do not establish budget or intent.
- **Payment-model signal:** Insurance plus published self-pay rates; not a cash-only practice.
- **Outreach angle:** Mobile website refresh, complete team presentation, and clearer intake handoffs while preserving current patient tools.

## Verification Scope

Lightweight public checks covered WHOIS, DNS, HTTP redirects/headers, homepage frames, first-level navigation destinations, the directly linked new-patient form, and published office policies. HTML vendor/payment keywords were searched across all fetched pages. Desktop and mobile screenshots were inspected. No form was submitted, account entered, payment initiated, vulnerability scan performed, or clinical/vendor workflow tested end to end. Public HTML, collected DNS/WHOIS evidence, and screenshots are retained in [sources/](sources/). The evidence was initially collected under `/private/tmp/centexmh-whois/`.
