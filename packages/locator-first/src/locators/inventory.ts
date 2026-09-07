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

  /** Every add/remove button — used to prove a reset actually reset. */
  allAddButtons: (page: Page): Locator => page.locator('[data-test^="add-to-cart"]'),
  allRemoveButtons: (page: Page): Locator => page.locator('[data-test^="remove"]'),

  /** The burger menu, and the two entries that change state. */
  /*
   * The button, not the `data-test` element. `open-menu` is on the <img>
   * inside the button, and the button intercepts the click — Playwright waits
   * for a stable element, finds one, and then cannot reach it.
   *
   * Worth keeping as written: it is the one place in this suite where the
   * published contract points at the wrong node, and reaching past it is a
   * deliberate exception rather than an oversight.
   */
  menu: (page: Page): Locator => page.locator('#react-burger-menu-btn'),
  logout: (page: Page): Locator => page.getByTestId('logout-sidebar-link'),
  resetState: (page: Page): Locator => page.getByTestId('reset-sidebar-link'),
}
