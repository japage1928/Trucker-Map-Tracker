import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dbApi } from "../lib/idb-storage";
import { type CreateLocationRequest, type UpdateLocationRequest } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// ============================================
// LOCAL-FIRST HOOKS — Using IndexedDB (idb)
// We keep the exact same interface as API hooks
// to make switching to backend easier later.
// ============================================

export function useLocations() {
  return useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      // Simulate network delay for realism
      // await new Promise(resolve => setTimeout(resolve, 300));
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
