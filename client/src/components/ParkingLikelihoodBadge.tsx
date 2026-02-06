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
  color: string;
  bgColor: string;
}> = {
  LIKELY_AVAILABLE: {
    icon: "🟢",
    label: "Likely Available",
    color: "text-green-700",
    bgColor: "bg-green-50 border-green-200",
  },
  UNCERTAIN: {
    icon: "🟡",
    label: "Uncertain",
    color: "text-yellow-700",
    bgColor: "bg-yellow-50 border-yellow-200",
  },
  LIKELY_FULL: {
    icon: "🔴",
    label: "Likely Full",
    color: "text-red-700",
    bgColor: "bg-red-50 border-red-200",
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
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${config.bgColor} ${className}`}
      >
        <span className="text-sm">{config.icon}</span>
        <span className={`text-xs font-medium ${config.color}`}>
          {config.label}
        </span>
      </div>
    );
  }

  // Full mode for detail cards
  return (
    <div className={`space-y-2 ${className}`}>
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${config.bgColor}`}>
        <span className="text-base">{config.icon}</span>
        <span className={`text-sm font-semibold ${config.color}`}>
          {config.label}
        </span>
      </div>
      
      {showExplanation && explanation && (
        <p className="text-sm text-gray-600 leading-relaxed">
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
      <div className={`rounded-lg shadow-lg border-2 ${config.bgColor} backdrop-blur-sm bg-opacity-95 p-3`}>
        <div className="flex items-center gap-2">
          <span className="text-lg">{config.icon}</span>
          <span className={`text-sm font-bold ${config.color}`}>
            {config.label}
          </span>
        </div>
        
        {showExplanation && explanation && (
          <p className="text-xs text-gray-600 mt-2 leading-snug">
            {explanation}
          </p>
        )}
      </div>
    </div>
  );
}
