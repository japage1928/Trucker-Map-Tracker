
import { 
  locations, pins, 
  type Location, type InsertLocation, type Pin, type InsertPin, 
  type LocationWithPins, type CreateLocationRequest, type UpdateLocationRequest 
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getLocations(): Promise<LocationWithPins[]>;
  getLocation(id: string): Promise<LocationWithPins | undefined>;
  createLocation(data: CreateLocationRequest): Promise<LocationWithPins>;
  updateLocation(id: string, data: UpdateLocationRequest): Promise<LocationWithPins | undefined>;
  deleteLocation(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getLocations(): Promise<LocationWithPins[]> {
    const allLocations = await db.select().from(locations);
    const results: LocationWithPins[] = [];
    
    for (const loc of allLocations) {
      const locPins = await db.select().from(pins).where(eq(pins.locationId, loc.id));
      results.push({ ...loc, pins: locPins });
    }
    
    return results;
  }

  async getLocation(id: string): Promise<LocationWithPins | undefined> {
    const [loc] = await db.select().from(locations).where(eq(locations.id, id));
    if (!loc) return undefined;
    
    const locPins = await db.select().from(pins).where(eq(pins.locationId, id));
    return { ...loc, pins: locPins };
  }

  async createLocation(data: CreateLocationRequest): Promise<LocationWithPins> {
    const { pins: pinsData, ...locationData } = data;
    
    // Ensure lastVerified is set on creation
    const [newLocation] = await db.insert(locations).values({
      ...locationData,
      lastVerified: new Date()
    }).returning();
    
    const newPins: Pin[] = [];
    if (pinsData && pinsData.length > 0) {
      const pinsToInsert = pinsData.map(p => ({
        ...p,
        locationId: newLocation.id,
        // Ensure lat/lng are strings as per schema
        lat: String(p.lat),
        lng: String(p.lng)
      }));
      
      const insertedPins = await db.insert(pins).values(pinsToInsert).returning();
      newPins.push(...insertedPins);
    }
    
    return { ...newLocation, pins: newPins };
  }

  async updateLocation(id: string, data: UpdateLocationRequest): Promise<LocationWithPins | undefined> {
    const existing = await this.getLocation(id);
    if (!existing) return undefined;

    const { pins: pinsData, ...locationData } = data;
    
    // Update location fields if provided
    let updatedLocation = existing;
    if (Object.keys(locationData).length > 0) {
      const [updated] = await db.update(locations)
        .set({ ...locationData, lastVerified: new Date() }) // Auto-update lastVerified
        .where(eq(locations.id, id))
        .returning();
      updatedLocation = updated as LocationWithPins;
    }

    // Handle pins: simple strategy = delete all and recreate if pins are provided
    // Ideally we would diff them, but overwrite is acceptable for this MVP
    let finalPins = existing.pins;
    if (pinsData) {
      await db.delete(pins).where(eq(pins.locationId, id));
      
      if (pinsData.length > 0) {
        const pinsToInsert = pinsData.map(p => ({
          ...p,
          locationId: id,
          lat: String(p.lat),
          lng: String(p.lng)
        }));
        finalPins = await db.insert(pins).values(pinsToInsert).returning();
      } else {
        finalPins = [];
      }
    }

    return { ...updatedLocation, pins: finalPins };
  }

  async deleteLocation(id: string): Promise<void> {
    await db.delete(locations).where(eq(locations.id, id));
  }
}

export const storage = new DatabaseStorage();
