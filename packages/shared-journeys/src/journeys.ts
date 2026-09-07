/**
 * The behaviours both packages must cover.
 *
 * The API repo could pin its two styles to one OpenAPI document; a browser
 * suite has no such artefact, so the shared thing is the journeys themselves.
 * `check:journeys` fails when a journey named here is missing from either
 * package, which is what stops one style quietly testing less than the other
 * and making the comparison meaningless.
 *
 * Each entry is a claim about the product, not a description of a test. How it
 * is proven is exactly what the two packages are allowed to disagree about.
 */

export interface Journey {
  readonly id: string
  /** What is being claimed, in the words a report should use. */
  readonly claim: string
  /** Smoke journeys run on every push; the rest run on the full suite. */
  readonly smoke: boolean
}

export const journeys = [
  {
    id: 'auth.valid-credentials',
    claim: 'a standard user signs in and reaches the product list',
    smoke: true,
  },
  {
    id: 'auth.locked-out',
    claim: 'a locked-out user is refused, and told why',
    smoke: true,
  },
  {
    id: 'auth.wrong-password',
    claim: 'a wrong password is refused without revealing which field was wrong',
    smoke: false,
  },
  {
    id: 'catalogue.lists-products',
    claim: 'every product shows a name, a price and an image',
    smoke: true,
  },
  {
    id: 'catalogue.sorts-by-price',
    claim: 'sorting by price low-to-high reorders the list and does not lose items',
    smoke: false,
  },
  {
    id: 'cart.add-updates-badge',
    claim: 'adding items updates the cart badge to match what the cart holds',
    smoke: true,
  },
  {
    id: 'cart.remove-updates-badge',
    claim: 'removing the last item clears the badge rather than showing zero',
    smoke: false,
  },
  {
    id: 'checkout.completes',
    claim: 'a filled checkout reaches the confirmation page',
    smoke: true,
  },
  {
    id: 'checkout.requires-postal-code',
    claim: 'checkout refuses to continue without a postal code, and says so',
    smoke: false,
  },
  {
    id: 'catalogue.sorts-by-name',
    claim: 'sorting Z-to-A reverses the A-to-Z order exactly',
    smoke: false,
  },
  {
    id: 'catalogue.opens-product-detail',
    claim: 'a product name opens its detail page, showing the same name and price',
    smoke: false,
  },
  {
    id: 'cart.survives-navigation',
    claim: 'the cart still holds its items after leaving the page and coming back',
    smoke: false,
  },
  {
    id: 'cart.continue-shopping-returns',
    claim: 'continue shopping returns to the product list without emptying the cart',
    smoke: false,
  },
  {
    id: 'checkout.totals-add-up',
    claim: 'the order summary charges tax on the item total, and the total is their sum',
    smoke: false,
  },
  {
    id: 'checkout.lists-what-was-ordered',
    claim: 'the order summary lists exactly the items the cart held',
    smoke: false,
  },
  {
    id: 'checkout.cancel-keeps-the-cart',
    claim: 'cancelling checkout returns to the cart with its items intact',
    smoke: false,
  },
  {
    id: 'auth.protects-pages-behind-login',
    claim: 'a signed-out visitor asking for a page directly is refused, and told why',
    smoke: true,
  },
  {
    id: 'auth.sign-out-ends-the-session',
    claim: 'signing out returns to the form and the page cannot be reached again',
    smoke: false,
  },
  {
    id: 'defect.problem-user-images',
    claim: 'problem_user renders the same image for every product — a defect the suite must catch',
    smoke: false,
  },
  {
    id: 'defect.reset-leaves-buttons-stale',
    claim:
      'Reset App State clears the cart badge but leaves add buttons reading Remove — the page contradicts itself',
    smoke: false,
  },
] as const satisfies readonly Journey[]

export type JourneyId = (typeof journeys)[number]['id']

export const smokeJourneys = journeys.filter((j) => j.smoke)
