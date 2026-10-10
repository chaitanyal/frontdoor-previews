# Mariposa hero review — step 1

Date: October 9, 2026

Status: user approved v2 and requested applying it to the Mariposa preview. The local preview now selects the optimized WebP. Copy and theme work remain pending their separate stages; no shared layout/style files changed. No commit, push, or live deployment has been performed for this image change.

## Skill update

Updated the installed `generate-practice-hero` skill at `/Users/chaitanya/Projects/llm_configs/skills/generate-practice-hero/SKILL.md`, reached through the existing `~/.codex/skills/generate-practice-hero` symlink. The skill now includes a concrete visual brief, layout-specific composition, palette/filter coordination, crop planning, provenance, and conditional generation. Exploration and implementation have separate outputs and verification expectations.

The skill-creator validator passed. [Reviewed skill snapshot](hero-skill-reviewed.md) records the version used for this candidate; the installed skill remains authoritative.

## Source selection and brief

- Edit target: [current limestone-path hero](../../../../sites/mariposa/images/hero/central-texas-limestone-path-v1.webp). Its original photographic provenance is unverified.
- Other inspected assets: the retained earlier regional hero, current office image, and Dr. Lara's portrait. The office image's provenance was not established; it was not used as a documentary reference. The portrait remains suitable for the provider introduction and was not edited or sent to ImageGen.
- Direction: retain the existing regional scene and broad path composition, remove the milky wash, and restore natural greens and limestone detail.
- Context: existing ivory surfaces, deep green actions, subdued rust accents, and the current headline. No copy revisions were introduced.
- Intended use: a separate photograph panel, without artificial negative space for text. This is a proposed future layout assumption, not a change to the current theme.
- Crop target: preserve the recognizable steps in a near-square desktop panel, a 4:5 panel, and a 390:260 mobile panel. The review uses `object-position: 70% center`.

## Output and provenance

- [Candidate v2](central-texas-limestone-path-v2-candidate.png): 1816 × 866 PNG.
- Method: built-in ImageGen edit of the current hero.
- [Exact prompt](prompt.txt).
- [Standalone comparison and crop review](review.html): current and candidate assets, candidate beside unchanged copy, and representative crops.

The edit removes the broad pale wash and restores stronger color and texture. It preserves the broad staircase and canopy composition but changes some fine vegetation and stone details. Treat it as a generative edit, not a pixel-preserving color correction or verified documentary photograph. It should not be represented as Dr. Lara's office or a specific verified landmark.

## Verification

- Inspected the generated output for added people, signage, lettering, watermarks, conspicuous visual artifacts, and lost focal detail; none were apparent at review scale.
- Rendered the standalone review through Playwright at 1440 × 1000 and 390 × 844 using a local `file://` URL.
- Visually checked both renders: the steps remain visible in the desktop, portrait, and mobile crop studies; the candidate works beside existing copy without a text overlay.
- The review is a composition study, not a verification of current-site responsive behavior. Current theme filters and gradients still apply to the published hero and would mute a direct image swap.
- After approval, converted the selected output to an 1816 × 866 WebP at quality 82: 593,396 bytes, down from the 4,328,195-byte PNG. Selected `sites/mariposa/images/hero/central-texas-limestone-path-v2.webp` in `practice.json`; the existing descriptive alt text still applies.
- Ran `npm run verify:site -- mariposa`. Reviewed and accepted only the expected image-path and asset-inventory changes in the Mariposa practice and dependent marketing output contracts, then reran verification successfully.
- Checked the actual built preview with Playwright at 1440 × 1000 and 390 × 844 through `file://`, allowing the existing entrance animation to finish. The existing layout, filters, and overlays remain in place for this image-only change.

## Review decision

Selected candidate: v2, approved by the user and applied locally. Next is the requested copywriting skill and copy stage; layout/theme implementation remains step 3.
