import { useState, useEffect } from "react";
import { useLocation as useLocationQuery, useDeleteLocation } from "@/hooks/use-locations";
import { Link, useLocation, useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LocationMap } from "@/components/LocationMap";
import { 
  ArrowLeft, Edit, Trash2, MapPin, Clock, 
  Info, AlertTriangle, Truck, Navigation, ParkingCircle, Users
} from "lucide-react";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ParkingLikelihoodBadge } from "@/components/ParkingLikelihoodBadge";
import { useShowExplanation } from "@/hooks/use-parking-insights";
import { locationToStopProfile } from "@shared/parking-profile-mapper";
import { getParkingLikelihood } from "@shared/parking-likelihood";
import { logParkingPing } from "@/lib/parking-ping";

type FullnessStatus = "empty" | "moderate" | "limited" | "full";

const statusConfig: Record<FullnessStatus, { label: string; color: string; bgColor: string }> = {
  empty: { label: "Empty", color: "text-green-400", bgColor: "bg-green-600" },
  moderate: { label: "Moderate", color: "text-yellow-400", bgColor: "bg-yellow-600" },
  limited: { label: "Limited", color: "text-orange-400", bgColor: "bg-orange-600" },
  full: { label: "Full", color: "text-red-400", bgColor: "bg-red-600" },
};

export default function LocationDetail() {
  const [match, params] = useRoute("/locations/:id");
  const id = params?.id || "";
  const [, setLocation] = useLocation();
  const [showReportPicker, setShowReportPicker] = useState(false);
  const queryClient = useQueryClient();
  
  const { data: location, isLoading, error } = useLocationQuery(id);
  const deleteMutation = useDeleteLocation();
  const showExplanation = useShowExplanation();

  const [reportError, setReportError] = useState<string | null>(null);

  // Fetch fullness reports for this location
  const { data: fullnessData, isLoading: fullnessLoading, error: fullnessError } = useQuery({
    queryKey: ["fullness-reports", id],
    queryFn: async () => {
      const res = await fetch(`/api/fullness-reports/${id}`);
      if (!res.ok) throw new Error("Failed to fetch reports");
      return res.json();
    },
    enabled: !!id,
    refetchInterval: 60000, // Refresh every minute
    retry: 2,
  });

  // Safe defaults for fullness data
  const safeFullnessData = {
    latestStatus: fullnessData?.latestStatus || null,
    totalReports: fullnessData?.totalReports || 0,
    statusCounts: fullnessData?.statusCounts || { empty: 0, moderate: 0, limited: 0, full: 0 },
  };

  // Parking likelihood prediction
  const parkingLikelihood = location ? (() => {
    const profile = locationToStopProfile(location);
    if (!profile) return null;
    return getParkingLikelihood(profile, Date.now());
  })() : null;

  // Log parking ping when likelihood is shown (fire-and-forget)
  useEffect(() => {
    if (parkingLikelihood && location?.id) {
      logParkingPing(location.id);
    }
  }, [parkingLikelihood, location?.id]);

  // Submit fullness report mutation
  const submitReport = useMutation({
    mutationFn: async (status: FullnessStatus) => {
      const res = await fetch("/api/fullness-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locationId: id, status }),
      });
      if (!res.ok) throw new Error("Failed to submit report");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fullness-reports", id] });
      setShowReportPicker(false);
      setReportError(null);
    },
    onError: () => {
      setReportError("Failed to submit your report. Please try again.");
    },
  });

  if (isLoading) return <div className="flex justify-center p-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  if (error || !location) return <div className="text-center p-20 text-destructive">Error loading location</div>;

  const pins = location.pins.map((p: any) => ({
    ...p,
    id: p.id,
    type: p.type as "entry" | "exit",
    lat: p.lat,
    lng: p.lng,
    label: p.label
  }));

  const mapCenter: [number, number] = pins.length > 0 
    ? [parseFloat(pins[0].lat), parseFloat(pins[0].lng)]
    : [39.8283, -98.5795];

  const handleDelete = () => {
    deleteMutation.mutate(id, {
      onSuccess: () => setLocation("/list"),
    });
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/list">
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/5">
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold truncate">{location.name}</h1>
          <p className="text-muted-foreground truncate">{location.address}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/locations/${id}/edit`}>
            <Button variant="outline" size="icon" className="border-border/50 bg-card hover:bg-primary/10 hover:text-primary hover:border-primary/50">
              <Edit className="w-4 h-4" />
            </Button>
          </Link>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="icon" className="border-border/50 bg-card hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50">
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-card border-border">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this location?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the location record from your local database.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Map Hero */}
      <Card className="overflow-hidden border-border/50 h-[300px] shadow-xl shadow-black/20 relative group">
        <LocationMap 
          center={mapCenter}
          zoom={16}
          pins={pins}
          className="h-full w-full"
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex justify-between items-end pointer-events-none">
          <div className="space-y-1">
             <div className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium pointer-events-auto">
               {location.locationType}
             </div>
          </div>
          <div className="text-xs text-white/70 font-mono">
            {location.pins.length} Verified Points
          </div>
        </div>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Important Info Card */}
        <Card className="p-6 border-border/50 space-y-4 shadow-lg h-full">
          <div className="flex items-center gap-2 pb-2 border-b border-border/50">
            <Info className="w-5 h-5 text-primary" />
            <h3 className="font-bold">Key Information</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-xs uppercase text-muted-foreground font-bold tracking-wider">Hours</span>
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 mt-0.5 text-muted-foreground" />
                <p className="text-sm">{location.hoursOfOperation || "Not specified"}</p>
              </div>
            </div>

             <div className="space-y-1">
              <span className="text-xs uppercase text-muted-foreground font-bold tracking-wider">Dock Type</span>
              <div className="flex items-start gap-2">
                <Truck className="w-4 h-4 mt-0.5 text-muted-foreground" />
                <p className="text-sm capitalize">{location.dockType}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <span className="text-xs uppercase text-muted-foreground font-bold tracking-wider">Arrival SOP</span>
            <p className="text-sm leading-relaxed bg-muted/30 p-3 rounded-md border border-border/50">
              {location.sopOnArrival || "No standard procedure recorded."}
            </p>
          </div>
        </Card>

        {/* Route Notes & Gotchas */}
        <div className="space-y-6">
          <Card className="p-6 border-border/50 space-y-3 shadow-lg">
             <div className="flex items-center gap-2">
              <Navigation className="w-5 h-5 text-blue-400" />
              <h3 className="font-bold text-blue-100">Last Mile Notes</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {location.lastMileRouteNotes || "No routing notes available."}
            </p>
          </Card>

           <Card className="p-6 border-destructive/20 bg-destructive/5 space-y-3 shadow-lg">
             <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <h3 className="font-bold text-destructive">Warnings & Gotchas</h3>
            </div>
            <p className="text-sm text-destructive-foreground/80">
              {location.gotchas || "No warnings recorded."}
            </p>
          </Card>
        </div>

        {/* Detailed Parking */}
        <Card className="p-6 border-border/50 space-y-3 md:col-span-2 shadow-lg">
           <h3 className="font-bold text-lg">Parking Instructions</h3>
           <ScrollArea className="h-32 rounded-md border border-border/50 bg-muted/20 p-4">
             <p className="text-sm leading-relaxed">
               {location.parkingInstructions || "No parking information available."}
             </p>
           </ScrollArea>
        </Card>

        {/* Parking Likelihood Prediction (Time-based) */}
        {parkingLikelihood && (
          <Card className="p-6 border-primary/30 bg-primary/5 space-y-4 md:col-span-2 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg mb-1">Parking Likelihood</h3>
                <p className="text-xs text-muted-foreground">Based on time patterns</p>
              </div>
            </div>

            <ParkingLikelihoodBadge
              status={parkingLikelihood.status}
              explanation={parkingLikelihood.explanation}
              showExplanation={showExplanation}
            />
          </Card>
        )}

        {/* Crowdsourced Parking Status */}
        <Card className="p-6 border-border/50 space-y-4 md:col-span-2 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ParkingCircle className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-lg">Parking Availability</h3>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>Crowdsourced</span>
            </div>
          </div>

          {/* Loading state */}
          {fullnessLoading && (
            <div className="p-4 rounded-lg bg-muted/30 border border-border/50 text-center text-muted-foreground">
              <p>Loading parking reports...</p>
            </div>
          )}

          {/* Error state */}
          {fullnessError && !fullnessLoading && (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-center text-destructive">
              <p>Unable to load parking reports</p>
            </div>
          )}

          {/* Current Status */}
          {!fullnessLoading && !fullnessError && safeFullnessData.latestStatus ? (
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 border border-border/50">
              <div className={`w-4 h-4 rounded-full ${statusConfig[safeFullnessData.latestStatus as FullnessStatus]?.bgColor || "bg-gray-500"}`} />
              <div className="flex-1">
                <p className={`font-semibold ${statusConfig[safeFullnessData.latestStatus as FullnessStatus]?.color || "text-gray-400"}`}>
                  {statusConfig[safeFullnessData.latestStatus as FullnessStatus]?.label || "Unknown"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {safeFullnessData.totalReports} report{safeFullnessData.totalReports !== 1 ? "s" : ""} in last 24 hours
                </p>
              </div>
              {/* Status breakdown */}
              {safeFullnessData.totalReports > 0 && (
                <div className="flex gap-2 text-xs flex-wrap">
                  {(Object.keys(statusConfig) as FullnessStatus[]).map((status) => 
                    safeFullnessData.statusCounts[status] > 0 && (
                      <span key={status} className={statusConfig[status].color}>
                        {safeFullnessData.statusCounts[status]} {statusConfig[status].label}
                      </span>
                    )
                  )}
                </div>
              )}
            </div>
          ) : !fullnessLoading && !fullnessError ? (
            <div className="p-4 rounded-lg bg-muted/30 border border-border/50 text-center text-muted-foreground">
              <p>No parking reports yet. Be the first to report!</p>
            </div>
          ) : null}

          {/* Report error message */}
          {reportError && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive">
              {reportError}
            </div>
          )}

          {/* Report Button / Picker */}
          {!showReportPicker ? (
            <Button 
              onClick={() => setShowReportPicker(true)}
              className="w-full"
              variant="outline"
            >
              <ParkingCircle className="w-4 h-4 mr-2" />
              Report Parking Status
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">How full is the parking lot right now?</p>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(statusConfig) as FullnessStatus[]).map((status) => (
                  <Button
                    key={status}
                    variant="outline"
                    className={`${statusConfig[status].bgColor} border-none hover:opacity-80`}
                    onClick={() => submitReport.mutate(status)}
                    disabled={submitReport.isPending}
                  >
                    {statusConfig[status].label}
                  </Button>
                ))}
              </div>
              <Button 
                variant="ghost" 
                className="w-full text-muted-foreground"
                onClick={() => setShowReportPicker(false)}
              >
                Cancel
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
