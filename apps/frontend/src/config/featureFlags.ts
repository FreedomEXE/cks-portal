/**
 * Feature Flags - Safe Rollout Control
 *
 * These flags allow us to enable/disable features quickly without code changes.
 * Useful for gradual rollouts and fast rollbacks if issues arise.
 *
 * To disable a feature: set flag to false and restart dev server.
 * No code changes or redeployment needed.
 */

export const FEATURE_FLAGS = {
  /**
   * ID_FIRST_MODALS - Use ID-only modal opening everywhere
   *
   * When enabled:
   * - openById(id) is used instead of openReportModal(id, type)
   * - Type is automatically detected from ID format
   * - Consistent behavior across Activity Feed, Directory, Archive, Search
   *
   * When disabled:
   * - Falls back to type-specific modal methods
   * - Legacy behavior maintained for safety
   *
   * **Status**: ✅ Enabled (Phase 1 rollout)
   * **Rollback**: Set to `false` if issues detected
   */
  ID_FIRST_MODALS: true,

  /**
   * SERVICE_DETAIL_FETCH - Use on-demand service detail fetching
   *
   * When enabled:
   * - Services fetch details via /services/:id/details endpoint
   * - No dependency on preloaded ordersData
   *
   * When disabled:
   * - Services still use preloaded data from hub
   *
   * **Status**: 🚧 Not yet implemented (Phase 3)
   * **Rollback**: Set to `false` if service modals break
   */
  SERVICE_DETAIL_FETCH: false,
} as const;

/**
 * Check if a feature is enabled
 *
 * @example
 * if (isFeatureEnabled('ID_FIRST_MODALS')) {
 *   modals.openById(id);
 * } else {
 *   modals.openReportModal(id, 'report');
 * }
 */
export function isFeatureEnabled(flag: keyof typeof FEATURE_FLAGS): boolean {
  return FEATURE_FLAGS[flag];
}

/**
 * Get all enabled features
 * Useful for debugging and admin dashboards
 */
export function getEnabledFeatures(): string[] {
  return Object.entries(FEATURE_FLAGS)
    .filter(([_, enabled]) => enabled)
    .map(([flag]) => flag);
}
