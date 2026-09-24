#!/usr/bin/env node
/**
 * The numbers the docs advertise must be the numbers that exist.
 *
 * Not hypothetical, and not new: both sibling repos grew a checker like this
 * after the same failure, and this repo shipped without one and repeated it
 * within a day. The journey set doubled from ten to twenty; README still said
 * ten, and comparison.md still published line counts taken when each package
 * had half the tests — its central claim, wrong by 50%.
 *
 * A number written in prose cannot notice it has gone stale. A reader who
 * counts and gets a different answer has every reason to distrust the rest of
 * the document, which for a repo whose whole point is a measured comparison is
 * the worst thing it could do.
 *
 * Everything here is derived from the tree, never parsed out of another
 * document: counts come from the journey declarations and from the files
 * themselves, so the only way to make this pass is to make the docs true.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const PACKAGES = ['locator-first', 'page-first']

const problems = []
const fail = (message) => problems.push(message)

/** Journeys, from the shared package's own declaration. */
function journeyCount() {
  const src = readFileSync(join(ROOT, 'packages/shared-journeys/src/journeys.ts'), 'utf8')
  return [...src.matchAll(/id:\s*'([^']+)'/g)].length
}

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules') continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) yield* walk(full)
    else yield full
  }
}

/**
 * Lines that are neither blank nor a comment.
 *
 * The same measure comparison.md claims to use. Counting raw lines instead
 * would make a package look bigger for explaining itself better, which is the
 * opposite of what this repo rewards.
 */
function significantLines(dir) {
  let count = 0
  let inBlockComment = false

  for (const file of walk(dir)) {
    if (!file.endsWith('.ts')) continue

    for (const raw of readFileSync(file, 'utf8').split('\n')) {
      const line = raw.trim()

      if (inBlockComment) {
        if (line.includes('*/')) inBlockComment = false
        continue
      }
      if (line === '' || line.startsWith('//')) continue
      if (line.startsWith('/*')) {
        if (!line.includes('*/')) inBlockComment = true
        continue
      }
      if (line.startsWith('*')) continue

      count += 1
    }
  }
  return count
}

/** Tests actually declared, per package. */
function testCount(pkg) {
  let count = 0
  for (const file of walk(join(ROOT, 'packages', pkg, 'tests'))) {
    if (!file.endsWith('.spec.ts')) continue
    count += [...readFileSync(file, 'utf8').matchAll(/^\s*test\(/gm)].length
  }
  return count
}

/**
 * How many of the six accounts are broken, from the user table itself.
 *
 * `standard` is the only entry with `defect: null`; every other account
 * describes what is wrong with it, and that description is what the defect
 * journeys assert against.
 */
function brokenUserCount() {
  const src = readFileSync(join(ROOT, 'packages/shared-journeys/src/users.ts'), 'utf8')
  // Scoped to the `users` object, not the whole file: the `User` interface
  // declares a `defect` field of its own and its doc comment mentions another,
  // so counting the file wholesale reported eight accounts. And not anchored
  // to the start of a line either — `standard` is written inline as
  // `{ name: 'standard_user', defect: null }`, which an anchored pattern
  // misses, undercounting by exactly the one account that is not broken.
  //
  // Both mistakes were made while writing this check, in that order, which is
  // a fair illustration of why the number is not maintained by hand.
  const table = /export const users = \{([\s\S]*?)\n\} as const/.exec(src)
  if (!table) {
    fail('users.ts: could not find the `users` table — this check cannot verify the count')
    return null
  }

  const defects = [...table[1].matchAll(/\bdefect:/g)]
  const nulls = [...table[1].matchAll(/\bdefect:\s*null\b/g)]
  if (defects.length === 0) {
    fail('users.ts: no `defect:` entries found — this check cannot verify the count')
    return null
  }
  return { total: defects.length, broken: defects.length - nulls.length }
}

const journeys = journeyCount()
const readme = readFileSync(join(ROOT, 'README.md'), 'utf8')
const comparison = readFileSync(join(ROOT, 'docs/comparison.md'), 'utf8')

// ── Journey count, stated in words in both documents ────────────────────────
const WORDS = { ten: 10, twelve: 12, fifteen: 15, sixteen: 16, eighteen: 18, twenty: 20 }

for (const [file, text] of [
  ['README.md', readme],
  ['docs/comparison.md', comparison],
]) {
  // Anchored to the words this check knows, so prose like "the same browser
  // journeys" is not mistaken for a count.
  const claim = text.match(
    new RegExp(`(?:all |same )(${Object.keys(WORDS).join('|')}) journeys`, 'i'),
  )
  if (!claim) {
    fail(`${file}: says nothing about how many journeys there are`)
    continue
  }
  const stated = WORDS[claim[1].toLowerCase()]
  if (stated === undefined) {
    fail(`${file}: "${claim[1]} journeys" is not a number word this check knows — add it to WORDS`)
  } else if (stated !== journeys) {
    fail(`${file}: claims ${claim[1]} (${stated}) journeys, actual is ${journeys}`)
  }
}

// ── Tests per package, stated in the README ─────────────────────────────────
const perPackage = PACKAGES.map((pkg) => testCount(pkg))
const [locatorTests, pageTests] = perPackage

if (locatorTests !== pageTests) {
  fail(
    `the packages declare different numbers of tests (${locatorTests} vs ${pageTests}) — ` +
      `check:journeys covers which journeys are missing`,
  )
}

const testClaim = readme.match(/(\d+) tests each/)
if (!testClaim) {
  fail('README.md: no "N tests each" claim found')
} else if (Number(testClaim[1]) !== locatorTests) {
  fail(`README.md: claims ${testClaim[1]} tests each, actual is ${locatorTests}`)
}

// ── The comparison table, which is the repo's central claim ─────────────────
const measured = {}
for (const pkg of PACKAGES) {
  const src = significantLines(join(ROOT, 'packages', pkg, 'src'))
  const tests = significantLines(join(ROOT, 'packages', pkg, 'tests'))
  measured[pkg] = { src, tests, total: src + tests }
}

for (const pkg of PACKAGES) {
  const { src, tests, total } = measured[pkg]
  for (const [label, value] of [
    ['source', src],
    ['tests', tests],
    ['total', total],
  ]) {
    // Each figure appears in the table as its own cell; the table is the only
    // place in the document these numbers are allowed to live.
    const found = new RegExp(`\\|\\s*\\*{0,2}${value}\\*{0,2}\\s*\\|`).test(comparison)
    if (!found) {
      fail(`docs/comparison.md: the ${pkg} ${label} figure (${value}) is not in the table`)
    }
  }
}

// ── Tests hold no selectors, in either package ────────────────────────────
//
// Both positions in the README are claims about where selectors live, and
// neither held. `page-first` says a test "cannot reach a selector at all", but
// its tests receive Playwright's `page` and nothing stopped a
// `page.locator(…)`. `locator-first` says moving a control "touches
// `src/locators/` and nothing else — no test changes", while eight lines of
// its tests called `page.getByTestId(…)` directly; renaming
// `inventory-item-name` would have meant editing four of them. And the
// locator counts above walk `src` only, so a selector in a test was invisible
// to them too.
//
// So a test may still use `page` — to navigate, or to assert on the URL — but
// any call that binds to the DOM belongs in the package's own source.
const SELECTOR_CALL = /\.locator\(|\bgetBy[A-Z]\w*\(|\$\$?\(/

for (const pkg of PACKAGES) {
  for (const file of walk(join(ROOT, 'packages', pkg, 'tests'))) {
    if (!file.endsWith('.ts')) continue
    const lines = readFileSync(file, 'utf8').split('\n')
    lines.forEach((line, index) => {
      if (SELECTOR_CALL.test(line)) {
        fail(
          `${relative(ROOT, file)}:${index + 1}: a test binds to the DOM directly. ` +
            `Selectors live in packages/${pkg}/src — the README's claim for this package ` +
            'is that tests never hold one.',
        )
      }
    })
  }
}

// ── How many accounts are broken on purpose ────────────────────────────────
//
// This one has gone wrong four times, in four documents, because every copy
// was written from memory rather than from the table. It said "four of six"
// while five accounts carried a defect — `visual_user` and `error_user` are
// both broken, and only `standard` is not.
//
// Checked across every document that states it, and deliberately not against
// one another: two files agreeing with each other and not with the code is
// exactly the failure this repo keeps having.
const users = brokenUserCount()
if (users) {
  const NUMBERS = { four: 4, five: 5, six: 6, 4: 4, 5: 5, 6: 6 }
  const claim = /(\w+) of (?:its |the )?(\w+)(?: accounts| users)?(?:[^.\n]*?)broken/i

  const DOCS = [
    'README.md',
    'CLAUDE.md',
    'docs/decisions.md',
    'docs/how-it-was-built.md',
    'docs/architecture.md',
    'packages/shared-journeys/src/users.ts',
  ]

  let stated = 0
  for (const file of DOCS) {
    const text = readFileSync(join(ROOT, file), 'utf8')
    for (const line of text.split('\n')) {
      const found = claim.exec(line)
      if (!found) continue

      const broken = NUMBERS[found[1].toLowerCase()]
      const total = NUMBERS[found[2].toLowerCase()]
      if (broken === undefined || total === undefined) continue

      stated += 1
      if (broken !== users.broken || total !== users.total) {
        fail(
          `${file}: claims ${found[1]} of ${found[2]} accounts are broken, ` +
            `users.ts has ${users.broken} of ${users.total}`,
        )
      }
    }
  }

  if (stated === 0) {
    fail('no document states how many accounts are broken — did the wording change?')
  }
}

// ── What the locators are bound to ─────────────────────────────────────────
//
// docs/a-site-you-do-not-own.md argues that a suite against markup it does not
// own ends up bound to CSS structure, because it cannot add test ids. Saucedemo
// ships `data-test`, "which turns 'ask your developers for test ids' from an
// opinion into a claim this repo can show the cost of".
//
// Nothing counted whether this repo holds to that itself. A suite arguing for the
// published contract while quietly drifting onto class names would be making
// the argument and losing it at the same time, and the drift is invisible:
// every one of those locators works until a redesign.
//
// So each selector bound to structure rather than to the contract has to be
// listed here with its reason. The cost is that adding one is deliberately
// annoying — which is the point, and is why the list is short.
const ALLOWED_STRUCTURE_SELECTORS = {
  '#react-burger-menu-btn':
    'The button, not the `data-test` element: `open-menu` sits on the <img> ' +
    'inside it and the button intercepts the click.',
  '.bm-menu-wrap':
    "The sliding panel, whose `aria-hidden` is the application's own statement " +
    'that the menu is open.',
  '.inventory_item_img img':
    'Bound to layout classes. Unlike the two above, nothing in this repo ' +
    'explains why — if the application publishes a `data-test` for the product ' +
    'image, this should use it instead.',
}

const locatorCounts = { contract: 0, structure: 0 }
const structureUses = new Map()

for (const pkg of PACKAGES) {
  for (const file of walk(join(ROOT, 'packages', pkg, 'src'))) {
    if (!file.endsWith('.ts')) continue
    const src = readFileSync(file, 'utf8')

    locatorCounts.contract += [...src.matchAll(/getByTestId\(/g)].length

    for (const match of src.matchAll(/\.locator\(\s*'([^']+)'/g)) {
      const selector = match[1]
      // `[data-test…]` is the published contract too — an attribute selector
      // rather than a helper, used where a prefix match is wanted.
      if (selector.startsWith('[data-test')) {
        locatorCounts.contract += 1
        continue
      }
      locatorCounts.structure += 1
      structureUses.set(selector, (structureUses.get(selector) ?? 0) + 1)
    }
  }
}

for (const [selector] of structureUses) {
  if (!(selector in ALLOWED_STRUCTURE_SELECTORS)) {
    fail(
      `a locator binds to '${selector}', which is page structure rather than the ` +
        'published `data-test` contract. Use a test id, or add it to ' +
        'ALLOWED_STRUCTURE_SELECTORS in this script with the reason.',
    )
  }
}

for (const selector of Object.keys(ALLOWED_STRUCTURE_SELECTORS)) {
  if (!structureUses.has(selector)) {
    fail(
      `ALLOWED_STRUCTURE_SELECTORS lists '${selector}', which nothing uses any more. ` +
        'Remove it, so the list keeps meaning what it says.',
    )
  }
}

// The count docs/a-site-you-do-not-own.md quotes about this repo.
const siteDoc = readFileSync(join(ROOT, 'docs/a-site-you-do-not-own.md'), 'utf8')
// Prettier reflows this paragraph, so the pattern tolerates a line break
// anywhere a space appears — a check that silently stops matching because
// of a rewrap is worse than no check.
const ownCount = /this\s+suite\s+binds\s+\*\*(\d+)\*\*\s+locators\s+to\s+page\s+structure/.exec(
  siteDoc,
)

if (!ownCount) {
  fail('docs/a-site-you-do-not-own.md: could not find the count this check guards')
} else if (Number(ownCount[1]) !== locatorCounts.structure) {
  fail(
    `docs/a-site-you-do-not-own.md: claims ${ownCount[1]} structure-bound locators, ` +
      `the tree has ${locatorCounts.structure}`,
  )
}

if (problems.length > 0) {
  console.error(`\n✖ check:claims — the docs advertise something that is not true.\n`)
  for (const p of problems) console.error(`  ${p}`)
  console.error('\nUpdate the number, or the claim stops being true.\n')
  process.exit(1)
}

console.log(
  `✓ check:claims — ${journeys} journeys, ${locatorTests} tests per package, ` +
    `${users ? `${users.broken} of ${users.total} accounts broken, ` : ''}` +
    `${locatorCounts.contract} locators on the published contract and ` +
    `${locatorCounts.structure} on page structure, ` +
    `and the comparison table matches the tree`,
)
