# playwright-ui-automation-patterns

The same browser journeys built two ways, so two ways of organising a UI suite
can be read side by side and compared on evidence rather than preference.

Companion to
[playwright-api-automation-patterns](https://github.com/surakiartysk/playwright-api-automation-patterns),
which asks the same question about API tests.

## The question

"Use page objects" is where most UI advice stops, and it is not an answer — it
says nothing about **where the knowledge of the page should live.** Two
positions, both defensible:

| Package         | Position                                                                                                                             |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `locator-first` | Selectors are data in their own module; pages compose them. Changing a selector never opens a page object.                           |
| `page-first`    | A page owns its selectors and exposes only intentions — `login(user)`, never `usernameField`. A test cannot reach a selector at all. |

Both cover the same journeys, run under the same configuration, and are held to
that by `check:journeys`, which fails when either package is missing one.

## The subject

[saucedemo.com](https://www.saucedemo.com) — Sauce Labs' sample application,
MIT licensed and published for this purpose.

Chosen on merit, not convenience: it ships six accounts, **four of them broken
on purpose.** `locked_out_user` cannot sign in. `problem_user` signs in and then
renders all six products with the same image. `performance_glitch_user` takes
seconds to do what the standard user does instantly. A suite that only walks
the happy path proves nothing; these are real defects, on demand.

## Running it

```bash
pnpm install
pnpm exec playwright install chromium
pnpm test              # both packages
pnpm test:locator      # one style
pnpm test:page         # the other
pnpm verify            # format, lint, types, leak, journey parity, tests
```

## Running it from the dashboard

`.github/workflows/on-demand.yml` accepts a dispatch, runs the chosen slice,
builds one merged Allure report from both packages, uploads it, and posts a
signed result back — the same contract the API suite honours, so one dashboard
drives both.

```
style   both | locator-first | page-first
scope   all | smoke | auth | catalogue | cart | checkout | defects
```

`scope` is a spec file for every value but `all` and `smoke`. That is not
cosmetic: these journeys are grouped by file rather than by tag, and
`--grep @auth` would match nothing — which Playwright reports as a **success
with zero tests**, so the dashboard would record a green run that asserted
nothing.

The report steps are skipped unless a caller passed a `run_id`, so a
hand-started run costs nothing extra. Reporting back also needs
`DASHBOARD_WEBHOOK_URL` (a repository variable) and `DASHBOARD_WEBHOOK_SECRET`;
the report itself additionally needs `CLOUDFLARE_API_TOKEN` and
`CLOUDFLARE_ACCOUNT_ID`. Without them the run still reports its numbers — it
just has no report link.

## What is written down

| Document                            | What it argues                                                               |
| ----------------------------------- | ---------------------------------------------------------------------------- |
| [comparison.md](docs/comparison.md) | the scorecard — where each style wins, written to be useful not flattering   |
| [flake.md](docs/flake.md)           | what testing a site you _don't_ own costs, measured against a suite that did |
| [decisions.md](docs/decisions.md)   | each decision with its trade-off, including the ones that were wrong first   |
| [provenance.md](docs/provenance.md) | what came from where, and what deliberately did not                          |

## Status

Both suites cover all twenty journeys — 20 tests each, green, every assertion
proven able to fail by mutation before it was believed.

Two of those journeys exist to catch defects the application ships on purpose:
`problem_user` rendering one image for six products, and Reset App State
clearing the cart badge while leaving every add button reading Remove. A suite
that only walks the happy path proves it can drive a browser, not that it can
catch anything.

What is not done: the sort tests cover two of the four orderings the control
offers, and nothing exercises the responsive layout. `check:journeys` holds
both packages to whatever is added next.
