# The tax on testing a site you do not own

This repository tests saucedemo, which is published for exactly this purpose.
An earlier suite of mine tested a live commercial ticketing site. The
difference between the two is not a detail — it is most of the work.

## What the earlier suite spent its lines on

That suite's `BasePage` ran to 524 lines. Ninety-four of them existed only to
fight the page:

- `dismissAllDialogs()` tried **five** different strategies in order, because no
  single one worked reliably. Cookie banners, marketing overlays, an
  announcement modal that only appeared when its content overflowed.
- `waitForOverlaysToDisappear()` polled a list of selectors on a timer,
  because there was no event to wait on.
- A file named after a CAPTCHA, describing how the suite got blocked.

None of that is bad code. It is the correct response to a page that was never
built to be automated, and it is invisible in a screenshot of a passing run.

## What replaced it here

Nothing. The tax is gone, not paid more cheaply.

That is the honest reason this repo can be about _structure_ — the two styles,
what each costs — rather than about survival. A comparison written against a
hostile site would mostly measure which style hid the workarounds better.

## The second cost, which is easier to miss

That suite also carried a 249-line `test-ids.ts`, mapping each case to a
requirement, a user story and a ticket. It was good work and it was never
wired up: the page objects call `getByTestId` **zero** times and raw CSS
locators **38** times, because you cannot add test ids to someone else's
markup.

Traceability was designed and then could not be built. Saucedemo ships
`data-test` attributes, so here it can be — which turns "ask your developers
for test ids" from an opinion into a claim this repo can show the cost of.
