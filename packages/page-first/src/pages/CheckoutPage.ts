import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

/** The cart page and the three checkout steps behind it. */
export class CheckoutPage {
  constructor(private readonly page: Page) {}

  async begin(): Promise<void> {
    await this.page.getByTestId('checkout').click()
  }

  async fillAddress(details: {
    firstName: string
    lastName: string
    postalCode?: string
  }): Promise<void> {
    await this.page.getByTestId('firstName').fill(details.firstName)
    await this.page.getByTestId('lastName').fill(details.lastName)
    if (details.postalCode !== undefined) {
      await this.page.getByTestId('postalCode').fill(details.postalCode)
    }
    await this.page.getByTestId('continue').click()
  }

  async finish(): Promise<void> {
    await this.page.getByTestId('finish').click()
  }

  async expectComplete(): Promise<void> {
    await expect(this.page).toHaveURL(/checkout-complete\.html/)
    await expect(this.page.getByTestId('complete-header')).toHaveText('Thank you for your order!')
  }

  /** Both halves: the message, and that the step did not advance. */
  async expectRefusedAtAddress(reason: RegExp): Promise<void> {
    await expect(this.page.getByTestId('error')).toContainText(reason)
    await expect(this.page).toHaveURL(/checkout-step-one\.html/)
  }
}
