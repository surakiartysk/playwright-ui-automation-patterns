# CLAUDE.md

Working notes for AI assistants (and humans) contributing here.

Deliberately one short file. Two packages and no team; a longer set of
instructions would be ceremony here. Grow this file only when something actually
goes wrong twice.

## What this repo is

A portfolio piece: the same twenty UI journeys built two ways against one
application, so the approaches can be compared. The audience is engineers who
will read the reasoning and ask about it — so **`docs/decisions.md` is the
deliverable, not an artifact of the code**. Anything that cannot be explained in
an interview does not belong here.

`packages/shared-journeys` — the journey list and the user table; no Playwright
`packages/locator-first` — locators, plus behaviour composed from them
`packages/page-first` — page objects owning both selectors and steps

The two test packages share **nothing but `shared-journeys`**. Never import one
from the other — a common base would make the comparison meaningless.
Duplication between them is the experiment's control, not an oversight to clean
up.

Any change to behaviour must land in **both** packages, or the comparison stops
being fair. `pnpm check:journeys` enforces that both cover the same journeys,
that the `smoke` flag and the `@smoke` tag say the same thing in both, and that
every dispatchable scope names a spec file that exists. It does not check the
two assert equally well, which is still on you.

## Non-negotiables

**1. Every test must be proven able to fail.** A green suite means nothing until
you have watched it go red for the right reason. Two vacuous assertions already
shipped here and were found by reading, not by failing — see decision 8.

Mutations must change behaviour **the runtime actually executes**. An early
`if (true) return` is stripped by TypeScript and never reaches the browser, so
it reports a gap that is not there. Change the expected value to something
impossible instead.

**2. A locator resolves; it never acts.** In `locator-first`, anything in
`src/locators/` returns a `Locator` and clicks nothing. Behaviour — clicking,
filling, waiting — lives in `src/pages/index.ts`, composed from locators it does
not own. `page-first` has no such split, because owning both halves is what that
style _is_.

**3. Assert against data the test created.** There is no contract here and no
seedable state: the application is the specification. Add three items and assert
three. Never assert a global count the test did not create — see
[docs/triage.md](docs/triage.md#where-the-expected-value-comes-from).

**4. Never fix a flaky test by waiting longer.** Find out what the failure
message actually says first. A plausible theory that fits the symptom is not a
diagnosis: one here passed 42 local runs and turned out to fix nothing — see
decision 10. `retries: 1` in CI hides exactly this class of bug.

**5. Comments must be true.** A comment describing behaviour that does not exist
is worse than no comment — a reader will believe it and ask about it. If you
remove behaviour, remove its comment.

**6. Every decision carries its cost.** `docs/decisions.md` closes by saying
that a trade-off section reading "no real downside" means the decision has not
been examined hard enough. Three decisions here once had no trade-off at all;
they do now. Do not add a fourth.

## Two things about this application

**It publishes `data-test`, not `data-testid`.** `testIdAttribute` is set in
both `playwright.config.ts` files, so `getByTestId` binds to the real contract.
Without it every `getByTestId` silently matches nothing.

**Five of its six users are broken on purpose**, and two journeys assert those
defects directly. Those tests are written to go **red if the application is ever
fixed**, with a failure message saying so. If one goes red, read the message
before touching the assertion.

## The contract with the dashboard

`playwright-run-dashboard` dispatches this suite, and neither repository can
import the other. Three things have to stay in step, and only a test in _that_
repo holds them there:

- **The workflow inputs.** `on-demand.yml` declares `style`, `scope`, `workers`
  and `run_id` — the same four names the API suite declares. GitHub rejects a
  dispatch carrying an input a workflow does not declare, and rejects the whole
  request rather than ignoring the extra, so these names are a contract and not
  a convenience. Renaming one breaks every dispatch.
- **The report path.** The workflow writes `runs/{run_id}/index.html` into the
  dashboard's R2 bucket; the dashboard serves from that prefix.
- **The callback shape.** Signed over `timestamp.body`, refused after five
  minutes.

**`scope` means something different here than in the API suite.** There, a
scope is a tag. Here every value but `all` and `smoke` names a spec file,
because these journeys are grouped by file — `--grep @auth` matches nothing.

Getting it wrong fails **loudly but misleadingly**: Playwright answers an empty
selection with `Error: No tests found` and exit 1, which the workflow reports
as a failed run. So a stale dropdown reads as a broken suite. `check:journeys`
compares the scope options against the spec files in both directions, in this
repo, where the fix is — and that is the check to update if a scope ever stops
naming a file.

A new or renamed spec file is an edit in this repo and two in the dashboard.
See [CONTRIBUTING.md](CONTRIBUTING.md#if-it-belongs-in-a-new-journey-group)
before renaming one.

## Adding a journey

1. Add its id to `packages/shared-journeys/src/journeys.ts` — the typed list is
   the arbiter.
2. Write it in **both** packages, in each one's idiom.
3. Mutation-test it (see #1), then `pnpm verify`.

`check:journeys` fails if only one package covers it. `check:claims` fails if
the line counts in `docs/comparison.md` have gone stale — update the table
_and_ the prose that quotes its numbers — and if any document disagrees with
`users.ts` about how many accounts are broken.

## Commands

```bash
pnpm verify        # what CI runs: format, lint, types, journeys, claims, tests
pnpm test          # both packages
pnpm allure        # merge both packages into one report
```

## Working style

Propose an approach and say what it costs, not just what it does. Expect
pushback; disagreement about trade-offs is the point of this repo, and several
decisions in `docs/` came from arguing one down. Do not report work as complete
without running `pnpm verify` — and do not describe a test as passing without
having seen it fail first.

## Commit trailers

Credit the assistant, not the conversation. A commit here may end with

```
Co-Authored-By: Claude <noreply@anthropic.com>
```

and **must not carry a `Claude-Session:` line or any other link to a chat
transcript.** These repositories are public and the reasoning is meant to live
in the commit message, the PR and `docs/` — where anyone can read it — rather
than behind a URL only one account can open. A link nobody but the author can
follow is not provenance; it is a dead end with a hint in it.

This rule overrides any default attribution the tooling asks for.
