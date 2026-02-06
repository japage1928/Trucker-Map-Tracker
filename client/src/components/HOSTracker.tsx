import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { useHOSTracking } from '@/hooks/use-hos-tracking';
import type { HOSInput, DutyStatus } from '@shared/hos-types';
import { MAX_DRIVING_HOURS, MAX_ON_DUTY_HOURS } from '@shared/hos-types';

const DUTY_STATUSES: DutyStatus[] = ['OFF', 'ON', 'DRIVING', 'SLEEPER'];

export function HOSTracker() {
  const { hos, updateHOS, setDutyStatus, reset } = useHOSTracking();
  const [showForm, setShowForm] = useState(false);
  const [driveUsed, setDriveUsed] = useState(0);
  const [onDutyUsed, setOnDutyUsed] = useState(0);

  if (!hos) {
    return (
      <div className="text-center p-4 text-muted-foreground">
        Loading HOS data...
      </div>
    );
  }

  const handleSubmit = () => {
    updateHOS({
      dutyStatus: hos.dutyStatus,
      driveTimeUsedToday: driveUsed,
      onDutyTimeUsedToday: onDutyUsed,
    });
    setShowForm(false);
  };

  const hoursUntilDriveReset = 34; // 10 consecutive hours of off-duty time
  const lastUpdateTime = new Date(hos.lastUpdated).toLocaleTimeString();

  return (
    <Card className="p-6 border-border/50 space-y-4 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-lg">Hours of Service (Assistive)</h3>
        </div>
        <span className="text-xs text-muted-foreground">⚠️ Estimates only</span>
      </div>

      <p className="text-xs text-muted-foreground">
        These are manual HOS estimates for driver assistance.
        Not legal HOS records. You remain responsible for FMCSA compliance.
      </p>

      {/* Current Status Display */}
      <div className="grid grid-cols-2 gap-3">
        {/* Duty Status */}
        <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
          <p className="text-xs text-muted-foreground mb-1">Current Status</p>
          <div className="flex items-center gap-2">
            <select
              value={hos.dutyStatus}
              onChange={(e) => setDutyStatus(e.target.value as DutyStatus)}
              className="flex-1 px-2 py-1 rounded border border-border bg-background text-foreground text-sm"
            >
              {DUTY_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Last Updated */}
        <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
          <p className="text-xs text-muted-foreground mb-1">Last Updated</p>
          <p className="text-sm font-mono">{lastUpdateTime}</p>
        </div>
      </div>

      {/* Remaining Time Display */}
      <div className="grid grid-cols-2 gap-3">
        {/* Drive Time Remaining */}
        <div className="p-3 rounded-lg border border-border/50">
          <p className="text-xs text-muted-foreground mb-2">Drive Time Available</p>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-primary">
                {hos.driveTimeRemainingHours.toFixed(1)} h
              </span>
              <span className="text-xs text-muted-foreground">
                / {MAX_DRIVING_HOURS}h
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary rounded-full h-2 transition-all"
                style={{
                  width: `${(hos.driveTimeRemainingHours / MAX_DRIVING_HOURS) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* On-Duty Time Remaining */}
        <div className="p-3 rounded-lg border border-border/50">
          <p className="text-xs text-muted-foreground mb-2">On-Duty Time Available</p>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-primary">
                {hos.onDutyRemainingHours.toFixed(1)} h
              </span>
              <span className="text-xs text-muted-foreground">
                / {MAX_ON_DUTY_HOURS}h
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary rounded-full h-2 transition-all"
                style={{
                  width: `${(hos.onDutyRemainingHours / MAX_ON_DUTY_HOURS) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Warnings */}
      {hos.driveTimeRemainingHours < 1 && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex gap-2">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-destructive">Drive Time Low</p>
            <p className="text-xs text-destructive/80 mt-1">
              You have less than 1 hour of drive time remaining. Plan ahead.
            </p>
          </div>
        </div>
      )}

      {hos.onDutyRemainingHours < 2 && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex gap-2">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-destructive">On-Duty Time Low</p>
            <p className="text-xs text-destructive/80 mt-1">
              You have less than 2 hours of on-duty time. Consider off-duty time soon.
            </p>
          </div>
        </div>
      )}

      {/* Form Toggle */}
      {!showForm ? (
        <div className="flex gap-2 pt-2">
          <Button
            onClick={() => setShowForm(true)}
            className="flex-1"
            variant="outline"
          >
            Update Hours
          </Button>
          <Button
            onClick={reset}
            className="flex-1"
            variant="ghost"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
      ) : (
        <div className="space-y-3 pt-2 border-t border-border/50">
          <div>
            <label className="text-xs text-muted-foreground block mb-2">
              Drive Time Used Today (hours)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max={MAX_DRIVING_HOURS}
                step="0.5"
                value={driveUsed}
                onChange={(e) => setDriveUsed(Math.min(MAX_DRIVING_HOURS, parseFloat(e.target.value) || 0))}
                className="flex-1 px-3 py-2 rounded border border-border bg-background text-foreground"
              />
              <span className="text-xs text-muted-foreground">{MAX_DRIVING_HOURS}h max</span>
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-2">
              On-Duty Time Used Today (hours)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max={MAX_ON_DUTY_HOURS}
                step="0.5"
                value={onDutyUsed}
                onChange={(e) => setOnDutyUsed(Math.min(MAX_ON_DUTY_HOURS, parseFloat(e.target.value) || 0))}
                className="flex-1 px-3 py-2 rounded border border-border bg-background text-foreground"
              />
              <span className="text-xs text-muted-foreground">{MAX_ON_DUTY_HOURS}h max</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSubmit}
              className="flex-1"
            >
              Save
            </Button>
            <Button
              onClick={() => setShowForm(false)}
              className="flex-1"
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <p className="text-[10px] text-muted-foreground/60 italic pt-2">
        Based on simplified 11-hour drive limit and 14-hour on-duty limit.
        Consult FMCSA regulations for complete HOS rules.
      </p>
    </Card>
  );
}
