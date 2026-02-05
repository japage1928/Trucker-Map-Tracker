import { useLocation as useLocationQuery, useUpdateLocation } from "@/hooks/use-locations";
import { LocationForm } from "@/components/LocationForm";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EditLocation() {
  const [match, params] = useRoute("/locations/:id/edit");
  const id = params?.id || "";
  const [_, setLocation] = useLocation();

  const { data: locationData, isLoading } = useLocationQuery(id);
  const mutation = useUpdateLocation();

  const handleSubmit = (data: any) => {
    mutation.mutate({ id, ...data }, {
      onSuccess: () => setLocation(`/locations/${id}`)
    });
  };

  if (isLoading) return <div className="flex justify-center p-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  if (!locationData) return <div>Location not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation(`/locations/${id}`)}>
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Edit Location</h1>
          <p className="text-muted-foreground">Update facility details and pins</p>
        </div>
      </div>
      
      <LocationForm 
        defaultValues={{
          ...locationData,
          category: locationData.category ?? undefined,
          notes: locationData.notes ?? undefined,
          sopOnArrival: locationData.sopOnArrival ?? undefined,
          parkingInstructions: locationData.parkingInstructions ?? undefined,
          lastMileRouteNotes: locationData.lastMileRouteNotes ?? undefined,
          gotchas: locationData.gotchas ?? undefined,
          dockType: locationData.dockType ?? undefined,
        }}
        onSubmit={handleSubmit} 
        isSubmitting={mutation.isPending} 
      />
    </div>
  );
}
