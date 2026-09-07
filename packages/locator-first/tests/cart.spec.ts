import { test, expect, journey } from './fixtures.js'
import { users } from '@swag-lab/shared-journeys'
import { inventoryLocators } from '../src/locators/inventory.js'
import { signIn, addToCart, removeFromCart, openCart } from '../src/pages/index.js'

const BACKPACK = 'sauce-labs-backpack'
const BIKE_LIGHT = 'sauce-labs-bike-light'

test.describe('The cart', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, users.standard)
  })

  test(`${journey('cart.add-updates-badge')} @smoke — the badge matches what the cart holds`, async ({
    page,
  }) => {
    await addToCart(page, BACKPACK)
    await expect(inventoryLocators.cartBadge(page)).toHaveText('1')

    await addToCart(page, BIKE_LIGHT)
    await expect(inventoryLocators.cartBadge(page)).toHaveText('2')

    /*
     * The badge is a summary, and a summary that disagrees with the thing it
     * summarises is worse than no badge. So this opens the cart and counts —
     * asserting on the badge alone would pass with an empty cart behind it.
     */
    await openCart(page)
    await expect(inventoryLocators.items(page)).toHaveCount(2)
  })

  test(`${journey('cart.remove-updates-badge')} — removing the last item clears the badge rather than showing zero`, async ({
    page,
  }) => {
    await addToCart(page, BACKPACK)
    await expect(inventoryLocators.cartBadge(page)).toHaveText('1')

    await removeFromCart(page, BACKPACK)

    /*
     * Hidden, not "0". The application removes the element entirely, and that
     * is the right behaviour — a zero badge is a notification that there is
     * nothing to notify about. Asserting `toHaveText('0')` here would fail
     * against correct code.
     */
    await expect(inventoryLocators.cartBadge(page)).toHaveCount(0)

    await openCart(page)
    await expect(inventoryLocators.items(page)).toHaveCount(0)
  })
})
