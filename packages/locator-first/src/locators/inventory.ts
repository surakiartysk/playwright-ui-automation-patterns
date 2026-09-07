import type { Page, Locator } from '@playwright/test'

/** The product list, and the cart badge that reflects it. */
export const inventoryLocators = {
  container: (page: Page): Locator => page.getByTestId('inventory-list'),
  items: (page: Page): Locator => page.getByTestId('inventory-item'),
  names: (page: Page): Locator => page.getByTestId('inventory-item-name'),
  prices: (page: Page): Locator => page.getByTestId('inventory-item-price'),
  images: (page: Page): Locator => page.locator('.inventory_item_img img'),
  sort: (page: Page): Locator => page.getByTestId('product-sort-container'),

  cartLink: (page: Page): Locator => page.getByTestId('shopping-cart-link'),
  /** Absent entirely when the cart is empty — not zero. */
  cartBadge: (page: Page): Locator => page.getByTestId('shopping-cart-badge'),

  /**
   * Add and remove buttons carry the product in the attribute itself, so the
   * product name is the parameter rather than an index into the list.
   */
  addToCart: (page: Page, product: string): Locator => page.getByTestId(`add-to-cart-${product}`),
  removeFromCart: (page: Page, product: string): Locator => page.getByTestId(`remove-${product}`),
}
