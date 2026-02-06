
import { 
  locations, pins, userPurchases, parkingPings,
  type Location, type InsertLocation, type Pin, type InsertPin, 
  type LocationWithPins, type CreateLocationRequest, type UpdateLocationRequest,
  type UserPurchase, type ParkingPing
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  getLocations(): Promise<LocationWithPins[]>;
  getLocation(id: string): Promise<LocationWithPins | undefined>;
  createLocation(data: CreateLocationRequest): Promise<LocationWithPins>;
  updateLocation(id: string, data: UpdateLocationRequest): Promise<LocationWithPins | undefined>;
  deleteLocation(id: string): Promise<void>;
  getPurchase(userId: string, purchaseType: string): Promise<UserPurchase | undefined>;
  createPurchase(userId: string, purchaseType: string): Promise<UserPurchase>;
  logParkingPing(stopId: string, hour: number, dayType: string): Promise<void>;
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
    
    const [newLocation] = await db.insert(locations).values({
      ...locationData,
      lastVerified: new Date()
    }).returning();
    
    const newPins: Pin[] = [];
    if (pinsData && pinsData.length > 0) {
      const pinsToInsert = pinsData.map(p => ({
        ...p,
        locationId: newLocation.id,
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
    
    let updatedLocation = existing;
    if (Object.keys(locationData).length > 0) {
      const [updated] = await db.update(locations)
        .set({ ...locationData, lastVerified: new Date() })
        .where(eq(locations.id, id))
        .returning();
      updatedLocation = updated as LocationWithPins;
    }

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

  async getPurchase(userId: string, purchaseType: string): Promise<UserPurchase | undefined> {
    const [purchase] = await db
      .select()
      .from(userPurchases)
      .where(
        and(
          eq(userPurchases.userId, userId),
          eq(userPurchases.purchaseType, purchaseType as any)
        )
      );
    return purchase;
  }

  async createPurchase(userId: string, purchaseType: string): Promise<UserPurchase> {
    const [purchase] = await db
      .insert(userPurchases)
      .values({
        userId,
        purchaseType: purchaseType as any,
      })
      .returning();
    return purchase;
  }

  async logParkingPing(stopId: string, hour: number, dayType: string): Promise<void> {
    const [existing] = await db
      .select()
      .from(parkingPings)
      .where(
        and(
          eq(parkingPings.stopId, stopId),
          eq(parkingPings.hour, hour),
          eq(parkingPings.dayType, dayType as any)
        )
      );

    if (existing) {
      await db
        .update(parkingPings)
        .set({
          pingCount: existing.pingCount + 1,
          updatedAt: new Date(),
        })
        .where(eq(parkingPings.id, existing.id));
    } else {
      await db.insert(parkingPings).values({
        stopId,
        hour,
        dayType: dayType as any,
        pingCount: 1,
      });
    }
  }
}

export const storage = new DatabaseStorage();
