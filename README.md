# playwright-ui-automation-patterns

The same browser journeys built two ways, so two ways of organising a UI suite
can be read side by side and compared on evidence rather than preference.

Companion to
[playwright-api-automation-patterns](https://github.com/surakiartysk/playwright-api-automation-patterns),
which asks the same question about API tests.

Part of [testbydesign.dev](https://testbydesign.dev): the
[Test Run Dashboard](https://runs.testbydesign.dev) dispatches this suite on demand.

## The question

"Use page objects" is where most UI advice stops, and it is not an answer — it
says nothing about **where the knowledge of the page should live.** Two
positions, both defensible:

| Package         | Position                                                                                                                             |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `locator-first` | Selectors are data in their own module; pages compose them. Changing a selector never opens a page object.                           |
| `page-first`    | A page owns its selectors and exposes only intentions — `login(user)`, never `usernameField`. A test cannot reach a selector at all. |

Both cover the same journeys, run under the same configuration, and are held to
that by `check:journeys`, which fails when either package is missing one or
skips one — and also when the two disagree about which journeys are smoke, or
when a scope the dashboard can dispatch names a spec file that does not exist.

## The subject

[saucedemo.com](https://www.saucedemo.com) — Sauce Labs' sample application,
MIT licensed and published for this purpose.

Chosen on merit, not convenience: it ships six accounts, **five of them broken
on purpose** — every one but `standard_user`. `locked_out_user` cannot sign in.
`problem_user` signs in and then renders all six products with the same image.
`performance_glitch_user` takes seconds to do what the standard user does
instantly. A suite that only walks the happy path proves nothing; these are
real defects, on demand.

## Running it

```bash
pnpm install
pnpm exec playwright install chromium
pnpm test              # both packages
pnpm test:locator      # one style
pnpm test:page         # the other
pnpm verify            # format, lint, types, journey parity, claims, tests
```

## Running it from the dashboard

`.github/workflows/on-demand.yml` accepts a dispatch, runs the chosen slice,
builds one merged Allure report from both packages, uploads it, and posts a
signed result back — the same contract the API suite honours, so one
[dashboard](https://github.com/surakiartysk/playwright-run-dashboard) drives both.

```
style   both | locator-first | page-first
scope   all | smoke | auth | catalogue | cart | checkout | defects
tag     all | smoke        (optional: only the tests in scope that carry it)
```

`scope` is a spec file for every value but `all` and `smoke`. That is not
cosmetic: these journeys are grouped by file rather than by tag, so
`--grep @auth` would match nothing at all. Playwright is loud about that —
`Error: No tests found`, exit 1 — and the workflow turns any non-zero exit into
a failed callback, so the dashboard would show a **failed run for a slice that
simply does not exist by that name**. Selecting the file means the slice either
runs or is caught by `check:journeys` before anyone dispatches it.

The report steps are skipped unless a caller passed a `run_id`, so a
hand-started run costs nothing extra. Reporting back also needs
`DASHBOARD_WEBHOOK_URL` (a repository variable) and `DASHBOARD_WEBHOOK_SECRET`;
the report itself additionally needs `CLOUDFLARE_API_TOKEN` and
`CLOUDFLARE_ACCOUNT_ID`. Without them the run still reports its numbers — it
just has no report link.

## What is written down

| Document                                                  | What it argues                                                               |
| --------------------------------------------------------- | ---------------------------------------------------------------------------- |
| [architecture.md](docs/architecture.md)                   | how the packages fit, and what each layer may know                           |
| [comparison.md](docs/comparison.md)                       | the scorecard — where each style wins, written to be useful not flattering   |
| [triage.md](docs/triage.md)                               | what to do when it goes red, and who owns each kind of failure               |
| [a-site-you-do-not-own.md](docs/a-site-you-do-not-own.md) | what testing a site you _don't_ own costs, and how this repo avoids that tax |
| [decisions.md](docs/decisions.md)                         | each decision with its trade-off, including the ones that were wrong first   |
| [how-it-was-built.md](docs/how-it-was-built.md)           | the subject, and how AI was used                                             |
| [CONTRIBUTING.md](CONTRIBUTING.md)                        | how to run it, what the gates check, how to add a journey                    |

## Status

Both suites cover all twenty journeys — 20 tests each, green, every assertion
proven able to fail by mutation before it was believed.

Two of those journeys exist to catch defects the application ships on purpose:
`problem_user` rendering one image for six products, and Reset App State
clearing the cart badge while leaving every add button reading Remove. A suite
that only walks the happy path proves it can drive a browser, not that it can
catch anything.

What is not done: the sort tests exercise three of the four orderings the
control offers — price high-to-low is the one left out — and nothing exercises
the responsive layout.
`check:journeys` holds both packages to whatever is added next.
