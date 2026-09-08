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

**Trade-off.** Mutation testing is done by hand here, so it is only as complete
as the person doing it was patient, and nothing re-runs it when the code
changes — a mutation proven in September says nothing about the assertion after
someone edits it in November. A tool like Stryker would keep the guarantee
alive, at the cost of a dependency and a much slower run against a hosted site
that is already the bottleneck. At twenty journeys the manual pass is
affordable and the automation is not; that arithmetic reverses as the suite
grows, and this note is where to start when it does.

## 6. Structure did not protect against a shallow assertion

The comparison expected to find that one style made a _wrong_ test easier to
write. It did not. Both packages would happily assert on a cart badge while the
cart behind it was empty, and both needed the same second assertion to close
that gap.

Recorded as a null result because it is the more useful finding: choosing
between these two styles is a readability and maintenance decision, not a
correctness one. What caught the shallow assertion was mutation testing, which
is orthogonal to how the suite is organised.

**Trade-off.** A null result from one comparison at one size is weak evidence,
and stating it plainly invites the reading that structure never affects
correctness. That is not the claim. Twenty journeys against a stable site is a
small sample, and the failure modes structure is supposed to prevent — a
selector duplicated in thirty places, a page's behaviour re-implemented per
test — are the kind that appear at a scale this suite never reaches. The
honest form of this finding is "not at this size", and reporting it as a null
result rather than dropping it is what keeps the comparison from only
publishing the differences it happened to find.

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

**Trade-off.** Both fixes make their tests longer and more specific: three
items where one would do, two named products where a count sufficed. That is a
real cost — a test asserting exact counts breaks when the application's
behaviour legitimately changes shape, and someone will have to decide whether
a new number is a bug or a redesign. The weaker assertions never had that
problem, because they never asked a question worth getting wrong.

The larger cost is what this says about the rest of the suite. Two vacuous
assertions were found by reading, not by any check — so the honest position is
that others may exist and nothing here would catch them. The mutation
discipline in decision 5 is the answer, and it is manual, which is the same
gap named there.

## 9. A dashboard runs this suite, and the contract is its inputs

This suite is dispatched by `playwright-run-dashboard`, the same dashboard that
runs the sibling API repo. `.github/workflows/on-demand.yml` takes a request,
runs the chosen slice, merges both packages into one Allure report, uploads it,
and posts a signed result back.

**The two workflows deliberately declare the same inputs** — `style`, `scope`,
`workers` and `run_id`. That is a contract rather than a coincidence: GitHub rejects
a dispatch carrying an input the workflow does not declare, and it rejects the
whole request rather than ignoring the extra. A caller that had to branch per
suite would be a second thing to keep in step, and it would fail loudly the
first time the two drifted.

What differs is what the inputs _mean_. The API suite's `scope` is a tag. Here
it names a spec file, because these journeys are grouped by file.

**That difference is dangerous in a specific way.** `--grep @auth` against
file-grouped tests matches nothing, and Playwright reports "no tests found" as
a **success with zero tests**. The dashboard would have recorded a green run
that asserted nothing — the worst available failure, because nobody
investigates green. The workflow therefore selects a file for every value but
`all` and `smoke`, and the dashboard's own contract test holds both workflows'
accepted values so a slice this suite would refuse cannot be offered.

**Trade-off.** Two repositories now have to agree about a vocabulary neither
owns. The dashboard lists this suite's journey groups in its own source, and a
spec file renamed here goes stale there — caught by a test in the _other_ repo,
which is a strange place for this repo's contributor to find out. The
alternative was an endpoint serving the list, which is a network round trip to
learn a constant that changes twice a year.

The second cost is that this suite now has a reason to care about a deployment
it cannot see. The report steps are skipped without a `run_id`, so a
hand-started run is unaffected — but the callback and upload need three secrets
configured on this repository, and when they are missing the run still passes
while quietly reporting nothing. That is deliberate (a fork should not fail for
want of credentials it should not have) and it is exactly the shape of thing
that hides a broken deployment for a week.

---

## 10. The flake was not what it looked like, twice

`defect.reset-leaves-buttons-stale` failed on roughly one CI run in three. Six
runs, two failures, and both packages hit it — so a timing problem in the
application rather than a fault in either style.

**The first diagnosis was wrong, and it passed 42 runs.** The burger menu
slides in over ~600ms, and Playwright refuses to click an element that is still
moving; that story fits the symptom, so the fix waited for the panel to settle
and the suite went green locally forty-two times. It was still wrong. Throttling
the CPU twentyfold to imitate a loaded runner reproduced the failure _with the
fix in place_ — and measurement showed `aria-hidden` flips at 100ms while the
slide finishes at 600ms, so the guard had never been waiting for the thing it
claimed to wait for. Forty-two green runs meant the machine was too fast to
show the bug, not that the bug was gone.

**The log said it plainly the whole time.** `element is not visible`, repeated
for the full 30-second timeout, then a retry passing in under two seconds. Not
a slow menu: a menu that never opened. The first click lands before React has
bound its handler, is swallowed, and the panel stays off-screen while Playwright
waits for an entry that will never appear.

So the click is repeated until the application says the menu is open, rather
than waited on for longer — waiting cannot help a click that was swallowed.
Proven by simulating it: with the first click deliberately eaten, the helper
recovers on the second in 1.2s instead of failing at 30s. Six CI runs
afterwards, zero failures, and the local suite unchanged at 15.0s against
15.4s before.

**Trade-off.** A retry loop around a click can hide a real regression. If the
menu ever breaks properly, this spends ten seconds discovering it instead of
failing on the first click, and a genuinely broken button now looks like a slow
one. The mitigation is that the loop is narrow — it clicks one control and
asserts one attribute — but it is still a place where "flaky" and "broken" have
been made to look alike, which is the thing this repo says elsewhere it will
not do.

The deeper cost is the retry that is still in `playwright.config.ts`. It masked
this for as long as it existed: the run stayed green, the numbers were right,
and only reading the log showed a test failing and passing on a second attempt.
`retries: 1` buys a suite that does not cry wolf and pays for it by making
exactly this class of bug invisible until someone goes looking.

---

## How to add a decision

Write it when the reasoning is still fresh, and include the cost. If the
trade-off section reads as "no real downside", the decision has not been
examined hard enough yet — go back and find who it makes life worse for.
