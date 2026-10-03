# Two styles, one journey set

Both packages cover the same journeys, run under the same configuration, and
are held to that by `check:journeys`. What differs is where the knowledge of
the page lives.

This document is the scorecard. It will try to be useful rather than
flattering: where one style wins, it will say so.

## What each style costs, measured

Both packages cover the same twenty journeys and pass. The numbers below are
non-comment, non-blank lines.

|           | `locator-first` | `page-first` |
| --------- | --------------- | ------------ |
| source    | 82              | 213          |
| tests     | 300             | 255          |
| **total** | **382**         | **468**      |

`locator-first` is smaller overall by 86 lines, and the split is the
interesting part: its source is under half the size, while its tests are
longer. That is the trade made visible — the knowledge has to live somewhere,
and this style puts more of it in the test.

The gap widened as the suite grew. At ten journeys it was 40 lines; at twenty
it is 86. `page-first` pays a fixed cost per behaviour — a method on a page
object — where `locator-first` pays it once per selector and then reuses it
from the test, so the two do not scale the same way. That is a finding about
the styles rather than about this suite's size, and it is why these figures are
checked in CI rather than written down once.

One movement is a worked example of the same trade. Three tests
were reading the DOM before it had settled, and fixing them cost
`locator-first` nine lines **in its tests** and `page-first` eleven **in its
source** — the wait went into the page object, because its tests cannot reach
a locator to wait on. Neither number is better; they are the same fix landing
where each style keeps its knowledge.

## Where each one wins

**`page-first` reads better at the call site.** Most of its auth tests are two
lines:

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
in `docs/decisions.md`. A second, larger pass (below) found the one place the
structure did change what a test asserted, and not in the direction the style
claims for itself.

## Do the two assert equally strongly?

`check:journeys` proves both packages cover the same journeys. It cannot prove
they check them as hard, so that was measured instead: 49 defects, forty
injected into the running application and nine made to each package's own page
objects and helpers, each run against both. The method and what it found are in
[decision 11](decisions.md#11-the-application-was-mutated-and-seven-tests-asserted-less-than-they-claimed).

|                                      | before fixes | after fixes |
| ------------------------------------ | ------------ | ----------- |
| same journeys red in both packages   | 41           | 46          |
| red in neither                       | 4            | 1           |
| red in one package and not the other | 4            | 2           |

The four that turned nothing red were real gaps, and they were in both
packages: a wrong-password message that named the field in words the test did
not forbid, an item total shifted along with its tax and total, a summary that
listed only the first line of an order, and product names compared as
substrings. The one that remains "red in neither" is the slow sign-in, which
stopped failing because the race it exposed is fixed.

**The structure did matter once, and it hid the weakness.** `page-first` checked
the order summary with `expectOrderLists`, whose body used a substring match. A
product named "Sauce Labs Backpack (Refurbished)" passed there and failed in
`locator-first`, which spelled the same check out in the test with an exact
`toHaveText`. A reader of the `page-first` test sees a method whose name says
"exactly what was ordered" and has no reason to open it. That is the cost of the
style this document already names — assertions live out of sight — shown on a
real defect rather than as an argument.

The two that still differ are structure and not strength. `locator-first`'s
defect tests call locators directly, so a broken `addToCart` helper never
reaches them; `page-first` routes them through methods and they go red. And
`page-first` waits for the product list with a helper that counts prices, so a
broken price locator reaches one more test there.

## The honest limit

Twenty journeys against a small, well-behaved application. The differences above
are real but they are measured at a scale where both styles work. A suite of
two hundred tests against a hostile page might separate them differently, and
this repo cannot say.
