import { test, expect, journey } from './fixtures.js'
import { users } from '@swag-lab/shared-journeys'

const BACKPACK = 'sauce-labs-backpack'
const BIKE_LIGHT = 'sauce-labs-bike-light'

test.describe('Checking out', () => {
  test.beforeEach(async ({ login, inventory, checkout }) => {
    await login.signIn(users.standard)
    await inventory.addToCart(BACKPACK)
    await inventory.openCart()
    await checkout.begin()
  })

  test(`${journey('checkout.completes')} @smoke — a filled checkout reaches the confirmation`, async ({
    checkout,
  }) => {
    await checkout.fillAddress({ firstName: 'Ada', lastName: 'Lovelace', postalCode: 'E1 6AN' })
    await checkout.finish()
    await checkout.expectComplete()
  })

  test(`${journey('checkout.requires-postal-code')} — checkout refuses to continue without a postal code, and says so`, async ({
    checkout,
  }) => {
    await checkout.fillAddress({ firstName: 'Ada', lastName: 'Lovelace' })

    // A form that refuses silently leaves the user pressing a dead button; one
    // that explains but continues has not validated anything.
    await checkout.expectRefusedAtAddress(/Postal Code is required/)
  })

  test(`${journey('checkout.totals-add-up')} — tax is charged on the item total, and the total is their sum`, async ({
    checkout,
  }) => {
    await checkout.fillAddress({ firstName: 'Ada', lastName: 'Lovelace', postalCode: 'E1 6AN' })
    const { itemTotal, tax, total } = await checkout.summaryTotals()

    /*
     * Arithmetic is where a quiet bug lives: every figure renders, the page
     * looks right, and the customer is charged the wrong amount.
     */
    expect(itemTotal).toBeGreaterThan(0)
    expect(total).toBeCloseTo(itemTotal + tax, 2)
    expect(tax).toBeCloseTo(Math.round(itemTotal * 8) / 100, 2)
  })

  test(`${journey('checkout.lists-what-was-ordered')} — the summary lists exactly what the cart held`, async ({
    checkout,
  }) => {
    await checkout.fillAddress({ firstName: 'Ada', lastName: 'Lovelace', postalCode: 'E1 6AN' })
    // A summary that drops a line is a customer charged for something they
    // will not receive.
    await checkout.expectOrderLists(['Sauce Labs Backpack'])
  })

  test(`${journey('checkout.cancel-keeps-the-cart')} — cancelling returns to the cart with its items intact`, async ({
    page,
    inventory,
    checkout,
  }) => {
    /*
     * A second item, added before cancelling.
     *
     * beforeEach puts exactly one thing in the cart, so "one item is still
     * here" after cancel proves nothing — it passes equally if cancel wiped
     * the cart and the one item is beforeEach's, on a page cancel never
     * touched. Two items mean the count can only be right if cancel preserved
     * what was there.
     */
    await page.goto('/inventory.html')
    await inventory.addToCart(BIKE_LIGHT)
    await inventory.openCart()
    await checkout.begin()

    await checkout.cancel()

    await checkout.expectBackInCartWith(2)
    await checkout.expectOrderLists(['Sauce Labs Backpack', 'Sauce Labs Bike Light'])
  })
})
