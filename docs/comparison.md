# Two styles, one journey set

Both packages cover the same journeys, run under the same configuration, and
are held to that by `check:journeys`. What differs is where the knowledge of
the page lives.

This document is the scorecard. It will try to be useful rather than
flattering: where one style wins, it will say so.

## What each style costs, measured

Both packages cover the same ten journeys and pass. The numbers below are
non-comment, non-blank lines.

|           | `locator-first` | `page-first` |
| --------- | --------------- | ------------ |
| source    | 62              | 116          |
| tests     | 156             | 142          |
| **total** | **218**         | **258**      |

`locator-first` is smaller overall, and the split is the interesting part: its
source is nearly half the size, and its tests are longer. That is the trade
made visible — the knowledge has to live somewhere, and this style puts more of
it in the test.

## Where each one wins

**`page-first` reads better at the call site.** Its auth tests are three lines
each:

```ts
await login.signIn(users.lockedOut)
await login.expectRefused(/locked out/)
```

The `locator-first` equivalent spells out the URL check and the error locator
in the test. Someone skimming to learn what the suite covers gets there faster
in `page-first`.

**`locator-first` absorbs a new assertion without ceremony.** The
wrong-password test asserts on the _absence_ of detail — that the error does
not name which field was wrong. In `locator-first` that is three lines in the
test, using the locator that already exists. In `page-first` it required a new
method, `expectRefusalRevealsNothing`, because a test cannot reach the error
element at all.

That is the style's design working as intended, and it is also its cost: every
unanticipated assertion is a round trip through the page object.

**`locator-first` makes a selector change a one-file change.** Moving a control
touches `src/locators/` and nothing else — no page object opens, no test
changes. `page-first` spreads its selectors across the methods that use them,
so the same change is a search.

## Where the difference did not show up

Neither style made a _wrong_ test easier to write, which was the difference
this document expected to find. Both would happily assert on a badge while the
cart behind it was empty; both needed the same second assertion to close that.

That is worth recording as a null result: the structure of a suite does not
protect against a shallow assertion. Only mutation testing did — see the note
in `docs/decisions.md`.

## The honest limit

Ten journeys against a small, well-behaved application. The differences above
are real but they are measured at a scale where both styles work. A suite of
two hundred tests against a hostile page might separate them differently, and
this repo cannot say.
