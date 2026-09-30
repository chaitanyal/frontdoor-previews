# North Hills Psychiatry — Domain & Contact Form Summary

## Domain

- Domain: `northhillspsychiatry.com`
- Practice: North Hills Adult and Child Psychiatry
- Location: Austin, TX
- Public website: `http://northhillspsychiatry.com`

## WHOIS Summary

- Registrar: NameCheap, Inc.
- Creation date: 2010-06-08
- Expiration date: 2026-06-08
- Name servers:
  - `dns1.registrar-servers.com`
  - `dns2.registrar-servers.com`
- Registrant: Redacted for privacy
- Privacy provider: Withheld for Privacy ehf
- Public registrant email: `17a5eed97d824f7794f71ab7a1f998cb.protect@withheldforprivacy.com`

The WHOIS record does not expose the actual domain owner. The registrant is privacy-protected through Namecheap’s privacy service.

## Infrastructure

- Hosting: Amazon S3 static website hosting
- DNS target: `s3-website-us-east-1.amazonaws.com`
- CDN: None detected
- HTTPS: Problematic / unavailable during inspection; HTTPS connection timed out while HTTP loaded successfully
- HTTP server header: `AmazonS3`

## Website Technology

- Site type: Static HTML
- CMS: None detected
- Framework/assets:
  - Older Bootstrap-based layout
  - jQuery-era frontend assets
  - Revolution Slider
  - Font Awesome
  - Flexslider
  - Fancybox
- Visible copyright: 2013
- Last-modified header on homepage: 2018-07-20

## Contact Form Behavior

Contact page:

`http://northhillspsychiatry.com/contact_us.html`

The contact form is not processed by North Hills Psychiatry’s own website backend. The site is static and hosted on Amazon S3, so there is no server-side form handler on the practice domain.

Instead, the page embeds a third-party form from FoxyForm.

### Embed Code

The page loads this FoxyForm script:

```html
http://www.foxyform.com/js.php?id=409746&sec_hash=bccb61e0d55&width=350px
```

That script injects an iframe pointing to:

```html
http://www.foxyform.com/form.php?id=409746&sec_hash=bccb61e0d55
```

### Form Submission

The embedded iframe form submits to FoxyForm:

```html
form.php?id=409746&mail=send&sec_hash=bccb61e0d55
```

The visible form fields are:

- Name
- Email
- Message
- Phone
- Google reCAPTCHA

## Email Delivery

The form likely sends an email through FoxyForm’s backend to the recipient configured in the FoxyForm account/settings.

The public HTML does not expose the configured recipient email. The contact page lists:

`info@northhillspsychiatry.com`

However, this does not prove that FoxyForm sends submissions to that address. The actual delivery address would need to be confirmed from the FoxyForm account configuration.

## FrontDoor Health Notes

- The site is a strong modernization candidate: old static template, no detected CDN, broken/problematic HTTPS, and third-party iframe contact form.
- A modern replacement should include secure HTTPS, accessible mobile-first layout, clear appointment CTA, local SEO/schema, and a safer structured intake/contact flow.
