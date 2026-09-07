import { test, journey } from './fixtures.js'
import { users } from '@swag-lab/shared-journeys'

const BACKPACK = 'sauce-labs-backpack'
const BIKE_LIGHT = 'sauce-labs-bike-light'

test.describe('The cart', () => {
  test.beforeEach(async ({ login }) => {
    await login.signIn(users.standard)
  })

  test(`${journey('cart.add-updates-badge')} @smoke — the badge matches what the cart holds`, async ({
    inventory,
  }) => {
    await inventory.addToCart(BACKPACK)
    await inventory.expectCartCount(1)

    await inventory.addToCart(BIKE_LIGHT)
    await inventory.expectCartCount(2)

    // The badge is a summary; a summary that disagrees with the thing it
    // summarises is worse than no badge.
    await inventory.openCart()
    await inventory.expectCartHolds(2)
  })

  test(`${journey('cart.remove-updates-badge')} — removing the last item clears the badge rather than showing zero`, async ({
    inventory,
  }) => {
    await inventory.addToCart(BACKPACK)
    await inventory.expectCartCount(1)

    await inventory.removeFromCart(BACKPACK)
    await inventory.expectCartCount(0)

    await inventory.openCart()
    await inventory.expectCartHolds(0)
  })
})
