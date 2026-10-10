---
name: generate-practice-hero
description: Create or adapt authentic hero imagery for a FrontDoor Health clinic site using practice.json and the clinic's existing photography. Use when selecting, editing, extending, or generating a homepage hero asset for a medical or mental-health practice. Avoid stock-photo aesthetics, especially staged imagery with people.
---

# Generate Practice Hero

Create a credible, calm hero image that feels specific to the practice rather than purchased from a healthcare stock library. Use the built-in `imagegen` skill for raster generation or editing and follow the repository's asset and verification instructions.

## Inputs and Scope

- Resolve the practice folder and read its `practice.json`.
- Inspect existing hero, office, provider, logo, and regional images visually before proposing a new asset.
- Use the practice specialty, location, theme, hero copy, and layout only to guide visual tone and composition. Do not turn clinical or operational fields into invented visual claims.
- Determine from the request whether the task is exploration, a new versioned asset, or implementation. Honor staged review checkpoints without asking again for authorization already given. Do not overwrite the current hero by default.

## Authenticity Standard

Apply this preference order:

1. Use a strong authentic clinic image as-is when crop and quality are sufficient.
2. Edit or extend an authentic clinic, office, exterior, or regional image while preserving recognizable details.
3. Create a people-free environmental image grounded in the practice's real setting and available references.
4. Use abstract texture, landscape, architecture, or quiet interior detail when authentic photography is insufficient.

Do not generate or select imagery that looks like conventional healthcare stock photography. In particular:

- Avoid staged clinicians, smiling patient-and-provider interactions, posed families, therapy-session reenactments, handshakes, clipboards, white coats, and generic waiting-room models.
- Avoid overly polished lifestyle lighting, spotless showroom interiors, implausible luxury, exaggerated depth of field, and generic wellness imagery.
- Do not generate synthetic provider or patient faces. Use a real provider portrait only when it is an approved source asset and the page design genuinely calls for it.
- Do not invent a clinic interior, exterior, logo, sign, skyline, landmark, or medical equipment and present it as documentary photography.
- Record whether a source is authentic photography, generated imagery, or of unknown provenance. Editing an image does not establish its authenticity. Describe generated regional imagery as atmospheric, not as a photograph of the practice or a verified location.
- Do not add text, signage, credentials, logos, or watermarks inside the image.

When people appear incidentally in an authentic source photo, preserve them only if the user has supplied or approved the image and their presence feels candid rather than promotional. Do not introduce additional people. If a user explicitly requests people, explain the stock-photo risk and use candid, observational composition with natural imperfection rather than posed interaction.

## Visual Direction

- Favor quiet editorial photography, natural light, restrained color, believable texture, and a clear sense of place.
- Coordinate image tones with the actual page background, text, and button colors without tinting the image to match the interface mechanically. Account for CSS filters and overlays before baking a faded or desaturated treatment into an asset.
- Distinguish a background behind copy from a separate image panel. Reserve negative space only where text actually overlaps the image, deriving placement from the rendered component. Do not force empty space into an image displayed beside text.
- Inspect desktop and mobile image containers, aspect ratios, `object-fit`, and `object-position`. Identify the focal point and details that must survive both crops. If a proposed future layout differs from the current one, label that assumption; image work alone does not authorize layout changes.
- Prefer one strong subject or spatial gesture over a collage of healthcare symbols.
- Judge whether the image adds practice-relevant character, not merely whether it is attractive. Do not replace a suitable existing asset just for novelty or force the same landscape, palette, or illustration style across practices.

## Visual Brief

Before selecting, editing, or generating, state a short brief covering:

- Purpose and practice relevance, informed by the actual headline.
- Source roles and provenance; details that must remain unchanged when editing.
- Current or proposed layout, copy placement, target crops, and focal point.
- Subject, light, compatible colors, and believable texture.
- Acceptance criteria: credible content, useful crops, and balance with the heading and CTA.

Use the brief to choose between selection as-is, restrained editing, and generation. Do not invent photographic provenance, clinical meaning, or a practice connection for an otherwise generic scene.

## Workflow

1. Read the repository `AGENTS.md`, the target `practice.json`, and the hero component that consumes the image.
2. Inventory and inspect relevant local images. Label each as an edit target, visual reference, or unsuitable source.
3. State the recommended direction and why it is specific to the practice. If a suitable authentic image already exists, prefer a crop or restrained edit over generation.
4. Use the existing image unchanged when it meets the brief. When raster generation or editing is needed, use `imagegen`, preserving source-image invariants and requesting no text, logos, watermarks, or added people. Generation is not a mandatory step.
5. Inspect the output for stock-photo signals, factual invention, distorted architecture, fake signage, visual artifacts, and weak mobile cropping. Reject an output that fails the authenticity standard even if it is technically polished.
6. Keep review candidates, original outputs, and provenance/prompt notes under `assessments/<practice-slug>/sources/` according to repository placement rules. Save selected publishable assets under `sites/<practice-slug>/images/hero/` with a versioned, descriptive filename. Prefer WebP for the final website asset when the repository workflow supports it.
7. For exploration or a staged review, deliver the inspected candidate and its intended crop/layout assumptions. A small standalone review page may show the candidate beside existing copy and at representative crops without changing the site. State what has and has not been checked; do not automatically replace the hero or run a site build.
8. For authorized implementation, update `hero.image` and `hero.imageAlt`, run `npm run verify:site -- <practice-slug>`, and inspect the built homepage at desktop and iPhone widths using a `file://` URL. Evaluate the assembled hero: focal point, crop, visual competition with the heading and CTA, text contrast where relevant, overflow, and image quality. Asset selection and exact user-directed visual changes do not require rebuilding factual source extraction.

## Deliverables

Report:

- the selected visual direction;
- source images and how each was used;
- the final prompt and whether the image was generated or edited;
- saved asset paths and any `practice.json` change;
- desktop and mobile crop or in-page verification results, distinguishing candidate review from implemented-site verification;
- any unresolved authenticity or provenance concern.
