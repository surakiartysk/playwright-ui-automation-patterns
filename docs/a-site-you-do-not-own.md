# The tax on testing a site you do not own

This repository tests saucedemo, which is published for exactly this purpose.
Most UI suites do not get that choice: they test a live site that was never
built to be automated. The difference is not a detail — it is most of the work.

## What a page that fights back demands

A suite against such a site spends much of its code fighting the page rather
than testing it:

- **Dialogs, dismissed several ways in turn**, because no single strategy is
  reliable — cookie banners, marketing overlays, announcements that appear only
  under some conditions.
- **Overlays, polled until they are gone**, because the page offers no event to
  wait on.
- **Bot protection.** A CAPTCHA is the site working as intended, and a suite has
  no honest way through it.

None of that is bad code. It is the correct response to a page that was never
built to be automated, and it is invisible in a screenshot of a passing run.

## What it costs here

Nothing. A site built to be tested does not charge the tax at all.

That is the honest reason this repo can be about _structure_ — the two styles,
what each costs — rather than about survival. A comparison written against a
hostile site would mostly measure which style hid the workarounds better.

## The second cost, which is easier to miss

Stable locators need a handle the application publishes, and you cannot add
test ids to someone else's markup. A suite can be careful in every other respect
and still have to find each element by CSS structure — so a redesign that
changes nothing a user sees breaks it anyway.

Saucedemo ships `data-test` attributes, so here the contract exists — which
turns "ask your developers for test ids" from an opinion into a claim this repo
can show the cost of.
