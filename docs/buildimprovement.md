# Build and verification improvement plan

Prepared October 3, 2026 against commit `180d56c`.

**Status: items 1–3 implemented and verified on October 3, 2026.** These changes
are included in the items 1–3 release to `origin main`, using automatic Cloudflare
deployment where enabled. Cloudflare deployment status is not checked.
Items 4–5 are implemented and verified, and included in the items 4–5 release
to `origin main`. Item 6 remains proposed. Item 7 watch/cache settings were applied
and read back on October 3; its repository documentation/validator are included
in the item 7 release to `origin main`. AGENTS.md describes the current verification and deployment boundaries.

## Completion record — October 3, 2026

| Item | Completed behavior |
| --- | --- |
| 1. Remove redundant build work | Shared practice CSS compiles once per build and is copied to each practice. Duplicate caller-side HTML validation was removed; the builder retains it. Timing messages cover CSS, assets, Astro, HTML validation, regression tests, contracts, browser checks, and total verification. |
| 2. Build once | `npm run verify:change` preserves existing site/marketing/shared/Worker coverage and accepts explicit browser suites in a single invocation. The full eight-target shared matrix is retained. Managed artifacts, public directories, and Astro caches are isolated by target/practice. Existing commands use the same content-checked artifacts; compatibility links preserve current local test paths. |
| 3. Reuse checked results in hooks | Full-contract, site, marketing, Worker, and combined-browser results are recorded with input fingerprints and output identities. Missing/corrupt records, altered output, changed inputs/tools/environment invalidate reuse. The staged hook includes deletions and both sides of renames; it refuses partial staging or other differences between staged and working build/check inputs. It does not silently stage files. |

Implementation files: [state.mjs](../scripts/verification/state.mjs),
[change-plan.mjs](../scripts/verification/change-plan.mjs),
[verify_change.mjs](../scripts/verify_change.mjs), the existing build/site/contract
scripts, Playwright global setup, package scripts, and verification documentation.
The hook still calls `test:staged`; that command delegates to the shared runner.

The source fingerprint conservatively includes Git-visible code, assets, tests,
contracts, configuration and lockfiles, installed Astro/Tailwind/Playwright
versions, Node/Python versions, selected environment settings, and local dotenv
contents. Research and non-build Markdown are excluded; source/published asset
Markdown remains an input. Records carry integrity checksums and verify actual
artifact contents. Symlinked Git-visible inputs are rejected rather than allowing
untracked changes outside the snapshot to evade the staged guard.

**Partial-staging behavior:** the hook stops with a list of mismatched inputs.
Stage the intended versions or restore unstaged inputs before committing. This
phase does not build a separate checkout of the Git index. Checks performed before
staging are reusable after those exact inputs are staged.

**Current usage:**

```bash
npm run verify:change
npm run verify:change -- --browser=themes,providers,analytics
npm run verify:change -- --dry-run
npm run verify:change -- --all --fresh
```

Existing `verify:site`, `test:output-contracts`, and browser commands remain
available. `--fresh` on full/site verification forces the selected builds/checks;
otherwise valid results and artifacts are reused. Browser selection remains
explicit when manually requested, and behavior routing now selects required suites automatically.

**Limitations:** workflows remain sequential. Compatibility links and Astro's
generated state do not support concurrent independent verification/build commands.
The fingerprint is intentionally broad: unrelated relevant input changes can
invalidate artifacts. Input fingerprints remain broad; target/check selection is narrower. Parallelism
remain deferred in item 6. Item 7 was subsequently applied as recorded below.

### Validation and timing

- The full eight-target contract suite passed without baseline updates. Generated
  CSS matched the pre-change baseline byte for byte, and compilation count fell
  from 14 to eight for a full matrix (one per build).
- Five regression tests cover partial staging, additions, deletions, renames,
  isolated build identities, stale/missing/modified artifacts, failed builds,
  changed tests/configuration/environment/dotenv, corrupt receipts, and changes
  during verification. A temporary Git-repository integration test confirms that
  the staged runner reuses a passed check and reruns checks when its record is
  missing, while reusing valid builds. It refuses partial staging.
- The existing HTML validator rejected a malformed-page fixture missing its
  main heading. The builder still runs this validator before recording success.
- All 24 theme/provider/analytics browser checks passed in a combined invocation
  using the existing artifacts with no fixture builds. The final repeat after the
  cached-site compatibility-link correction also passed all 24 checks in 36.31
  seconds wall time, with zero fixture builds.

| Measurement | Observed duration / interpretation |
| --- | --- |
| Pre-change full contracts | 43.02 seconds wall time, measured immediately before implementation. |
| New forced full verification | 49.70 seconds wall time; includes the new cache-safety tests and cold isolated build state. Cold runs are not faster in this measurement. |
| Full verification repeated with identical inputs | 0.45 seconds wall time; no builds or repeated regression tests. |
| Combined 24 browser checks after contracts | 35.85 seconds wall time; zero fixture builds, versus 100.5 seconds reported for three separate commands in the earlier session. This is illustrative, not a controlled same-session before/after browser benchmark. |
| Full contract recheck after final input/preview-link guards | 52.35 seconds in the verification runner; all targets passed. |
| Final complete command repeated (contracts + all three browser suites) | 0.60 seconds wall time; no builds, repeated tests, or browser launch. |

The principal improvement is eliminating repeated verification and fixture builds
after the first checked result. Hook reuse is covered by a temporary-repository
test; the release also runs the installed staged hook during the commit.

## Items 4–5 completion — October 3, 2026

- **Behavior selection:** practice edits verify standalone output plus marketing
  whenever the practice is featured or preview-eligible (including previous HEAD
  eligibility). Deleting a practice escalates to the full matrix. Marketing-only
  edits keep marketing coverage. Shared CSS checks marketing, standalone Dr.
  Dronavalli, and preview ALL, whose browser representatives include all three
  themes and reflective. Provider components retain full contracts plus provider
  and analytics assertions. Analytics/Functions changes select analytics checks.
  Routing/build/configuration/dependency changes retain full contracts and all
  three behavior suites. Unknown/mixed changes retain full contracts and the
  suites required by any known behavior in the mix. Places Worker checks remain.
- **Production guide changes:** `practice-production.mjs` contains robots,
  redirects, headers and other production behavior as well as `llms.txt`; edits
  keep the full contract matrix and generator regressions, including preview
  exclusion. This module is deliberately not treated as formatting-only.
- **Contract review:** `npm run review:output-contracts -- --targets=<names>`
  produces snapshots and differences for all selected targets, without changing
  baselines or recording a pass. After reviewing the snapshots, explicit
  `npm run accept:output-contracts` validates current input/output/snapshot content,
  updates the reviewed baselines, and compares again without rebuilding. Baselines
  remain check inputs but are excluded from build identity; baseline edits rerun
  checks while retaining unchanged artifacts. Legacy explicit update commands
  remain supported.
- **Screenshots:** theme assertions run without capture by default; shared CSS
  routing enables capture automatically. Provider layout capture is a separate
  opt-in tag. Use `npm run verify:change -- --browser=themes,providers --screenshots`
  or `npm run test:themes -- --screenshots` / `npm run test:providers -- --screenshots`.
  Screenshot comparison via `--browser=visual` still requires explicit selection.
  Essential assertions remain active without screenshots. Optional sections are
  checked only when configured/present; image readiness fails within three seconds.
- **Failure recovery:** combined browser execution records passing suites
  individually, even if another suite fails. Rerunning the required command skips
  those suites and reuses valid builds; failed/skipped/absent suites never receive
  a passing receipt. Full contracts collect all target differences in one run.

### Items 4–5 validation

- Final eight-target contracts and configuration regressions passed without
  baseline updates. Eight workflow regression tests cover the original cache and
  staging guards plus behavior selection, per-suite failure handling, and reviewed
  baseline acceptance. The acceptance fixture confirms zero additional builds and
  rejects changed source, output, and review snapshots.
- All 24 browser checks with capture passed (35.4 seconds). Final default browser
  verification passed all 23 assertions without screenshot capture (18.1 seconds).
  These are same-session observations, not a controlled performance benchmark.
- A local alias collision caused by overlapping manual verification commands
  produced one theme failure. A sequential rerun reused passed analytics/provider
  receipts and ran only the four theme tests, all passing. Workflows must remain
  sequential until item 6 addresses shared compatibility paths.
- Centex site verification confirmed both standalone and dependent marketing
  contracts using existing artifacts. Selector examples were checked against the
  full matrix; CSS selects the three representative targets and four theme cases,
  while provider changes retain all contracts plus provider/analytics assertions.
- Final complete command repeated with unchanged inputs: **1.22 seconds** in the
  runner, with no builds, tests, or browser launch. Input hashing now occurs once
  per receipt's artifact set rather than once per artifact.
- `git diff --check` passed. No production content or checked-in baselines changed.

Items 4–5 are included in the release to `origin main`, using automatic Cloudflare
deployment where enabled. Cloudflare deployment status is not checked.
At completion of items 4–5, Cloudflare settings had not changed; item 7 was
subsequently applied as recorded below. Item 6 remains deferred.

## Item 7 completion — October 3, 2026

Applied and read back on `drdronavalli`, `frontdoor-health`, and
`frontdoor-previews`: include `*`, exclude only `docs/*` and `assessments/*`, enable
build caching. Previously all three included `*`, excluded nothing, and did not
report an explicit build-cache setting. Git integration, automatic deployments,
branches, build commands/output roots, and deployment environments were preserved.

The user's priority is **false negatives matter more than false positives**.
No per-practice include list, broad Markdown exclusion, unknown-directory exclusion,
or narrowing based on local verification routing was added. Root Markdown, tests,
Workers, other practice inputs, scripts, dependencies, configuration, and new paths
still trigger all three projects. The audited excluded directories are not build
inputs; remove exclusions before adding any such dependency in future.

[Live settings, audit, future-project setup and rollback](deployment/cloudflare/build-watch-paths.md)
and [policy](deployment/cloudflare/build-watch-policy.json) document the external
configuration. The local validator passed three projects × 18 cases and protected
228 tracked source/build/publishing/check paths. It checked configured asset
references and replayed 80 commits; only one would be skipped, confirming modest,
deliberate savings. This tests the documented matching model; no live webhook/test
push or production deployment check was performed. Build-cache speedup has not
been measured. Rollback is includes `*`, excludes empty.

Repository documentation and validator changes are included in the item 7 release
to `origin main`. Automatic Git deployment remains enabled; deployment status is
not checked.
Item 6 remains deferred. Final repository verification passed all eight output
contract targets, configuration regressions, and 23 theme/provider/analytics
browser assertions. No baselines or production website content changed.
`git diff --check` passed.

## Objective

Reduce the time from completed website changes to a production push by eliminating
repeated builds and checks, while retaining meaningful release safeguards.
Preserve **commit → push → automatic Cloudflare deployment** where enabled.

## Evidence reviewed

Reviewed this session and repository-specific prior session records covering the
September 29 reorganization, September 30/October 1 Centex work, and October 2–3
provider, production guide, and visual-polish releases. Also inspected the current
build scripts, staged-file routing, Playwright setup, contract runner, and logs.

| Finding | Evidence and cost |
| --- | --- |
| Separate browser commands rebuild their fixtures | Final successful visual-polish runs reported 43.0 seconds for themes, 34.3 seconds for providers, and 23.2 seconds for analytics: 100.5 seconds combined. Each command invokes global setup with its own builds. These are observed suite durations, not controlled benchmarks of individual build stages. |
| The hook repeats a completed full verification | The latest release ran the eight-target contract suite before committing and again inside the pre-commit hook. The same pattern occurred in earlier provider and production-guide releases. |
| Identical shared CSS is compiled repeatedly | Tailwind runs inside the practice loop with the same configuration and inputs. The current all-preview build compiles it four times; the eight-target contract matrix invokes it 14 times. |
| Baseline review causes additional build cycles | Prior sessions rebuilt after reviewing intentional image, metadata, and footer-link changes. Full contract capture/check always rebuilds its targets; scoped comparison functions already support inspecting existing output. |
| Test-harness failures add avoidable waits | Visual-polish tests hit 60-second timeouts while waiting for offscreen lazy images and for a resources section absent from Mariposa. Those harness issues were fixed in the session. |
| Built HTML validation is duplicated | The builder validates output, then `verify_site.mjs` and the marketing-only staged route invoke HTML validation again. |

The three successful browser commands, one full pre-release contract check, and
the hook's full contract check account for **25 build invocations** under the
current routing: 3 + 3 + 3 + 8 + 8. This excludes baseline capture and failed runs.
The target and practice counts above describe the repository at the reference
commit; they will grow as practices are added.

## Prioritized implementation plan

### 1. Remove redundant work inside the builder

- Compile shared practice CSS once per build, then copy it to each practice's
  output. Keep current public asset paths and practice asset-copy behavior.
- Remove redundant built-HTML validation from callers, retaining the validation
  performed by the builder.
- Add lightweight elapsed-time reporting for CSS, asset preparation, Astro,
  validation, contract comparison, and browser checks to establish a baseline.

Files: [build_astro.mjs](../scripts/build_astro.mjs),
[verify_site.mjs](../scripts/verify_site.mjs),
[run_staged_checks.mjs](../scripts/run_staged_checks.mjs).

Acceptance: generated CSS and semantic output remain identical; invalid HTML
still fails; CSS compilation occurs once per build. Benefits apply both locally
and to Cloudflare builds.

### 2. Build once for a selected verification run

- Introduce a proposed `npm run verify:change` entry point that identifies affected
  targets, builds each required target once, and runs selected contract/browser
  checks against the resulting output.
- Keep existing commands as convenient entry points into the shared runner.
- Isolate output and temporary public directories by target and practice; current
  practice builds overwrite the same directory, as do preview variants. Account
  for Astro's shared generated/cache state before allowing concurrent builds.
- Record the source inputs and target options for each artifact. A directory's
  existence alone must not establish that it is current or for the correct site.
- Initially retain the eight-target matrix for broad shared changes. Eliminate
  repetition before reducing coverage.

Files: [global-setup.mjs](../tests/verification/global-setup.mjs),
[verify_output_contracts.mjs](../scripts/verification/verify_output_contracts.mjs),
the build script, and package scripts.

Acceptance: each required target builds at most once per verification run;
missing, stale, or mismatched artifacts trigger a rebuild; contracts and browser
checks consume the same verified output.

### 3. Reuse valid verification results in the commit hook

- Record successful checks with their input fingerprints, check versions, relevant
  environment/tool versions, and artifact identities.
- Reuse results only when they cover the exact staged changes and dependencies.
  A timestamp or a generic “last run passed” flag is insufficient.
- Handle partial staging explicitly: a result for working-tree content must not
  approve different content in the index. Include added, renamed, and deleted
  inputs, relevant assets, lockfiles, build configuration, tests, and validators.
- Fix staged routing's current `--diff-filter=ACMR` omission of deletions.
- If a result is missing or invalid, run the required checks. Keep the hook enabled
  and update AGENTS.md so it recognizes verified-result reuse rather than requiring
  duplicate work.

Files: [run_staged_checks.mjs](../scripts/run_staged_checks.mjs),
[pre-commit](../githooks/pre-commit), and [AGENTS.md](../AGENTS.md).

Acceptance: unchanged verified code commits without rebuilding; changing a relevant
input invalidates the result. Exercise partial staging, deletion, rename,
configuration changes, and absent/corrupt result records. Do not use `--no-verify`
as an optimization.

### 4. Select verification by the affected behavior

| Change | Proposed default coverage |
| --- | --- |
| Assessments or documentation only | No website build, provided the files are not consumed by the build. |
| Practice copy, hours, links, or images | Affected practice and publishing targets; focused content, asset, and link checks. |
| Theme styling | Representative sites across all three themes, including reflective; relevant visual checks. |
| Provider navigation or profiles | Provider tests and affected contracts; analytics checks when actions change. |
| Production `llms.txt` formatting | Focused generator tests, indexable production output, and preview/nonindexable exclusion checks. Broader production-library changes retain broader coverage. |
| Routing, schema, shared build infrastructure, or dependencies | Full contract matrix and relevant browser suites. |
| Analytics or Worker behavior | Relevant browser/backend tests and deployment-configuration checks. |
| Unknown or mixed impact | Conservative broader verification. |

The dependency map must reflect deployment composition. Centex and other eligible
previews are included in the marketing deployment; Dr. Dronavalli supplies the
marketing case study. A folder-only rule would miss those relationships. Validate
the selector against representative changes before narrowing existing coverage.

Acceptance: documented example changes select all affected targets and avoid
unrelated suites. Compare selections with the full suite during rollout.

### 5. Separate baseline review and screenshot capture from rebuilding

- Generate actual contracts once and present differences across built targets.
- Allow explicit, reviewed baseline updates from those same artifacts, then
  compare again without rebuilding. Preserve input/artifact validation.
- Keep baseline approval separate from a passing test; never automatically accept
  unexpected differences.
- Keep essential browser assertions in release verification. Generate extensive
  screenshots for visual changes rather than routine copy or generator changes.
- After a failure, rerun the affected check first against valid artifacts, then
  complete the required final coverage. Avoid repeating passed unrelated suites.
- Keep optional-section checks configuration-aware and image readiness bounded.

Acceptance: intentional baseline updates require no extra build; unexpected
differences still fail; ordinary nonvisual releases avoid screenshot generation.

### 6. Add modest parallelism after isolation

- Start with two browser workers for independent tests.
- Keep tests that mutate fixtures or rebuild shared output serial until isolated.
- Do not run today's build-producing npm commands concurrently against shared
  directories. Evaluate build parallelism only after output/cache isolation and
  timing measurements show it is worthwhile.
- Use one browser invocation for selected suites where practical; Playwright
  projects/setup dependencies can represent their setup requirements.

Acceptance: repeated runs produce consistent results without directory races;
compare elapsed time and resource use with one worker.

References: [Playwright parallelism](https://playwright.dev/docs/test-parallel),
[setup and teardown](https://playwright.dev/docs/test-global-setup-teardown).

### 7. Reduce unnecessary Cloudflare builds

- Review project build-watch paths and build-cache settings in a separately
  authorized implementation step. Current project settings were not checked for
  this plan.
- Exclude non-build documentation/research changes from deployment triggers.
  Retain all shared dependencies, publishing configuration, and practice inputs
  required by each project.
- Preserve automatic Git deployment. Avoid a second direct Wrangler deployment
  for the same release.
- Do not replace the local release gate with an independent post-push GitHub
  check unless deployment is explicitly configured to wait for it. Direct pushes
  to `main` can trigger Cloudflare before an independent check finishes.

Acceptance: documentation-only changes skip website deployments; relevant site
and shared-code changes still trigger every dependent project.

References: [Cloudflare build-watch paths](https://developers.cloudflare.com/pages/configuration/build-watch-paths/),
[Cloudflare build caching](https://developers.cloudflare.com/pages/configuration/build-caching/).

## Rollout and success criteria

Items **1–5 are implemented** and included in releases to `origin main`. Item 7
settings are applied with conservative exclusions; its documentation/validator
are included in the item 7 release to `origin main`. Item 6 remains deferred.

- At most one build per required target in a verification run.
- No build during commit when the exact staged change has valid verification.
- No website build for non-build documentation-only changes.
- Reusable artifacts never conceal stale content, wrong targets, or missing checks.
- Required contract, provider, indexing, link, and action safeguards remain covered.
- Report stage timings and compare equivalent cold and warm runs before and after.
  Use repeated measurements to set realistic latency targets; no percentage speedup
  is promised from the current evidence.

Update this document with subsequent items, release commits, measured results, and
remaining limitations as the work proceeds. The first implementation changes
local scripts and verification behavior; it does not change site content or
Cloudflare deployment settings.
