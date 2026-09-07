import { test, expect, journey } from './fixtures.js'
import { users } from '@swag-lab/shared-journeys'

/** "$29.99" as 29.99, for comparing prices numerically. */
const value = (p: string) => Number(p.replace('$', ''))

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

    const ascending = after.map(value)

    expect(ascending).toEqual(ascending.toSorted((a, b) => a - b))
    // A sort that drops an item passes the check above while being broken.
    expect(after.toSorted()).toEqual(before.toSorted())
  })

  test(`${journey('catalogue.sorts-by-name')} — sorting Z-to-A reverses the A-to-Z order exactly`, async ({
    inventory,
  }) => {
    await inventory.sortByNameAscending()
    const ascending = await inventory.names()

    await inventory.sortByNameDescending()
    const descending = await inventory.names()

    // Exactly reversed, not merely a different order.
    expect(descending).toEqual(ascending.toReversed())
  })

  test(`${journey('catalogue.opens-product-detail')} — a product name opens its detail page`, async ({
    inventory,
  }) => {
    const product = await inventory.openFirstProduct()
    // The same product, not just *a* product — the classic list-to-detail
    // off-by-one.
    await inventory.expectShowingProduct(product)
  })
})
