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

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules') continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) yield* walk(full)
    else if (full.endsWith('.spec.ts')) yield full
  }
}

/** Ids a package claims, via `journey('id')` in its specs. */
function claimedBy(pkg) {
  const dir = join(ROOT, 'packages', pkg, 'tests')
  const claimed = new Set()
  try {
    for (const file of walk(dir)) {
      const src = readFileSync(file, 'utf8')
      for (const m of src.matchAll(/journey\(\s*'([^']+)'/g)) claimed.add(m[1])
    }
  } catch {
    // A package with no tests yet claims nothing, which the report below says.
  }
  return claimed
}

const declared = declaredJourneys()
const problems = []

for (const pkg of PACKAGES) {
  const claimed = claimedBy(pkg)
  const missing = declared.filter((id) => !claimed.has(id))
  const unknown = [...claimed].filter((id) => !declared.includes(id))

  for (const id of missing) problems.push(`${pkg}: does not cover '${id}'`)
  for (const id of unknown) {
    problems.push(`${pkg}: claims '${id}', which is not a declared journey`)
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

console.log(`✓ check:journeys — both packages cover all ${declared.length} journeys`)
