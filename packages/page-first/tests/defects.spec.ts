import { test, expect, journey } from './fixtures.js'
import { users } from '@swag-lab/shared-journeys'

/**
 * The accounts that are broken on purpose — the reason this application was
 * chosen. A suite that only walks the happy path proves it can drive a
 * browser, not that it can catch anything.
 */
test.describe('Known defects', () => {
  test(`${journey('defect.problem-user-images')} — problem_user renders the same image for every product`, async ({
    login,
    inventory,
  }) => {
    await login.signIn(users.problem)
    const sources = await inventory.imageSources()

    expect(sources).toHaveLength(6)

    const distinct = new Set(sources)
    expect(
      distinct.size,
      `problem_user is meant to render one image for all six products. ` +
        `Found ${distinct.size} distinct images — if the application has been ` +
        `fixed, this test is the thing that is now wrong.`,
    ).toBe(1)

    // The control: the same page as a working user differs.
    await login.signIn(users.standard)
    expect(new Set(await inventory.imageSources()).size).toBeGreaterThan(1)
  })
})
