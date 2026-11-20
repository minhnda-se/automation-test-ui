/**
 * Suite lifecycle status - the one place that decides what "work in progress"
 * means for a scenario file.
 *
 * The validator and the runner both need this answer, and before this module
 * they had no way to agree on it: a suite was either fully resolved or it
 * failed the build. That left no state for a generated suite mid-handoff, so
 * one unfinished data file turned every CI run red at the validate step - a
 * gate failing for a reason unrelated to the change, which is exactly what
 * Phase 9 set out to stop.
 *
 * Pure string handling. No filesystem, no Playwright: it is imported by a
 * build script and by a spec file, and must stay usable from both.
 */

export type SuiteStatus = 'ready' | 'wip';

export const SUITE_STATUSES: readonly SuiteStatus[] = ['ready', 'wip'];

/**
 * A suite with no `config.status` is ready. Every file that predates this
 * field keeps its current strict treatment, so adding the field changes
 * nothing until someone opts a suite in.
 */
export const DEFAULT_SUITE_STATUS: SuiteStatus = 'ready';

/**
 * Appended to the generated test title of every wip suite, so a suite that is
 * being skipped says so in the report instead of quietly not being there.
 */
export const WIP_TAG = '@wip';

export interface SuiteStatusResult {
  status: SuiteStatus;
  /** Set when the raw value was present but not a recognised status. */
  error?: string;
}

/**
 * Resolve `config.status` into a status the validator and runner can act on.
 *
 * An unrecognised value resolves to `ready`, not `wip`. The direction matters:
 * `"WIP"` or `"in-progress"` is a typo, and treating a typo as an opt-in would
 * silently exempt a suite from the locator gate - the failure mode this field
 * exists to avoid. Falling back to the strict status means a typo surfaces as
 * a validation error instead.
 */
export function resolveSuiteStatus(rawStatus: unknown): SuiteStatusResult {
  if (rawStatus === undefined || rawStatus === null) {
    return { status: DEFAULT_SUITE_STATUS };
  }

  if (typeof rawStatus === 'string' && (SUITE_STATUSES as readonly string[]).includes(rawStatus)) {
    return { status: rawStatus as SuiteStatus };
  }

  return {
    status: DEFAULT_SUITE_STATUS,
    error: `Invalid "config.status" value ${JSON.stringify(rawStatus)}. Use one of: ${SUITE_STATUSES.map((s) => `"${s}"`).join(', ')}.`,
  };
}

export function isWipSuite(rawStatus: unknown): boolean {
  return resolveSuiteStatus(rawStatus).status === 'wip';
}
