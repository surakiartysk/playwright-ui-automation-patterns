import type { Page, Locator } from '@playwright/test'

/** The cart page and the three checkout steps behind it. */
export const checkoutLocators = {
  checkout: (page: Page): Locator => page.getByTestId('checkout'),

  firstName: (page: Page): Locator => page.getByTestId('firstName'),
  lastName: (page: Page): Locator => page.getByTestId('lastName'),
  postalCode: (page: Page): Locator => page.getByTestId('postalCode'),
  continue: (page: Page): Locator => page.getByTestId('continue'),
  finish: (page: Page): Locator => page.getByTestId('finish'),

  error: (page: Page): Locator => page.getByTestId('error'),
  completeHeader: (page: Page): Locator => page.getByTestId('complete-header'),
}
