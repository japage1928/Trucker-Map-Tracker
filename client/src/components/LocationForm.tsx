import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { locationFormSchema, type CreateLocationRequest, locationTypeEnum, dockTypeEnum, facilityKindEnum } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LocationMap } from "./LocationMap";
import { Trash2, MapPin, Save, Navigation, Locate, Loader2 } from "lucide-react";
import { useState } from "react";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useToast } from "@/hooks/use-toast";

interface LocationFormProps {
  defaultValues?: Partial<CreateLocationRequest>;
  onSubmit: (data: CreateLocationRequest) => void;
  isSubmitting?: boolean;
}

export function LocationForm({ defaultValues, onSubmit, isSubmitting }: LocationFormProps) {
  const { getCurrentLocation, loading: geoLoading } = useGeolocation();
  const { toast } = useToast();

  const form = useForm<CreateLocationRequest>({
    resolver: zodResolver(locationFormSchema),
    defaultValues: defaultValues || {
      name: "",
      address: "",
      facilityKind: "warehouse",
      locationType: "pickup",
      hoursOfOperation: "",
      sopOnArrival: "",
      parkingInstructions: "",
      dockType: "live",
      lastMileRouteNotes: "",
      gotchas: "",
      pins: [],
      addressSource: "manual",
      visibility: "public"
    }
  });

  const facilityKind = form.watch("facilityKind");

  const handleUseCurrentLocation = async () => {
    try {
      const result = await getCurrentLocation();
      
      form.setValue("lat", String(result.lat));
      form.setValue("lng", String(result.lng));
      form.setValue("accuracy", result.accuracy);
      form.setValue("addressSource", "geocoded");
      
      if (result.address) {
        form.setValue("address", result.address);
      }
      
      // Also add a pin at the geocoded location if no pins exist
      const currentPins = form.getValues("pins") || [];
      if (currentPins.length === 0) {
        append({
          type: 'entry',
          lat: String(result.lat),
          lng: String(result.lng),
          label: 'Current Location',
          instruction: 'Captured from device'
        });
      }
      
      toast({
        title: "Location captured",
        description: "Address and coordinates updated from your current position.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: String(err),
      });
    }
  };

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "pins"
  });

  const [activePinType, setActivePinType] = useState<'entry' | 'exit'>('entry');

  const handleMapClick = (lat: string, lng: string) => {
    append({
      type: activePinType,
      lat,
      lng,
      label: activePinType === 'entry' ? 'Main Entrance' : 'Main Exit',
      instruction: 'Enter here'
    });
  };

  const handlePinMove = (index: number, lat: string, lng: string) => {
    const pin = fields[index];
    update(index, { ...pin, lat, lng });
  };

  // Calculate center based on pins or default
  const pins = form.watch("pins") || [];
  const mapCenter: [number, number] = pins.length > 0 
    ? [parseFloat(pins[0].lat), parseFloat(pins[0].lng)]
    : [39.8283, -98.5795];
  const mapZoom = pins.length > 0 ? 16 : 4;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-24 md:pb-8">
        
        {/* Map Section */}
        <Card className="overflow-hidden border-border/50 shadow-lg">
          <div className="bg-muted/50 p-4 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between gap-4 mb-1">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Pin Placement
                </h3>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={handleUseCurrentLocation}
                  disabled={geoLoading}
                  className="gap-2 h-8"
                >
                  {geoLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Locate className="h-4 w-4" />
                  )}
                  Use Current Location
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">Click map to add pins. Drag to adjust.</p>
            </div>
            
            <div className="flex bg-background rounded-lg border border-border p-1">
              <button
                type="button"
                onClick={() => setActivePinType('entry')}
                className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${activePinType === 'entry' ? 'bg-green-500/20 text-green-500' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Entry Mode
              </button>
              <button
                type="button"
                onClick={() => setActivePinType('exit')}
                className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${activePinType === 'exit' ? 'bg-red-500/20 text-red-500' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Exit Mode
              </button>
            </div>
          </div>
          
          <div className="h-[400px] w-full relative">
            <LocationMap 
              interactive={true}
              center={mapCenter}
              zoom={mapZoom}
              pins={pins}
              onPinAdd={handleMapClick}
              onPinMove={handlePinMove}
              className="h-full w-full"
            />
          </div>

          {/* Pin List */}
          {fields.length > 0 && (
            <div className="p-4 bg-background border-t border-border">
              <h4 className="text-sm font-bold mb-3 uppercase text-muted-foreground tracking-wider">Active Pins</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-2 p-3 rounded-md border border-border bg-card/50">
                    <div className={`w-2 h-10 rounded-full ${field.type === 'entry' ? 'bg-green-500' : 'bg-red-500'}`} />
                    <div className="flex-1 space-y-2">
                      <Input 
                        {...form.register(`pins.${index}.label`)} 
                        placeholder="Label (e.g. Gate A)"
                        className="h-8 text-sm"
                      />
                      <Input 
                        {...form.register(`pins.${index}.instruction`)} 
                        placeholder="Instruction"
                        className="h-8 text-sm text-muted-foreground"
                      />
                    </div>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => remove(index)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Details Section */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="p-6 space-y-6 md:col-span-2 border-border/50 shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <Navigation className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-bold">Facility Details</h3>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Facility Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Distribution Center #5" {...field} className="text-lg font-medium" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Industrial Pkwy..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="facilityKind"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Facility Kind</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select kind" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {facilityKindEnum.map(k => (
                          <SelectItem key={k} value={k} className="capitalize">{k}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="locationType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {locationTypeEnum.map(t => (
                          <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="truck stop">Truck Stop</SelectItem>
                        <SelectItem value="parking">Parking</SelectItem>
                        <SelectItem value="scale">Scale</SelectItem>
                        <SelectItem value="food">Food</SelectItem>
                        <SelectItem value="rest area">Rest Area</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dockType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dock Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select dock type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {dockTypeEnum.map(t => (
                          <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hoursOfOperation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hours of Operation</FormLabel>
                    <FormControl>
                      <Input placeholder="Mon-Fri 08:00 - 17:00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="visibility"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visibility</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || "public"}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select visibility" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </Card>

          {/* Instructions Sections - Conditional for Warehouse */}
          {facilityKind === 'warehouse' && (
            <div className="grid gap-6 md:grid-cols-2 md:col-span-2">
              <Card className="p-6 space-y-6 border-border/50">
                 <FormField
                    control={form.control}
                    name="sopOnArrival"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SOP On Arrival</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Check in at guard shack first..." 
                            className="min-h-[120px]" 
                            {...field} 
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="parkingInstructions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parking Instructions</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Overnight parking available in lot B..." 
                            className="min-h-[120px]" 
                            {...field} 
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              </Card>

              <Card className="p-6 space-y-6 border-border/50">
                 <FormField
                    control={form.control}
                    name="lastMileRouteNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Mile Route Notes</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Avoid Main St bridge (low clearance)..." 
                            className="min-h-[120px]" 
                            {...field} 
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="gotchas"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gotchas / Warnings</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Tight turn at entrance..." 
                            className="min-h-[120px] border-destructive/30 focus:border-destructive" 
                            {...field} 
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              </Card>
            </div>
          )}

          {/* General Notes for everyone */}
          <Card className="p-6 space-y-6 md:col-span-2 border-border/50">
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>General Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any extra information..." 
                      className="min-h-[100px]" 
                      {...field} 
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Card>
        </div>

        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full h-14 text-lg font-display uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl shadow-primary/20 sticky bottom-20 md:static"
        >
          {isSubmitting ? "Saving Facility..." : "Save Facility Record"} <Save className="ml-2 w-5 h-5" />
        </Button>
      </form>
    </Form>
  );
}
