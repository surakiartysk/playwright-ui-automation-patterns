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

## What is written down

| Document                            | What it argues                                                               |
| ----------------------------------- | ---------------------------------------------------------------------------- |
| [comparison.md](docs/comparison.md) | the scorecard — where each style wins, written to be useful not flattering   |
| [flake.md](docs/flake.md)           | what testing a site you _don't_ own costs, measured against a suite that did |
| [decisions.md](docs/decisions.md)   | each decision with its trade-off, including the ones that were wrong first   |
| [provenance.md](docs/provenance.md) | what came from where, and what deliberately did not                          |

## Status

Both suites cover all ten journeys — 10 tests each, green, every assertion
proven able to fail by mutation before it was believed.

What is not done: the journey set is deliberately small, and the sort test
covers one direction of one control. Broadening it is the next work, and
`check:journeys` will hold both packages to whatever is added.
