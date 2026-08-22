# Source Extraction

## Source Inventory

- `assessment.md`: August 22, 2026 FrontDoor practice intelligence assessment copied from `assessments/northwestpsychiatry.md`.
- Live public pages reviewed August 22, 2026: homepage, provider roster, three current provider profiles, services, scheduling, new patients, forms, office, contact, blog index, and one representative blog article.
- Public provider photographs downloaded from the current provider profiles.
- `austin-skyline.webp`: existing regional hero asset reused from the North Hills preview because the current Northwest site does not expose a suitable authentic office or regional photograph.
- `khyati-profile.png`: public professional-profile headline supplied by the user.
- `khyati-education.png`: public professional-profile education section supplied by the user.
- `khyati-certifications.png`: public professional-profile licenses and certifications section supplied by the user.

## Field Evidence Ledger

| Field | Proposed value | Status | Source | Observed | Notes |
|---|---|---|---|---|---|
| `practice.phone` | `(512) 342-7979` | confirmed | current public pages | 2026-08-22 | Repeated site-wide |
| `practice.email` | `awalia@waliamd.com` | confirmed | homepage structured data | 2026-08-22 | Does not match the practice domain |
| `practice.defaultAppointmentUrl` | Northwest scheduling page | confirmed | scheduling page | 2026-08-22 | Disabled as an outbound action in the preview |
| `practice.patientPortalUrl` | Athenahealth portal | confirmed | site navigation | 2026-08-22 | Disabled as an outbound action in the preview |
| `practice.acceptsNewPatients` | `true` | inferred | scheduling and new-patient materials | 2026-08-22 | Provider-specific availability is unknown |
| `location.hours` | Monday–Thursday 8–5; Friday 8–3 | confirmed | office page and site-wide hours | 2026-08-22 | Friday is telehealth/phone support only |
| `insurance.coverage_types` | Seven displayed carriers | conflicting | homepage; forms | 2026-08-22 | Medicare participation requires verification |
| Current provider roster | Walia, Nguyen, Delada | confirmed | current navigation and provider pages | 2026-08-22 | Sitemap contains additional stale provider URLs |
| Blog platform | Officite SMB/WebManager | confirmed | blog index and article markup | 2026-08-22 | Authorship and export capability are unknown |

## Practice Facts

- Practice: Northwest Psychiatry [assessment.md, homepage]
- Positioning: Adult outpatient psychiatry in Austin [homepage, services]
- Current providers in navigation: Arvinder Walia, MD; Kathleen Nguyen, PA-C; Khyati Delada, PA-C [homepage, provider pages]
- Online scheduling is offered through a NextPatient widget on the current scheduling page [scheduling page]
- Athenahealth patient portal: `https://24508.portal.athenahealth.com/` [site navigation]
- Public contact email in structured data: `awalia@waliamd.com` [homepage JSON-LD]
- Main phone: (512) 342-7979 [all public pages]
- After-hours emergency line: (512) 467-5338 [all public pages]

## Providers

### Arvinder Walia, MD

- Board-certified adult psychiatrist; board certification is listed as Adult Psychiatry [provider profile, arvinder-walia-credential-corrections.png]
- Primary interests: mood, anxiety, and cognitive disorders [provider profile]
- Experience includes forensic psychiatric evaluations of healthcare professionals and consultation-liaison psychiatry for metabolic disorders [provider profile]
- Co-founder and medical director of Austin Center for Psychological Care, a dialectical behavior intensive outpatient program for personality and mood disorders [provider profile]
- Teaches Advanced Psychiatric Nurse Practitioner students at the University of Texas at Austin School of Nursing [provider profile]
- Medical school: Dayanand Medical College, India [arvinder-walia-credential-corrections.png]
- Psychiatry training at Austin Medical Education Program for Psychiatry; visiting ECT fellowship at Duke University Medical Center [provider profile]
- Hospital affiliation: St. David's North Austin Medical Center [`https://www.healthgrades.com/physician/dr-arvinder-walia-38l5w`, corroborated by Medical News Today provider listing]
- Authentic portrait saved as `./images/providers/arvinder-walia.webp` [provider profile]

### Kathleen Nguyen, PA-C

- LinkedIn profile: `https://www.linkedin.com/in/kathleen-nguyen-b6a206114/` [user-supplied]
- Board-certified physician assistant with urgent care, post-acute care, and skilled nursing experience [provider profile]
- Treats adults with depression, anxiety, mood disorders, insomnia, and behavioral symptoms associated with chronic medical illness [provider profile]
- Approach emphasizes medication management, education, shared decision-making, and individualized treatment planning [provider profile]
- Master of Science in Physician Assistant studies, University of Bridgeport, 2019–2021 [kathleen-education.png]
- Bachelor of Science in Biology/Biological Sciences, UC Irvine, 2013–2017 [kathleen-education.png]
- Authentic portrait saved as `./images/providers/kathleen-nguyen.webp` [provider profile]

### Khyati Delada, MPAM, PA-C, CNIM

- LinkedIn profile: `https://www.linkedin.com/in/khyati-delada/` [user-supplied]
- Board-certified physician assistant with psychiatry, behavioral health, and neurology experience [provider profile]
- Treats adults with depression, anxiety disorders, ADHD, bipolar disorder, insomnia, trauma-related disorders, and other mood and stress-related concerns [provider profile]
- Neurology background supports evaluation of neuropsychiatric and cognitive disorders [provider profile]
- Approach emphasizes medication management, education, shared decision-making, and individualized treatment planning [provider profile]
- Public professional headline uses `Khyati Delada, MPAM, PA-C, CNIM` and describes her as a board-certified physician associate specializing in neuropsychology [khyati-profile.png]
- Master of Science in Physician Assistant studies, University of Lynchburg, 2020-2022 [khyati-education.png]
- Bachelor of Science in Neuroscience, University of Illinois Chicago, 2012-2016 [khyati-education.png]
- Physician Assistant-Certified through the National Commission on Certification of Physician Assistants [khyati-certifications.png]
- Certification in Neurophysiologic Intraoperative Monitoring through ABRET Neurodiagnostic Credentialing and Accreditation [khyati-certifications.png]
- Authentic portrait saved as `./images/providers/khyati-delada.webp` [provider profile]

## Services and Conditions

- Psychiatric evaluation and medication management [services]
- ADHD diagnostic testing and treatment [services]
- Bariatric surgery psychiatric evaluations [services]
- Psychiatric evaluations for healthcare professionals and licensing boards [services, Arvinder Walia profile]
- Ketamine treatment and Suboxone treatment [services]
- Conditions explicitly listed across current pages: depression, anxiety disorders, PTSD, ADHD/ADD, bipolar disorder, panic disorder, schizophrenia, insomnia, trauma-related disorders, mood disorders, stress-related conditions, and cognitive/neuropsychiatric disorders [homepage, services, provider profiles]

## Insurance and Payment

- Current homepage says the practice accepts Aetna, Blue Cross Blue Shield, Cigna, Beacon Health Options, UnitedHealthcare, Medicare, and Baylor Scott & White [homepage]
- Office page says the practice accepts most traditional insurance plans and asks patients to verify plan acceptance [office]
- Payment methods: checks, cash, and credit cards; a flexible payment plan is mentioned [office]

## Location, Hours, and Contact

- Address: 11673 Jollyville Road, Building B, Suite 202, Austin, TX 78759 [office, homepage structured data]
- Phone: (512) 342-7979 [all pages]
- Fax: (512) 637-2596 [office]
- Email: `awalia@waliamd.com` [homepage structured data]
- Monday-Thursday: 8:00 AM-5:00 PM [office]
- Friday: 8:00 AM-3:00 PM; no in-office appointments, with telehealth and phone support available [office and site-wide hours]
- Saturday-Sunday: closed [office]
- Lunch: 12:00 PM-1:00 PM Monday-Thursday [site-wide hours]

## Links, Portals, Forms, and Resources

- Scheduling: `https://www.northwestpsychiatry.com/scheduling/` with NextPatient provider-search widget [scheduling]
- Patient portal: `https://24508.portal.athenahealth.com/` [site navigation]
- New-patient packet PDF: `https://www.northwestpsychiatry.com/storage/app/media/forms/New-Patient-Packet-Revised2025.pdf` [forms]
- Online new-patient packet: `https://hushforms.com/np-newpatientpacket` [forms]
- Consent to release medical records PDF and HushForms version [forms]
- Telemedicine informed consent PDF [forms]
- HIPAA authorization PDF and HushForms version [forms]

## Content and SEO Migration

- Blog index: `https://www.northwestpsychiatry.com/blog/`; the first page displayed 16 posts and pagination for three pages on August 22, 2026 [blog index]
- Latest visible article: `https://www.northwestpsychiatry.com/blog/1486034-common-myths-about-ptsd/`, posted August 17, 2026 [blog index, article]
- Platform: Officite SMB/WebManager; article images are hosted on `secure.officite.com` and `smb.ibsrv.net` [blog index, article markup]
- URL pattern: `/blog/<numeric-id>-<slug>/`; preserve current canonicals or create one-to-one permanent redirects during migration [blog index, article]
- The reviewed article includes a title, meta description, canonical URL, Open Graph metadata, and a `PTSD` tag. No public RSS/Atom feed, `Article`/`BlogPosting` schema, or author attribution was detected [article markup]
- Migration scope includes a complete crawl of all three index pages, article bodies, publication dates, tags, metadata, and external images. Public CMS export capability was not confirmed.

## Images and Asset Candidates

- `./images/providers/arvinder-walia.webp`: sourced provider portrait.
- `./images/providers/kathleen-nguyen.webp`: sourced provider portrait.
- `./images/providers/khyati-delada.webp`: sourced provider portrait.
- `./images/hero/austin-skyline.webp`: existing repository regional image used for the hero.
- `./images/office/waiting-room.webp`: user-supplied photograph of the Northwest Psychiatry waiting room, used in the location section [office-interior.png].

## Conflicts or Uncertainty

- The homepage displays Medicare as accepted, while the forms page includes a Medicare Private Contract. The preview lists Medicare as shown but tells patients to verify coverage with the office.
- The assessment previously found stale provider URLs in the sitemap. Only the three providers in the current navigation are included.
- Provider-specific scheduling availability is not stated. The practice is marked as offering new-patient scheduling, but individual providers are not labeled as accepting new patients.
- The current site lists an after-hours emergency number, but the preview retains the repository's standard 911/988 crisis notice rather than presenting the practice line as emergency coverage.
- Kathleen Nguyen's supplied education screenshot shows two completed degree entries. No other education details are inferred.
- Khyati Delada's professional headline uses the credential `MPAM`, while the visible education entry describes her University of Lynchburg degree as a Master of Science in Physician Assistant studies. The preview preserves the displayed `MPAM` credential and describes the degree using the education entry's wording.
- The certifications screenshot contains both an undated CNIM entry and an older CNIM entry marked expired in December 2022. Her current headline still uses `CNIM`, so the preview treats CNIM as current without publishing an issue or expiration date.
- A third education entry is indicated but not visible in the supplied screenshot and is therefore omitted.
- Blog authorship and editorial ownership are not publicly attributed in the reviewed markup. No public RSS/Atom feed or CMS export path was confirmed.
