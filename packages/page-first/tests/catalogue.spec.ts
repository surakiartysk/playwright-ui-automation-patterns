import { test, expect, journey } from './fixtures.js'
import { users } from '@swag-lab/shared-journeys'

/** "$29.99" as 29.99, for comparing prices numerically. */
const value = (p: string) => Number(p.replace('$', ''))

test.describe('The product list', () => {
  test.beforeEach(async ({ login, inventory }) => {
    await login.signIn(users.standard)
    // `signIn` returns once it has clicked submit, not once the list is there,
    // and the sort tests snapshot the list without retrying. With sign-in made
    // to take 400ms, both read an empty list and failed.
    await inventory.expectLoaded()
  })

  test(`${journey('catalogue.lists-products')} @smoke — every product shows a name, a price and an image`, async ({
    inventory,
  }) => {
    // Counted, not spot-checked: "the first product has a price" passes on a
    // page where the other five lost theirs.
    await inventory.expectProductCount(6)
    await inventory.expectEveryPriceFormatted()
    await inventory.expectEveryNameAndImagePresent()
  })

  test(`${journey('catalogue.sorts-by-price')} — sorting by price, either way, reorders the list and loses nothing`, async ({
    inventory,
  }) => {
    const before = await inventory.prices()
    await inventory.sortByPriceAscending()
    const after = await inventory.prices()

    const ascending = after.map(value)

    expect(ascending).toEqual(ascending.toSorted((a, b) => a - b))
    // A sort that drops an item passes the check above while being broken.
    expect(after.toSorted()).toEqual(before.toSorted())

    // The other direction, which the first version of this journey left out. Exactly the
    // reverse of the ascending prices: equal prices are the same text, so a reversed list
    // of them is a descending one, and a sort that shuffled or dropped an item is neither.
    await inventory.sortByPriceDescending()
    const descending = await inventory.prices()

    expect(descending).toEqual(after.toReversed())
    expect(descending.toSorted()).toEqual(before.toSorted())
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

/*
 * The only journey run at a phone's width. saucedemo lays the list out for the
 * screen — two columns at 1280px, one from 1024px down, the sort control folded
 * to an icon below 800px, each add button stretched to its card on a phone —
 * and none of that was exercised: every other journey runs at Desktop Chrome's
 * 1280×720. 390×844 is a common phone; the claim is about what a person there
 * can still reach, not about the exact layout, so nothing here pins a pixel.
 */
test.describe('The product list on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test.beforeEach(async ({ login, inventory }) => {
    await login.signIn(users.standard)
    await inventory.expectLoaded()
  })

  test(`${journey('catalogue.fits-a-phone')} — the products stack in one column, nothing scrolls sideways, and the menu, the cart and every add button stay in reach`, async ({
    inventory,
  }) => {
    await inventory.expectOneColumn()
    await inventory.expectNothingScrollsSideways()
    await inventory.expectMenuAndCartInReach()
    await inventory.expectEveryAddButtonWithinWidth()

    // The farthest product, scrolled to and tapped, reaches the cart.
    await inventory.addLastProductToCart()
    await inventory.expectCartCount(1)
  })
})
