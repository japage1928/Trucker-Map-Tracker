import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dbApi } from "../lib/idb-storage";
import { type CreateLocationRequest, type UpdateLocationRequest, type LocationWithPins } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

// ============================================
// LOCAL-FIRST HOOKS — Using IndexedDB (idb)
// We keep the exact same interface as API hooks
// to make switching to backend easier later.
// ============================================

export function useLocations() {
  const queryClient = useQueryClient();

  // Seeding logic
  useEffect(() => {
    const seedData = async () => {
      const hasSeeded = localStorage.getItem('app_seeded');
      if (hasSeeded) return;

      try {
        const response = await fetch('/data/seed-pois.json');
        const data = await response.json();
        
        for (const item of data) {
          // Convert seed format to internal format if necessary
          // Note: dbApi.create handles the storage
          await dbApi.create({
            ...item,
            isSeeded: true,
            locationType: "both", // Default for seeds
            hoursOfOperation: "24/7",
            sopOnArrival: "Seeded point of interest",
            parkingInstructions: "N/A",
            dockType: "mixed",
            lastMileRouteNotes: "N/A",
            gotchas: "N/A",
            address: "Seeded Location"
          });
        }
        
        localStorage.setItem('app_seeded', 'true');
        queryClient.invalidateQueries({ queryKey: ['locations'] });
      } catch (err) {
        console.error("Failed to seed data:", err);
      }
    };

    seedData();
  }, [queryClient]);

  return useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      return dbApi.getAll();
    },
  });
}

export function useLocation(id: string) {
  return useQuery({
    queryKey: ['locations', id],
    queryFn: async () => {
      const loc = await dbApi.get(id);
      if (!loc) throw new Error('Location not found');
      return loc;
    },
    enabled: !!id,
  });
}

export function useCreateLocation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateLocationRequest) => {
      return dbApi.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      toast({ title: "Location Saved", description: "Successfully added to local database." });
    },
    onError: (err) => {
      toast({ 
        title: "Error", 
        description: err instanceof Error ? err.message : "Failed to save location",
        variant: "destructive"
      });
    }
  });
}

export function useUpdateLocation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & UpdateLocationRequest) => {
      return dbApi.update(id, updates);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      queryClient.invalidateQueries({ queryKey: ['locations', variables.id] });
      toast({ title: "Location Updated", description: "Changes saved successfully." });
    },
    onError: (err) => {
      toast({ 
        title: "Error", 
        description: err instanceof Error ? err.message : "Failed to update location",
        variant: "destructive"
      });
    }
  });
}

export function useDeleteLocation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      return dbApi.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      toast({ title: "Location Deleted", description: "Removed from local database." });
    },
  });
}
