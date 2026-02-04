
import { pgTable, text, serial, integer, boolean, timestamp, jsonb, uuid, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

export const locationTypeEnum = ["pickup", "delivery", "both"] as const;
export const dockTypeEnum = ["live", "drop", "mixed"] as const;
export const pinTypeEnum = ["entry", "exit"] as const;

export const addressSourceEnum = ["manual", "geocoded"] as const;

export const locations = pgTable("locations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  lat: text("lat"),
  lng: text("lng"),
  addressSource: text("address_source", { enum: addressSourceEnum }).default("manual"),
  accuracy: integer("accuracy"),
  locationType: text("location_type", { enum: locationTypeEnum }).notNull(),
  hoursOfOperation: text("hours_of_operation").notNull(),
  sopOnArrival: text("sop_on_arrival").notNull(), // Standard Operating Procedure
  parkingInstructions: text("parking_instructions").notNull(),
  dockType: text("dock_type", { enum: dockTypeEnum }).notNull(),
  lastMileRouteNotes: text("last_mile_route_notes").notNull(),
  gotchas: text("gotchas").notNull(), // Warnings or issues
  lastVerified: timestamp("last_verified").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const pins = pgTable("pins", {
  id: uuid("id").primaryKey().defaultRandom(),
  locationId: uuid("location_id").notNull().references(() => locations.id, { onDelete: "cascade" }),
  type: text("type", { enum: pinTypeEnum }).notNull(),
  lat: text("lat").notNull(), // Using text to preserve precision if needed, or doublePrecision if available. Text is safe.
  lng: text("lng").notNull(),
  label: text("label").notNull(), // e.g., "Gate A"
  instruction: text("instruction").notNull(), // e.g., "Use right lane"
});

// === RELATIONS ===
export const locationsRelations = relations(locations, ({ many }) => ({
  pins: many(pins),
}));

export const pinsRelations = relations(pins, ({ one }) => ({
  location: one(locations, {
    fields: [pins.locationId],
    references: [locations.id],
  }),
}));

// === ZOD SCHEMAS ===
// Base schemas
export const insertLocationSchema = createInsertSchema(locations).omit({ 
  id: true, 
  lastVerified: true, 
  createdAt: true 
});

export const insertPinSchema = createInsertSchema(pins).omit({ 
  id: true 
});

// Composite schema for creating/updating a location WITH its pins
export const locationFormSchema = insertLocationSchema.extend({
  pins: z.array(insertPinSchema.omit({ locationId: true })).default([]),
});

// === EXPLICIT API TYPES ===
export type Location = typeof locations.$inferSelect;
export type Pin = typeof pins.$inferSelect;
export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type InsertPin = z.infer<typeof insertPinSchema>;

// The frontend will likely use a "Location with Pins" object
export type LocationWithPins = Location & { pins: Pin[] };

export type CreateLocationRequest = z.infer<typeof locationFormSchema>;
export type UpdateLocationRequest = Partial<CreateLocationRequest>;
