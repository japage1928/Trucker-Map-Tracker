/**
 * Hook for parking insights feature.
 * PAYWALL DISABLED - Feature is free for all users.
 */

/**
 * Parking insights are free for all users.
 * No purchase required.
 */
export function useParkingInsights() {
  return {
    hasParkingInsights: true, // Always free
    isLoading: false,
    purchase: () => {}, // No-op
    isPurchasing: false,
  };
}

/**
 * Explanation text is always shown (no paywall).
 */
export function useShowExplanation() {
  return true; // Always show explanations
}
