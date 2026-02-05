import { useLocations } from "@/hooks/use-locations";
import { LocationMap } from "@/components/LocationMap";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Plus } from "lucide-react";

export default function MapView() {
  const { data: locations, isLoading } = useLocations();

  if (isLoading) return <div className="flex justify-center p-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;

  const allPins = (locations || []).flatMap(loc => 
    loc.pins.map(p => ({
      ...p,
      type: p.type as "entry" | "exit",
      label: `${loc.name} - ${p.label}`,
      isSeeded: loc.isSeeded
    }))
  );

  return (
    <div className="h-[calc(100vh-6rem)] md:h-[calc(100vh-4rem)] flex flex-col gap-4">
      <div className="flex justify-between items-center shrink-0">
        <h1 className="text-2xl font-bold">Global Map</h1>
        <Link href="/new">
          <Button size="sm" className="bg-primary text-primary-foreground">
            <Plus className="w-4 h-4 mr-2" /> Add
          </Button>
        </Link>
      </div>

      <Card className="flex-1 overflow-hidden border-border/50 shadow-lg relative">
        <LocationMap 
          interactive={true} 
          center={[39.8283, -98.5795]} 
          zoom={4}
          pins={allPins}
          className="h-full w-full"
        />
        <div className="absolute top-4 right-4 bg-card/90 backdrop-blur p-4 rounded-lg border border-border shadow-xl z-[400] max-w-xs">
          <h4 className="font-bold text-sm mb-2">Legend</h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500 shadow shadow-green-500/50"></div>
              <span>Entry Points</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500 shadow shadow-red-500/50"></div>
              <span>Exit Points</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
