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

  test(`${journey('defect.reset-leaves-buttons-stale')} — Reset App State clears the badge but leaves buttons reading Remove`, async ({
    page,
  }) => {
    await signIn(page, users.standard)

    /*
     * Three items, not one. The defect scales with the cart: reset clears the
     * badge and leaves *every* add button reading Remove, so adding one and
     * asserting "at least one is stale" would pass whether the application
     * left one behind or twenty. Three pins the shape.
     */
    const added = ['sauce-labs-backpack', 'sauce-labs-bike-light', 'sauce-labs-onesie']
    for (const product of added) {
      await inventoryLocators.addToCart(page, product).click()
    }
    await expect(inventoryLocators.cartBadge(page)).toHaveText(String(added.length))

    await inventoryLocators.menu(page).click()
    await inventoryLocators.resetState(page).click()

    // The cart really is empty.
    await expect(inventoryLocators.cartBadge(page)).toHaveCount(0)

    /*
     * But the button still says Remove. The page now contradicts itself: the
     * badge says nothing is in the cart while the control says something is,
     * and a visitor pressing Remove is removing an item that is not there.
     *
     * Asserted as a defect the suite *catches*. If it is ever fixed this test
     * goes red, and the message explains that rather than leaving someone to
     * work out why a passing suite started failing.
     */
    const stale = await inventoryLocators.allRemoveButtons(page).count()
    expect(
      stale,
      `Reset App State is expected to leave one Remove button per item that was ` +
        `in the cart — ${added.length} here — while the badge is gone, the page ` +
        `contradicting itself. Found ${stale}. If this is now 0 the application ` +
        `has been fixed and this test is what is wrong; any other number means ` +
        `the defect has changed shape.`,
    ).toBe(added.length)
  })
})
