/**
 * The accounts saucedemo ships, and what is wrong with each.
 *
 * Four of the six are broken on purpose. That is the reason this site was
 * chosen over a well-behaved one: a suite that only ever walks the happy path
 * demonstrates nothing, and these give real defects to catch on demand.
 *
 * The defects are described here rather than in the tests so that both
 * packages are testing the same claim about each user, in the same words.
 */

export const PASSWORD = 'secret_sauce'

export interface User {
  readonly name: string
  /** What this account does wrong, in words a failure message can borrow. */
  readonly defect: string | null
}

export const users = {
  standard: { name: 'standard_user', defect: null },

  lockedOut: {
    name: 'locked_out_user',
    defect: 'cannot sign in at all — the form returns "Sorry, this user has been locked out."',
  },

  problem: {
    name: 'problem_user',
    defect: 'signs in, then renders every product with the same image — six items, one picture',
  },

  performanceGlitch: {
    name: 'performance_glitch_user',
    defect: 'signs in successfully but takes seconds to do it',
  },

  error: {
    name: 'error_user',
    defect: 'fails partway through the checkout flow',
  },

  visual: {
    name: 'visual_user',
    defect: 'renders a visibly wrong layout while behaving correctly',
  },
} as const satisfies Record<string, User>

export type UserKey = keyof typeof users
