import { useCreateLocation } from "@/hooks/use-locations";
import { LocationForm } from "@/components/LocationForm";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CreateLocation() {
  const mutation = useCreateLocation();
  const [_, setLocation] = useLocation();

  const handleSubmit = (data: any) => {
    mutation.mutate(data, {
      onSuccess: () => setLocation("/")
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">New Facility Record</h1>
          <p className="text-muted-foreground">Add a new location to your database</p>
        </div>
      </div>
      
      <LocationForm 
        onSubmit={handleSubmit} 
        isSubmitting={mutation.isPending} 
      />
    </div>
  );
}
