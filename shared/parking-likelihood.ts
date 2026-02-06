export type CapacityBucket = "small" | "medium" | "large";
export type StopType = "truck_stop" | "rest_area";
export type ParkingLikelihoodStatus = "LIKELY_AVAILABLE" | "UNCERTAIN" | "LIKELY_FULL";

type DayType = "weekday" | "weekend";

export interface StopProfile {
  stopId: string;
  capacityBucket: CapacityBucket;
  region: string;
  type: StopType;
  // Placeholder for future data blending.
  recentActivityScore?: number; // range 0.0 - 1.0
}

export interface ParkingLikelihoodResult {
  status: ParkingLikelihoodStatus;
  explanation: string;
}

export const CAPACITY_MODIFIERS: Record<CapacityBucket, number> = {
  small: 1.2,
  medium: 1.0,
  large: 0.8,
};

export const temporalWeights: Record<DayType, number[]> = {
  weekday: [
    0.35, 0.35, 0.32, 0.32, 0.30, 0.32,
    0.40, 0.48, 0.55, 0.62, 0.65, 0.68,
    0.70, 0.68, 0.64, 0.66, 0.70, 0.78,
    0.85, 0.92, 0.96, 0.92, 0.78, 0.55,
  ],
  weekend: [
    0.30, 0.30, 0.28, 0.28, 0.26, 0.28,
    0.35, 0.40, 0.46, 0.52, 0.55, 0.58,
    0.60, 0.58, 0.55, 0.56, 0.60, 0.68,
    0.74, 0.80, 0.84, 0.80, 0.66, 0.50,
  ],
};

function getDayType(date: Date): DayType {
  const day = date.getDay();
  return day === 0 || day === 6 ? "weekend" : "weekday";
}

function getTimeBucketLabel(hour: number) {
  if (hour < 5) return "overnight";
  if (hour < 11) return "morning";
  if (hour < 15) return "midday";
  if (hour < 19) return "afternoon";
  if (hour < 23) return "evening";
  return "late night";
}

function getSizeDescriptor(capacityBucket: CapacityBucket) {
  if (capacityBucket === "small") return "smaller";
  if (capacityBucket === "large") return "larger";
  return "mid-sized";
}

function getTemporalWeight(dayType: DayType, hour: number) {
  const weights = temporalWeights[dayType];
  return weights[hour] ?? 0.6;
}

function classifyLoad(baseLoad: number): ParkingLikelihoodStatus {
  if (baseLoad < 0.45) return "LIKELY_AVAILABLE";
  if (baseLoad < 0.75) return "UNCERTAIN";
  return "LIKELY_FULL";
}

function buildExplanation(
  status: ParkingLikelihoodStatus,
  dayType: DayType,
  hour: number,
  capacityBucket: CapacityBucket
): string {
  const timeLabel = getTimeBucketLabel(hour);
  const sizeLabel = getSizeDescriptor(capacityBucket);
  const dayLabel = dayType === "weekday" ? "weekdays" : "weekends";

  if (status === "LIKELY_AVAILABLE") {
    if (timeLabel === "midday" || timeLabel === "morning") {
      return `Midday parking at this ${sizeLabel} stop is often available on ${dayLabel}.`;
    }
    return `Parking is usually easier ${timeLabel} at this ${sizeLabel} stop on ${dayLabel}.`;
  }

  if (status === "LIKELY_FULL") {
    if (timeLabel === "evening" || timeLabel === "late night") {
      return `This stop usually fills up ${timeLabel} on ${dayLabel}.`;
    }
    return `Parking is often tight ${timeLabel} at this ${sizeLabel} stop on ${dayLabel}.`;
  }

  return `Parking can be unpredictable ${timeLabel} at this ${sizeLabel} stop on ${dayLabel}.`;
}

export function getParkingLikelihood(
  stopProfile: StopProfile,
  timestamp: Date | number
): ParkingLikelihoodResult {
  const date = typeof timestamp === "number" ? new Date(timestamp) : timestamp;
  const dayType = getDayType(date);
  const hour = date.getHours();
  const temporalWeight = getTemporalWeight(dayType, hour);
  const capacityModifier = CAPACITY_MODIFIERS[stopProfile.capacityBucket];

  const baseLoad = temporalWeight * capacityModifier;
  const status = classifyLoad(baseLoad);
  const explanation = buildExplanation(status, dayType, hour, stopProfile.capacityBucket);

  return { status, explanation };
}

// Example usage (mock data)
export function exampleUsage() {
  const mockStop: StopProfile = {
    stopId: "demo-001",
    capacityBucket: "medium",
    region: "midwest",
    type: "truck_stop",
  };

  const result = getParkingLikelihood(mockStop, new Date("2026-02-05T19:30:00Z"));

  return {
    stop: mockStop,
    prediction: result,
  };
}
