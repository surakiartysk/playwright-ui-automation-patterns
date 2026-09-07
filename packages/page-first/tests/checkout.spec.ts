import { test, journey } from './fixtures.js'
import { users } from '@swag-lab/shared-journeys'

const BACKPACK = 'sauce-labs-backpack'

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
})
