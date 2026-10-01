# Centex hero v2 — September 30, 2026

## Direction and provenance

Generated regional landscape using the built-in imagegen tool: a quiet limestone creek and live oaks, with natural blue-green water and earthy bark. This is an illustrative Central Texas setting, not a photograph of a named place or clinic property. No people, buildings, signage, logo, or text appear in the image.

The supplied `../images/central_texas_mental_health_logo.jpeg` was inspected as a palette and flowing-form reference only; no pixels were composited from it. The existing waiting-room hero/office photograph was inspected and excluded from generation as requested. Existing provider portraits are unrelated to this people-free hero and were not used. No local regional source photograph was available. This is a new generated image, not an edit of the clinic's photography.

Original generated PNG: `/Users/chaitanya/.codex/generated_images/01a0f2fd-3bcc-7bc1-8e79-2793d9e572fc/exec-7afe75f7-8efb-40ed-a3b2-836bd952206c.png`.

Website asset: `sites/centexmh/images/hero/centexmh-limestone-creek-v2.webp`. The previous hero remains preserved. The office section retains the authentic waiting-room photo. The new hero and social-preview image point to the new asset; their alt text identifies it as a generated landscape.

## Final generation prompt

Create a new landscape hero image for Central Texas Mental Health, an adult psychiatry practice serving Round Rock, Georgetown, Cedar Park and the northern Austin suburbs including Wells Branch. A photorealistic editorial landscape interpretation of Central Texas: one quiet, shallow limestone creek bending gently through low native grasses beneath spreading live oaks. Weathered pale limestone shelves, subtly rippled deep blue-green water, restrained olive foliage, warm brown branches, believable irregular vegetation. Soft clear morning daylight, neutral colors, natural imperfections, moderate depth of field, unglamorous and grounded. Do not depict a recognizable named park, landmark, or exact real location. The supplied clinic logo was reviewed only for deep blue-green and earthy brown palette cues and gently flowing botanical curves; do not reproduce or embed the logo. Composition: wide horizontal 3:2 image, preferably 2400x1600 or larger. Left 50 percent is visually quiet open creek water and low distant bank, providing breathing room under a cream editorial text panel. Main curving bank and a graceful live oak branch in upper right, with water and limestone visible near 62 percent horizontal center so a narrow mobile crop remains coherent. Important detail across center-right, no isolated edge-only subject. Natural subdued textures, no dramatic sunset, no orange color grade, no glowing haze, no exaggerated bokeh, no manicured resort or fairytale wilderness. Absolutely no indoor spaces, waiting rooms, medical equipment, buildings, people, faces, staged activities, signage, letters, logos, watermarks, or artificial graphic overlays. Deliver just the landscape image, not a website mockup. This is a generated regional atmosphere image, not documentary photography.

## Review

Output visually reviewed: coherent oak branches, natural limestone and water texture, no faces, buildings, lettering or recognizable landmark claim. Main detail is center-right with left-side space for the existing editorial text panel.

Final asset is 1536×1024, WebP quality 88, 552,178 bytes; conversion only, no further content edits. `npm run verify:site -- centexmh` passed. Preview and marketing builds passed and their scoped output contracts match after updating the intended hero asset references. Configuration audit reports zero errors or warnings.

The built homepage was visually reviewed at 390×844 and 1440×1000 using `file://`. Text remains readable, the center-right crop retains branches/creek texture, images load, and no horizontal overflow occurs. The shared editorial theme naturally subdues the image behind the mobile text panel. Service-area copy and MedicalClinic schema include the Round Rock office plus Georgetown, Cedar Park and Wells Branch. No additional office is claimed; provider profiles do not inherit service-area copy. Preview appointment destinations remain disabled.

Screenshots and browser audit: `.tmp/centexmh-hero-v2-qa/`. Local preview: `.tmp/astro-dist/preview/previews/centexmh/index.html`. Nothing deployed. Only provenance limitation is that this is a generated regional interpretation; it must not be labeled as a photograph of a specific creek, park or clinic property.
