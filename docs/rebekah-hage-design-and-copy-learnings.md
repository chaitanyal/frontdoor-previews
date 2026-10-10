# Design and copy lessons from Rebekah Hage Counseling

Reviewed: October 9, 2026
Reference: [Rebekah Hage Counseling](https://www.rebekahhagecounseling.com/)
Purpose: Improve FrontDoor Health's marketing website and the practice websites it generates.

## Scope and evidence

These notes draw on a visual review of the live desktop homepage, its rendered text, the FrontDoor theme documentation, the local marketing homepage source, and the practice-copywriter skill. The web text extractor initially returned older homepage content; the live browser showed the newer design discussed here.

Observations describe what was visible. Recommendations are editorial and design judgments, not evidence of higher conversion rates. Mobile behavior, performance, accessibility compliance, and booking completion were not tested. No reference-site assets were downloaded for reuse. This document proposes future work; it does not change themes, copy-generation instructions, or published pages.

## What the reference does well

The [homepage](https://www.rebekahhagecounseling.com/) combines cream surfaces, ochre accents, muted blue buttons, earthy illustrations, and warm photography. A large hero photo overlaps a fine rounded outline. Generous spacing, open service columns, broad color sections, and photography vary the page's rhythm.

The illustrations share a visual language with the logo. The opening identifies the audience, concerns served, and geographic access. Later sections explain the practice's approach, organize services around patient concerns, and invite visitors to explore fit through a free consultation. Scheduling and the existing-client portal have separate header actions.

My interpretation: its appeal comes from consistency across composition, imagery, language, and the invitation to act. Changing colors alone would capture only part of that effect.

## Design principles to adapt

| Principle | FrontDoor application |
| --- | --- |
| Coordinate the whole palette | Choose background, text, accent, and image tones together. Keep strong contrast for reading and actions. |
| Give the hero a deliberate composition | Explore an asymmetric image/text arrangement with a restrained outline. Keep the heading concise and the primary action easy to find. |
| Vary section presentation | Alternate open text, imagery, practical information, and selective cards. Use cards where grouping helps comprehension. |
| Use space to establish hierarchy | Separate major ideas generously while keeping related labels, descriptions, and actions close together. |
| Build an original visual identity | Use original assets appropriate to each practice. Decorative illustration is optional; it should not become a requirement for every site. |
| Match imagery to the message | Prefer authentic provider, office, or regional photographs with intentional crops and consistent treatment. |

For practice sites, prototype with `editorial-healthcare` and its existing `reflective` variant first. Preserve the existing Newsreader/Inter font system. Consider a new variant only if the prototype reveals reusable composition needs that the current variant cannot reasonably serve. The reference's typography need not be reproduced to apply its lessons.

Keep appearance in shared theme rules and components, with practice facts and content in `practice.json`. Carry the treatment through provider, financial, and appointment sections. Do not create a practice-specific CSS exception for reusable behavior.

For the FrontDoor marketing site, apply the same principles to its own identity and practice-owner audience. Practice theme selection does not automatically restyle the marketing website.

## Copy principles to adapt

### 1. Establish relevance early

For a practice, the opening should establish whom it serves, the kind of care available, and where patients can access it. Divide that information between a short headline and supporting copy; avoid packing every condition into one sentence.

For FrontDoor, establish the customer and useful result: independent healthcare practices need websites that explain care and make practical information easy to find. Technical implementation details belong later, if they help a buying decision.

### 2. Make warmth concrete

Warmth can come from understandable explanations, respectful language, and clear next steps. Repeated claims of compassion, dedication, or personalization add little unless verified details explain what those qualities mean in practice.

Do not convert a desirable tone into an unsupported care promise. Statements about listening, shared decisions, appointment length, referral help, or response times need evidence just as credentials and fees do.

### 3. Give each section one useful job

| Section | Patient question it should answer |
| --- | --- |
| Hero | Is this practice relevant to me? |
| Services | What care is available for my concern? |
| Approach | What does this practice's approach mean for my care? |
| Team | Who might I see, and what is their role? |
| Practical information | Where can I receive care, how do payment and insurance work, and how do I start? |
| Appointment transition | What action should I take, and what happens afterward? |

Use this as an editorial test, not a mandatory section order. Avoid repeating the same care philosophy in the hero, team introduction, provider taglines, and appointment section.

### 4. Introduce the team with useful facts

Weak introduction:

> Meet our experienced and dedicated providers.

Illustrative replacement, only if all facts are verified:

> Our psychiatrists and psychiatric nurse practitioners care for adults with anxiety, depression, and ADHD, offering psychiatric evaluations and medication management.

The replacement identifies professions, patients served, and care offered. “Meet our team” remains a useful heading; the paragraph beneath it should add information. Do not imply that every provider offers every practice service. Adjust the sentence to the actual roster and scope of care.

### 5. Translate services without inventing specialties

When source evidence supports it, explain clinical services through concerns patients recognize. Keep the clinical term where it helps clarity and search discovery, then add a plain-language explanation.

Do not infer that a provider treats a condition merely because it is commonly associated with their profession. Similarly, a description of a patient's possible difficulty must not become a diagnosis or a promised outcome.

### 6. Reduce uncertainty around the next step

Use an action label that matches the destination: calling, submitting a request, or opening an actual booking system. Add a brief explanation of what follows when the process is confirmed.

A practice's free consultation, availability, referral assistance, or response time cannot be borrowed from the reference. For FrontDoor, explain the preview/review process using the actual service offered, without inventing turnaround times or commitments.

## Examples for future drafts

These examples are editorial directions, not approved practice facts or automatic replacements.

| Generic wording | Better direction |
| --- | --- |
| “Comprehensive, compassionate mental healthcare tailored to your unique needs.” | “Psychiatric care for adults in Austin, with in-person and telehealth appointments.” Use only if verified. |
| “Our Services” | “How we can help” can provide a warmer introduction; retain precise service names below it. |
| “Begin your journey toward a happier, healthier you.” | “Request an appointment,” accompanied by the verified request process. |
| “Beautiful, modern websites that transform your practice.” | Describe the specific information FrontDoor makes easier to find: providers, care, payment, location, and appointment options. |

## Implications for frontdoor.health

The local marketing homepage already organizes content around patient fit, care offered, insurance, and next steps. It also explains that FrontDoor handles copy, design, and launch while the practice reviews the details. Preserve these concrete ideas.

Future improvements should focus on:

1. **Editing repetition.** Review adjacent sections about patient questions and the solution; ensure each develops the argument instead of restating it.
2. **Connecting proof to the promise.** Use existing practice examples to demonstrate specific improvements in information and navigation. Retain attribution, dates, and appropriate context for performance metrics; do not imply guaranteed results for future customers.
3. **Making the preview action understandable.** Explain what a practice owner submits, receives, and reviews, using the actual workflow.
4. **Adding visual breathing room selectively.** Keep useful proof and actions prominent while testing fewer containers and more varied section compositions.

## Proposed improvement to the copy-generation workflow

The current practice-copywriter skill already requires evidence, concrete wording, useful team introductions, and restraint around clinical claims. Add a homepage editorial pass to make those standards more consistent across sections:

1. Identify the intended patient, verified care, access details, and meaningful differentiators.
2. Give every section a patient question to answer before drafting it.
3. Draft concise public copy and map factual claims to evidence separately.
4. Read the assembled page for repetition, generic praise, and unexplained terminology.
5. Check whether reassurance implies an unsupported operational or clinical promise.
6. Read each CTA together with its destination and any process explanation.
7. Review the rendered page so headline length, paragraph density, and hierarchy work in the actual layout.

If a paragraph could belong to almost any practice, make it more specific with supported facts or remove it. Limited evidence justifies shorter copy. It does not justify invented personality, services, or promises.

## Proposed improvements to the hero-image skill

The existing `generate-practice-hero` skill already prioritizes authentic source photography, avoids invented clinic details and synthetic faces, and requires restrained styling and mobile-aware composition. Preserve those standards. The main opportunity is to design the image and surrounding page together: photography, interface colors, headline, and placement should reinforce one another.

| Improvement | Proposed skill guidance |
| --- | --- |
| Write a concrete visual brief | Before selecting, editing, or generating an asset, specify its purpose, subject, light, palette, crop, and relationship to the actual headline. Explain why the direction suits this practice. |
| Match composition to the layout | Distinguish a background behind text from a separate image beside text. Reserve negative space for copy only where the layout needs it; a separate image can use its frame more fully. |
| Coordinate the palette | Inspect the actual page background, text, and button colors alongside the source photograph. Seek compatible tones without mechanically tinting the image or misrepresenting the setting. |
| Plan crops precisely | Read the rendered image dimensions, aspect ratios, and `object-fit`/`object-position` behavior. Identify the subject and details that must survive both desktop and mobile crops. |
| Strengthen selection criteria | Ask whether the image contributes something specific to the practice. A beautiful but interchangeable landscape is not automatically a strong hero. Prefer a suitable existing image over generating a replacement merely for novelty. |
| Evaluate the assembled hero | Review the image with the real heading, supporting text, and CTA. Check visual balance, competing focal points, crop quality, and text contrast where text overlaps the image. |

### Workflow corrections

1. **Make generation conditional.** The skill's preference order allows an authentic image to be used unchanged, but its workflow subsequently directs the agent to use ImageGen. Explicitly allow selection as-is, cropping, restrained editing, or generation according to the evidence and layout needs. Use ImageGen when raster generation or editing is needed, following the applicable image tooling instructions.
2. **Separate exploration from implementation.** Exploration should deliver an inspected candidate with its intended layout, crop assumptions, and any unverified in-page behavior clearly stated. It should not automatically replace the current hero or trigger a site build. Implementation should update the authorized image fields, run the repository's site verification, and inspect the built homepage at desktop and iPhone widths.

### Suggested brief and acceptance check

Keep the brief short and grounded in the actual site:

- Purpose and practice relevance: what the image contributes to this homepage.
- Source and provenance: authentic photo, edit target, visual reference, or generated environmental image.
- Layout: separate image or background, actual aspect ratios, and copy placement.
- Visual direction: subject, natural light, compatible colors, texture, and details to preserve.
- Crop requirements: focal point and essential content at desktop and mobile sizes.
- Acceptance: credible imagery, no invented documentary details, useful crops, and a balanced relationship with the headline and CTA.

Do not force every hero to contain negative space, an illustration, or the same warm color treatment. The goal is an appropriate image for each practice within FrontDoor's reusable design system. These recommendations change how assets are chosen and reviewed; they do not authorize layout changes or introduce new configuration fields by themselves.

## Implementation and review priorities

Start with one practice's copy in the existing theme, then evaluate whether a composition prototype adds value. Review desktop and mobile before expanding shared styles. Apply successful principles to the marketing homepage through a separate, audience-appropriate edit.

Measure contrast rather than assuming soft colors are accessible. Check heading hierarchy, focus visibility, image crops, readable line lengths, touch targets, and horizontal overflow. The reference's tall header, long hero heading, and pale text are areas to reconsider in a FrontDoor adaptation, not patterns to adopt automatically.

For implementation, follow repository routing: practice-only copy changes use `npm run verify:site -- <practice-slug>`; shared design or marketing changes use `npm run verify:change` with the required browser checks. This documentation-only task does not require a website build.

## Boundaries

- Create original copy and visual assets. Do not reuse the reference's logo, illustrations, photographs, or distinctive prose.
- Preserve practice-specific accuracy even when a more expressive draft sounds appealing.
- Treat conversion benefits as hypotheses until measured.
- Keep this reference as one input to FrontDoor's reusable system, rather than making every practice resemble a counseling website.

## Related implementation references

- [Theme system](../README.md#theme-system)
- [Astro source guide](../src/README.md)
- [Marketing homepage composition](../src/entries/marketing/pages/index.astro)
- [Marketing data and proof configuration](../marketing/marketing.json)
- [Shared practice styles](../shared/styles/frontdoor.css)
- [Theme tokens](../shared/themes.json)

Skills reviewed: `~/.codex/skills/practice-copywriter/SKILL.md` and `~/.codex/skills/generate-practice-hero/SKILL.md`. Proposed skill changes above have not been applied.
