/**
 * Parking Likelihood Badge Component
 * 
 * Displays parking availability status with color-coded badge.
 * Free users see badge only.
 * Paid users see badge + explanation.
 */

import type { ParkingLikelihoodStatus } from "@/../../shared/parking-likelihood";

interface ParkingLikelihoodBadgeProps {
  status: ParkingLikelihoodStatus;
  explanation?: string;
  showExplanation?: boolean;
  compact?: boolean;
  className?: string;
}

const STATUS_CONFIG: Record<ParkingLikelihoodStatus, {
  icon: string;
  label: string;
  className: string;
}> = {
  LIKELY_AVAILABLE: {
    icon: "✓",
    label: "Likely Available",
    className: "status-available",
  },
  UNCERTAIN: {
    icon: "?",
    label: "Uncertain",
    className: "status-uncertain",
  },
  LIKELY_FULL: {
    icon: "✕",
    label: "Likely Full",
    className: "status-full",
  },
};

export function ParkingLikelihoodBadge({
  status,
  explanation,
  showExplanation = false,
  compact = false,
  className = "",
}: ParkingLikelihoodBadgeProps) {
  const config = STATUS_CONFIG[status];

  if (compact) {
    // Compact mode for HUD: icon + label only
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${config.className}`}
      >
        <span className="text-sm">{config.icon}</span>
        <span className="text-xs font-medium">
          {config.label}
        </span>
      </div>
    );
  }

  // Full mode for detail cards
  return (
    <div className={`space-y-2 ${className}`}>
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${config.className}`}>
        <span className="text-base">{config.icon}</span>
        <span className="text-sm font-semibold">
          {config.label}
        </span>
      </div>
      
      {showExplanation && explanation && (
        <p className="text-sm text-muted-foreground leading-relaxed">
          {explanation}
        </p>
      )}
    </div>
  );
}

/**
 * HUD-specific variant with auto-hide and positioning.
 * Designed for minimal distraction during driving.
 */
interface ParkingHudBadgeProps {
  status: ParkingLikelihoodStatus;
  explanation?: string;
  showExplanation?: boolean;
  visible?: boolean;
}

export function ParkingHudBadge({
  status,
  explanation,
  showExplanation = false,
  visible = true,
}: ParkingHudBadgeProps) {
  if (!visible) {
    return null;
  }

  const config = STATUS_CONFIG[status];

  return (
    <div
      className="fixed bottom-20 left-4 z-10 pointer-events-none"
      style={{ maxWidth: "240px" }}
    >
      <div className={`rounded-lg shadow-lg border glass-card backdrop-blur-md bg-black/40 p-3 ${config.className}`}>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">{config.icon}</span>
          <span className="text-sm font-bold">
            {config.label}
          </span>
        </div>
        
        {showExplanation && explanation && (
          <p className="text-xs mt-2 leading-snug opacity-90">
            {explanation}
          </p>
        )}
      </div>
    </div>
  );
}
