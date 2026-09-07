import { test as base } from '@playwright/test'
import type { JourneyId } from '@swag-lab/shared-journeys'

/**
 * Names the journey a test covers.
 *
 * `check:journeys` reads these to prove both packages cover the same
 * behaviours — the comparison is worthless if one side is quietly better
 * tested. The id is typed, so a typo is a compile error rather than a journey
 * silently going uncovered.
 */
export const journey = (id: JourneyId): string => id

export const test = base
export { expect } from '@playwright/test'
