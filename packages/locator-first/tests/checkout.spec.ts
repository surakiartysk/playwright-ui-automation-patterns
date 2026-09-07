import { test, expect, journey } from './fixtures.js'
import { users } from '@swag-lab/shared-journeys'
import { checkoutLocators } from '../src/locators/checkout.js'
import { signIn, addToCart, openCart, fillAddress } from '../src/pages/index.js'

const BACKPACK = 'sauce-labs-backpack'

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
})
