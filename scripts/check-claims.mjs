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
import { join } from 'node:path'
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

if (problems.length > 0) {
  console.error(`\n✖ check:claims — the docs advertise something that is not true.\n`)
  for (const p of problems) console.error(`  ${p}`)
  console.error('\nUpdate the number, or the claim stops being true.\n')
  process.exit(1)
}

console.log(
  `✓ check:claims — ${journeys} journeys, ${locatorTests} tests per package, ` +
    `and the comparison table matches the tree`,
)
