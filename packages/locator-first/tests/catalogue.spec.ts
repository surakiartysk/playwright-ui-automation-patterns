import { test, expect, journey } from './fixtures.js'
import { users } from '@swag-lab/shared-journeys'
import { inventoryLocators } from '../src/locators/inventory.js'
import { signIn } from '../src/pages/index.js'

/** "$29.99" as 29.99, for comparing prices numerically. */
const value = (p: string) => Number(p.replace('$', ''))

test.describe('The product list', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, users.standard)

    /*
     * `signIn` returns once it has clicked submit, not once the list is there.
     * The sort tests below take a snapshot of the list with `allTextContents`,
     * which does not retry — with sign-in made to take 400ms, both read an empty
     * list and failed. Every other test reaches its first `expect` before it
     * reads anything, so this is the one place the wait has to be written.
     */
    await expect(page).toHaveURL(/inventory\.html/)
    await expect(inventoryLocators.title(page)).toHaveText('Products')
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

    // The same goes for the name and the image: a count says an element exists,
    // not that it says or shows anything.
    for (const name of await inventoryLocators.names(page).all()) {
      await expect(name).toHaveText(/\S/)
    }
    for (const image of await inventoryLocators.images(page).all()) {
      await expect(image).toHaveAttribute('src', /\S/)
    }
  })

  test(`${journey('catalogue.sorts-by-price')} — sorting by price reorders the list and loses nothing`, async ({
    page,
  }) => {
    const priceText = () => inventoryLocators.prices(page).allTextContents()
    const before = await priceText()

    /*
     * `selectOption` returns once the control has changed, which is before the
     * list it reorders has re-rendered — so a bare `allTextContents()` here
     * reads the *unsorted* order and the test fails claiming the sort is
     * broken. `toHaveText` polls until the DOM settles; `allTextContents`
     * takes one snapshot and cannot.
     *
     * Asserted as "already in ascending order" rather than "different from
     * before", because the two are not the same: a list that happens to be
     * sorted already would never change, and waiting for a change would hang.
     */
    await inventoryLocators.sort(page).selectOption('lohi')
    await expect(inventoryLocators.prices(page)).toHaveText(
      [...before].sort((a, b) => value(a) - value(b)),
    )

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
    // Waited on for the same reason as the price sort above: `selectOption`
    // returns before the list it reorders has re-rendered.
    const original = await inventoryLocators.names(page).allTextContents()

    await inventoryLocators.sort(page).selectOption('az')
    await expect(inventoryLocators.names(page)).toHaveText([...original].sort())
    const ascending = await inventoryLocators.names(page).allTextContents()

    await inventoryLocators.sort(page).selectOption('za')
    await expect(inventoryLocators.names(page)).toHaveText([...ascending].toReversed())
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

    /*
     * Wait for the list to be *gone* before reading the detail page.
     *
     * The URL changes before the DOM does — this is a client-side route, so
     * for a moment `page.url()` is the detail page while the six list items
     * are still mounted. `toHaveURL` is satisfied by the URL alone and returns
     * inside that window, and the assertion below then resolves to six
     * elements and fails on strict mode rather than retrying.
     *
     * `waitForURL` does not help, for the same reason: it waits on the URL,
     * which was never the slow part. The count is what actually distinguishes
     * the two pages, so it is what gets waited on.
     */
    await expect(inventoryLocators.names(page)).toHaveCount(1)

    // The detail page must show the same product, not just *a* product — the
    // classic off-by-one in a list-to-detail link.
    await expect(inventoryLocators.names(page)).toHaveText(firstName ?? '')
    await expect(inventoryLocators.prices(page)).toHaveText(firstPrice ?? '')
  })
})
