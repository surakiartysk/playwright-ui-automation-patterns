import type { Locator } from '@playwright/test'
import { test, expect, journey } from './fixtures.js'
import { users } from '@swag-lab/shared-journeys'
import { checkoutLocators } from '../src/locators/checkout.js'
import { signIn, addToCart, openCart, fillAddress } from '../src/pages/index.js'

const BACKPACK = 'sauce-labs-backpack'
const BIKE_LIGHT = 'sauce-labs-bike-light'

/** A rendered money figure as a number: "$29.99" becomes 29.99. */
const money = async (locator: Locator) =>
  Number(((await locator.textContent()) ?? '').replace(/[^0-9.]/g, ''))

test.describe('Checking out', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, users.standard)
    await addToCart(page, BACKPACK)
    await openCart(page)
    await checkoutLocators.checkout(page).click()
  })

  test(`${journey('checkout.completes')} @smoke — a filled checkout reaches the confirmation`, async ({
    page,
  }) => {
    await fillAddress(page, { firstName: 'Ada', lastName: 'Lovelace', postalCode: 'E1 6AN' })
    await checkoutLocators.finish(page).click()

    await expect(page).toHaveURL(/checkout-complete\.html/)
    await expect(checkoutLocators.completeHeader(page)).toHaveText('Thank you for your order!')
  })

  test(`${journey('checkout.requires-postal-code')} — checkout refuses to continue without a postal code, and says so`, async ({
    page,
  }) => {
    await fillAddress(page, { firstName: 'Ada', lastName: 'Lovelace' })

    /*
     * Both halves matter. A form that refuses silently leaves the user pressing
     * a dead button; one that explains but continues anyway has not validated
     * anything. So this asserts the message *and* that the step did not move.
     */
    await expect(checkoutLocators.error(page)).toContainText('Postal Code is required')
    await expect(page).toHaveURL(/checkout-step-one\.html/)
  })

  test(`${journey('checkout.totals-add-up')} — tax is charged on the item total, and the total is their sum`, async ({
    page,
  }) => {
    await fillAddress(page, { firstName: 'Ada', lastName: 'Lovelace', postalCode: 'E1 6AN' })

    const itemTotal = await money(checkoutLocators.itemTotal(page))
    const tax = await money(checkoutLocators.tax(page))
    const total = await money(checkoutLocators.total(page))

    /*
     * Arithmetic is where a quiet bug lives: every figure renders, the page
     * looks right, and the customer is charged the wrong amount. Asserting
     * that the three numbers are *consistent with each other* catches that
     * without hard-coding prices this suite does not own.
     */
    expect(itemTotal).toBeGreaterThan(0)
    expect(total).toBeCloseTo(itemTotal + tax, 2)
    // 8%, as the application charges. Rounded to the cent before comparing.
    expect(tax).toBeCloseTo(Math.round(itemTotal * 8) / 100, 2)
  })

  test(`${journey('checkout.lists-what-was-ordered')} — the summary lists exactly what the cart held`, async ({
    page,
  }) => {
    await fillAddress(page, { firstName: 'Ada', lastName: 'Lovelace', postalCode: 'E1 6AN' })

    // One item went in; one item must be listed. A summary that quietly drops
    // a line is a customer charged for something they will not receive.
    await expect(page.getByTestId('inventory-item')).toHaveCount(1)
    await expect(page.getByTestId('inventory-item-name')).toHaveText('Sauce Labs Backpack')
  })

  test(`${journey('checkout.cancel-keeps-the-cart')} — cancelling returns to the cart with its items intact`, async ({
    page,
  }) => {
    /*
     * A second item, added before cancelling.
     *
     * beforeEach puts exactly one thing in the cart, so asserting "one item is
     * still here" after cancel proves nothing: the same assertion passes if
     * cancel wipes the cart and the count of one is the item beforeEach added
     * on a page cancel never touched. Two items — one from beforeEach, one
     * added here — mean the count can only be right if cancel preserved what
     * was there.
     */
    await page.goto('/inventory.html')
    await addToCart(page, BIKE_LIGHT)
    await openCart(page)
    await checkoutLocators.checkout(page).click()

    await checkoutLocators.cancel(page).click()

    await expect(page).toHaveURL(/cart\.html/)
    await expect(page.getByTestId('inventory-item')).toHaveCount(2)
    // And the right two, not merely two of something.
    await expect(page.getByTestId('inventory-item-name')).toContainText([
      'Sauce Labs Backpack',
      'Sauce Labs Bike Light',
    ])
  })
})
