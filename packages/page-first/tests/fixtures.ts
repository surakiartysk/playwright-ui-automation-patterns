import { test as base } from '@playwright/test'
import type { JourneyId } from '@swag-lab/shared-journeys'
import { LoginPage, InventoryPage, CheckoutPage } from '../src/pages/index.js'

/**
 * Pages arrive constructed.
 *
 * The sibling package exports functions a test imports and calls with a page.
 * Here the pages are objects the test receives, so a test never constructs one
 * and never holds a `page` unless it genuinely needs the raw handle.
 */
type Pages = {
  login: LoginPage
  inventory: InventoryPage
  checkout: CheckoutPage
}

export const test = base.extend<Pages>({
  login: async ({ page }, use) => {
    await use(new LoginPage(page))
  },
  inventory: async ({ page }, use) => {
    await use(new InventoryPage(page))
  },
  checkout: async ({ page }, use) => {
    await use(new CheckoutPage(page))
  },
})

/** Names the journey a test covers — see check:journeys. */
export const journey = (id: JourneyId): string => id

export { expect } from '@playwright/test'
