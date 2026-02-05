import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type CreateLocationRequest, type UpdateLocationRequest, type LocationWithPins } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'include',
  });
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || 'Request failed');
  }
  
  if (res.status === 204) return undefined as T;
  return res.json();
}

export function useLocations() {
  return useQuery<LocationWithPins[]>({
    queryKey: ['locations'],
    queryFn: () => apiRequest<LocationWithPins[]>('/api/locations'),
  });
}

export function useLocation(id: string) {
  return useQuery<LocationWithPins>({
    queryKey: ['locations', id],
    queryFn: () => apiRequest<LocationWithPins>(`/api/locations/${id}`),
    enabled: !!id,
  });
}

export function useCreateLocation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateLocationRequest) => 
      apiRequest<LocationWithPins>('/api/locations', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      toast({ title: "Location Saved", description: "Successfully added to database." });
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
    mutationFn: ({ id, ...updates }: { id: string } & UpdateLocationRequest) => 
      apiRequest<LocationWithPins>(`/api/locations/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      }),
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
    mutationFn: (id: string) => 
      apiRequest<void>(`/api/locations/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      toast({ title: "Location Deleted", description: "Removed from database." });
    },
  });
}
