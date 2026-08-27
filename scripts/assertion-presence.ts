/**
 * Every test case must assert something.
 *
 * `.claude/rules/step-decomposition.md` section 4 is titled "Strict
 * Verification (No Blind Assertions)" and nothing enforced it. An audit of all
 * 115 test cases found 9 with no assertion at all - tests that run steps and
 * verify nothing, so they pass as long as the clicks land. Their names made
 * claims the steps never checked: "Close button dismisses the log in modal"
 * clicked close and never looked at the modal.
 *
 * This is the third time this defect class has surfaced here. The blanket
 * `nth=0` made `verify_element_count` measure one element forever (Phase 13a),
 * and `DDT_01` rows exercised invalid credentials while verifying nothing (D2).
 * Both were fixed one at a time. This checks the property instead.
 *
 * A false green is worse than a red: a test that cannot fail reports safety it
 * has not established, and it does so quietly, forever.
 */

/** Assertion keywords are exactly the `verify_*` family. */
export function isAssertion(action: unknown): boolean {
  return typeof action === 'string' && action.startsWith('verify_');
}

export interface AssertionPresenceResult {
  hasAssertion: boolean;
  /** True when a sub-flow may carry the assertion instead. */
  delegatesToFlow: boolean;
}

/**
 * Preconditions are deliberately not counted. They establish the starting
 * state; an assertion there says the setup worked, not that the behaviour under
 * test did. A test whose only `verify_*` sits in `preconditions` still never
 * checks its own subject.
 */
export function checkAssertionPresence(testCase: any): AssertionPresenceResult {
  const steps = [
    ...(Array.isArray(testCase?.steps) ? testCase.steps : []),
    ...(Array.isArray(testCase?.postconditions) ? testCase.postconditions : []),
  ];

  return {
    hasAssertion: steps.some((step: any) => isAssertion(step?.action)),
    delegatesToFlow: steps.some((step: any) => step?.action === 'call_flow'),
  };
}

/**
 * Returns an error line, or null when the test case asserts something.
 *
 * A test that calls a sub-flow is exempt: the flow may hold the assertion, and
 * this check reads one scenario file at a time. That is a real hole, and a
 * narrow one - it is better than either forcing a redundant assertion into
 * every flow-based test or resolving flows here and duplicating the runner.
 */
export function checkTestCaseAsserts(testCase: any, label: string): string | null {
  const { hasAssertion, delegatesToFlow } = checkAssertionPresence(testCase);

  if (hasAssertion || delegatesToFlow) return null;

  return `[FAIL] [${label}] Test case has no assertion. Every test case needs at least one verify_* step in "steps" or "postconditions" - without one it passes as long as the steps do not throw, whatever the application does. See .claude/rules/step-decomposition.md section 4.`;
}
