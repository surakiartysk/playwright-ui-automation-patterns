# Architecture

How the two packages are put together, and what each layer is allowed to know.

## The shape

```
packages/shared-journeys    the journey list and the user table — data, no Playwright
packages/locator-first      locators, plus behaviour composed from them
packages/page-first         page objects that own both the selectors and the steps
```

`shared-journeys` is the only thing both test packages import, and it holds no
Playwright at all. That is deliberate: it is the one place a change must land
in both styles at once, so it contains the things that are genuinely common —
what behaviours exist, and which users the application ships — and nothing
about how either style reaches them.

The two test packages **import nothing from each other**. A shared base class
or a shared helper would make the comparison meaningless, because the thing
being compared is exactly how much each style needs. Duplication between them
is the control, not an oversight.

## The dependency direction

```
tests  ──▶  src  ──▶  shared-journeys
                          │
                     (no Playwright)
```

Nothing points back up. A locator does not know which test uses it, and a
journey id does not know whether either package has covered it — that is what
`check:journeys` is for, and it reads the tree rather than being told.

## Where the styles actually differ

The whole comparison lives in one question: **when a test needs to reach a
control, what does it talk to?**

|                     | `locator-first`                             | `page-first`              |
| ------------------- | ------------------------------------------- | ------------------------- |
| Test talks to       | a locator, directly                         | a method on a page object |
| Selector lives in   | `src/locators/*.ts`                         | inside the page object    |
| Step order lives in | the test                                    | the page object           |
| Adding a behaviour  | usually nothing — compose existing locators | a new method              |
| Adding a selector   | one export                                  | one private locator       |

`locator-first` keeps a strict rule: **a locator resolves and never acts.**
`inventoryLocators.menu(page)` returns a `Locator` and clicks nothing. Anything
that clicks, fills, or waits is a function in `src/pages/index.ts` — behaviour
composed from locators it does not own.

That rule is why `openMenu` lives where it does. It clicks and then waits for
the application to confirm the menu opened (see
[decision 10](decisions.md#10-the-flake-was-not-what-it-looked-like-twice)), so
it cannot be a locator. `page-first` puts the same logic in a method on
`InventoryPage`, because in that style a page object already owns both halves.

## Testing a site nobody here controls

Every other decision follows from this one. The application under test is
[saucedemo.com](https://www.saucedemo.com), which this repo neither owns nor
can change — see
[decision 2](decisions.md#2-saucedemo-not-a-site-i-actually-shipped).

The consequences are structural, not incidental:

- **No fixtures that seed state.** There is no database to reach and no reset
  endpoint. A test that needs a cart with three items adds three items.
- **No contract to assert against.** The API sibling has an OpenAPI file that
  arbitrates every disagreement. Here the application _is_ the specification,
  so an assertion can only be as good as the behaviour someone observed — which
  is why [decision 8](decisions.md#8-two-tests-asserted-less-than-they-claimed)
  matters more here than it would there.
- **The site can change without warning.** A green suite is evidence about
  today. `check:journeys` and `check:claims` protect the repo's internal
  consistency; nothing protects against the application being rewritten.

## The users are part of the test data

`shared-journeys/users.ts` names six accounts the application publishes, five
of which are broken on purpose — `problem_user` renders one image for every
product, `performance_glitch_user` is deliberately slow.

Two journeys assert those defects directly, and they are written to go **red if
the application is ever fixed**, with a failure message saying so. That is
unusual and deliberate: a test whose expectation is "this is broken" has to
announce loudly when its premise stops being true, or it silently becomes a
test of nothing.

## Isolation

Each test signs in from scratch through the browser. There is no
`storageState` reuse and no shared session.

That is slower than it needs to be, and it is the honest shape for this
application: the cart lives in the browser's own storage, so a shared session
would let one test's cart leak into another's assertions. Signing in is a
second or two; a cross-test leak is an afternoon.

Tests within a file run in parallel, and both packages run concurrently in CI —
they bind no ports and share no state, unlike the API sibling whose two
packages each start a mock on the same port.

## Running it

```bash
pnpm test              # both packages
pnpm test:locator      # one style
pnpm test:page         # the other
pnpm verify            # format, lint, types, leak, journey parity, claims, tests
pnpm allure            # merge both packages into one report
```

CI adds `retries: 1`, which is a trade rather than a convenience —
[decision 10](decisions.md#10-the-flake-was-not-what-it-looked-like-twice)
explains what it hides.

## Further reading

- [comparison.md](comparison.md) — what each style costs, measured
- [decisions.md](decisions.md) — why it is shaped this way, with the costs
- [triage.md](triage.md) — what to do when it goes red
- [flake.md](flake.md) — testing a site you do not own
