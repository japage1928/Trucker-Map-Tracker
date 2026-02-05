import { openDB, type DBSchema } from 'idb';
import { type LocationWithPins, type CreateLocationRequest, type UpdateLocationRequest } from '@shared/schema';
import { v4 as uuidv4 } from 'uuid';

interface TruckerDB extends DBSchema {
  locations: {
    key: string;
    value: LocationWithPins;
    indexes: { 'by-date': string };
  };
}

const DB_NAME = 'trucker-buddy-db';
const DB_VERSION = 1;

export async function initDB() {
  return openDB<TruckerDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const store = db.createObjectStore('locations', { keyPath: 'id' });
      store.createIndex('by-date', 'createdAt');
    },
  });
}

export const dbApi = {
  async getAll(): Promise<LocationWithPins[]> {
    const db = await initDB();
    return db.getAllFromIndex('locations', 'by-date');
  },

  async get(id: string): Promise<LocationWithPins | undefined> {
    const db = await initDB();
    return db.get('locations', id);
  },

  async create(data: CreateLocationRequest): Promise<LocationWithPins> {
    const db = await initDB();
    const id = uuidv4();
    const now = new Date();
    
    // Map request to full object with defaults
    const newLocation: LocationWithPins = {
      id,
      name: data.name,
      address: data.address,
      facilityKind: data.facilityKind || "warehouse",
      locationType: data.locationType,
      category: data.category || "general",
      status: data.status || "approved",
      visibility: data.visibility || "public",
      hoursOfOperation: data.hoursOfOperation,
      sopOnArrival: data.sopOnArrival || null,
      parkingInstructions: data.parkingInstructions || null,
      dockType: data.dockType || null,
      lastMileRouteNotes: data.lastMileRouteNotes || null,
      gotchas: data.gotchas || null,
      notes: data.notes || null,
      isSeeded: data.isSeeded || false,
      lastVerified: now,
      createdAt: now,
      pins: data.pins.map(p => ({
        id: uuidv4(),
        locationId: id,
        ...p
      }))
    };

    await db.add('locations', newLocation);
    return newLocation;
  },

  async update(id: string, data: UpdateLocationRequest): Promise<LocationWithPins> {
    const db = await initDB();
    const existing = await db.get('locations', id);
    if (!existing) throw new Error('Location not found');

    const updated: LocationWithPins = {
      ...existing,
      ...data,
      sopOnArrival: data.sopOnArrival === undefined ? existing.sopOnArrival : (data.sopOnArrival || null),
      parkingInstructions: data.parkingInstructions === undefined ? existing.parkingInstructions : (data.parkingInstructions || null),
      dockType: data.dockType === undefined ? existing.dockType : (data.dockType || null),
      lastMileRouteNotes: data.lastMileRouteNotes === undefined ? existing.lastMileRouteNotes : (data.lastMileRouteNotes || null),
      gotchas: data.gotchas === undefined ? existing.gotchas : (data.gotchas || null),
      notes: data.notes === undefined ? existing.notes : (data.notes || null),
      // Handle pins update if provided
      pins: data.pins ? data.pins.map(p => ({
        id: uuidv4(), // Simplified: regnerate IDs for now or would need complex merging logic
        locationId: id,
        ...p
      })) : existing.pins,
      lastVerified: new Date() // Update verification timestamp on edit
    };

    await db.put('locations', updated);
    return updated;
  },

  async delete(id: string): Promise<void> {
    const db = await initDB();
    await db.delete('locations', id);
  }
};
