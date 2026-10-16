# Milestone 4: maintainable, configuration-driven tests

Date: October 16, 2026.
Status: all three P1 items implemented locally and verified. P2 work remains deferred.
Follows [milestone 3](verification-simplification-plan.md).

## Goals

Reduce false failures after valid content changes. Keep independent checks of output and behavior.
Make test ownership explicit without adding new verification layers or expanding routine release coverage.

## Prioritized problems and solutions

No P0 issue has been demonstrated. These findings concern test reliability and maintenance, not a confirmed production outage.

| Priority | Problem | Solution | Acceptance criterion |
| --- | --- | --- | --- |
| P1 | Hardcoded changing content | Read mutable names, provider slugs/counts, selected providers, routes, and eligible practices from raw `practice.json`. Use fixed synthetic inputs for logic tests. | Audited semantic checks no longer lock historical rosters, names, or image filenames. |
| P1 | Uniform assumptions across practices | Branch on explicit eligibility, directory, featured-provider, optional-section, and fictional-demo configuration. Retain intentional representative cases. | Solo/group/directory/fictional cases keep distinct safeguards and explicit coverage. |
| P1 | Unclear responsibilities | Document authoritative test layers and sources of expected values. Keep independently authored logic fixtures. | Tests distinguish configuration validity, rendered output, browser behavior, visual approval, and factual accuracy. |
| P2 | Overlapping coverage | Inventory guarantees across validators, contracts, and browsers; remove only proven duplicates. | Each removal names retained authoritative coverage. |
| P2 | Incidental presentation constraints | Assert membership/destinations unless exact order or pixels represent an intentional design requirement. | Harmless presentation changes avoid unrelated semantic failures. |
| P2 | Infrequently run suites become stale | Define a complete retained-suite audit command and execution policy. | Routine verification remains narrow; a full audit has explicit ownership and cadence. |
| P2 | Broad check fingerprints | Measure invalidations and narrow tooling/browser dependencies conservatively. | Unrelated test edits preserve passing receipts without permitting stale results. |

## P1 implementation scope

- Local preview semantic tests: derive eligible rosters, provider/treatment/directory routes, optional sections, and resource counts from configuration.
- Provider tests: derive homepage selection, roster counts, names, and destinations; preserve keyboard, no-JavaScript, identity, and overflow checks.
- Theme fixtures: derive changing provider routes, identities, and team counts while retaining explicit layout requirements.
- Practice schema integration: use raw configured featured slugs for expectations, rather than the production selection function under test.
- Logic tests: use explicit synthetic provider identities and selection inputs for independent expected results.
- Foundation, hours/payment/telehealth guide, and care-guidance unit tests: separate synthetic logic fixtures from current practice facts.
- Treatment routing and guide integration: read current treatment selections from raw configuration.

Fixed pilot IDs identify intentional representative coverage, not immutable patient-facing facts.
If a pilot stops supporting its designated feature, report a fixture-coverage problem instead of silently skipping the feature.
Keep fixed boundary cases, mocked analytics origins, required noindex/disclosure rules, and reviewed pixel baselines.
Live staging checks and pixel-baseline redesign are outside this local P1 pass.

## Test responsibilities

| Layer | Proves | Expected-value source |
| --- | --- | --- |
| Configuration validators | Required fields, safe values, valid references | Explicit schema rules and independently authored invalid/valid fixtures |
| Logic unit tests | Selection, identity, routing, and transformation rules | Fixed synthetic inputs with manually specified expected outputs |
| Output contracts | Reviewed structure, metadata, routes, and target boundaries | Reviewed manifests; no automatic baseline acceptance |
| Configuration-to-output integration | Current published facts and configured features render correctly | Raw practice/marketing configuration, not the renderer's selection/transformation helpers |
| Browser behavior | Navigation, keyboard interaction, disabled actions, responsive rendering, and mocked events | Observable behavior and configured destinations |
| Visual review | Intentional appearance and visual regressions | Explicitly reviewed screenshots and baselines |
| Source evidence | Accuracy of healthcare and operational facts | `source_extraction.md` and retained evidence; rendering tests cannot establish factual truth |

Do not calculate an expected result with the same function whose correctness the test claims to establish.
Configuration may supply changing facts; it must not supply its own validation rules or approve its own output.

## Verification and completion

1. Finish P1 edits before running affected checks.
2. Run changed unit tests and affected local browser suites sequentially.
3. Confirm both positive output matching and independent logic/negative validation safeguards remain.
4. Reuse unchanged builds. Run no live-site checks, optional review captures, or pixel comparisons for these test-only changes.
5. Record changed coverage, results, and remaining P2 work here.

Do not change website content, accept baselines, commit, deploy, or implement P2 solely under this P1 authorization.


## P1 completion record — October 16, 2026

### Delivered

- Documented layer responsibilities in this plan and the verification README.
- Preview expectations discover all eligible practices from raw configuration, including fictional demos.
  They check complete configured provider, treatment, directory, and legal routes.
- Protected-preview headers now cover every eligible practice, including embedded marketing previews.
- Single-preview verification explicitly selects its own pilot artifact before comparing its contract.
  It no longer relies on an ambient preview alias selecting the right target.
- Resource expectations compare configured destinations and support both local files and HTTPS links.
- Directory/browser checks use configured featured slugs, provider names, roster counts, and destinations.
- Profile identity checks cover the standalone pilot and all eligible previews, including fictional providers.
- Practice schema expectations read featured selections directly from configuration rather than the production selector.
- Theme checks use configured provider routes, identities, team sizes, optional sections, and selected concern counts.
  Fictional availability checks retain required noindex/disclosure rules and derive action counts from configured options.
- Provider-selection, availability, payment, office-hours, telehealth, and care-guidance logic use explicit synthetic cases.
  Fixed expected selection order and identity labels remain independent of production transformations.
- Foundation variant logic no longer requires North Hills to remain private pay or Mariposa to retain a particular biography.
  That test avoids two practice builds. Rendering remains covered by contracts and browser integration.

### Verification

`npm run verify:change` selected the affected unit files, foundation/practice/preview specs, and provider/theme suites.
Workflows ran sequentially. No verification-selector, caching, website, schema, or deployment implementation changed.

| Coverage | Result |
| --- | --- |
| Care-guidance unit cases | 3 passed |
| Machine-readable practice guide cases | 4 passed |
| Provider rules and validation | 7 passed |
| Treatment validation and routing | 2 passed |
| Foundation | 7 passed |
| Real-practice output and safety | 2 passed |
| Preview eligibility and publishing | 4 passed |
| Provider and theme browser behavior | 15 passed |
| Total | 44 passed |

The preview roster currently contains six eligible practices, including two fictional demos,
17 provider routes, and four treatment routes. These counts describe the current inputs; tests discover them rather than hardcode them.
Five real-practice output contracts and the selected preview/marketing contracts matched without baseline changes.

The initial sandbox run passed all 16 unit cases, then macOS blocked Chromium's IPC connection.
The approved outside-sandbox run reused those unit receipts and passed the browser checks in a 150.32-second runner invocation.
Foundation took 34.73 seconds, practice 43.49 seconds, preview 36.52 seconds, and combined provider/theme checks 30.54 seconds.
These are single observations for a broad test-maintenance change, not routine content-verification budgets or guaranteed speedups.

No live HTML/CSS checks, optional review captures, or visual snapshot comparisons ran.
Provider/theme and practice/preview checks used existing network mocks. Foundation smoke checks loaded local file output. No baselines were accepted or refreshed.
Test implementation adds a net ten nonblank lines; no new script, test module, package, or verification layer was introduced.
Whitespace checks passed. The user subsequently authorized this P1 release to `origin/main`.
Git history records the release commit; report push and automatic deployment status separately.

### Boundaries and remaining work

- P2 duplicate-coverage inventory, incidental presentation cleanup, complete-suite audit policy, and narrower fingerprints remain unimplemented.
- Reviewed pixel fixtures, explicit representative pilot IDs/themes, and mocked network origins remain deliberate fixed test inputs.
- Live staging checks and pixel-baseline redesign were not audited or run in this P1 pass.
- Source-backed factual accuracy still requires evidence review. Configuration-to-output matching does not establish truth.
- Output-contract and pixel-baseline review remains intentional; this work does not automatically approve changed output.
