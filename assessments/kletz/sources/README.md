# Kletz Psychiatry source inventory

Observed October 2, 2026. Public website evidence only. No forms submitted, appointments booked, authenticated portals entered, or vulnerability scans performed.

| File | Source / purpose |
| --- | --- |
| `evidence.json` | Single-site helper WHOIS, website DNS, headers, core-page URLs/statuses, and automated heuristics |
| `page-01.html` | https://www.kletzpsychiatry.com/ |
| `page-02.html` | https://www.kletzpsychiatry.com/about |
| `page-03.html` | https://www.kletzpsychiatry.com/services |
| `page-04.html` | https://www.kletzpsychiatry.com/appointments |
| `page-05.html` | https://www.kletzpsychiatry.com/contact-1 |
| `reviews.html` | https://www.kletzpsychiatry.com/reviews |
| `psychiatry-tips.html` | https://www.kletzpsychiatry.com/short-form-psychiatry-1 |
| `article-paxil.html` | https://www.kletzpsychiatry.com/short-form-psychiatry-1/paxil-for-anxiety-and-depression |
| `apex-email-dns.json` | Supplemental apex MX/TXT, DMARC, and selected DKIM queries; the helper queried `www` |
| `mobile.png` | Live homepage, Chromium, 390 × 844 viewport, full-page screenshot |
| `desktop.png` | Live homepage, Chromium, 1440 × 1000 viewport, full-page screenshot |
| `contact_form.png` | User-supplied screenshot of the Contact form, showing Name, Email, Message, and Send |

## Manual verification notes

- `curl -I -L --max-redirs 3 http://kletzpsychiatry.com` returned a 301 to `https://www.kletzpsychiatry.com/`, then 200; inspected October 2, 2026.
- Live mobile capture used the closed-menu homepage. Desktop header booking links had zero-size bounding rectangles at the mobile viewport; overlay links existed in the DOM but were not visible in the screenshot. No homepage-body booking link was found.
- The helper's blog output was incomplete. Manual first-level navigation inspection identified Psychiatry Tips, fetched its index, then fetched one representative article. Article schema, dates, tags, and RSS link were reviewed; RSS contents were not fetched.
- Phone conflict: footer `(415) 320-6524`; Contact body `(415) 236-5509`. No call was placed and the intended routing remains unknown.
- Empty `href` values on Zocdoc/Psychology Today buttons and Squarespace-owned social destinations were confirmed in retained HTML.
- The user independently reports that Zocdoc and Psychology Today links do not work.
- Contact page configuration identifies native Squarespace form `67aee72554fe60668c010c83` (`New Form 2`) with required Name, Email, and Message fields. Its recipient/storage destination is not publicly exposed. Spruce appears as contact text, not evidence of this form's delivery integration. No submission was made.
- Automated keyword hits may originate in generic platform scripts. The narrative distinguishes visible business statements and vendor-specific embeds from these heuristics.
- No licensing verification, clinical-content review, performance benchmark, formal accessibility audit, email delivery test, or completed scheduling test was performed.
