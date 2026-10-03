# Documentation

Use the [root README](../README.md) for setup and build commands, [AGENTS.md](../AGENTS.md)
for maintenance rules, and the [Astro source guide](../src/README.md) for code locations.

## Current guidance

- [Google Maps integration](integrations/google-maps.md): design, rollout notes, and verification.
- [Cloudflare deployment](deployment/cloudflare/README.md): infrastructure overview.
- [Conservative Cloudflare build triggers](deployment/cloudflare/build-watch-paths.md): live watch/cache settings, validation, and future-project setup.
- [DNS](deployment/cloudflare/dns.md), [manual setup](deployment/cloudflare/manual-setup.md),
  and [rate limits](deployment/cloudflare/rate-limit.md).
- [Analytics Worker](../analytics-worker/README.md) and [Places Worker](../places-worker/README.md):
  backend-specific commands, run from each worker directory.
- [Practice assessments and source evidence](../assessments/README.md).
- [Treatment pages](treatment-pages.md): configuration, shared routes, evidence and migration guidance.
- [Practice link previews](social-share-images.md): clinic-facing metadata and branded share-image generation.
- [Output and browser verification](../tests/verification/README.md).
- [Build and verification improvement plan](buildimprovement.md): proposed changes
  to reduce repeated builds, reuse verified results, and speed up releases.

## Historical material

[The archive](archive/README.md) retains earlier implementation plans and templates.
Use current source, root documentation, and `sites/template/practice.json` for new work.
