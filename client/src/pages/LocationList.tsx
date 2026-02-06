import { useLocations } from "@/hooks/use-locations";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import { Search, MapPin, Truck, Clock, Navigation, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function LocationList() {
  const { data: locations, isLoading } = useLocations();
  const [search, setSearch] = useState("");

  const filteredLocations = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return locations || [];

    return (locations || []).filter(loc => {
      const name = loc.name?.toLowerCase() || "";
      const address = loc.address?.toLowerCase() || "";
      return name.includes(normalizedSearch) || address.includes(normalizedSearch);
    });
  }, [locations, search]);

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">My Locations</h1>
          <p className="text-muted-foreground">Manage your offline delivery database</p>
        </div>
        
        <Link href="/new">
          <Button className="w-full md:w-auto gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20">
            <Plus className="w-5 h-5" />
            Add New Facility
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input 
          placeholder="Search by name or address..." 
          className="pl-12 h-14 text-lg bg-card/50 border-border/50 focus:border-primary/50 transition-all rounded-xl"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* List Grid */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : filteredLocations.length === 0 ? (
        <div className="text-center py-20 space-y-4 opacity-50">
          <Truck className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-bold">No locations found</h3>
          <p>Add your first delivery point to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredLocations.map((loc) => (
            <Link key={loc.id} href={`/locations/${loc.id}`}>
              <Card className="group cursor-pointer hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 overflow-hidden border-border/50 bg-card">
                <div className="p-5 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">
                        {loc.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
                        <Badge variant="outline" className="text-[10px] uppercase border-border/50 bg-background/50">
                          {loc.locationType}
                        </Badge>
                        <span className="opacity-50">•</span>
                        <span>{loc.dockType}</span>
                      </div>
                    </div>
                    {loc.pins.length > 0 && (
                      <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                        {loc.pins.length} PINS
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                      <span className="line-clamp-2">{loc.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 shrink-0" />
                      <span className="truncate">{loc.hoursOfOperation}</span>
                    </div>
                  </div>
                </div>
                
                {/* Visual Footer */}
                <div className="bg-muted/30 p-3 flex justify-between items-center border-t border-border/50 group-hover:bg-primary/5 transition-colors">
                  <span className="text-xs text-muted-foreground font-mono">
                    Updated: {new Date(loc.lastVerified).toLocaleDateString()}
                  </span>
                  <Navigation className="w-4 h-4 text-primary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
