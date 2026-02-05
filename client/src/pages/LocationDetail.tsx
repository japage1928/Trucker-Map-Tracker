import { useLocation, useDeleteLocation } from "@/hooks/use-locations";
import { Link, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LocationMap } from "@/components/LocationMap";
import { 
  ArrowLeft, Edit, Trash2, MapPin, Clock, 
  Info, AlertTriangle, Truck, Navigation 
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

export default function LocationDetail() {
  const [match, params] = useRoute("/locations/:id");
  const id = params?.id || "";
  
  const { data: location, isLoading, error } = useLocation(id);
  const deleteMutation = useDeleteLocation();

  if (isLoading) return <div className="flex justify-center p-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  if (error || !location) return <div className="text-center p-20 text-destructive">Error loading location</div>;

  const pins = location.pins.map(p => ({
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
    deleteMutation.mutate(id);
    window.location.href = "/";
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
             <Badge className="bg-primary text-primary-foreground pointer-events-auto">
               {location.locationType}
             </Badge>
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
      </div>
    </div>
  );
}
