import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'
import { PASSWORD, type User } from '@swag-lab/shared-journeys'

/**
 * The sign-in page.
 *
 * Nothing here is exported that a test could point at — no locators, no
 * element getters. A test can ask this page to sign someone in, or to describe
 * what went wrong, and that is the whole surface. That is the style's claim: a
 * test cannot couple itself to markup it cannot reach.
 *
 * The cost is visible in `expectRefused` below. A test that wants to assert
 * something this page did not anticipate has to come back and add a method,
 * where the sibling package would simply reach for the locator.
 */
export class LoginPage {
  constructor(private readonly page: Page) {}

  async open(): Promise<void> {
    await this.page.goto('/')
  }

  async signIn(user: User): Promise<void> {
    await this.open()
    await this.page.getByTestId('username').fill(user.name)
    await this.page.getByTestId('password').fill(PASSWORD)
    await this.page.getByTestId('login-button').click()
  }

  /** Signs in with a deliberately wrong password. */
  async signInWithWrongPassword(user: User): Promise<void> {
    await this.open()
    await this.page.getByTestId('username').fill(user.name)
    await this.page.getByTestId('password').fill('not-the-password')
    await this.page.getByTestId('login-button').click()
  }

  /** Asks for a page directly, with no session. */
  async requestDirectly(path: string): Promise<void> {
    await this.page.goto(path)
  }

  async expectSignInFormShown(): Promise<void> {
    await expect(this.page.getByTestId('login-button')).toBeVisible()
  }

  async expectRefused(reason: RegExp): Promise<void> {
    await expect(this.page).not.toHaveURL(/inventory\.html/)
    await expect(this.page.getByTestId('error')).toContainText(reason)
  }

  /**
   * Asserts the refusal gives nothing away.
   *
   * An error naming which half was wrong tells an attacker the username
   * exists, turning a password guess into account enumeration.
   */
  async expectRefusalRevealsNothing(): Promise<void> {
    const error = this.page.getByTestId('error')
    await expect(error).toBeVisible()
    await expect(error).not.toContainText(/password is incorrect/i)
    await expect(error).not.toContainText(/no such user/i)
  }
}
