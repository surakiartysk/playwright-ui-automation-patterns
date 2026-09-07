# Provenance

Where this repository came from, what did and did not travel, and how AI was
used. Written plainly because the alternative — depth with no explanation —
invites the wrong question.

## The short version

This is a UI companion to `playwright-api-automation-patterns`, built the same
way and for the same reason: to show how a suite is structured, using a subject
that can be published.

It draws on two earlier suites of mine and copies neither.

## What travelled

**From a regression suite I wrote against a live commercial site**, concepts
only, all reimplemented:

- page objects injected through Playwright fixtures, so a test receives ready
  pages instead of constructing them
- assertions that read as sentences, so a failure names the thing that failed
  rather than a selector
- an Allure `step()` wrapper, so the report reads as prose
- `storageState` for authentication, so signing in happens once per worker

What did **not** travel is more interesting, and is written up in
[flake.md](flake.md): 94 lines of dialog-dismissing and overlay-polling that
only existed because the site under test was never built to be automated.

## What did not travel at all

**Nothing from third-party training material.** A course template of a similar
shape exists on my machine. Course code is licensed for study, not
redistribution; paying for a course buys attendance, not copyright. The _idea_
of separating locators from page objects is nobody's property and is
reimplemented here from scratch; none of that repository's code is present.

`scripts/check-leak.mjs` enforces this on every run rather than leaving it to
good intentions. Its word list — including the course's own module names —
lives outside the repository, because a denylist published in a public repo
names the very things it exists to suppress.

**No employer endpoint, field name, business rule or environment URL.** No
employer, product or repository name, here or in the commit history.

## The subject

[saucedemo.com](https://www.saucedemo.com), owned by Sauce Labs, MIT licensed,
and published as a sample application for practising exactly this. It is used
here on its own merits: six accounts, four of them broken on purpose, which
gives a suite real defects to catch instead of a happy path to walk.

## How AI was used

As a drafting tool, under review. The architecture, the decisions and the
trade-offs are mine; the typing largely was not.

The discipline that makes that division honest: **nothing is described as
passing until it has been seen to fail for the right reason.**
