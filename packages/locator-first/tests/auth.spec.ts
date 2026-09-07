import { test, expect, journey } from './fixtures.js'
import { users } from '@swag-lab/shared-journeys'
import { loginLocators } from '../src/locators/login.js'
import { inventoryLocators } from '../src/locators/inventory.js'
import { signIn } from '../src/pages/index.js'

test.describe('Signing in', () => {
  test(`${journey('auth.valid-credentials')} @smoke — a standard user reaches the product list`, async ({
    page,
  }) => {
    await signIn(page, users.standard)

    await expect(page).toHaveURL(/inventory\.html/)
    await expect(page.getByTestId('title')).toHaveText('Products')
  })

  test(`${journey('auth.locked-out')} @smoke — a locked-out user is refused, and told why`, async ({
    page,
  }) => {
    await signIn(page, users.lockedOut)

    // Still on the sign-in page: the refusal has to be visible, not a silent
    // redirect that leaves the user wondering.
    await expect(page).not.toHaveURL(/inventory\.html/)
    await expect(loginLocators.error(page)).toContainText('locked out')
  })

  test(`${journey('auth.wrong-password')} — a wrong password is refused without naming the field`, async ({
    page,
  }) => {
    await page.goto('/')
    await loginLocators.username(page).fill(users.standard.name)
    await loginLocators.password(page).fill('not-the-password')
    await loginLocators.submit(page).click()

    const error = loginLocators.error(page)
    await expect(error).toBeVisible()

    /*
     * The point of this test is the *absence* of detail. An error naming which
     * half was wrong tells an attacker that the username exists, which turns a
     * password guess into an account enumeration.
     */
    await expect(error).not.toContainText(/password is incorrect/i)
    await expect(error).not.toContainText(/no such user/i)
  })

  test(`${journey('auth.protects-pages-behind-login')} @smoke — a signed-out visitor asking for a page directly is refused`, async ({
    page,
  }) => {
    /*
     * Typed straight into the address bar, with no session. The application
     * has to decide this on the server's terms rather than by hiding a link:
     * a page reachable by URL is reachable, whatever the navigation shows.
     */
    await page.goto('/inventory.html')

    await expect(page).not.toHaveURL(/inventory\.html/)
    await expect(loginLocators.error(page)).toContainText('when you are logged in')
  })

  test(`${journey('auth.sign-out-ends-the-session')} — signing out returns to the form and the page cannot be reached again`, async ({
    page,
  }) => {
    await signIn(page, users.standard)
    await inventoryLocators.menu(page).click()
    await inventoryLocators.logout(page).click()

    await expect(loginLocators.submit(page)).toBeVisible()

    // The half that is easy to skip: signing out has to end the session, not
    // just navigate away from it.
    await page.goto('/inventory.html')
    await expect(loginLocators.error(page)).toContainText('when you are logged in')
  })
})
