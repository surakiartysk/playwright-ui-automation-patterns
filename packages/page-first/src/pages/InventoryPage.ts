import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

/** The product list, and the cart badge that summarises it. */
export class InventoryPage {
  constructor(private readonly page: Page) {}

  /** Bound to layout classes rather than a `data-test` — `check:claims` lists why that is allowed. */
  private get images() {
    return this.page.locator('.inventory_item_img img')
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/inventory\.html/)
    await expect(this.page.getByTestId('title')).toHaveText('Products')
  }

  async addToCart(product: string): Promise<void> {
    await this.page.getByTestId(`add-to-cart-${product}`).click()
  }

  async removeFromCart(product: string): Promise<void> {
    await this.page.getByTestId(`remove-${product}`).click()
  }

  async openCart(): Promise<void> {
    await this.page.getByTestId('shopping-cart-link').click()
  }

  /*
   * Sorts, and does not return until the list has actually reordered.
   *
   * `selectOption` returns once the control has changed, which is before the
   * list it reorders has re-rendered — so a caller reading `prices()` straight
   * afterwards gets the *unsorted* order and concludes the sort is broken.
   * `toHaveText` polls until the DOM settles; `allTextContents` takes one
   * snapshot and cannot.
   *
   * Waiting here rather than in the test is what this style is for: the test
   * cannot reach the locator, so the page has to be the thing that knows when
   * it is ready. `locator-first` pays the same cost in the test instead.
   */
  async sortByPriceAscending(): Promise<void> {
    const before = await this.prices()
    await this.page.getByTestId('product-sort-container').selectOption('lohi')
    await expect(this.page.getByTestId('inventory-item-price')).toHaveText(
      [...before].sort((a, b) => Number(a.replace('$', '')) - Number(b.replace('$', ''))),
    )
  }

  /** Prices as they are shown, in the order they are shown. */
  async prices(): Promise<string[]> {
    return this.page.getByTestId('inventory-item-price').allTextContents()
  }

  /** Image sources, for the tests that care what is actually rendered. */
  async imageSources(): Promise<(string | null)[]> {
    return this.images.evaluateAll((images) => images.map((image) => image.getAttribute('src')))
  }

  async expectProductCount(count: number): Promise<void> {
    await expect(this.page.getByTestId('inventory-item')).toHaveCount(count)
    await expect(this.page.getByTestId('inventory-item-name')).toHaveCount(count)
    await expect(this.page.getByTestId('inventory-item-price')).toHaveCount(count)
    await expect(this.images).toHaveCount(count)
  }

  async expectEveryPriceFormatted(): Promise<void> {
    for (const price of await this.page.getByTestId('inventory-item-price').all()) {
      await expect(price).toHaveText(/^\$\d+\.\d{2}$/)
    }
  }

  /** A count says an element exists, not that it says or shows anything. */
  async expectEveryNameAndImagePresent(): Promise<void> {
    for (const name of await this.page.getByTestId('inventory-item-name').all()) {
      await expect(name).toHaveText(/\S/)
    }
    for (const image of await this.images.all()) {
      await expect(image).toHaveAttribute('src', /\S/)
    }
  }

  async expectCartCount(count: number): Promise<void> {
    const badge = this.page.getByTestId('shopping-cart-badge')
    if (count === 0) {
      // The element is removed entirely when the cart empties, which is right:
      // a zero badge notifies about nothing.
      await expect(badge).toHaveCount(0)
      return
    }
    await expect(badge).toHaveText(String(count))
  }

  /** Sorts A-to-Z, and waits for the list to be in that order. */
  async sortByNameAscending(): Promise<void> {
    const before = await this.names()
    await this.page.getByTestId('product-sort-container').selectOption('az')
    await expect(this.page.getByTestId('inventory-item-name')).toHaveText([...before].sort())
  }

  /** Sorts Z-to-A, and waits for the list to be in that order. */
  async sortByNameDescending(): Promise<void> {
    const before = await this.names()
    await this.page.getByTestId('product-sort-container').selectOption('za')
    await expect(this.page.getByTestId('inventory-item-name')).toHaveText(
      [...before].sort().reverse(),
    )
  }

  async names(): Promise<string[]> {
    return this.page.getByTestId('inventory-item-name').allTextContents()
  }

  async openFirstProduct(): Promise<{ name: string; price: string }> {
    const name = (await this.page.getByTestId('inventory-item-name').first().textContent()) ?? ''
    const price = (await this.page.getByTestId('inventory-item-price').first().textContent()) ?? ''
    await this.page.getByTestId('inventory-item-name').first().click()
    return { name, price }
  }

  /*
   * Waits for the list to be gone before reading the detail page.
   *
   * The URL changes before the DOM does — this is a client-side route, so for
   * a moment the URL is the detail page while the six list items are still
   * mounted. `toHaveURL` is satisfied by the URL alone and returns inside that
   * window; the name assertion then resolves to six elements and fails on
   * strict mode rather than retrying. `waitForURL` does not help, because the
   * URL was never the slow part.
   *
   * The count is what actually distinguishes the two pages, so it is what gets
   * waited on. It does not weaken the assertion below: clicking the second
   * product and asserting the first still fails, on the name.
   */
  async expectShowingProduct(product: { name: string; price: string }): Promise<void> {
    await expect(this.page).toHaveURL(/inventory-item\.html/)
    await expect(this.page.getByTestId('inventory-item-name')).toHaveCount(1)
    await expect(this.page.getByTestId('inventory-item-name')).toHaveText(product.name)
    await expect(this.page.getByTestId('inventory-item-price')).toHaveText(product.price)
  }

  /*
   * The button, not the `data-test` element: `open-menu` sits on the <img>
   * inside the button, and the button intercepts the click.
   *
   * Clicked until the menu is actually open, because on a loaded CI runner the
   * first click sometimes does nothing at all — landing before React has bound
   * its handler, so the state never changes and the panel never opens.
   *
   * Measured over six CI runs: two failed this way, a 33% rate. The signature
   * is unmistakable — `element is not visible` repeated for the full 30s
   * timeout, then a retry passing in under two seconds. Not a slow menu; a
   * menu that never opened.
   *
   * `toPass` rather than a longer timeout or a sleep: waiting longer cannot
   * help a click that was swallowed, and a sleep would slow every run to pay
   * for a case that happens one time in three. The happy path still costs one
   * click and the ~50ms the panel takes to report itself open, measured
   * locally over ten runs.
   *
   * `aria-hidden` is the application's own statement that the menu is open. It
   * flips well before the slide finishes, which is the point: this waits for
   * the click to have *registered*, and Playwright's own actionability check
   * handles the rest before it clicks an entry.
   */
  async openMenu(): Promise<void> {
    const panel = this.page.locator('.bm-menu-wrap')
    await expect(async () => {
      await this.page.locator('#react-burger-menu-btn').click()
      await expect(panel).toHaveAttribute('aria-hidden', 'false', { timeout: 1_000 })
    }).toPass({ timeout: 10_000 })
  }

  async signOut(): Promise<void> {
    await this.openMenu()
    await this.page.getByTestId('logout-sidebar-link').click()
  }

  async resetAppState(): Promise<void> {
    await this.openMenu()
    await this.page.getByTestId('reset-sidebar-link').click()
  }

  /** How many buttons still read Remove — see the reset defect. */
  async staleRemoveButtonCount(): Promise<number> {
    return this.page.locator('[data-test^="remove"]').count()
  }

  async expectProductInCart(product: string): Promise<void> {
    await expect(this.page.getByTestId(`remove-${product}`)).toBeVisible()
  }

  async expectCartHolds(count: number): Promise<void> {
    await expect(this.page.getByTestId('inventory-item')).toHaveCount(count)
  }
}
