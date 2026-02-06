
import { pgTable, text, serial, integer, boolean, timestamp, jsonb, uuid, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";
import { users } from "./models/auth";

export const locationTypeEnum = ["pickup", "delivery", "both"] as const;
export const dockTypeEnum = ["live", "drop", "mixed"] as const;
export const pinTypeEnum = ["entry", "exit"] as const;
export const facilityKindEnum = ["warehouse", "truck stop", "rest area", "parking only"] as const;
export const addressSourceEnum = ["manual", "geocoded"] as const;

export const locations = pgTable("locations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").references(() => users.id),
  name: text("name").notNull(),
  address: text("address").notNull(),
  lat: text("lat"),
  lng: text("lng"),
  addressSource: text("address_source", { enum: addressSourceEnum }).default("manual"),
  accuracy: integer("accuracy"),
  facilityKind: text("facility_kind", { enum: facilityKindEnum }).notNull().default("warehouse"),
  locationType: text("location_type", { enum: locationTypeEnum }).notNull(),
  category: text("category").default("general"),
  status: text("status").default("approved"),
  visibility: text("visibility", { enum: ["public", "private"] }).default("public"),
  hoursOfOperation: text("hours_of_operation").notNull(),
  sopOnArrival: text("sop_on_arrival"),
  parkingInstructions: text("parking_instructions"),
  dockType: text("dock_type", { enum: dockTypeEnum }),
  lastMileRouteNotes: text("last_mile_route_notes"),
  gotchas: text("gotchas"),
  notes: text("notes"),
  isSeeded: boolean("is_seeded").default(false).notNull(),
  lastVerified: timestamp("last_verified").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const pins = pgTable("pins", {
  id: uuid("id").primaryKey().defaultRandom(),
  locationId: uuid("location_id").notNull().references(() => locations.id, { onDelete: "cascade" }),
  type: text("type", { enum: pinTypeEnum }).notNull(),
  lat: text("lat").notNull(),
  lng: text("lng").notNull(),
  label: text("label").notNull(),
  instruction: text("instruction").notNull(),
});

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userEventTypeEnum = ["fuel_stop", "parking_stop", "food_stop", "shutdown", "alert_shown", "alert_tapped", "alert_ignored"] as const;

export const userEvents = pgTable("user_events", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  eventType: text("event_type", { enum: userEventTypeEnum }).notNull(),
  locationId: uuid("location_id").references(() => locations.id, { onDelete: "set null" }),
  category: text("category"),
  alertType: text("alert_type"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  preferredCategories: jsonb("preferred_categories").default({}).notNull(),
  ignoredAlertTypes: jsonb("ignored_alert_types").default({}).notNull(),
  avgShutdownHour: integer("avg_shutdown_hour"),
  totalStops: integer("total_stops").default(0).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const fullnessStatusEnum = ["empty", "moderate", "limited", "full"] as const;

export const fullnessReports = pgTable("fullness_reports", {
  id: serial("id").primaryKey(),
  locationId: uuid("location_id").notNull().references(() => locations.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id),
  status: text("status", { enum: fullnessStatusEnum }).notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const purchaseTypeEnum = ["parkingInsights"] as const;

export const userPurchases = pgTable("user_purchases", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  purchaseType: text("purchase_type", { enum: purchaseTypeEnum }).notNull(),
  purchasedAt: timestamp("purchased_at").defaultNow().notNull(),
});

export const dayTypeEnum = ["weekday", "weekend"] as const;

export const parkingPings = pgTable("parking_pings", {
  id: serial("id").primaryKey(),
  stopId: text("stop_id").notNull(),
  hour: integer("hour").notNull(),
  dayType: text("day_type", { enum: dayTypeEnum }).notNull(),
  pingCount: integer("ping_count").default(1).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const locationsRelations = relations(locations, ({ many }) => ({
  pins: many(pins),
}));

export const pinsRelations = relations(pins, ({ one }) => ({
  location: one(locations, {
    fields: [pins.locationId],
    references: [locations.id],
  }),
}));

export const insertLocationSchema = createInsertSchema(locations).omit({ 
  id: true, 
  lastVerified: true, 
  createdAt: true 
}).extend({
  sopOnArrival: z.string().optional(),
  parkingInstructions: z.string().optional(),
  dockType: z.enum(dockTypeEnum).optional(),
  lastMileRouteNotes: z.string().optional(),
  gotchas: z.string().optional(),
  notes: z.string().optional(),
});

export const insertPinSchema = createInsertSchema(pins).omit({ 
  id: true 
});

const baseFormSchema = insertLocationSchema.extend({
  category: z.string().default("truck stop"),
  pins: z.array(insertPinSchema.omit({ locationId: true })).default([]),
});

export const locationFormSchema = baseFormSchema.extend({
  isSeeded: z.boolean().default(false),
}).superRefine((data: any, ctx: any) => {
    if (data.facilityKind === "warehouse") {
      if (!data.sopOnArrival) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "SOP is required for warehouses", path: ["sopOnArrival"] });
      if (!data.parkingInstructions) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Parking instructions are required for warehouses", path: ["parkingInstructions"] });
      if (!data.dockType) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Dock type is required for warehouses", path: ["dockType"] });
      if (!data.lastMileRouteNotes) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Route notes are required for warehouses", path: ["lastMileRouteNotes"] });
      if (!data.gotchas) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Gotchas are required for warehouses", path: ["gotchas"] });
    }
});

export const updateLocationSchema = baseFormSchema.partial();

export type Location = typeof locations.$inferSelect;
export type Pin = typeof pins.$inferSelect;
export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type InsertPin = z.infer<typeof insertPinSchema>;

export type LocationWithPins = Location & { pins: Pin[] };

export type CreateLocationRequest = z.infer<typeof locationFormSchema>;
export type UpdateLocationRequest = Partial<CreateLocationRequest>;

export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;

export type FullnessReport = typeof fullnessReports.$inferSelect;

export type UserEvent = typeof userEvents.$inferSelect;
export type InsertUserEvent = typeof userEvents.$inferInsert;
export type UserPreference = typeof userPreferences.$inferSelect;

export type UserPurchase = typeof userPurchases.$inferSelect;
export type InsertUserPurchase = typeof userPurchases.$inferInsert;

export type ParkingPing = typeof parkingPings.$inferSelect;
