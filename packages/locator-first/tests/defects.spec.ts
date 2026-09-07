import { test, expect, journey } from './fixtures.js'
import { users } from '@swag-lab/shared-journeys'
import { inventoryLocators } from '../src/locators/inventory.js'
import { signIn } from '../src/pages/index.js'

/**
 * The accounts that are broken on purpose.
 *
 * A suite that only walks the happy path proves it can drive a browser, not
 * that it can catch anything. These users are the reason this application was
 * chosen: real defects, on demand, that the suite either notices or does not.
 */
test.describe('Known defects', () => {
  test(`${journey('defect.problem-user-images')} — problem_user renders the same image for every product`, async ({
    page,
  }) => {
    await signIn(page, users.problem)

    const sources = await inventoryLocators
      .images(page)
      .evaluateAll((images) => images.map((image) => image.getAttribute('src')))

    expect(sources).toHaveLength(6)

    /*
     * Six products, one picture. The page is not broken in any way a status
     * code or a console error would reveal — every element is present and the
     * layout is intact, which is why this needs a browser and an assertion
     * about content rather than a smoke check.
     *
     * Asserted as a failure the suite *catches*, not as expected behaviour:
     * the day Sauce Labs fixes this user, this test goes red and the message
     * below says why, rather than leaving someone to wonder.
     */
    const distinct = new Set(sources)
    expect(
      distinct.size,
      `problem_user is meant to render one image for all six products. ` +
        `Found ${distinct.size} distinct images — if the application has been ` +
        `fixed, this test is the thing that is now wrong.`,
    ).toBe(1)

    // And the control: the same page, signed in as a working user, differs.
    await signIn(page, users.standard)
    const healthy = await inventoryLocators
      .images(page)
      .evaluateAll((images) => images.map((image) => image.getAttribute('src')))
    expect(new Set(healthy).size).toBeGreaterThan(1)
  })
})
