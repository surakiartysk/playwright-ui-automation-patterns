import type { Page } from '@playwright/test'
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
