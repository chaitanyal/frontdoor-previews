# Northwest Psychiatry Assessment

- Assessment date: August 22, 2026
- Website: <https://www.northwestpsychiatry.com/>
- Location: 11673 Jollyville Road, Building B, Suite 202, Austin, TX 78759
- Practice type: Established outpatient adult psychiatry practice
- Overall FrontDoor fit: High

## Practice overview

- Serving greater Austin since 2004.
- One detected office location.
- Current navigation presents three providers:
  - Arvinder Walia, MD
  - Kathleen Nguyen, PA-C
  - Khyati Delada, PA-C
- Services include psychiatric evaluations, medication management, depression, anxiety, ADHD, bipolar disorder, PTSD, ketamine treatment, and Suboxone treatment.
- The homepage displays Aetna, Blue Cross Blue Shield, Cigna, Beacon Health Options, UnitedHealthcare, Medicare, and Baylor Scott & White insurance logos.

Sources:

- [Homepage](https://www.northwestpsychiatry.com/)
- [Services](https://www.northwestpsychiatry.com/psychiatry-services/)
- [Staff](https://www.northwestpsychiatry.com/psychiatry-staff/)

## Domain and infrastructure

- Domain created: May 24, 2013
- Current expiration: May 24, 2027
- Registrar: Register.com/Network Solutions
- DNS provider: Cloudflare
- Authoritative nameservers:
  - `graham.ns.cloudflare.com`
  - `june.ns.cloudflare.com`
- CDN/reverse proxy: Cloudflare
- HTTPS: Active
- Origin hosting: Not confirmed because Cloudflare proxies it
- CMS/platform: Officite/WebManager, associated with Henry Schein One
- Theme identifier: `austin`
- DNSSEC: Not detected as signed during the assessment

This is an established domain with meaningful search history. A replacement should preserve important URLs and implement redirects rather than simply removing the existing service-page structure.

## Email infrastructure

- Public structured-data email: `awalia@waliamd.com`
- Website-domain MX: GoDaddy mail infrastructure
- SPF: Not detected during the DNS check
- DMARC: Not detected during the DNS check
- DKIM: Not confirmed
- The published email does not match `northwestpsychiatry.com`.

This creates a branding inconsistency and potentially weakens spoofing protection and email deliverability. Email modernization is a legitimate secondary opportunity.

## Detected systems

- Patient portal: [Athenahealth](https://24508.portal.athenahealth.com/)
- Online scheduling: NextPatient, embedded on the [scheduling page](https://www.northwestpsychiatry.com/scheduling/)
- Online intake: HushForms
- Printable intake: PDF patient packets
- Analytics: Two GA4 measurement IDs detected
- Marketing attribution: Officite/Internet Brands CampaignTracker
- Social: Facebook
- Reputation links: Google, Healthgrades, and Vitals

The practice already has useful operational systems. The opportunity is to build a better public-facing experience around them, not replace the clinical systems.

## Blog and content publishing

- A public [blog index](https://www.northwestpsychiatry.com/blog/) is integrated into the main site.
- The blog is powered by Officite's proprietary SMB/WebManager publishing system, not WordPress. Evidence includes `Smb__Blog__Widgets__BlogSettings`, `/plugins/smb/blog/` assets, and Officite-hosted article media.
- The first index page displayed 16 articles and pagination for three pages during the assessment. Its latest visible post was [Common Myths About PTSD](https://www.northwestpsychiatry.com/blog/1486034-common-myths-about-ptsd/), dated August 17, 2026.
- The reviewed article has a self-referencing canonical URL, unique title and meta description, Open Graph metadata, and a `PTSD` tag.
- No public RSS/Atom feed, `Article`/`BlogPosting` structured data, or author attribution was detected in the reviewed index and article markup. The article's Open Graph type is the generic `website`, rather than `article`.
- Article images are served from Officite/Internet Brands infrastructure, principally `secure.officite.com` and `smb.ibsrv.net`.
- Visible first-page dates run from July 2024 through August 2026. This shows that the blog is active, though publishing is irregular.
- Public evidence does not establish whether Northwest Psychiatry, Officite, or another party writes or edits the posts.

The blog is a useful SEO asset, but it also increases migration scope. A replacement should inventory all three index pages, migrate article bodies, dates, tags, metadata, and images, and either preserve the current numeric-ID article URLs or map each one to a permanent redirect. No public CMS export or feed was confirmed.

## Website strengths

- Prominent scheduling, portal, and telephone actions.
- Individual provider pages and authentic provider photography.
- Online and printable [patient forms](https://www.northwestpsychiatry.com/forms/).
- Canonical URLs, page titles, descriptions, and `MedicalBusiness` structured data.
- An active, multi-page blog provides an existing library of locally relevant psychiatric content.
- Insurance information appears on the homepage.
- An after-hours emergency number is clearly identified.
- Cloudflare provides HTTPS, caching, and edge protection.

## Main weaknesses

### 1. Template-heavy presentation

The site uses a dated Officite theme, dense navigation, and repeated boilerplate sections. The source also contains commented dental-template copy and cross-specialty template identifiers.

### 2. Stale provider SEO inventory

The current navigation shows three providers, but the [XML sitemap](https://www.northwestpsychiatry.com/sitemap.xml) also exposes pages for Wendy Lowry, Hayley Hill, and Mallori Hernandez. These may be former providers or otherwise inactive pages and should be audited.

### 3. Conflicting patient information

- The homepage displays Medicare, while the forms area includes a Medicare Private Contract.
- The office page says checks are accepted, while the current new-patient packet says personal checks are not accepted.

These inconsistencies can create patient confusion and additional office calls.

### 4. Weak trust signals

The homepage testimonial section currently says “Coming Soon.” For an established practice, verified review links or no testimonial section would be stronger.

### 5. Analytics fragmentation

Two GA4 properties fire on the homepage. That may be intentional, but otherwise it can fragment reporting and complicate attribution.

### 6. Mobile conversion opportunity

Responsive navigation and a mobile-enabled hero booking CTA are present in the markup, but no persistent call or booking action was detected. An independent headless visual check was blocked by a `403` response, so the rendered mobile experience was not fully confirmed.

### 7. Blog portability and article SEO

The Officite blog uses platform-specific numeric article URLs and externally hosted images. The reviewed article has solid basic metadata, but no visible author attribution or `Article`/`BlogPosting` schema, and its Open Graph type is `website`. These are addressable SEO and trust gaps. The absence of a publicly evident feed or export also means migration should begin with a complete crawl and content inventory.

## Recommended FrontDoor approach

A strong redesign would:

- Put providers, major services, insurance, location, new-patient information, and primary calls to action on a concise homepage.
- Retain individual provider pages for provider searches.
- Preserve or redirect existing high-value service URLs.
- Keep Athenahealth, NextPatient, and HushForms integrations.
- Add persistent mobile **Call** and **Book Appointment** actions.
- Clarify Medicare participation, insurance acceptance, and payment policies from one authoritative configuration.
- Remove former providers and irrelevant template-library URLs from the sitemap while retaining valid blog articles.
- Migrate the complete blog archive, preserve current canonicals where practical, and create one-to-one permanent redirects for every changed article URL.
- Import article images and tags into the replacement CMS, add reviewed author attribution and dates, and emit `Article` or `BlogPosting` structured data.
- Preserve analytics events while consolidating the GA configuration.
- Strengthen provider and practice structured data.
- Move public email to the practice domain and configure SPF, DKIM, and DMARC.

## Assessment score

| Category | Score |
|---|---:|
| Design quality | 2/5 |
| Conversion flow | 3/5 |
| Mobile experience | 3/5 |
| Provider presentation | 3/5 |
| Technical maturity | 3/5 |
| Email infrastructure | 1/5 |
| **Total** | **15/30** |

## FrontDoor opportunity

- Fit: High
- Replacement difficulty: Moderate
- Likely value: High
- Primary pitch: Modernize the public patient journey while preserving search equity and existing operational integrations.
- Secondary pitch: Eliminate stale and conflicting content that generates patient confusion and administrative work.

## Suggested outreach

> Dr. Walia, I reviewed Northwest Psychiatry’s website and noticed that the practice already has strong operational tools, including NextPatient scheduling, an Athenahealth portal, online patient forms, and an active three-page blog. The larger opportunity is simplifying the mobile patient journey and cleaning up outdated content without losing that search inventory. The current sitemap still exposes additional provider pages that are not in the navigation, payment and Medicare information appears inconsistent, and two separate GA4 properties are configured. FrontDoor could modernize the public website around your current providers and services while preserving the blog URLs, scheduling, portal, and intake workflows.

## Verification scope and limitations

The assessment used public WHOIS and DNS data, response headers, homepage metadata and structured data, selected first-level pages, the public XML sitemap, the blog index, one representative article, and detected vendor links. Blog post counts refer only to the 16 articles visible on the first index page; the three-page archive was not exhaustively counted. The site returned `403 Unauthorized` to the independent headless-Chrome mobile render, so the mobile visual assessment is based on the delivered markup and detected responsive behavior rather than a completed screenshot review. Origin hosting, DKIM, blog authorship/editorial ownership, CMS export capability, and any systems not exposed through public pages or DNS were not confirmed.
