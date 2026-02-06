import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Route, Trash2, Pencil } from "lucide-react";
import { useTrips } from "@/hooks/use-trips";

export default function TripsPage() {
  const { trips, addTrip, removeTrip, updateTrip, clearTrips } = useTrips();
  const [title, setTitle] = useState("");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [plannedDate, setPlannedDate] = useState("");
  const [distanceMiles, setDistanceMiles] = useState("");
  const [etaMinutes, setEtaMinutes] = useState("");
  const [notes, setNotes] = useState("");
  const [tripType, setTripType] = useState<"business" | "personal">("business");
  const [status, setStatus] = useState<"planned" | "active" | "completed">("planned");
  const [editingId, setEditingId] = useState<string | null>(null);

  const canSubmit = title.trim() && origin.trim() && destination.trim();

  const resetForm = () => {
    setTitle("");
    setOrigin("");
    setDestination("");
    setPlannedDate("");
    setDistanceMiles("");
    setEtaMinutes("");
    setNotes("");
    setTripType("business");
    setStatus("planned");
    setEditingId(null);
  };

  const handleAddTrip = () => {
    if (!canSubmit) return;

    const payload = {
      title: title.trim(),
      origin: origin.trim(),
      destination: destination.trim(),
      plannedDate: plannedDate || undefined,
      distanceMiles: distanceMiles ? Number(distanceMiles) : undefined,
      etaMinutes: etaMinutes ? Number(etaMinutes) : undefined,
      notes: notes.trim() || undefined,
      tripType,
      status,
    };

    if (editingId) {
      updateTrip(editingId, payload);
    } else {
      addTrip(payload);
    }

    resetForm();
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Route className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-amber-500">Trips</h1>
          <p className="text-muted-foreground">
            Auto-detect trips from GPS or log manual trips for AI planning.
          </p>
        </div>
      </div>

      <Card className="p-4 border-border/50 bg-card/60">
        <p className="text-sm text-muted-foreground">
          Trips can be auto-detected from GPS and edited manually. Tag each trip as business or personal.
        </p>
      </Card>

      <Card className="p-6 border-border/50 space-y-4 shadow-lg">
        <h2 className="text-lg font-semibold">{editingId ? "Edit Trip" : "New Trip"}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Trip Name</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Kansas City to Dallas"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Planned Date (optional)</label>
            <Input
              type="date"
              value={plannedDate}
              onChange={(e) => setPlannedDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Trip Type</label>
            <select
              value={tripType}
              onChange={(e) => setTripType(e.target.value as "business" | "personal")}
              className="w-full px-3 py-2 rounded border border-border bg-background text-foreground text-sm"
            >
              <option value="business">Business</option>
              <option value="personal">Personal</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "planned" | "active" | "completed")}
              className="w-full px-3 py-2 rounded border border-border bg-background text-foreground text-sm"
            >
              <option value="planned">Planned</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Origin</label>
            <Input
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="Kansas City, MO"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Destination</label>
            <Input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Dallas, TX"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Distance (miles, optional)</label>
            <Input
              type="number"
              min="0"
              value={distanceMiles}
              onChange={(e) => setDistanceMiles(e.target.value)}
              placeholder="540"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">ETA (minutes, optional)</label>
            <Input
              type="number"
              min="0"
              value={etaMinutes}
              onChange={(e) => setEtaMinutes(e.target.value)}
              placeholder="520"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs text-muted-foreground">Notes (optional)</label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Preferred stops, delivery window, etc."
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleAddTrip}
            disabled={!canSubmit}
            className="w-full md:w-auto"
          >
            {editingId ? "Save Changes" : "Save Trip"}
          </Button>
          {editingId && (
            <Button
              onClick={resetForm}
              variant="ghost"
              className="w-full md:w-auto"
            >
              Cancel Edit
            </Button>
          )}
        </div>
      </Card>

      <Card className="p-6 border-border/50 space-y-4 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Trips</h2>
          {trips.length > 0 && (
            <Button variant="ghost" onClick={clearTrips} className="text-muted-foreground">
              Clear All
            </Button>
          )}
        </div>

        {trips.length === 0 ? (
          <p className="text-sm text-muted-foreground">No trips logged yet.</p>
        ) : (
          <div className="space-y-3">
            {trips.map((trip) => (
              <div
                key={trip.id}
                className="border border-border/50 rounded-lg p-4 bg-muted/20"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-foreground">
                      {trip.title}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {trip.origin} ? {trip.destination}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-[10px] uppercase tracking-wide">
                      {trip.tripType && (
                        <span className="rounded border border-amber-400/40 px-2 py-0.5 text-amber-300">
                          {trip.tripType}
                        </span>
                      )}
                      {trip.status && (
                        <span className="rounded border border-white/20 px-2 py-0.5 text-white/70">
                          {trip.status}
                        </span>
                      )}
                      {trip.autoDetected && (
                        <span className="rounded border border-emerald-400/40 px-2 py-0.5 text-emerald-300">
                          auto
                        </span>
                      )}
                    </div>
                    {trip.plannedDate && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Planned: {trip.plannedDate}
                      </div>
                    )}
                    {trip.startedAt && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Started: {new Date(trip.startedAt).toLocaleString()}
                      </div>
                    )}
                    {trip.endedAt && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Ended: {new Date(trip.endedAt).toLocaleString()}
                      </div>
                    )}
                    {(trip.distanceMiles || trip.etaMinutes) && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {trip.distanceMiles ? `${trip.distanceMiles} mi` : ""}
                        {trip.distanceMiles && trip.etaMinutes ? " • " : ""}
                        {trip.etaMinutes ? `${trip.etaMinutes} min` : ""}
                      </div>
                    )}
                    {trip.notes && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {trip.notes}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setEditingId(trip.id);
                        setTitle(trip.title || "");
                        setOrigin(trip.origin || "");
                        setDestination(trip.destination || "");
                        setPlannedDate(trip.plannedDate || "");
                        setDistanceMiles(trip.distanceMiles ? String(trip.distanceMiles) : "");
                        setEtaMinutes(trip.etaMinutes ? String(trip.etaMinutes) : "");
                        setNotes(trip.notes || "");
                        setTripType(trip.tripType || "business");
                        setStatus(trip.status || "planned");
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => removeTrip(trip.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
