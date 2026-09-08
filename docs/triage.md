# When the suite goes red

A failing UI test is a question, not an answer. The question is _who owns this_
— and answering it in the wrong order is how teams end up filing bug reports
against an application that was never broken.

The API sibling has five owners because it has a contract to arbitrate. This
suite has four, and the missing one is the point: **there is no specification
here**. The application is the specification, so "the app is wrong" is a claim
this repo can rarely make.

## Four owners, ruled out cheapest first

| Class           | What it means                                                       | Who fixes it     |
| --------------- | ------------------------------------------------------------------- | ---------------- |
| **ENV**         | The run never really happened — no browser, no network, no site     | whoever runs it  |
| **FLAKY**       | Intermittent, timing-dependent, or an oracle that cannot be exact   | us — reliability |
| **TEST-BUG**    | The test is wrong: bad selector, bad assumption, wrong expectation  | us — the test    |
| **APP-CHANGED** | The application genuinely behaves differently than when we wrote it | us — the suite   |

Note who fixes the last one. Against a site we do not own, "the application
changed" is **still our problem** — there is nobody to file it with. That is
the structural difference from the API suite, where `API-DEFECT` has an owner
and a contract proving it.

**The order is the method:**

```
Did it run at all?            ── no ──▶  ENV
        │ yes
Does it fail every time?      ── no ──▶  FLAKY
        │ yes
Is our expectation correct?   ── no ──▶  TEST-BUG
        │ yes
                                      APP-CHANGED
```

Running it backwards is the expensive mistake. Start by assuming the site
changed, and every slow runner becomes an afternoon of reading diffs against a
page that is fine.

> **A red test is never fixed by a retry.** `retries: 1` in CI buys a suite
> that does not cry wolf, and it pays for that by making a real intermittent
> bug invisible until someone reads the log. That is a trade, not a solution —
> see [decision 10](decisions.md#10-the-flake-was-not-what-it-looked-like-twice).

## Worked examples from this repo

### The one that looked like FLAKY and was FLAKY — but not the flake we thought

`defect.reset-leaves-buttons-stale` failed on about one CI run in three.

The first diagnosis was that the burger menu slides in over ~600ms and
Playwright refuses to click a moving element. That story fit, and the fix built
on it passed 42 local runs. It was still wrong — throttling the CPU twentyfold
reproduced the failure _with the fix in place_.

What the log had said all along:

```
2 × waiting for element to be visible, enabled and stable
  - element is not visible
58 × waiting for element to be visible, enabled and stable
  - element is not visible
```

`element is not visible`, not `unstable` and not `intercepted`. The menu never
opened at all — the first click landed before React bound its handler and was
swallowed. Waiting longer cannot help a click that did not happen.

**The lesson for triage:** the failure message was precise from the first run,
and a plausible theory was allowed to override it. Read what the tool actually
says before deciding what it means.

### The one that looked like APP-CHANGED and was TEST-BUG

Two tests asserted less than they claimed —
[decision 8](decisions.md#8-two-tests-asserted-less-than-they-claimed). Both
were green, and both would have stayed green through the exact bug they
existed to catch.

Neither was found by a failure. They were found by reading the assertions and
asking what would have to break for them to go red. Triage does not only happen
when the suite is red.

### The one that is APP-CHANGED on purpose

Two journeys assert defects the application ships deliberately: `problem_user`
rendering one image for six products, and Reset App State leaving every button
reading Remove.

If Sauce Labs ever fixes those, **these tests go red and they are right to**.
The failure messages say so explicitly:

> _if the application has been fixed, this test is the thing that is now wrong._

Triage here means reading the message before touching the assertion.

## Ruling out ENV first, concretely

```bash
pnpm exec playwright install chromium   # no browser is the commonest ENV cause
curl -sI https://www.saucedemo.com | head -1   # is the site up at all?
```

If the site is down or rate-limiting, everything below is noise. Check it
first; it costs two seconds.

## Telling FLAKY from a real failure

Run the single test enough times to make an intermittent failure show itself,
and under enough load to provoke a timing problem:

```bash
pnpm --filter @swag-lab/locator-first exec playwright test tests/defects.spec.ts \
  --repeat-each=5 --workers=8 --retries=0
```

`--retries=0` matters. With retries on, a flake reports as a pass and the thing
being measured disappears.

A local machine is often too fast to reproduce a CI timing bug. When it will
not fail locally, throttle it:

```js
const cdp = await page.context().newCDPSession(page)
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 20 })
```

That is what finally reproduced the menu failure, and it is what proved the
first fix did nothing.

## Where the expected value comes from

An assertion is only as good as its oracle, and this suite has no contract to
consult. Three sources, in order of how much they can be trusted:

1. **Something the test itself created.** Add three items, assert three. This
   is the only oracle that cannot drift.
2. **A relationship that must hold.** Tax is charged on the item total; the
   total is their sum. True whatever the prices are.
3. **A value observed on the site.** The weakest, because it is a snapshot of
   someone else's application. Use it only when 1 and 2 cannot express the
   behaviour, and expect it to break.

Never assert a global count the test did not create. `expect(items).toHaveCount(6)`
passes today and tells you nothing about whether the listing works.

## Writing it up for someone else

A useful report answers four things:

- **Which class** — ENV, FLAKY, TEST-BUG, APP-CHANGED
- **What the tool actually said** — the call log, not a paraphrase
- **How many times out of how many** — "2 of 6 CI runs" is evidence; "sometimes" is not
- **What would make it red again** — the reproduction, or an honest "could not reproduce locally"

The last one is the one people skip, and it is the one that makes the next
person's triage cheap.
