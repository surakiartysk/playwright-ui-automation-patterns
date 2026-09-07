# Decisions

Each decision, with the trade-off it accepted. Written when the reasoning was
fresh, including the costs — a decision recorded without its cost has not been
examined hard enough.

## 1. The question is where page knowledge lives, not whether to use page objects

"Use page objects" is where most UI advice stops, and it settles nothing. Both
packages here use them. What they disagree about is whether a selector is data
that pages compose (`locator-first`) or a private detail a page never exposes
(`page-first`).

Repeating the API repo's question — how should a suite be structured? — would
have produced a thinner version of that repo. This is the question that is
still open for UI work.

**Trade-off.** A reader expecting "POM vs no POM" will not find it, and the
distinction drawn here is finer, so the comparison has to work harder to show
that it matters at all.

## 2. Saucedemo, not a site I actually shipped

The earlier suite this draws on tested a live commercial site. That suite
cannot be published, and rebuilding it against another real product would
recreate the problem.

Saucedemo is Sauce Labs' own sample application, MIT licensed and published for
practising exactly this — and it earns the place on merit: four of its six
accounts are broken on purpose, which gives a suite genuine defects to catch.

**Trade-off.** It is a small, stable, well-behaved application. The suite
therefore says nothing about surviving a hostile page, which is a real skill
and most of the earlier suite's code. That cost is paid explicitly in
[flake.md](flake.md) rather than hidden.

## 3. Journeys are shared data, and parity is enforced

The API repo could pin both styles to one OpenAPI document. A browser suite has
no such artefact, so the shared thing is the journeys themselves — claims about
the product, in `packages/shared-journeys`.

`check:journeys` fails when a journey is missing from either package. Counting
tests would not catch it: two packages can have the same number of tests and
still cover different things.

**Trade-off.** Tagging every test with a journey id is ceremony, and it can
drift into being satisfied by a tag rather than by a real test. The check
verifies that a claim is made, not that it is honoured — the mutation
discipline is what covers that.

## 4. Current tooling, not the sibling repo's tooling

The API repo pins TypeScript 5 and lints with `typescript-eslint`. Copying that
here was the reflex, and it was wrong: this repo starts today, so it should
start on what is current rather than inherit a lockfile.

TypeScript 7 type-checks all three packages and Playwright runs on it without
complaint — both verified before the switch, not assumed. What TypeScript 7
breaks is `typescript-eslint`, which refuses it outright and has no released
version that accepts it.

That made the real choice explicit: keep TS 5 to keep the linter, or take TS 7
and replace the linter. This repo takes TS 7 and lints with `oxlint`, which
does not depend on the TypeScript compiler at all — so the two can never block
each other again.

`oxlint` was checked against the case that mattered rather than adopted on
reputation: an unused import, which is the error `typescript-eslint` had
already caught once in this repo's own scripts. It catches it, and found a
second real issue on the first run.

**Trade-off.** `oxlint` has no type-aware rules, so
`consistent-type-imports` — which matters under `verbatimModuleSyntax` — is no
longer enforced automatically. `tsc` still catches the failures that rule
prevents; it simply reports them later than a linter would. The other cost is
divergence: the two repos no longer share a lint config, and a reader moving
between them meets two setups.

## 5. Mutation testing, and one mutation that lied

Every assertion in both packages was removed or inverted and the suite watched
going red before the test was believed. That caught nothing alarming, which is
the point of doing it — the value is the assurance, not the finds.

One attempt was worth recording because it produced a _false alarm_. Disabling
an assertion with an early `if (true) return` left both cart tests passing, and
for a few minutes it looked as though the cart badge was never verified at all.
It is: TypeScript strips the unreachable code, so the mutation never reached
the browser. Changing the assertion to something impossible — expect the badge
to read `count + 99` — turned both tests red immediately.

**The lesson is about the technique, not the code.** A mutation that the
toolchain optimises away is indistinguishable from a test that does not care,
and it fails in the safe-looking direction: it reports a gap that is not there.
Mutations have to change behaviour the runtime actually executes.

## 6. Structure did not protect against a shallow assertion

The comparison expected to find that one style made a _wrong_ test easier to
write. It did not. Both packages would happily assert on a cart badge while the
cart behind it was empty, and both needed the same second assertion to close
that gap.

Recorded as a null result because it is the more useful finding: choosing
between these two styles is a readability and maintenance decision, not a
correctness one. What caught the shallow assertion was mutation testing, which
is orthogonal to how the suite is organised.

## 7. The numbers in the docs are checked, because they were already wrong

This repo shipped without a claims checker, unlike both of its siblings, and
repeated their mistake within a day. The journey set doubled from ten to
twenty; the README still said ten, and `comparison.md` still published line
counts measured when each package had half the tests — its central claim,
wrong by roughly 50%.

Nothing was lying. Someone wrote true numbers and the tree moved underneath
them, which is what always happens to a figure written in prose.

`check:claims` derives every published number from the tree — journeys from the
shared package's declaration, tests from the spec files, line counts by the
same non-comment measure the table claims to use — and fails when a document
disagrees. It earned its place twice during the change that added it: once
catching the original drift, and again when hoisting a single helper function
moved a total from 342 to 343 and the doc had to follow.

### Trade-offs

- **It parses prose with regexes**, which is fragile in the ordinary way. The
  journey-count check is anchored to a list of number words so that "the same
  browser journeys" is not mistaken for a count — a false positive it produced
  on the first run.
- **It cannot check the reasoning**, only the figures. A comparison whose
  numbers are right and whose conclusion is wrong passes cleanly.
- **The line-count check is exact**, so a refactor that changes no behaviour
  still fails CI until the table is updated. That is deliberate: a figure
  nobody has to maintain is a figure nobody can trust.

## 8. Two tests asserted less than they claimed

Found by reviewing the repo rather than by anything failing, which is the point
worth recording — both were green, and both would have stayed green through the
bug they existed to catch.

**The reset defect** asserted `toBeGreaterThan(0)` stale buttons after adding
one item. Probing the application shows the count tracks the cart: add three,
three stay stale. The assertion therefore passed whether the application left
one behind or twenty, while its own failure message claimed to describe the
defect precisely. It now adds three and asserts exactly three.

**Cancelling checkout** asserted the cart still held one item — the one item
`beforeEach` had added. That assertion is identical whether cancel preserves
the cart or wipes it on a page it never touched, because the count of one was
never at risk. It now adds a second item first and names both products, so the
count can only be right if cancel preserved what was there.

Both were mutation-tested afterwards: replacing cancel with an explicit
emptying of the cart turns the new test red, and the old one would have passed.

## How to add a decision

Write it when the reasoning is still fresh, and include the cost. If the
trade-off section reads as "no real downside", the decision has not been
examined hard enough yet — go back and find who it makes life worse for.
