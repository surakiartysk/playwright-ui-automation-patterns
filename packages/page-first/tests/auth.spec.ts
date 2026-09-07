import { test, journey } from './fixtures.js'
import { users } from '@swag-lab/shared-journeys'

test.describe('Signing in', () => {
  test(`${journey('auth.valid-credentials')} @smoke — a standard user reaches the product list`, async ({
    login,
    inventory,
  }) => {
    await login.signIn(users.standard)
    await inventory.expectLoaded()
  })

  test(`${journey('auth.locked-out')} @smoke — a locked-out user is refused, and told why`, async ({
    login,
  }) => {
    await login.signIn(users.lockedOut)
    await login.expectRefused(/locked out/)
  })

  test(`${journey('auth.wrong-password')} — a wrong password is refused without naming the field`, async ({
    login,
  }) => {
    await login.signInWithWrongPassword(users.standard)
    await login.expectRefusalRevealsNothing()
  })

  test(`${journey('auth.protects-pages-behind-login')} @smoke — a signed-out visitor asking for a page directly is refused`, async ({
    login,
  }) => {
    // Typed into the address bar, no session. A page reachable by URL is
    // reachable, whatever the navigation chooses to show.
    await login.requestDirectly('/inventory.html')
    await login.expectRefused(/when you are logged in/)
  })

  test(`${journey('auth.sign-out-ends-the-session')} — signing out returns to the form and the page cannot be reached again`, async ({
    login,
    inventory,
  }) => {
    await login.signIn(users.standard)
    await inventory.signOut()
    await login.expectSignInFormShown()

    // The half that is easy to skip: signing out must end the session, not
    // just navigate away from it.
    await login.requestDirectly('/inventory.html')
    await login.expectRefused(/when you are logged in/)
  })
})
