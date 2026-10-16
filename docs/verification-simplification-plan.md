# Build and verification simplification plan

Date: October 16, 2026.

Status: phases 1 and 2 implemented locally and verified on October 16, 2026.
The user approved implementation with “Get started.” Phase 3 remains proposed.
No commit or deployment has been made for this work.

This plan follows the [earlier improvement work](buildimprovement.md).
It narrows routine verification and reduces maintenance overhead without changing website content.

## Goals

1. Reduce complexity: maintain fewer overlapping scripts, checks, and special cases.
2. Improve build and verification speed: eliminate unnecessary builds and repeated checks.
3. Align verification with scope: small content edits should trigger small checks.

Prefer removing duplicate work over adding more orchestration or caching layers.
Retain full coverage for broad changes to build systems, routing, and shared foundations.

## Current measurements

The footprint measurement counts nonblank lines in tracked working-tree files, including comments.
It excludes dependencies, generated output, documentation, and retained research.
These counts describe the inspected October 16 working tree, rather than a clean historical checkout.

| Category | Files | Nonblank lines |
| --- | ---: | ---: |
| Website implementation, including request endpoint | 80 | 8,571 |
| Backend Workers and database migrations | 8 | 553 |
| Build and content-management scripts | 4 | 666 |
| Verification scripts, validators, and commit hook | 13 | 1,890 |
| Tests, helpers, and fixtures, including Worker tests | 21 | 4,048 |
| Site content/configuration JSON | 11 | 3,391 |
| Output-contract JSON baselines | 10 | 7,635 |

Verification code and tests total 5,938 lines, approximately 69% of website implementation.
Including build/content tooling gives 6,604 lines, approximately 77%.
Contract baselines are data, not executable code. Ten screenshot baselines occupy 12.4 MiB.

The previous complete verification ran 51 browser tests, with one intentional skip, and captured 148 screenshots.
It took 156.59 seconds: 83.80 seconds for browser checks and approximately 72.79 seconds for remaining work.
The remaining time includes builds and other checks; it is not a separate build-only measurement.
A later commit-hook invocation repeated 39 browser tests in approximately 40 seconds.
These observations describe one release workflow, not controlled benchmark averages.

## Proposed default coverage

| Change | Required coverage | Browser and visual coverage |
| --- | --- | --- |
| Non-build documentation or research | None | None |
| Practice copy, hours, contact details, or links | Configuration validation, affected site build, local HTML/link/asset checks | None by default |
| Marketing content | Affected marketing output and relevant content/link checks | None by default |
| Images, CSS, or layout | Affected output and representative layouts/themes | Focused assertions and mobile/desktop captures for visible changes |
| Forms, navigation, or analytics | Affected output and relevant behavior tests | Relevant suite; screenshots only when useful |
| Test or baseline changes | Changed checks against valid existing artifacts | Only affected suites; rebuild when actual build inputs change |
| Verification tooling changes | Tooling regressions and representative routing/cache integration scenarios | No automatic full website browser matrix |
| Build behavior, routing, dependencies, or shared foundations | Full output-contract matrix and relevant regression suites | Full required behavior coverage |
| Unknown impact | Conservative broader coverage | Required suites based on affected behavior |

Mixed changes must combine required coverage rather than silently choosing the narrowest category.
Practice changes can affect embedded marketing previews and featured-practice content.
Narrow dependent marketing checks only after identifying actual consumed fields and routes.
Eligibility changes and practice deletion must retain publishing, routing, and indexing safeguards.

## Phases and milestones

### Phase 1: remove duplicate work

- Let successful screenshot-enabled suites satisfy equivalent assertion-only checks.
- Separate build inputs from test inputs. Test and baseline edits must still invalidate affected check results.
- Stop `--screenshots` from automatically adding unrelated theme checks and visual comparisons.
- Preserve artifact integrity checks, environment invalidation, and staged-content guards.

**Milestone 1:** regression fixtures demonstrate zero repeated builds or browser tests when committing unchanged verified inputs.
Missing or altered artifacts and changed build inputs still invalidate reuse.
Screenshot requests run selected suites without silently expanding coverage.

### Phase 2: align verification with change scope

- Select content, visual, interaction, and infrastructure checks using explicit behavior rules.
- Keep content-only changes free of browser tests and screenshots.
- Reduce provider, analytics, and marketing coverage where dependencies justify narrower checks.
- Use representative shared layouts instead of every practice/page/viewport combination for routine visual changes.
- Keep one verification entry point and an explicit full-audit option.
- Update repository instructions to match implemented behavior.

**Milestone 2:** a selection table covers content, assets, marketing, providers, analytics, shared CSS, tooling, and routing changes.
Tests cover mixed edits, additions, deletions, renames, and dependent publishing behavior.
Representative runs confirm that selected checks execute and unrelated suites do not.

### Phase 3: simplify the supporting code

- Inventory overlapping assertions, fixtures, snapshots, and command wrappers.
- Remove demonstrably redundant coverage and consolidate duplicate orchestration.
- Review whether contract baselines encode incidental content instead of meaningful output guarantees.
- Retain checks for indexing, routing, missing assets, essential actions, and production/preview boundaries.

**Milestone 3:** report net code, baseline, and test reductions with the coverage retained for each removal.
Propose specific removals for approval after phases 1 and 2 establish measured results.
Do not set an arbitrary line-count or test-count reduction target.

## Benefits and acceptance criteria

| Scenario | Expected benefit | Acceptance criterion |
| --- | --- | --- |
| Commit after screenshot-enabled verification | Avoid the observed 39-test repeat, approximately 40 seconds in that release | Zero repeated builds/browser tests for unchanged verified inputs |
| Content-only edit | Avoid unrelated work; current routing already skips browser tests | Zero browser tests and screenshots; only affected publishing checks |
| Test/baseline-only edit | Reuse unchanged website output | Zero website rebuilds when build inputs remain unchanged |
| Focused screenshot request | Avoid automatic extra suites and excessive captures | Only selected/required suites run; report capture count |
| Broad infrastructure change | Preserve regression coverage | Full required matrix remains available and selected |
| Supporting-code cleanup | Reduce maintenance cost | Net footprint reduction without removing unique required safeguards |

The 40-second saving is an opportunity demonstrated by a previous redundant run, not a guaranteed future duration.
Other timing and test-count reductions remain unmeasured.
Narrower verification improves local verification latency; it does not necessarily speed Cloudflare builds.
Measure build-only performance separately before proposing builder optimizations.

## Benchmark and rollout

1. Record before/after selections for representative changes using dry runs.
2. Benchmark affected-site content verification, focused browser verification, test/baseline edits, and a broad change.
3. Record cold and warm runs separately. Use the same target set, environment, and screenshot settings for comparisons.
4. Record total/build/browser time, build count, browser test count, screenshot count, and reused checks.
5. Exercise commit-hook reuse with temporary Git fixtures; do not create release commits just to benchmark.
6. Run applicable checks once after implementation. Repeat only when subsequent changes invalidate their results.
7. Report measured savings, remaining limitations, and the revised code footprint before further simplification.

Run build workflows sequentially until their shared mutable state supports concurrency.
Do not introduce parallel builds as part of this plan.

## Approval and release boundaries

The user requested this document before approving phases 1 and 2.
Phase 3 requires a concrete duplication audit and approval.
Implementation approval does not authorize baseline acceptance, a commit, or deployment.
Keep normal commit hooks enabled.
When a website release is authorized, use commit, push, and automatic Cloudflare deployment.
Skip routine live HTML/CSS checks. Deployment-status checks remain separate from website verification.


## Implementation record — October 16, 2026

### Delivered behavior

- Tooling edits run syntax checks and 14 workflow regressions without website builds or browser tests.
- Changed unit tests run individually. Known browser spec changes select their suite and deduplicate overlapping website requirements.
- Other browser specs run directly; deleted test files run remaining tests of that type.
- Provider-only and analytics-only changes select three contract targets instead of ten: a 70% reduction in selected targets.
- Marketing form/endpoint-only changes select one contract target instead of ten.
  Analytics browser setup still needs marketing, standalone practice, and preview artifacts.
- Contract-baseline-only changes select named targets instead of the full matrix.
- Test, baseline, and known verification-tool edits invalidate checks while preserving unchanged website artifacts.
- Screenshot-enabled passes satisfy assertion-only requests. Missing capture files still prevent capture reuse.
- Screenshot requests require an explicitly or automatically selected theme/provider suite.
  They do not add unrelated themes or pixel comparisons.
- `--all` includes full contracts and all three behavior suites.
- Full contracts retain workflow regressions. Representative/targeted contracts omit unrelated workflow regressions.
- Repository instructions describe the implemented scope and reuse rules.

### Verification and measurements

Commands used unchanged website content to exercise the selected paths.
The explicit `--file` argument selected representative scenarios without editing practice facts or tracking code.
All build-producing workflows ran sequentially. No screenshots, baseline updates, or live-site checks ran.

| Scenario | Observed time | Work performed |
| --- | ---: | --- |
| Tooling verification, final uncached run | 24.88 seconds | Syntax checks and 14 passing regressions; zero website builds/browser tests |
| Same tooling inputs repeated | 0.37 seconds | Reused passing check; no repeated tests |
| Dr. Dronavalli content path, uncached artifacts | 16.59 seconds | Practice and dependent marketing builds/contracts; zero browser tests |
| Content path after verification-only source changes | 1.86 seconds | Reused both builds; reran configuration/contracts |
| Same content path repeated | 0.55 seconds | Reused passing site check |
| Analytics representative path | 30.58 seconds | Three matching contracts and 24 passing browser tests; one new build, two reused |
| Same analytics path repeated | 0.70 seconds | Reused contracts and browser results; no repeated builds/tests |

Times come from the verification runner, excluding npm startup. They are single-run observations, not statistical guarantees.
The analytics run mixed cold and warm artifacts; it is not a fully cold benchmark.
The earlier 156.59-second release included different coverage and screenshot settings, so it is not a controlled speedup comparison.

A before/after selector comparison confirms these changes:

| Input | Previous selection | Current selection |
| --- | --- | --- |
| Verification tooling | Full contracts and three browser suites | Tooling regressions only |
| Practice content | Affected site and publishing dependencies | Unchanged; no new browser reduction claimed |
| Provider component | Ten contracts plus providers/analytics | Three contracts plus providers/analytics |
| Shared analytics | Ten contracts plus analytics | Three contracts plus analytics |
| Marketing request form | Ten contracts plus analytics | Marketing contract plus analytics |
| One unit test | Full contracts | Changed unit test |
| One contract baseline | Full contracts | Named contract target |
| Routing | Full contracts and three browser suites | Unchanged full coverage |

Regression fixtures exercise partial staging, additions, deletions, renames, changed inputs/environment,
missing or altered artifacts, failed checks, screenshot reuse, and intentional baseline review.
They verify that screenshot receipts alone satisfy assertions without approving changed website content.
The full routing matrix was checked through selection assertions, rather than rerunning unrelated website suites.

### Remaining work and limits

- Dependent marketing checks remain conservative for featured and preview-eligible practices.
  Narrowing them requires explicit field/route dependency evidence.
- Existing theme/provider responsive assertions and extensive optional captures remain available.
  This phase narrows when suites run; it does not delete their unique assertions.
- Build fingerprints remain broad across website targets. Unrelated website source edits can still invalidate builds.
- Cold Cloudflare build performance has not changed or been benchmarked.
- Staged-hook safety and screenshot-to-assertion reuse passed regression fixtures; no real release commit was created.
- Changed tooling contains 44 additional nonblank lines; regression tests add 49.
  No new orchestration module or dependency was introduced. Net code reduction remains a phase 3 goal.
- Further consolidation, test deletion, and snapshot redesign require the phase 3 audit and approval.
