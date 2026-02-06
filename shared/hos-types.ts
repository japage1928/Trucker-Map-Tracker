/**
 * Hours of Service (HOS) Tracking Types
 * 
 * These are assistive estimates only, not legal HOS records.
 * Driver is responsible for compliance with FMCSA HOS regulations.
 */

export type DutyStatus = "OFF" | "ON" | "DRIVING" | "SLEEPER";

export interface HOSTracking {
  dutyStatus: DutyStatus;
  driveTimeRemainingHours: number;
  onDutyRemainingHours: number;
  lastUpdated: string; // ISO timestamp
}

export interface HOSInput {
  dutyStatus: DutyStatus;
  driveTimeUsedToday: number; // hours
  onDutyTimeUsedToday: number; // hours
}

// HOS constants (simplified 11-hour and 14-hour rules)
export const MAX_DRIVING_HOURS = 11;
export const MAX_ON_DUTY_HOURS = 14;

export function calculateRemaining(input: HOSInput): HOSTracking {
  return {
    dutyStatus: input.dutyStatus,
    driveTimeRemainingHours: Math.max(0, MAX_DRIVING_HOURS - input.driveTimeUsedToday),
    onDutyRemainingHours: Math.max(0, MAX_ON_DUTY_HOURS - input.onDutyTimeUsedToday),
    lastUpdated: new Date().toISOString(),
  };
}
