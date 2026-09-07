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
})
