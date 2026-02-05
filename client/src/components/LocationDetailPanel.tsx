import { X, Clock, MapPin, Building2, Phone, Globe, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LocationInfo {
  name: string;
  address: string;
  facilityKind: string;
  hoursOfOperation: string;
  notes?: string | null;
  id: string;
}

interface LocationDetailPanelProps {
  location: LocationInfo | null;
  onClose: () => void;
}

export function LocationDetailPanel({ location, onClose }: LocationDetailPanelProps) {
  if (!location) return null;

  const formatAddress = (address: string) => {
    if (!address) return "Address unavailable";
    const isCoordinates = /^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(address.trim());
    if (isCoordinates) return "Address unavailable";
    return address;
  };

  const formatFacilityType = (kind: string) => {
    return kind
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const displayAddress = formatAddress(location.address);

  return (
    <div className="absolute bottom-0 left-0 right-0 z-[500] animate-in slide-in-from-bottom duration-300">
      <div className="bg-card border-t border-border rounded-t-2xl shadow-2xl max-h-[60vh] overflow-auto">
        <div className="sticky top-0 bg-card border-b border-border/50 px-4 py-3 flex items-center justify-between">
          <h3 className="font-bold text-lg truncate pr-4">{location.name}</h3>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="shrink-0 h-8 w-8"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="p-4 space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Type</p>
              <p className="font-medium">{formatFacilityType(location.facilityKind)}</p>
            </div>
          </div>

          {displayAddress !== "Address unavailable" && (
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium">{displayAddress}</p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Hours</p>
              <p className="font-medium">{location.hoursOfOperation || "24/7"}</p>
            </div>
          </div>

          {location.notes && (
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                <Info className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="font-medium">{location.notes}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
