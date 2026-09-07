import { expect, type Page } from '@playwright/test'
import { PASSWORD, type User } from '@swag-lab/shared-journeys'
import { loginLocators } from '../locators/login.js'
import { inventoryLocators } from '../locators/inventory.js'
import { checkoutLocators } from '../locators/checkout.js'

/**
 * Behaviour, composed from locators it does not own.
 *
 * These are thin on purpose. A page here knows the *order* of things — fill,
 * then submit — and nothing about where any control is. That is the trade the
 * style makes: a selector change never reaches this file, but a test can still
 * reach a locator directly when it needs to, because the locators are exported.
 */

export async function signIn(page: Page, user: User): Promise<void> {
  await page.goto('/')
  await loginLocators.username(page).fill(user.name)
  await loginLocators.password(page).fill(PASSWORD)
  await loginLocators.submit(page).click()
}

export async function addToCart(page: Page, product: string): Promise<void> {
  await inventoryLocators.addToCart(page, product).click()
}

export async function removeFromCart(page: Page, product: string): Promise<void> {
  await inventoryLocators.removeFromCart(page, product).click()
}

export async function openCart(page: Page): Promise<void> {
  await inventoryLocators.cartLink(page).click()
}

/**
 * Opens the burger menu, and does not return until it is actually open.
 *
 * On a loaded CI runner the first click sometimes does nothing at all — it
 * lands before React has bound its handler, so the state never changes and the
 * panel never opens. Measured over six CI runs: two failed this way, a 33%
 * rate. The signature is unmistakable — `element is not visible` repeated for
 * the full 30s timeout, then a retry passing in under two seconds. Not a slow
 * menu; a menu that never opened.
 *
 * `toPass` rather than a longer timeout or a sleep: waiting longer cannot help
 * a click that was swallowed, and a sleep would slow every run to pay for a
 * case that happens one time in three. The happy path still costs one click
 * and the ~50ms the panel takes to report itself open, measured locally over
 * ten runs.
 *
 * It lives here rather than in `inventoryLocators` because a locator in this
 * package is a locator — resolving one must not click anything. This is
 * behaviour composed from locators, which is what this file is for.
 */
export async function openMenu(page: Page): Promise<void> {
  await expect(async () => {
    await inventoryLocators.menu(page).click()
    await expect(inventoryLocators.menuPanel(page)).toHaveAttribute('aria-hidden', 'false', {
      timeout: 1_000,
    })
  }).toPass({ timeout: 10_000 })
}

/** Fills the address step. `postalCode` is optional so a test can omit it. */
export async function fillAddress(
  page: Page,
  details: { firstName: string; lastName: string; postalCode?: string },
): Promise<void> {
  await checkoutLocators.firstName(page).fill(details.firstName)
  await checkoutLocators.lastName(page).fill(details.lastName)
  if (details.postalCode !== undefined) {
    await checkoutLocators.postalCode(page).fill(details.postalCode)
  }
  await checkoutLocators.continue(page).click()
}
