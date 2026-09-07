import { test, expect, journey } from './fixtures.js'
import { users } from '@swag-lab/shared-journeys'

test.describe('The product list', () => {
  test.beforeEach(async ({ login }) => {
    await login.signIn(users.standard)
  })

  test(`${journey('catalogue.lists-products')} @smoke — every product shows a name, a price and an image`, async ({
    inventory,
  }) => {
    // Counted, not spot-checked: "the first product has a price" passes on a
    // page where the other five lost theirs.
    await inventory.expectProductCount(6)
    await inventory.expectEveryPriceFormatted()
  })

  test(`${journey('catalogue.sorts-by-price')} — sorting by price reorders the list and loses nothing`, async ({
    inventory,
  }) => {
    const before = await inventory.prices()
    await inventory.sortByPriceAscending()
    const after = await inventory.prices()

    const value = (p: string) => Number(p.replace('$', ''))
    const ascending = after.map(value)

    expect(ascending).toEqual([...ascending].sort((a, b) => a - b))
    // A sort that drops an item passes the check above while being broken.
    expect([...after].sort()).toEqual([...before].sort())
  })
})
