import { test, expect, journey } from './fixtures.js'
import { users } from '@swag-lab/shared-journeys'
import { inventoryLocators } from '../src/locators/inventory.js'
import { signIn } from '../src/pages/index.js'

/** "$29.99" as 29.99, for comparing prices numerically. */
const value = (p: string) => Number(p.replace('$', ''))

test.describe('The product list', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, users.standard)
  })

  test(`${journey('catalogue.lists-products')} @smoke — every product shows a name, a price and an image`, async ({
    page,
  }) => {
    const items = inventoryLocators.items(page)
    await expect(items).toHaveCount(6)

    /*
     * Counted rather than spot-checked. "The first product has a price" passes
     * on a page where the other five lost theirs, which is exactly the kind of
     * partial breakage a catalogue suffers.
     */
    await expect(inventoryLocators.names(page)).toHaveCount(6)
    await expect(inventoryLocators.prices(page)).toHaveCount(6)
    await expect(inventoryLocators.images(page)).toHaveCount(6)

    // A price that renders empty is still an element, so assert on the text.
    for (const price of await inventoryLocators.prices(page).all()) {
      await expect(price).toHaveText(/^\$\d+\.\d{2}$/)
    }
  })

  test(`${journey('catalogue.sorts-by-price')} — sorting by price reorders the list and loses nothing`, async ({
    page,
  }) => {
    const priceText = () => inventoryLocators.prices(page).allTextContents()
    const before = await priceText()

    await inventoryLocators.sort(page).selectOption('lohi')
    const after = await priceText()

    const ascending = [...after].map(value)

    // Sorted...
    expect(ascending).toEqual(ascending.toSorted((a, b) => a - b))
    // ...and still the same products. A sort that drops an item passes the
    // check above while being badly broken.
    expect(after.toSorted()).toEqual(before.toSorted())
  })

  test(`${journey('catalogue.sorts-by-name')} — sorting Z-to-A reverses the A-to-Z order exactly`, async ({
    page,
  }) => {
    await inventoryLocators.sort(page).selectOption('az')
    const ascending = await inventoryLocators.names(page).allTextContents()

    await inventoryLocators.sort(page).selectOption('za')
    const descending = await inventoryLocators.names(page).allTextContents()

    // Exactly reversed, not merely "different order". A sort that shuffles
    // passes a weaker check while being wrong.
    expect(descending).toEqual(ascending.toReversed())
  })

  test(`${journey('catalogue.opens-product-detail')} — a product name opens its detail page`, async ({
    page,
  }) => {
    const firstName = await inventoryLocators.names(page).first().textContent()
    const firstPrice = await inventoryLocators.prices(page).first().textContent()

    await inventoryLocators.names(page).first().click()

    await expect(page).toHaveURL(/inventory-item\.html/)
    // The detail page must show the same product, not just *a* product — the
    // classic off-by-one in a list-to-detail link.
    await expect(page.getByTestId('inventory-item-name')).toHaveText(firstName ?? '')
    await expect(page.getByTestId('inventory-item-price')).toHaveText(firstPrice ?? '')
  })
})
