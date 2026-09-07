import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

/** The product list, and the cart badge that summarises it. */
export class InventoryPage {
  constructor(private readonly page: Page) {}

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

  async sortByPriceAscending(): Promise<void> {
    await this.page.getByTestId('product-sort-container').selectOption('lohi')
  }

  /** Prices as they are shown, in the order they are shown. */
  async prices(): Promise<string[]> {
    return this.page.getByTestId('inventory-item-price').allTextContents()
  }

  /** Image sources, for the tests that care what is actually rendered. */
  async imageSources(): Promise<(string | null)[]> {
    return this.page
      .locator('.inventory_item_img img')
      .evaluateAll((images) => images.map((image) => image.getAttribute('src')))
  }

  async expectProductCount(count: number): Promise<void> {
    await expect(this.page.getByTestId('inventory-item')).toHaveCount(count)
    await expect(this.page.getByTestId('inventory-item-name')).toHaveCount(count)
    await expect(this.page.getByTestId('inventory-item-price')).toHaveCount(count)
    await expect(this.page.locator('.inventory_item_img img')).toHaveCount(count)
  }

  async expectEveryPriceFormatted(): Promise<void> {
    for (const price of await this.page.getByTestId('inventory-item-price').all()) {
      await expect(price).toHaveText(/^\$\d+\.\d{2}$/)
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

  async expectCartHolds(count: number): Promise<void> {
    await expect(this.page.getByTestId('inventory-item')).toHaveCount(count)
  }
}
