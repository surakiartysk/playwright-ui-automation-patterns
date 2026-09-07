import { test, expect, journey } from './fixtures.js'
import { users } from '@swag-lab/shared-journeys'
import { inventoryLocators } from '../src/locators/inventory.js'
import { signIn } from '../src/pages/index.js'

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

    const value = (p: string) => Number(p.replace('$', ''))
    const ascending = [...after].map(value)

    // Sorted...
    expect(ascending).toEqual([...ascending].sort((a, b) => a - b))
    // ...and still the same products. A sort that drops an item passes the
    // check above while being badly broken.
    expect([...after].sort()).toEqual([...before].sort())
  })
})
