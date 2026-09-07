import type { Page, Locator } from '@playwright/test'

/**
 * Where the sign-in page's controls are.
 *
 * This module is the whole point of the style: selectors are data, and they
 * live apart from the behaviour that uses them. Moving a field or renaming an
 * attribute is a change here and nowhere else — no page object opens, no test
 * changes.
 *
 * Every entry is a `data-test` attribute the application publishes. Binding to
 * those rather than to CSS structure means a redesign that keeps the contract
 * does not break the suite; see docs/flake.md for what the alternative costs.
 */
export const loginLocators = {
  username: (page: Page): Locator => page.getByTestId('username'),
  password: (page: Page): Locator => page.getByTestId('password'),
  submit: (page: Page): Locator => page.getByTestId('login-button'),
  error: (page: Page): Locator => page.getByTestId('error'),
}
