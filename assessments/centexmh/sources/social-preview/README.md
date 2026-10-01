# Centex link preview

## Production share image

`generate-production.mjs` creates `sites/centexmh/images/social/centexmh-production-share.png`
as a separate 1200 × 630 clinic-facing image. It includes the supplied clinic logo,
Round Rock headline, medication management, NeuroStar TMS Therapy, Spravato, clinic
phone/domain and service-area communities. The right panel uses the existing generated
creek hero; it does not represent a verified clinic property or named local landmark.
No concept or FrontDoor sales messaging appears. At the user's request, this asset
is selected in practice.json for previews as well as eventual production builds.
Clinic-focused title/description replace the prior independent-concept metadata.

```sh
node assessments/centexmh/sources/social-preview/generate-production.mjs
```

## Earlier concept share image (retained, no longer selected)

Earlier on October 1, 2026, homepage preview metadata identified Central Texas Mental
Health and labels the site as an independent website concept. The description
emphasizes finding providers, accessing forms, exploring TMS/Spravato and requesting
care from a phone. The patient-facing homepage headline and hero remain unchanged.

`generate.mjs` renders a 1200 × 630 PNG share card with a screenshot of the actual
local mobile homepage. The published image is
`sites/centexmh/images/social/centexmh-website-concept.png`; screenshot intermediates
remain in `.tmp/centexmh-share-card/`. This is deterministic HTML composition,
not AI imagery. Run from the repository root after building the Centex preview:

```sh
node assessments/centexmh/sources/social-preview/generate.mjs
```

The clinic name comes from practice.json. Share-card headings and captions live
in this retained asset generator; patient-facing webpage copy remains in
practice.json. Concept wording and imagery have since been replaced with clinic-facing
metadata and the production share image for all builds. Messaging clients
may retain cached cards for previously shared URLs; updated metadata does not
force an existing conversation's card to refresh.
