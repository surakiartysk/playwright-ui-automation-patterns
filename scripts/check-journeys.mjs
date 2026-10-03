#!/usr/bin/env node
/**
 * Both packages must cover every shared journey.
 *
 * The comparison this repo is built on means nothing if one side is quietly
 * better tested. In the API repo that was not hypothetical — an early draft of
 * one package was missing two authentication cases, so one suite was strictly
 * better protected for reasons unrelated to its style.
 *
 * Journeys carry ids, and a test claims one by tagging it. That is stricter
 * than counting tests: a package can have the same number of tests and still
 * be missing a behaviour, and counting would not notice.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const PACKAGES = ['locator-first', 'page-first']

/** Ids declared in the shared package, read from the source rather than imported. */
function declaredJourneys() {
  const src = readFileSync(join(ROOT, 'packages/shared-journeys/src/journeys.ts'), 'utf8')
  return [...src.matchAll(/id:\s*'([^']+)'/g)].map((m) => m[1])
}

/** Ids the shared package marks `smoke: true`. */
function declaredSmoke() {
  const src = readFileSync(join(ROOT, 'packages/shared-journeys/src/journeys.ts'), 'utf8')
  const smoke = new Set()
  for (const m of src.matchAll(/id:\s*'([^']+)'[\s\S]*?smoke:\s*(true|false)/g)) {
    if (m[2] === 'true') smoke.add(m[1])
  }
  return smoke
}

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules') continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) yield* walk(full)
    else if (full.endsWith('.spec.ts')) yield full
  }
}

/**
 * A spec's source with its comments removed.
 *
 * A test that has been commented out still contains `journey('id')`, and read
 * raw it went on covering its journey.
 *
 * @param {string} file - Spec file path
 * @returns {string} Source without block or whole-line comments
 */
function specSource(file) {
  // Newlines inside a comment are kept, so a line number reported below is
  // the line in the file.
  return readFileSync(file, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, ''))
    .replace(/^[ \t]*\/\/.*$/gm, '')
}

/** Ids a package claims, via `journey('id')` in its specs. */
function claimedBy(pkg) {
  const dir = join(ROOT, 'packages', pkg, 'tests')
  const claimed = new Set()
  try {
    for (const file of walk(dir)) {
      const src = specSource(file)
      for (const m of src.matchAll(/journey\(\s*'([^']+)'/g)) claimed.add(m[1])
    }
  } catch {
    // A package with no tests yet claims nothing, which the report below says.
  }
  return claimed
}

/**
 * Ids whose test title carries `@smoke`, per package.
 *
 * The tag is written by hand into the title beside `journey(id)`, and it is
 * what `--grep @smoke` and `pnpm test:smoke` actually select on. The `smoke`
 * flag in the shared package says the same thing in a second place, and two
 * statements of one fact drift.
 *
 * The drift is invisible in the direction that matters: dropping a tag makes
 * the smoke slice smaller and faster, and a run of four green tests looks
 * exactly like a run of six.
 *
 * @param {string} pkg - Package directory name
 * @returns {Map<string, boolean>} Claimed id to whether its title is tagged
 */
function smokeTaggedBy(pkg) {
  const dir = join(ROOT, 'packages', pkg, 'tests')
  const tagged = new Map()
  try {
    for (const file of walk(dir)) {
      const src = specSource(file)
      // The id and the rest of that title's template literal, up to its
      // closing backtick.
      for (const m of src.matchAll(/journey\(\s*'([^']+)'\s*\)\}([^`]*)`/g)) {
        tagged.set(m[1], m[2].includes('@smoke'))
      }
    }
  } catch {
    // Reported below as a package claiming nothing.
  }
  return tagged
}

/**
 * Every place a package skips, fixmes or expects to fail a test.
 *
 * A skipped journey is not a covered one, but it still carries its
 * `journey('id')` — so this check, and the test count in check:claims, went on
 * reporting full coverage. A `test.skip(true, '…')` inside a test body showed
 * it most plainly: every check stayed green, and only a line count in the
 * comparison table moved, which its failure message said to update.
 *
 * Refused outright rather than allowed with a reason, because nothing here is
 * skipped today and the application is public, so any state a journey needs
 * can be reached. The cost: a journey that ever genuinely cannot run — the
 * site down for a week, say — has to be removed from the shared list in the
 * same change, so the gap is declared rather than skipped.
 *
 * @param {string} pkg - Package directory name
 * @returns {string[]} Problems, one per occurrence
 */
function skipsIn(pkg) {
  const dir = join(ROOT, 'packages', pkg, 'tests')
  const found = []
  try {
    for (const file of walk(dir)) {
      const lines = specSource(file).split('\n')
      for (const [index, line] of lines.entries()) {
        const m = /\btest(?:\.describe)?\.(skip|fixme|fail)\s*\(/.exec(line)
        if (m) {
          const where = `${file.slice(ROOT.length)}:${index + 1}`
          const call = m[0].replace(/\s*\($/, '')
          found.push(`${pkg}: ${where} calls ${call} — a skipped journey is not a covered one`)
        }
      }
    }
  } catch {
    // Reported elsewhere as a package claiming nothing.
  }
  return found
}

const declared = declaredJourneys()
const smoke = declaredSmoke()
const problems = []

for (const pkg of PACKAGES) {
  const claimed = claimedBy(pkg)
  const missing = declared.filter((id) => !claimed.has(id))
  const unknown = [...claimed].filter((id) => !declared.includes(id))

  for (const id of missing) problems.push(`${pkg}: does not cover '${id}'`)
  problems.push(...skipsIn(pkg))
  for (const id of unknown) {
    problems.push(`${pkg}: claims '${id}', which is not a declared journey`)
  }

  const tagged = smokeTaggedBy(pkg)

  // A title-reading regex that stops matching would report every journey as
  // untagged, or as nothing at all. Say that rather than emitting a wall of
  // findings whose real cause is this file.
  if (tagged.size !== claimed.size) {
    problems.push(
      `${pkg}: read ${claimed.size} journey claims but only ${tagged.size} test titles — ` +
        'the title pattern in this script no longer matches how tests are written',
    )
    continue
  }

  for (const id of claimed) {
    if (smoke.has(id) && tagged.get(id) === false) {
      problems.push(`${pkg}: '${id}' is declared smoke but its title is not tagged @smoke`)
    }
    if (!smoke.has(id) && tagged.get(id) === true) {
      problems.push(`${pkg}: '${id}' is tagged @smoke but is not declared smoke`)
    }
  }
}

/**
 * Every on-demand scope must name a spec file that exists.
 *
 * `scope` selects a file here rather than a tag, because these journeys are
 * grouped by file. That makes the dropdown a hand-maintained copy of a
 * directory listing, and renaming a spec breaks a slice with no warning: the
 * run fails with Playwright's "No tests found", which reads as a broken suite
 * rather than a stale dropdown.
 *
 * Compared in both directions. A spec file no scope offers is the quieter
 * half — those tests can only ever be reached by running everything.
 *
 * The cost: a scope that is deliberately not a file would have to be excluded
 * here by hand, the way `all` and `smoke` are. There is no such scope today.
 */
const workflow = readFileSync(join(ROOT, '.github/workflows/on-demand.yml'), 'utf8')
const optionsMatch = /scope:[\s\S]*?options:\s*\n?\s*\[([^\]]+)\]/.exec(workflow)

if (!optionsMatch) {
  problems.push(
    'on-demand.yml: could not read the scope options — the check that every slice is ' +
      'runnable cannot run',
  )
} else {
  // `all` runs everything and `smoke` greps a tag; neither names a file.
  const offered = new Set(
    optionsMatch[1]
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s && s !== 'all' && s !== 'smoke'),
  )

  for (const pkg of PACKAGES) {
    const specs = new Set(
      [...walk(join(ROOT, 'packages', pkg, 'tests'))].map((f) =>
        f.split('/').pop().replace('.spec.ts', ''),
      ),
    )

    for (const scope of offered) {
      if (!specs.has(scope)) {
        problems.push(`${pkg}: scope '${scope}' names tests/${scope}.spec.ts, which does not exist`)
      }
    }
    for (const spec of specs) {
      if (!offered.has(spec)) {
        problems.push(`${pkg}: tests/${spec}.spec.ts is not offered as a scope by on-demand.yml`)
      }
    }
  }
}

if (problems.length > 0) {
  console.error(`\n✖ check:journeys — ${problems.length} problem(s)\n`)
  for (const p of problems) console.error(`  ${p}`)
  console.error('\nBoth packages cover the same journeys, or the comparison is not a comparison.')
  console.error('Declare a journey in packages/shared-journeys/src/journeys.ts, then tag it in')
  console.error('both packages with journey(<id>).\n')
  process.exit(1)
}

console.log(
  `✓ check:journeys — both packages cover all ${declared.length} journeys, ` +
    `agree on the ${smoke.size} smoke tags, skip none of them, and every scope names a spec that exists`,
)
