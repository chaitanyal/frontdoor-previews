# North Hills Psychiatry Assessment

- Assessment date: August 22, 2026
- Website: <http://northhillspsychiatry.com/>
- Location: 11615 Angus Road, Suite 225, Austin, TX 78759
- Practice type: Two-physician outpatient adult, child, and adolescent psychiatry practice
- Overall FrontDoor fit: High

## Practice overview

- North Hills Psychiatry presents two board-certified psychiatrists at one Austin location:
  - Zita Samuel, MD — Adult Psychiatry
  - Diana Samuel, MD — Adult Psychiatry and Child and Adolescent Psychiatry
- The practice treats ADHD, anxiety, bipolar disorder, depression, eating disorders, OCD, PTSD, schizophrenia, and tic disorders.
- Detailed provider biographies and authentic provider photography are available.
- The practice explicitly states that it does not accept insurance. Payment is private pay by check, Visa, or Mastercard; rates are provided by phone.
- Appointments are requested by telephone or a general contact form. No online scheduling system or patient portal was detected.

Sources:

- [Homepage](http://northhillspsychiatry.com/)
- [Provider biographies](http://northhillspsychiatry.com/austin-psychiatrist.html)
- [Conditions](http://northhillspsychiatry.com/conditions.html)
- [FAQs and payment policy](http://northhillspsychiatry.com/faqs.html)
- [Contact and appointment request](http://northhillspsychiatry.com/contact_us.html)
- [Patient forms](http://northhillspsychiatry.com/forms.html)

## Domain and infrastructure

- Domain: `northhillspsychiatry.com`
- Registrar: NameCheap, Inc.
- Created: June 8, 2010
- Domain age: Approximately 16 years
- Registry expiration: June 8, 2027
- Registrar-listed nameservers:
  - `dns1.registrar-servers.com`
  - `dns2.registrar-servers.com`
- Hosting: Amazon S3 static website hosting, detected from the apex CNAME and `Server: AmazonS3` response header
- CDN/reverse proxy: Not detected
- HTTPS: Not available during testing; the HTTPS connection timed out and HTTP does not redirect to HTTPS
- Homepage `Last-Modified`: July 20, 2018
- DNSSEC: Unsigned

The established domain has useful history and should be retained. A replacement should preserve or redirect the existing page URLs rather than abandoning them.

## Email infrastructure

- Public email: `info@northhillspsychiatry.com`
- MX provider: None detected
- SPF: Not detected
- DMARC: Not detected
- DKIM: Not confirmed

The apex domain aliases directly to an Amazon S3 website endpoint and returned no MX record. The advertised domain email is therefore unlikely to receive mail reliably. Email routing and SPF/DKIM/DMARC should be treated as a priority operational check, not merely a website enhancement.

## Detected systems

- CMS: Not detected; the site appears to be hand-authored/static HTML
- Frontend: Legacy Bootstrap, jQuery 1.7.2, Revolution Slider, Isotope, Fancybox, and Font Awesome
- Hosting: Amazon S3 website endpoint
- Analytics/tag manager: Not detected
- Scheduling vendor: Not detected
- Patient portal: Not detected
- Contact forms: Foxyform
- Intake: Downloadable PDF new-patient packet
- Mapping: Legacy Google Maps embed
- Social/marketing: A Facebook icon is present, but its link is only `#`; no active social destination was confirmed

The current operational flow is lightweight but fragile: telephone calls, a third-party general contact form, and downloadable paperwork carry most of the new-patient journey.

## Website strengths

- The practice's specialty and two-provider model are understandable from the site.
- Provider biographies include credentials, training, experience, treatment philosophy, and authentic photos.
- The telephone number is prominent, clickable, and visible on mobile.
- Address, office hours, FAQs, conditions, and a downloadable new-patient packet are available.
- The private-pay policy is explicit, reducing ambiguity about insurance participation.
- Pages rendered without obvious horizontal overflow at a 390-pixel mobile viewport.

## Main weaknesses

### 1. No HTTPS on a healthcare contact flow

The entire website is served over plain HTTP. The appointment page asks for name, email, phone, and a free-text message through Foxyform without transport encryption. This creates a serious patient-trust and privacy exposure even though the form warns against emergencies and established-patient communication.

### 2. Broken or incomplete email setup

The site publishes `info@northhillspsychiatry.com`, but the domain returned no MX record and no SPF or DMARC policy. Patients who choose email instead of the form may encounter failed or unreliable delivery, while the domain lacks basic anti-spoofing controls.

### 3. Dated presentation and slow first impression

The visual design, 2013 copyright, legacy slider, small typography, and template-era styling feel substantially older than the providers' credentials and practice positioning. In headless checks, the homepage hero remained a blank loading area initially and populated only after several seconds.

### 4. Weak mobile conversion path

The phone number remains visible, which is useful, but the mobile navigation collapses to a select menu showing only “Home.” The “Contact Us / schedule an appointment” action is hidden inside that control, and there is no persistent **Call** or **Request Appointment** button. The provider message also becomes small and incomplete in the mobile hero, so the first screen does not quickly explain who the doctors help or what the visitor should do next.

### 5. Contact-page friction

The contact form loads on mobile, but it is a generic third-party form rather than a structured new-patient request. The legacy map did not render in the mobile screenshot and left a large blank region, making the page unusually long. There is no visible confirmation of intake eligibility, preferred provider, patient age group, self-pay expectations, or next-step routing before submission.

### 6. Limited local SEO and structured content

- Every inspected page uses the same title and short meta description.
- Canonical tags, Open Graph metadata, JSON-LD structured data, and an XML sitemap were not detected.
- Both providers share one biography page rather than having distinct provider URLs.
- Condition names are presented as a short list rather than useful service pages.
- A site-restricted search returned no first-party results during the assessment; this is an indicative visibility signal, not definitive proof of deindexing.
- The external ADHD teacher-form link now redirects to the publisher's homepage rather than the referenced PDF.

### 7. Limited measurement and follow-up infrastructure

No analytics, tag manager, online scheduling, patient portal, CRM, or automated lead-routing system was detected. The site promises a response within one business day but exposes no visible workflow supporting that promise.

## Business signals

- Practice size: Small group, two physicians
- Practice model: Independent outpatient psychiatry practice
- Locations: One detected
- Insurance/payment model: Private pay / self-pay only
- Accepted insurance: None; the practice explicitly says it does not accept insurance
- Cash-pay signals: Rates by phone; checks, Visa, and Mastercard accepted
- Marketing maturity: Low
- Operational maturity: Low to moderate; clear offline policies and downloadable forms, but minimal digital workflow

The private-pay model strengthens the business case for a polished conversion experience: the website must establish enough provider trust and clarity for families to request care without insurance-network validation.

## Recommended FrontDoor approach

A focused replacement should:

- Launch on HTTPS while preserving the established domain and redirecting existing `.html` URLs.
- Put **Call** and **Request Appointment** actions persistently on mobile.
- Replace the generic Foxyform workflow with a privacy-conscious, structured lead request that avoids collecting clinical details and routes requests reliably.
- Give each physician a dedicated provider page with credentials, age-group focus, treatment philosophy, and clear appointment action.
- Separate adult psychiatry and child/adolescent psychiatry pathways so visitors immediately reach the relevant provider and information.
- State the private-pay model and payment expectations clearly near conversion points; add current rates or an intentional consultation prompt if the practice prefers.
- Modernize the new-patient workflow while retaining a printable option.
- Add local-business, medical-practice, provider, and FAQ structured data; unique page metadata; a sitemap; and canonical URLs.
- Repair the map and outdated external resource link.
- Add privacy-safe page-view and CTA analytics plus basic lead-source attribution.
- Restore domain email with a real mail provider and configure SPF, DKIM, and DMARC.

## Assessment score

| Category | Score |
|---|---:|
| Design quality | 2/5 |
| Conversion flow | 2/5 |
| Mobile experience | 2/5 |
| Provider presentation | 3/5 |
| Technical maturity | 1/5 |
| Email infrastructure | 1/5 |
| **Total** | **11/30** |

## FrontDoor opportunity

- Fit score: High
- Replacement difficulty: Low to moderate
- Likelihood of paying for modernization: Moderate
- Payment-model signal: Strong private-pay practice
- Primary outreach angle: Secure and modernize the private-pay patient journey
- Secondary outreach angle: Repair domain email and convert the two strong provider stories into discoverable, conversion-focused pages

## Suggested outreach

> Drs. Samuel, I reviewed North Hills Psychiatry's website and found that the strongest content is already there: two clear specialties, meaningful training and experience, authentic provider photos, and an explicit private-pay model. The main gap is the patient journey around that content. The site is still served without HTTPS, the appointment form sends patient-entered contact information through a third party over plain HTTP, and the published practice-domain email has no detectable mail routing. On mobile, scheduling is hidden inside a dropdown and the provider message depends on a slow legacy slider. FrontDoor could preserve your established domain and current phone workflow while giving adult patients and families a secure, clearer path to the right doctor and next step.

## Personalized outreach notes

- Lead with security and reliability: no HTTPS and no detectable MX record are concrete operational issues, not subjective design criticism.
- Acknowledge the providers' strong biographies; position the redesign as making their existing credibility easier to discover and act on.
- Tie conversion improvements to the private-pay model, where trust and differentiation must do more work before a patient calls.
- Emphasize two distinct entry paths: adult psychiatry with Dr. Zita Samuel and child/adolescent care with Dr. Diana Samuel.
- Offer a low-disruption migration: preserve the domain, phone number, provider content, forms, and existing page equity while replacing the public-facing experience.

## Verification scope and limitations

This assessment used public WHOIS and DNS records, HTTP response headers, homepage metadata, all linked first-level practice pages, standard robots/sitemap checks, vendor and business-term searches across the fetched HTML, live mobile and desktop screenshots, and limited public search results. The assessment did not submit the contact form, inspect private systems, or verify clinical availability. DKIM and any vendors not exposed through public DNS or page source were not confirmed.
