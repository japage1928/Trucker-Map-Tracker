import { useState, useEffect } from 'react';
import type { HOSTracking, HOSInput, DutyStatus } from '@shared/hos-types';
import { calculateRemaining, MAX_DRIVING_HOURS, MAX_ON_DUTY_HOURS } from '@shared/hos-types';

const HOS_STORAGE_KEY = 'hos-tracking-state';

export function useHOSTracking() {
  const [hos, setHos] = useState<HOSTracking | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(HOS_STORAGE_KEY);
    if (stored) {
      try {
        setHos(JSON.parse(stored));
        return;
      } catch {
        // Ignore parse error
      }
    }
    const initial: HOSTracking = {
      dutyStatus: 'OFF',
      driveTimeRemainingHours: MAX_DRIVING_HOURS,
      onDutyRemainingHours: MAX_ON_DUTY_HOURS,
      lastUpdated: new Date().toISOString(),
    };
    setHos(initial);
    localStorage.setItem(HOS_STORAGE_KEY, JSON.stringify(initial));
  }, []);

  const updateHOS = (input: HOSInput) => {
    const updated = calculateRemaining(input);
    setHos(updated);
    localStorage.setItem(HOS_STORAGE_KEY, JSON.stringify(updated));
  };

  const setDutyStatus = (status: DutyStatus) => {
    if (hos) {
      const updated: HOSTracking = {
        ...hos,
        dutyStatus: status,
        lastUpdated: new Date().toISOString(),
      };
      setHos(updated);
      localStorage.setItem(HOS_STORAGE_KEY, JSON.stringify(updated));
    }
  };

  const incrementDriveTime = (hours: number) => {
    if (hos) {
      const newDriveUsed = Math.max(0, 
        MAX_DRIVING_HOURS - hos.driveTimeRemainingHours + hours
      );
      const newOnDutyUsed = Math.max(0,
        MAX_ON_DUTY_HOURS - hos.onDutyRemainingHours + hours
      );
      updateHOS({
        dutyStatus: hos.dutyStatus,
        driveTimeUsedToday: newDriveUsed,
        onDutyTimeUsedToday: newOnDutyUsed,
      });
    }
  };

  const incrementOnDutyTime = (hours: number) => {
    if (hos) {
      const newOnDutyUsed = Math.max(0,
        MAX_ON_DUTY_HOURS - hos.onDutyRemainingHours + hours
      );
      updateHOS({
        dutyStatus: hos.dutyStatus,
        driveTimeUsedToday: MAX_DRIVING_HOURS - hos.driveTimeRemainingHours,
        onDutyTimeUsedToday: newOnDutyUsed,
      });
    }
  };

  const reset = () => {
    const initial: HOSTracking = {
      dutyStatus: 'OFF',
      driveTimeRemainingHours: MAX_DRIVING_HOURS,
      onDutyRemainingHours: MAX_ON_DUTY_HOURS,
      lastUpdated: new Date().toISOString(),
    };
    setHos(initial);
    localStorage.setItem(HOS_STORAGE_KEY, JSON.stringify(initial));
  };

  return {
    hos,
    updateHOS,
    setDutyStatus,
    incrementDriveTime,
    incrementOnDutyTime,
    reset,
  };
}
