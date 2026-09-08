# Contributing

How to run this, what the gates check, and how to add a journey without
breaking the comparison the repo exists to make.

The short list of rules — and why they exist — is in [CLAUDE.md](CLAUDE.md).
This file is the mechanics.

## Setup

Node 22 (see `.nvmrc`) and pnpm.

```bash
pnpm install
pnpm exec playwright install chromium
```

Chromium only. This suite runs one browser on purpose — the question it asks is
about test structure, not cross-browser rendering, and three browsers would
triple the run time to answer a question nobody asked.

There is no application to start. The suite drives
[saucedemo.com](https://www.saucedemo.com), which means **an internet
connection is a dependency** and the site being down looks exactly like a
broken suite. [docs/triage.md](docs/triage.md) covers telling those apart.

## Running tests

```bash
pnpm test              # both packages, sequentially
pnpm test:locator      # locator-first only
pnpm test:page         # page-first only
pnpm test:smoke        # the @smoke subset of both
```

To run one file or one journey:

```bash
pnpm --filter @swag-lab/locator-first exec playwright test tests/cart.spec.ts
pnpm --filter @swag-lab/locator-first exec playwright test --grep @smoke
```

Watch out for `--grep` with a journey group: **`--grep @auth` matches nothing**,
because these journeys are grouped by spec file rather than by tag, and
Playwright reports "no tests found" as a _success with zero tests_. Only
`@smoke` is a tag. Name the file instead.

### Two things that differ from the API sibling

- **Both packages can run at once.** They drive a hosted site and bind no
  ports, so nothing serialises them. The API suite has to run its two packages
  one after the other because both start a mock on the same port.
- **`retries: 1` in CI, 0 locally.** A retry converts a real intermittent
  failure into a slow one, so it hides exactly the class of bug that matters —
  [decision 10](docs/decisions.md#10-the-flake-was-not-what-it-looked-like-twice)
  is the worked example. When investigating a flake, pass `--retries=0` or you
  will measure nothing.

## Proving a test can fail

Nothing is done until you have watched the test go red for the right reason.

The trap here is specific to TypeScript: **an early `if (true) return` is
stripped before it reaches the browser**, so the mutation never runs and the
test passes. That looks identical to a test that does not care, and it fails in
the safe-looking direction — it reports a gap that is not there. Change the
expected value to something impossible instead:

```ts
// Not this — TypeScript removes the unreachable code.
if (true) return
await expect(badge).toHaveText(String(count))

// This — the assertion runs and cannot pass.
await expect(badge).toHaveText(String(count + 99))
```

Two assertions already shipped here that were green and would have stayed green
through the bug they existed to catch. Both were found by reading, not by
failing — see
[decision 8](docs/decisions.md#8-two-tests-asserted-less-than-they-claimed).

## Quality gates

There are no git hooks in this repo — no husky, no lint-staged, no commitlint.
`pnpm verify` is the gate, and it is on you to run it:

```bash
pnpm verify
```

which is `format:check → lint → type-check → check:leak → check:journeys →
check:claims → test`, the same sequence CI runs in `.github/workflows/verify.yml`.

### `check:leak`

A vocabulary tripwire with two halves. The **structural** patterns — a JWT, a
real-looking secret, a real email — live in `scripts/check-leak.mjs`. The
**word list** lives in `.leakwords.json`, which is **gitignored and never
published**, because a public denylist of terms from a private project leaks
the very thing it protects.

So the check behaves differently in two places, on purpose:

|                           | word list | what runs                             |
| ------------------------- | --------- | ------------------------------------- |
| Local clone with the file | present   | words + structure                     |
| CI, or a fresh clone      | absent    | structure only, and it says so loudly |

It warns rather than passing silently, because a tripwire that quietly checks
nothing is worse than none at all. **The full check is a local gate** — run it
before pushing anything you would not want published.

If it fires on innocent code, narrow the pattern. Never rename the variable to
get around it.

### `check:journeys`

Both packages must cover every journey in
`packages/shared-journeys/src/journeys.ts`. The comparison means nothing if one
side is quietly better tested — in the API sibling that was not hypothetical,
where one package was missing two authentication cases and looked better
protected for reasons unrelated to its style.

It checks a journey id is _claimed_, not that it is honoured. The mutation
discipline above is what covers the rest.

### `check:claims`

Fails when the documents advertise a number the tree no longer supports —
journey counts, tests per package, and the line counts in
`docs/comparison.md`.

When it fires after you add code, update **both the table and the prose that
quotes its numbers**. The gap between the two styles is stated in a sentence as
well as a table, and only the table is checked.

## Adding a journey

1. **Add the id and claim** to `packages/shared-journeys/src/journeys.ts`. The
   `claim` is what a report should say, in product words — not a description of
   the test. Set `smoke: true` only if it should run on every push.
2. **Write it in both packages**, each in its own idiom:
   - `locator-first` — a locator in `src/locators/`, and any clicking or
     waiting in `src/pages/index.ts`. A locator resolves and never acts.
   - `page-first` — a method on the page object, which owns both the selector
     and the steps.
3. **Tag it** with `journey('the.id')` so `check:journeys` can see it. The id
   is typed, so a typo is a compile error rather than a journey silently going
   uncovered.
4. **Prove it can fail**, then `pnpm verify`.

Assert against data the test created. There is no contract here and no way to
seed state — the application _is_ the specification — so a global count like
`toHaveCount(6)` passes today and proves nothing.
[docs/triage.md](docs/triage.md#where-the-expected-value-comes-from) ranks the
oracles worth trusting.

## Adding a selector

`locator-first` exports it from `src/locators/`; `page-first` keeps it private
inside the page object. The application publishes `data-test`, and
`testIdAttribute` is set in both configs so `getByTestId` binds to it — without
that, every `getByTestId` silently matches nothing.

One deliberate exception is recorded in `inventory.ts`: the burger menu is
reached by `#react-burger-menu-btn` rather than its `data-test` element,
because that attribute sits on an `<img>` inside the button and the button
intercepts the click. It is the one place the published contract points at the
wrong node.

## Commit format

No commitlint here, so this is convention rather than enforcement. Conventional
Commits, and a body that says **why** — the repo's value is its reasoning, and
a commit that only restates the diff throws that away.

## Working style

Propose an approach and say what it costs, not just what it does. Expect
pushback; several decisions in `docs/` came from arguing one down. Do not
report work as complete without running `pnpm verify` — and do not describe a
test as passing without having seen it fail first.
