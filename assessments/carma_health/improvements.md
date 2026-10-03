# CARMAhealth design audit and Astro component improvements

Reviewed October 2, 2026; implementation status updated October 3, 2026. Reference: [carmahealth.com](https://carmahealth.com/). This is a design and component audit, not a clinical-content review or proof of conversion performance. The original comparisons below describe the October 2 baseline. **Use the implementation record and remaining-work list below to resume work; historical “current” and “proposed” wording later in the audit is not the present implementation state.**

## Implementation record — October 3, 2026

### Completed

| Area | Implemented behavior | Code / commit |
| --- | --- | --- |
| Native provider links (§3 and SEO P1) | Provider cards are real anchors, supporting keyboard activation, browser link actions, and navigation without JavaScript. Redundant card-navigation JavaScript was removed. | `882d30e`; shared `ProviderCard.astro` in the subsequent provider work |
| Homepage versus directory (§1) | Provider/condition composition is separated into reusable sections. Teams of five or more get a directory by default; `providerDirectory` explicitly enables/disables it. Optional `home.featuredProviderSlugs` selects homepage providers in supplied order without removing anyone from the directory. Solo/small-team introductions are retained. | `7f73f3c`; `ProviderCard.astro`, `ProviderTeam.astro`, `Conditions.astro`, `ProviderDirectory.astro`, `ProviderDirectoryPage.astro`, `provider-team.mjs` |
| Compact directory presentation (§1, partial §7) | Consistent portraits, name, credentials, readable role, native profile link, and a responsive one/two/three-column grid. Location groups and search/filter controls were not added. | `7f73f3c`; shared components and theme CSS |
| Provider profiles (§2, items 1–4 and directory return path) | Identity and actions precede a smaller portrait on mobile; all supplied biography paragraphs and nonempty training categories render. Labels and certification categories respect profession; directory breadcrumbs return to the full team. Existing fixed mobile actions remain. | `7f73f3c`; `ProviderProfile.astro`, `practice-view.mjs`, shared theme CSS |
| Provider/directory SEO and lifecycle (§1, SEO P1/P2) | Homepage provider schemas match the selected team; directories describe the full roster with ItemList and stable provider references. Provider/directory BreadcrumbList matches navigation. Routes work across all three targets, directory discovery is included in sitemap/production guides, and retirement removes featured selections while preserving an enabled directory and appropriate redirects. Unknown new-patient availability no longer becomes an affirmative default badge; PA credentials no longer trigger a psychiatrist badge. | `7f73f3c`; routing, schema helpers, validation, provider retirement workflow |
| Centex copy and selection | Homepage features **Dr. Michael Musgrove, Julie Williams, and Emily Morris**; directory retains all seven providers. Homepage/directory share the approved team introduction mentioning medication management, NeuroStar TMS Therapy, and Spravato. Six PA profile taglines use verified backgrounds where available; Caitlin's duplicate tenure badge was removed. Credentials and full biographies remain. | `7f73f3c`; `sites/centexmh/practice.json` |
| Production `llms.txt` (§9, improvements 1–4 and local checks in 6) | Overview reflects enabled homepage sections and the payment model. Approved payment/telehealth information and explicit practice-level availability supplement specialty/address/phone. Facts precede link-list headings; larger rosters and treatments get separate groups. Directory links remain. Indexable standalone pages use route-relative `rel="describedby"` discovery links. Previews/nonindexable builds publish neither the guide nor its discovery link. | `57c1cd9`; `practice-production.mjs`, `PracticeLayout.astro` |
| Repeatable production guide workflow | Every production build regenerates the guide from current configuration and validates its content, local destinations, and page discovery links. Focused regression tests run within the output-contract suite. No manual export, new component/page, or mirror deployment is required. | `57c1cd9`; production build validation, `practice-llms.test.mjs`, output-contract runner, `src/README.md` |
| Office hours in the production guide | The generator now includes the displayed day-specific hours, configured time zone, and explicitly marked telehealth-only days. Missing hours/time zones are omitted rather than guessed; this runs on every future production build. | `e5c77f1`; `practice-production.mjs`, regression tests, and source guidance. Pushed for automatic deployment; deployment completion not checked. |
| Selective visual polish (§7) | All three shared themes, including the reflective variant, have tighter mobile section spacing, balanced headings, readable supporting text, and open FAQ/resource lists. Financial, appointment, location, and credential panels retain emphasis. Optional provider `imagePosition` percentages apply consistently to homepage cards, directories, and profiles; existing portraits keep their default crop. | Local changes; shared theme CSS, provider components, JSON validation, and `src/README.md`. Included in the visual-polish release; automatic deployment follows the push. Deployment completion not checked. |
| Consistent public footer (§8) | Home, provider, directory, and treatment pages share legal links and a compact Patient information group when at least three existing destinations are available. Links lead to enabled public sections/pages and preserve preview action restrictions. Legal-page footers wrap cleanly on mobile. | Local changes; `PracticeFooter.astro`, `LegalPage.astro`, and shared CSS. Included in the visual-polish release; automatic deployment follows the push. Deployment completion not checked. |

**Centex approved team introduction:** “Our board-certified psychiatrist and physician assistants bring experience and thoughtful care to adult mental health, with treatment options ranging from medication management to NeuroStar TMS Therapy and Spravato.” These are practice-level offerings; this does not assign TMS or Spravato delivery to every provider.

**Related changes:** `7f73f3c` also added the opt-in FrontDoor footer credit, enabled for Dr. Dronavalli; this is not the patient-tools footer recommendation in §8. `57c1cd9` includes AGENTS.md release guidance: **commit → push → automatic Cloudflare deployment**, when integration is enabled. The separate `practice-copywriter` skill in `llm_configs` was updated with the team-introduction, evidence-backed differentiation, credential specificity, and repetition lessons; that skill is outside this repository.

### Verification and release record

- All three commits above were pushed to `origin/main`.
- Native provider links were manually verified by the user. Provider changes passed output-contract, provider-browser, and analytics checks. Provider browser coverage included no-JavaScript navigation, keyboard use, mobile identity/biography preservation across practice themes, a temporary 25-card layout, and local screenshots.
- October 2: provider/copy/footer changes were deployed directly to the `drdronavalli`, `frontdoor-health`, and `frontdoor-previews` Pages projects; CLI reported success. The commits were subsequently pushed. No post-deployment Cloudflare checks were performed, as requested.
- October 3: `llms.txt` changes passed focused regression tests, full output contracts, and the pre-commit checks. Dr. Dronavalli's local production build passed guide/link validation; both preview targets were checked for absence of the guide/discovery links. The only output-contract change was the five new discovery links on Dr. Dronavalli's pages.
- October 3 office-hours follow-up: all four guide regression tests, the full output-contract suite, and pre-commit checks passed. Tests cover variable daily schedules, closed days, time zones, telehealth-only days, and omission of unknown hours/time zones. Commit `e5c77f1` was pushed to `origin/main` for automatic deployment; deployment completion was not checked.
- October 3 visual-polish follow-up: four theme-browser checks passed across Dr. Dronavalli (calm), Centex (editorial), Northwest Psychiatry (clinical), and Mariposa (reflective) at 390, 768, and 1440 pixels. Checks cover overflow, supporting-copy contrast, FAQ keyboard operation, footer destinations and touch targets, and the clinical resources list without a curved top border. Four provider-experience and 16 analytics checks passed; the full static-output contract suite also passed with the reviewed footer-link additions. Local section screenshots were reviewed; stable review copies are in `.tmp/theme-review-2026-10-03/`. The visual-polish release uses commit → push → automatic Cloudflare deployment where enabled; deployment completion is not checked.
- `57c1cd9` was pushed for automatic deployment. On October 3, the user supplied a Cloudflare screenshot showing **automatic deployments enabled and a successful production deployment of `main` commit `57c1cd9` for Dr. Dronavalli**, at `https://440485ca.drdronavalli.pages.dev`. This confirms that project's automatic deployment succeeded; it does not establish live-page verification or deployment status for `frontdoor-health` / `frontdoor-previews`. No additional direct deployment is needed.

### Where to pick up next

**Current preference:** new components and pages are welcome when useful, but are deferred for now. Prioritize improvements to existing generators, layouts, components, styles, or copy in the near term. Do not treat this backlog as authorization to implement or deploy all remaining work.

| Suggested near-term order | Remaining improvement | Main beneficiaries / boundary |
| --- | --- | --- |
| 1 | Remaining SEO work: sourced treatment/service entities and known social-image dimensions; verified author/reviewer details only when appropriate. | Centex treatment pages; metadata improvements across production and previews. Provider/directory breadcrumbs and availability defaults are already done. |
| 2 | Link individual providers' verified treatment services to existing treatment pages. Preserve existing plain service entries where no relationship is sourced. | Centex, only with evidence that the specific provider delivers the service; do not infer from practice offerings. |
| 3 | Improve existing appointment/treatment/payment wording using verified material: visit preparation, treatment logistics/FAQs, and service-specific coverage verification. | All practices for preparation; Centex first for TMS/Spravato and payment distinctions. New structured sections/components/pages can be considered in a later phase. |

**Optional/deferred, not prerequisites:** provider location/language grouping or filtering when reliable data and roster size justify it; dedicated new-patient pages; legal links in an Optional guide section; same-origin markdown exports only for a concrete consumer need. A separate mirror domain remains unnecessary. Published `llms.txt` currently benefits Dr. Dronavalli; the other four practices remain previews and will receive the guide when launched as indexable standalone production sites.

**No demonstrated outcome claim:** completed implementation and local validation do not establish ranking, traffic, conversion, or AI-citation improvements. Further live/schema/Search Console checks require their own scope; respect the user's request to skip post-deployment checks.

## Main finding

The biggest opportunity identified in the original audit was **separating the homepage introduction from the full provider directory**. CARMAhealth gives visitors a short team overview, then a dedicated directory grouped by geography. At audit time, FrontDoor put every provider on the homepage. This works for a solo practitioner or small group, but makes the homepage serve two competing purposes as the team grows: explain the practice and browse its entire roster. The core separation is now implemented as recorded above.

Your existing editorial theme already has strong typography, authentic photography, restrained colors, and readable provider rows. A new theme is unnecessary. Improve information hierarchy, provider discovery, and visit preparation within the existing themes.

## Evidence and scope

- Inspected live Carma homepage, provider directory, Sally Reese profile, new-patient, insurance, and TMS pages; also reviewed the supplied advanced-treatment, Spravato, psychiatric-evaluation, and scheduling screenshots.
- Compared source for `ProviderConditions`, `ProviderProfile`, `HomeHero`, `PracticeHeader`, `AppointmentSection`, `FinancialPolicy`, `PatientResources`, `TreatmentCards`, `PracticeFooter`, shared homepage/treatment pages, route generation, and theme CSS.
- Captured live Carma and local Central Texas Mental Health layouts at **390 × 844** and **1440 × 1000**. No horizontal overflow was detected in those captured views. The local Centex homepage renders seven providers and uses the editorial theme. This is a concrete group-practice comparison, not a visual certification of every theme or practice.
- Carma screenshots include its default cookie notice; no consent was accepted, form submitted, appointment booked, or patient portal entered. Blank areas in some supplied long screenshots may reflect reveal timing; they are not treated as missing content.
- [Source inventory](sources/README.md), [viewport observations](sources/visual-observations.json), [Carma homepage team](sources/carma-home-team-desktop.png), [Carma directory](sources/carma-directory-desktop.png), and [FrontDoor team](sources/frontdoor-team-desktop.png).

## Original prioritized comparison — October 2 baseline

| Priority | Learning from Carma | FrontDoor at audit time | Original recommendation / ownership |
| --- | --- | --- | --- |
| P1 | Short homepage team preview plus full directory | `ProviderConditions.astro` maps all providers; no directory index route | Separate provider card, homepage team section, and directory page; preserve existing profile URLs |
| P1 | Consistent directory portraits and concise location/role text | Two-column group layout with tagline and two trust badges per provider | Add a compact directory card treatment; reserve fuller trust narratives for profiles |
| P1 | Provider name, role, and next step lead the mobile profile | `ProviderProfile.astro` puts a large portrait before the name | Move identity above or alongside a smaller mobile portrait; keep the existing fixed appointment/call bar |
| P1 | Provider cards use native links | FrontDoor uses focusable `article[role=link]` plus JavaScript navigation | Render a real anchor for each single-destination card and remove the redundant card-navigation script |
| P2 | Services are presented as understandable choices | Conditions are a plain list; treatment cards contain title/summary/link | Improve care-path summaries and treatment-page structure using verified practice content |
| P2 | Visit preparation is a distinct part of the journey | Appointment section is primarily actions/contact; resources are mostly downloads | Add optional visit steps and a preparation checklist, with a dedicated page only when substantial |
| P2 | Insurance explanation connects to the specific service | `FinancialPolicy.astro` primarily explains practice-wide payment | Add optional service-specific coverage notes and links without implying guaranteed coverage |
| P2 | Section hierarchy mixes open space, rules, and selected panels | Base theme uses many large rounded cards; editorial already reduces these | Refine existing theme-scoped hierarchy and mobile spacing; avoid a new palette or theme |
| P3 | Footer groups useful patient destinations | Practice footer has legal links and a fixed mobile action bar | Add optional patient-tool links when a practice has enough destinations to justify them |

## 1. Provider discovery: highest-value improvement

### What Carma does well

The [homepage](https://carmahealth.com/) features three clinicians, shows a compact indication of the wider team, and links to the full directory. Its [directory](https://carmahealth.com/providers) groups practitioners under Texas and Florida, using a three-column desktop grid and one column on mobile. Cards combine a consistent square portrait, location label, name/credentials, short role description, and profile destination. Inspection found 28 unique provider-profile destinations; no directory search or filter controls were detected in the inspected page.

The advantage is purposeful separation: introduction on the homepage, comparison in the directory, detail in the profile. Large portraits alone are not the solution; Carma's mobile directory still requires considerable scrolling.

### Recommended FrontDoor composition

Use these as **initial design guidelines**, not automatic rules already established by user research:

| Practice size | Homepage | Full directory |
| --- | --- | --- |
| 1 provider | Keep the existing substantial solo-provider introduction | Usually unnecessary |
| 2–4 providers | Show the complete team with concise cards | Optional |
| 5–8 providers | Use shorter cards; consider an explicitly chosen three-provider introduction when the homepage becomes too long | Useful when visitors need to compare roles or locations |
| 9+ providers | Show a small curated introduction, total roster count, and prominent full-team link | Recommended |

For Centex, first compare a compact seven-provider section against a three-provider introduction plus a full directory. Do not automatically spotlight only physicians: the practice should approve representative selections across its actual clinical team. Featured providers are an editorial choice, not a quality ranking.

Suggested component boundaries:

- **`ProviderCard.astro` — proposed:** shared identity, portrait, role, and link markup. Two real contexts justify a compact directory treatment and a fuller introduction treatment. Preserve the existing solo-provider composition.
- **`ProviderTeam.astro` — proposed:** homepage heading/summary, chosen cards, and full-team link. Extract the provider portion of `ProviderConditions.astro`; leave conditions separately composed in `PracticeHome.astro` so the two sections can evolve independently.
- **`ProviderDirectory.astro` and shared directory page — proposed:** render all providers, optional sourced location groups, and a short explanation of the team. Start with a static grid. Add name/location/specialty filtering only when roster size and reliable data justify it; keep all cards available without JavaScript.

Use 1 column on narrow mobile, 2 on tablet, and 3 on sufficiently wide desktop for the directory. Keep a predictable image box, natural face crops, comparable text density, and a clear text link. Compact horizontal rows may be more useful than large portrait tiles on phones; test both rather than duplicating Carma's mobile dimensions.

Reuse `name`, `credentials`, `image`, `imageAlt`, `heroTitle`, `tagline`, and verified specialties first. Add provider-level location/language fields only where source evidence exists. A practice-wide location or telehealth claim must not silently become a provider-specific claim. Unknown new-patient availability should remain unstated; `acceptsNewPatients` already exists in validation and can be used when explicitly sourced.

### Routing and SEO work that accompanies a directory

Preserve `/providers/<slug>/`. Add `/providers/` to standalone entries and `/previews/<practice>/providers/` to both preview route trees only for practices using the directory. Update `preview-paths.mjs`, `home-sections.mjs`, provider breadcrumbs/back links, sitemap discovery, and generated `llms.txt` as needed. Audit provider-add/retire workflows so both the roster and profile routes remain consistent. Make directory links relative to each deployment root.

If the homepage shows a subset, review `practiceHomepageSchemas()` in `practice-view.mjs`: it currently emits schemas for every provider. Prefer homepage provider markup aligned with the visible introduction and put full-roster directory markup on the directory. Every provider should retain its individual profile metadata.

## 2. Provider profiles: show identity sooner and preserve supplied content

Carma's [Sally Reese profile](https://carmahealth.com/providers/sally-reese) introduces the name, clinical role, and personalized appointment action before the portrait. It separates biography, credential categories, and linked services. This makes it easier to understand who the provider is before reading the long biography.

In the [local Centex mobile capture](sources/frontdoor-profile-mobile.png), the header, breadcrumb, and large portrait consume almost the whole first screen; the name begins near the fixed action bar. The fixed booking/call bar is a FrontDoor strength worth keeping.

Recommended changes in `ProviderProfile.astro`, `practice-view.mjs`, and shared theme CSS:

1. Put name, credentials, readable role, and one short care summary first on mobile. Use a smaller adjacent portrait or place the larger portrait after that introduction. Keep logical reading order in the markup and ensure long credentials wrap cleanly.
2. Use role-aware labels. `providerProfile()` currently defaults to `How Dr. <lastName> helps` for all providers. Prefer a neutral name-based label unless a verified title is explicitly supplied; nurse practitioners and physician assistants should not acquire an unsupported title.
3. Review `profile.bioParagraphs.slice(0, 2)`: it silently hides later supplied paragraphs. Render all approved biography paragraphs, or provide an intentional accessible expansion for a long biography. Do not discard approved content through a fixed slice.
4. Reuse existing certification, education, academic appointment, and affiliation data for meaningful credential groups. The current fixed education rows are more physician-oriented; render appropriate training for each profession and omit absent categories rather than adding filler cards.
5. Link a provider's verified services to existing treatment pages when the relationship is explicitly sourced. Current provider services are plain strings; any new structured link representation should preserve those existing entries. Do not apply every practice treatment to every provider.
6. Offer a genuine path back to all providers when a directory exists. A personalized scheduling label should only imply provider selection when the destination or workflow actually preserves that selection.

Carma's first-screen design also wraps Sally's credentials across several large lines, and its cookie notice covers part of the portrait in the live capture. Borrow the information order while keeping FrontDoor's more restrained type sizing and persistent actions.

## 3. Make provider cards work as ordinary web links

Carma directory cards are actual `<a href="…">` elements. FrontDoor's `ProviderConditions.astro` uses `article`, `tabindex`, `role="link"`, and `data-card-href`; `PracticeHome.astro` attaches click and key handlers that assign `window.location.href`.

Replace the single-destination card interaction with a native anchor, retaining semantic card content and visible focus styles. This provides browser link behavior, open-in-new-tab actions, and operation without the card script. Do not nest booking buttons inside that anchor; if multiple destinations are introduced, use an article with separate normal links instead.

This is a small, reusable improvement independent of the larger directory project.

## 4. Present treatments as a patient decision journey

Carma's [TMS page](https://carmahealth.com/services/tms-therapy) separates explanation, concise treatment facts, evidence, visit stages, coverage, FAQs, and next steps. The supplied [advanced-treatment screenshot](services/advanced_treatments.png) also shows a broader care-path page leading to specific treatments. These patterns help visitors answer practical questions before contacting the office.

`TreatmentCards.astro` already supplies summary cards and links. `TreatmentPage.astro` already has a summary, optional certification, content sections, resources, related treatments, phone action, and emergency notice. Extend this existing structure rather than replacing it with a new page system:

- Add optional structured visit steps rendered as an ordered list, with short headings and descriptions.
- Add a concise, verified logistics summary where useful: visit length, visit setting, preparation, and how the office evaluates suitability. Omit unsupported values.
- Add treatment-specific FAQs and coverage notes when supplied. Place reassurance near the relevant contact action rather than repeating generic carrier lists everywhere.
- Let related treatments carry a short explanation when patients genuinely need to compare options. Keep internal links selective.
- Maintain the current public phone action on treatment pages. Changing those pages into booking/intake flows would be a separate product decision.

For homepage conditions, an optional short explanation can improve the current plain-name list. Add links only when a substantive destination exists; no thin page for every diagnosis. Do not copy Carma's research percentages, treatment schedules, outcome language, or clinical claims into another practice's configuration without practice-specific evidence and review.

## 5. Add visit preparation to appointment and resource components

Carma's [new-patient page](https://carmahealth.com/new-patients) distinguishes booking, insurance verification, paperwork, evaluation, and what to bring. That is an information-design lesson; its vendors and processes are not defaults for your practices.

FrontDoor's `AppointmentSection.astro` clearly distinguishes new-patient and existing-patient actions, telehealth access, and office contact. `PatientResources.astro` already groups downloadable resources and marks PDFs/external destinations. Keep those strengths.

Add optional sourced `visitSteps` and preparation items to the appointment content. A small practice may need only three concise steps adjacent to contact actions. A practice with substantial instructions can have a dedicated new-patient page assembled from the same content. Link each resource at the step where it is needed and retain the existing grouped resource list for returning patients.

Preserve preview disabling of scheduling, portal, and telehealth destinations; phone/email behavior and existing analytics should continue working. No new form collection is needed to adopt this pattern.

## 6. Explain payment at the right level

Carma's [insurance page](https://carmahealth.com/insurance) distinguishes service types and gives a verification process. Your `FinancialPolicy.astro` already handles insurance, private pay, out-of-network arrangements, published fees, payment methods, and verification contact. A logo strip would be mostly cosmetic; the useful addition is a short service-specific clarification.

Add optional coverage notes with a service label, explanation, and verification destination. For example, a practice might need to distinguish medication visits from an advanced treatment, but only if its evidence supports the difference. Accepted carrier names do not establish that a particular plan covers a treatment or that a provider participates. Keep the existing disclaimer and contact route.

Do not show insurance-first CTAs for cash-only practices. Let the secondary action address that practice's actual patient question: fees, care approach, or provider choice.

## 7. Refine visual hierarchy within the existing themes

Carma uses a consistent relationship between small section labels, large editorial headings, short introductions, green actions, spacious white panels, and restrained photography. It also varies section presentation rather than putting everything inside the same card treatment.

Your editorial theme already does much of this. Target `shared/styles/frontdoor.css` and the actual shared components:

- Keep Inter and Newsreader. Establish consistent heading/copy widths and spacing within each theme instead of importing Carma's typography wholesale.
- Reserve elevated panels for actions, important summaries, and credentials. Use open layouts and rules for supporting lists; retain the editorial provider rows where they remain effective.
- Tighten long mobile sections around repeated provider entries and credential lists. Let desktop breathe without making phones traverse unnecessary empty space.
- Standardize image aspect ratios and optional focal-position metadata when real portraits crop poorly. Authentic portraits matter more than uniform background removal or mandatory grayscale.
- Keep copy readable. Carma's directory markup uses low-opacity role/location/link text; its faint supporting text is not a pattern to emulate. Check contrast and touch targets in implementation.
- Preserve FrontDoor's visible mobile contact action and fixed booking/call bar. Carma's header collapses actions into a hamburger, although its page heroes expose booking; avoid losing your persistent access.

No new theme, practice-only CSS override, decorative animation system, or wholesale homepage reorder is needed. If a large-practice introduction needs services before the roster, split the current provider/conditions composition first and make the order an explicit, reviewed design choice.

## 8. Footer and machine-readable content: useful selectively

Carma's footer groups services, conditions, patient tools, and contact destinations. Add a compact optional patient-tools group to `PracticeFooter.astro` for practices with several real destinations. Small practices can keep a minimal footer. Render verified links already represented in the configuration, and preserve preview action restrictions. Provider pages currently omit the legal footer; consider a consistent legal/utility footer if those pages gain additional navigation.

The supplied [machine-readable map](llm_txt/llm_txt.md) documents Carma's separate markdown mirror. FrontDoor already generates `llms.txt` for indexable standalone practices from verified configuration and omits it for previews. Maintain parity when directory or new-patient routes are added. A separate mirror domain would introduce unnecessary maintenance for the current scope; this audit provides no evidence that one improves discovery or citation.

## 9. Separate SEO and `llms.txt` audit

### Scope and verified baseline

The filename is **`llms.txt`**, with an `s`. This section compares Carma's current public files and six representative HTML pages with FrontDoor's generated production/preview output and shared generators. It does not measure rankings, search traffic, backlinks, Core Web Vitals, Google-selected canonicals, or actual AI citations. No live Dr. Dronavalli checks were made; that comparison uses the existing local production build.

Retained evidence: [SEO observations](sources/seo-observations.json), [all-preview metadata checks](sources/frontdoor-preview-seo.json), [configuration-derived machine-readable summaries](sources/frontdoor-config-llms.json), [Carma sitemap](sources/carma-sitemap-0.xml), [Carma main map](sources/carma-llms.txt), and [mirror map](sources/mirror-llms.txt).

| Area | CARMAhealth: observed | FrontDoor: observed | Assessment |
| --- | --- | --- | --- |
| Titles/descriptions | Six sampled pages have distinct titles/descriptions and one H1 each | All five local Dr. Dronavalli pages and 31 built preview pages have descriptions and one H1; production titles are distinct | Sound baseline; prioritize accurate, useful descriptions over fixed character limits |
| Canonical URLs | Sampled pages use self-canonicals on HTTPS apex with no trailing slash for nested pages | All 31 preview canonicals match their deployment paths; five production pages use the configured production origin and trailing slashes | Both conventions are acceptable when redirects, links, and sitemap agree |
| Redirects | HTTP redirects to HTTPS; `www` redirects to apex; sampled TMS trailing-slash URL redirects to its non-slash canonical | Local output/source inspected; production redirect behavior not retested | Check variants when launching a domain; do not assume a canonical tag alone redirects visitors |
| Robots/indexing | Root robots allows public crawling, names the sitemap index, and disallows internal design/review paths | Production robots allows crawling and names the sitemap; all 31 preview HTML pages have `noindex, nofollow`; generated preview headers also specify noindex | Preserve FrontDoor's production/preview split; robots directives do not establish actual indexing |
| Sitemap | Index references one child sitemap containing 105 unique URLs | Dr. Dronavalli sitemap covers all five built HTML routes; marketing sitemap contains six routes and excludes previews | Existing automatic discovery is useful; extend it when genuine new routes are introduced |
| Social metadata | All six sampled pages have Open Graph/Twitter metadata, including OG image dimensions | Home/provider/treatment pages receive social metadata; legal pages deliberately do not | Add image dimensions if known; uniform legal-page social cards are low priority |
| Structured data | Organization, breadcrumbs, provider, therapy, and FAQ blocks detected; JSON parses | Production homepage/profile have WebPage and provider/clinic entities; Centex treatment routes have WebPage/BreadcrumbList; JSON parses in inspected output | Improve entity relationships and supported detail; parsing is not schema validation |
| Internal discovery | Homepage has three native provider-profile links plus the directory route | Dr. Dronavalli homepage has zero native provider-profile anchors; its provider card navigates through JavaScript | Native card links are the clearest immediate SEO/component improvement |
| `llms.txt` coverage | Main file and XML sitemap contain exactly the same 105 normalized URLs | Production map links its two core care pages; three legal routes are omitted. Providers/treatments come from config | Curated coverage is appropriate; a machine-readable guide need not reproduce the entire sitemap |
| Separate markdown mirror | Mirror map has 104 URLs and differs from the main map; one sampled mirror page returns markdown with a canonical/source declaration and `X-Robots-Tag: noindex, follow` | No separate mirror; summaries generated from practice configuration | Keep the simpler generator; adopt markdown exports only if there is a concrete use for them |

Carma's checked HTTP, `www`, and trailing-slash redirects terminate in 200 responses. Relative resource/page destinations resolve in the inspected Dr. Dronavalli and Centex builds. These checks do not establish that every external destination or all 105 Carma routes currently return 200.

### SEO changes worth making

**P1 — Native provider links.** Implement the anchor-card recommendation in section 3. A provider name/profile should be reachable through a real `href` in the initial HTML. A sitemap supplies another discovery path, but should not compensate for missing navigational links. Owner: `ProviderConditions.astro` / proposed `ProviderCard.astro` and `PracticeHome.astro`. Keep native links when rendering a homepage subset and directory.

**P1 — Keep visible facts and structured facts consistent.** `providerProfile()` emits availability in schema only when `acceptsNewPatients` is explicitly boolean, but its default trust-item logic treats an unspecified value as accepting new patients. Make the visible fallback equally evidence-bound. Preserve profession-aware entity typing instead of applying a physician type to every clinician. Carma's sampled nurse-practitioner profile uses `Physician` despite an NP role; treat its schema as a reference to review, not a pattern to copy. Reuse provider/clinic `@id` relationships, and add languages, credentials, and specific locations only when the displayed page and source ledger support them. Owner: `practice-view.mjs` and `ProviderProfile.astro`. [Google's structured-data policies](https://developers.google.com/search/docs/appearance/structured-data/sd-policies) require current, relevant markup aligned with visible content.

**P2 — Complete breadcrumb and directory semantics.** Carma supplies breadcrumb JSON-LD on sampled inner pages. FrontDoor displays provider breadcrumbs but emits no BreadcrumbList on the checked production profile; treatment pages already do. Add provider/directory breadcrumbs from the same route information used by visible navigation. A future directory can use an ItemList of the profiles it actually lists, with stable provider references. Keep location grouping scoped to sourced facts. Owner: `ProviderPage.astro`, future directory page, and SEO helpers.

**P2 — Strengthen treatment metadata without proliferating pages.** FrontDoor treatment pages currently identify the page and breadcrumb path, but not a treatment/service entity. Consider a sourced Service or appropriate medical-therapy entity linked to the clinic where it accurately describes the page. Include the same service name, location/scope, and description shown to patients; validate property applicability. Do not copy Carma's regulatory/outcome claims. Add service/condition pages only when they answer a distinct patient question with substantive practice-specific information.

**P2 — Review metadata as content, not a character-count exercise.** Dr. Dronavalli's homepage description is 185 characters, versus 123 on its provider page; this alone is not an error. Preserve readable specialty/location positioning and unique page purpose. Generate descriptions for directory and new-patient pages separately. Add known `og:image:width`/`height` via the asset metadata path if practical; avoid hard-coded dimensions applied to unrelated images. The current social cards already have useful titles, descriptions, and image alt metadata on core pages.

**P2 — Add stronger content ownership where appropriate.** If research-heavy treatment pages or future articles are introduced, show a verified author/reviewer and genuine review date, and distinguish practice instructions from general education. Carma's service pages provide contextual links and referenced evidence; that is more useful to borrow than a large volume of diagnosis keywords. Do not fabricate a reviewer, fresh date, training credential, service radius, or insurance relationship. Keep patient-facing factual updates tied to `source_extraction.md`.

**Preserve preview noindex behavior.** FrontDoor's generated marketing sitemap correctly excludes preview routes and the checked preview pages carry noindex. Keep previews crawlable enough for crawlers to see noindex; do not replace that control with a blanket robots disallow and assume it prevents indexing. Carma's disallowed internal paths were not individually inspected, so their claimed additional noindex was not verified. [Google's robots documentation](https://developers.google.com/crawling/docs/robots-txt/robots-txt-spec) distinguishes crawl restrictions from indexing controls.

### Structured-data cautions from the reference site

Carma's TMS and insurance pages each contain **two FAQPage blocks describing the same five questions**. The answer text differs in places through wording or embedded links. This is unnecessary duplication, not evidence of better SEO. Keep a single authoritative FAQ representation generated from the same content as the visible answers.

Also, do not sell FAQ schema as a search-result enhancement. Google's current documentation states that FAQ rich results stopped appearing on May 7, 2026. FAQs remain valuable patient content; retaining semantically accurate markup can serve other consumers, but should not be framed as guaranteed Google rich-result eligibility. [Google documentation updates](https://developers.google.com/search/updates).

The sampled Carma provider-schema image URL returned 200 with an image content type. FrontDoor's generated JSON-LD parsed successfully, but neither site was submitted to an external schema validator in this audit. Future changes should check the actual types/properties and visible-content parity, rather than merely counting schema blocks.

### `llms.txt`: what to adopt and what to improve

**What Carma does well:** its main map organizes services, conditions, locations, team, FAQs, publishing, and utility pages. The main map and sitemap have full URL-set parity across 105 entries. Its sampled markdown profile declares the original URL and is served with noindex/follow, limiting competition with the human-facing site. [Main file](https://carmahealth.com/llms.txt); retained [mirror profile](sources/mirror-sally-reese.md) and [response headers](sources/mirror-provider-headers.txt).

**Where its mirror has drifted:** after normalizing mirror URLs to the primary host, the mirror map lacks `/locations/dallas-tx`, `/providers/jennifer-lane`, and `/providers/risika-akanbi-yusuff`, while listing `/providers/isela-werchan` and `/providers/samantha-hurlbut`, which are absent from the main map. This establishes map inconsistency, not that those individual URLs are broken or the clinicians have left. The sampled mirror profile declares a July 8 generation timestamp; no claim is made that all its content is stale.

**FrontDoor changes, in order:**

1. **Make summaries reflect enabled content.** `practiceLlms()` currently describes every homepage as containing services, insurance, appointments, location, and hours. Generate this description from actual sections/payment model, so cash-pay practices are described accurately. Owner: `src/lib/practice-production.mjs`.
2. **Keep a concise factual overview.** Continue using approved practice name, specialty, address, phone, and explicit availability. Add a short payment-model or telehealth explanation only when sourced. Avoid treating `seo.description` as the complete operational summary.
3. **Group real destinations by purpose.** Separate provider links from treatment links when the roster warrants it. Add directory/new-patient routes if they are built; optionally link legal policies in an `Optional` section. Dr. Dronavalli's omitted legal links are a curation choice, not a broken file. Preview configurations can produce candidate summaries for checking, but the four current nonindexable practices should continue to omit published `llms.txt`.
4. **Improve format consistency and discoverability.** The current H1/summary/link list is useful. The proposal describes H2 sections as file lists; moving factual practice details before those link sections would make the structure easier for parsers to interpret. Consider a production-only `rel="describedby"` link to the file in `PracticeLayout.astro`, using a path appropriate to the deployment. A footer link is optional; no need to reproduce Carma's conspicuous machine-readable-site promotion.
5. **Avoid a separate mirror deployment for now.** If a concrete consumer needs markdown, generate optional same-origin provider/treatment markdown from the same validated configuration during the existing build. Preserve original-page references and generate maps/exports in the same pass to avoid the drift observed at Carma. Do not add a third-party knowledge-format profile or mirror domain merely because the reference has one.
6. **Verify content usefulness.** Starting only from `llms.txt`, check whether a consumer can identify the practice, payment model, relevant provider/treatment page, and appropriate contact path without inventing facts. Check link resolution and consistency with rendered pages after provider retirement or route additions. Compare against the intended core-page set rather than demanding every sitemap URL appear.

`llms.txt` is an evolving proposal, not a replacement for robots, sitemap, canonical HTML, or indexing controls. Its current proposal discusses curated link sections, optional markdown alternatives, and discovery link relations. [Proposal](https://llmstxt.org/). Google explicitly says it does not use `llms.txt` for Search visibility or rankings, including its generative features; its utility for another agent/service must be evaluated separately. [Google AI optimization guidance](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide).

### Verification for future SEO changes

- Validate unique page titles/descriptions, one intended H1, exact canonical origin/path, absolute social/schema image URLs, and native incoming links for every core route.
- Check representative HTTP/HTTPS, www/apex, retired-provider, and trailing-slash behavior after deployment; confirm final canonical pages return 200. Live FrontDoor redirect/header checks remain outside this audit.
- Match indexable routes against XML sitemap; keep preview noindex and sitemap exclusion intact. Resolve every intended `llms.txt` destination locally and check production links when publishing.
- Validate JSON-LD types/properties and agreement with visible content. Add focused checks for profession/availability defaults and duplicate FAQ entities when changing those behaviors.
- Run existing output-contract checks for implementation changes, then use Search Console inspection/performance data to assess actual indexing and outcomes. No ranking or AI-citation improvement is promised by this report.

## Suggested implementation sequence

1. **Improve the existing provider experience:** native card links, mobile identity order, profession-aware labels, and intentional biography rendering. Pilot on Centex and confirm a solo-provider page still works.
2. **Add the large-practice path:** shared compact card, optional homepage selection, and full directory. Use Centex as the real seven-provider pilot; use temporary larger-roster fixtures for scale checks, without publishing invented clinicians.
3. **Improve patient decision support:** sourced visit steps/preparation, treatment logistics/FAQs, and service-specific payment notes.
4. **Polish shared hierarchy:** theme-scoped spacing, portrait handling, and optional footer tools after the content structure is settled.

### Verification criteria for a future implementation

- Review 1, 3, 7, and approximately 25 providers at mobile/tablet/desktop widths; test long names, long credentials, and variable portrait shapes. No clipped identity, horizontal scrolling, or action-bar overlap with final content.
- Cards navigate with native links and keyboard focus. Without JavaScript, provider discovery and profile links remain usable; any optional directory filters degrade to the complete roster.
- Homepage selection does not remove anyone from the full directory or break existing profile URLs. Counts come from the roster; location groupings and role labels reflect sourced facts.
- Directory/profile breadcrumbs, header links, sitemap, `llms.txt`, metadata, preview paths, and provider retirement behavior agree across all build targets.
- No supplied biography paragraph disappears unintentionally. Role-specific credentials and service links remain accurate; absent facts do not become default claims.
- Preserve analytics and preview action restrictions. Run `npm run test:output-contracts` for shared changes and inspect file-based screenshots across all three themes. Review intentional contract changes before updating baselines.

The original audit added only documentation and retained public evidence. Subsequent implementation is recorded at the top of this file. No conversion uplift, performance score, comprehensive accessibility result, or clinical claim is asserted.
