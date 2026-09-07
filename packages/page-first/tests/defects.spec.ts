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

  test(`${journey('defect.reset-leaves-buttons-stale')} — Reset App State clears the badge but leaves buttons reading Remove`, async ({
    login,
    inventory,
  }) => {
    await login.signIn(users.standard)

    /*
     * Three items, not one. The defect scales with the cart, so adding one and
     * asserting "at least one is stale" would pass whether the application
     * left one behind or twenty.
     */
    const added = ['sauce-labs-backpack', 'sauce-labs-bike-light', 'sauce-labs-onesie']
    for (const product of added) {
      await inventory.addToCart(product)
    }
    await inventory.expectCartCount(added.length)

    await inventory.resetAppState()

    // The cart really is empty...
    await inventory.expectCartCount(0)

    /*
     * ...but the button still says Remove. The page contradicts itself: the
     * badge says nothing is in the cart while the control says something is.
     *
     * Asserted as a defect the suite catches. If it is ever fixed this goes
     * red, and the message says so rather than leaving someone puzzled.
     */
    const stale = await inventory.staleRemoveButtonCount()
    expect(
      stale,
      `Reset App State is expected to leave one Remove button per item that was ` +
        `in the cart — ${added.length} here — while the badge is gone. Found ` +
        `${stale}. If this is now 0 the application has been fixed and this test ` +
        `is what is wrong; any other number means the defect has changed shape.`,
    ).toBe(added.length)
  })
})
