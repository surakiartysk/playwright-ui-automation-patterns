import type { Page, Locator } from '@playwright/test'

/** The cart page and the three checkout steps behind it. */
export const checkoutLocators = {
  checkout: (page: Page): Locator => page.getByTestId('checkout'),

  firstName: (page: Page): Locator => page.getByTestId('firstName'),
  lastName: (page: Page): Locator => page.getByTestId('lastName'),
  postalCode: (page: Page): Locator => page.getByTestId('postalCode'),
  continue: (page: Page): Locator => page.getByTestId('continue'),
  finish: (page: Page): Locator => page.getByTestId('finish'),

  cancel: (page: Page): Locator => page.getByTestId('cancel'),
  continueShopping: (page: Page): Locator => page.getByTestId('continue-shopping'),

  /** The order summary's three money lines, as rendered. */
  itemTotal: (page: Page): Locator => page.getByTestId('subtotal-label'),
  tax: (page: Page): Locator => page.getByTestId('tax-label'),
  total: (page: Page): Locator => page.getByTestId('total-label'),

  error: (page: Page): Locator => page.getByTestId('error'),
  completeHeader: (page: Page): Locator => page.getByTestId('complete-header'),
}
