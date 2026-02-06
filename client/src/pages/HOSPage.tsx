import { Card } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { HOSTracker } from "@/components/HOSTracker";

export default function HOSPage() {
  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Clock className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-amber-500">HOS Tracker</h1>
          <p className="text-muted-foreground">
            Manual FMCSA HOS clocks for personal time tracking.
          </p>
        </div>
      </div>

      <Card className="p-4 border-border/50 bg-card/60">
        <p className="text-sm text-muted-foreground">
          This is a manual time log for your HOS clocks. It does not auto-track duty status,
          and it is not an ELD. You are responsible for official compliance.
        </p>
      </Card>

      <HOSTracker />
    </div>
  );
}
