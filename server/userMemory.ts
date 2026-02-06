import { db } from "./db";
import { userEvents, userPreferences, userEventTypeEnum } from "@shared/schema";
import { eq, desc, and, gte } from "drizzle-orm";

type EventType = typeof userEventTypeEnum[number];

interface CategoryCount {
  [category: string]: number;
}

interface AlertIgnoreCount {
  [alertType: string]: number;
}

export async function logUserEvent(
  userId: string,
  eventType: EventType,
  options?: {
    locationId?: string;
    category?: string;
    alertType?: string;
    metadata?: Record<string, unknown>;
  }
) {
  await db.insert(userEvents).values({
    userId,
    eventType,
    locationId: options?.locationId,
    category: options?.category,
    alertType: options?.alertType,
    metadata: options?.metadata,
  });

  await updateUserPreferences(userId);
}

async function updateUserPreferences(userId: string) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentEvents = await db
    .select()
    .from(userEvents)
    .where(and(eq(userEvents.userId, userId), gte(userEvents.createdAt, thirtyDaysAgo)))
    .orderBy(desc(userEvents.createdAt));

  const preferredCategories: CategoryCount = {};
  const ignoredAlertTypes: AlertIgnoreCount = {};
  let totalStops = 0;
  const shutdownHours: number[] = [];

  for (const event of recentEvents) {
    if (["fuel_stop", "parking_stop", "food_stop"].includes(event.eventType)) {
      totalStops++;
      if (event.category) {
        preferredCategories[event.category] = (preferredCategories[event.category] || 0) + 1;
      }
    }

    if (event.eventType === "shutdown") {
      const hour = event.createdAt.getHours();
      shutdownHours.push(hour);
    }

    if (event.eventType === "alert_ignored" && event.alertType) {
      ignoredAlertTypes[event.alertType] = (ignoredAlertTypes[event.alertType] || 0) + 1;
    }
  }

  const avgShutdownHour = shutdownHours.length > 0
    ? Math.round(shutdownHours.reduce((a, b) => a + b, 0) / shutdownHours.length)
    : null;

  const existing = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(userPreferences)
      .set({
        preferredCategories,
        ignoredAlertTypes,
        avgShutdownHour,
        totalStops,
        updatedAt: new Date(),
      })
      .where(eq(userPreferences.userId, userId));
  } else {
    await db.insert(userPreferences).values({
      userId,
      preferredCategories,
      ignoredAlertTypes,
      avgShutdownHour,
      totalStops,
    });
  }
}

export async function getPreferredStops(userId: string): Promise<string[]> {
  const prefs = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);

  if (prefs.length === 0) return [];

  const categories = prefs[0].preferredCategories as CategoryCount;
  return Object.entries(categories)
    .sort((a, b) => b[1] - a[1])
    .map(([cat]) => cat);
}

export async function getAvgShutdownTime(userId: string): Promise<number | null> {
  const prefs = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);

  return prefs.length > 0 ? prefs[0].avgShutdownHour : null;
}

export async function getIgnoredAlertTypes(userId: string): Promise<string[]> {
  const prefs = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);

  if (prefs.length === 0) return [];

  const ignored = prefs[0].ignoredAlertTypes as AlertIgnoreCount;
  const threshold = 3;
  
  return Object.entries(ignored)
    .filter(([, count]) => count >= threshold)
    .map(([type]) => type);
}

export async function getUserPreferences(userId: string) {
  const prefs = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);

  if (prefs.length === 0) {
    return {
      preferredCategories: [] as string[],
      ignoredAlertTypes: [] as string[],
      avgShutdownHour: null as number | null,
      totalStops: 0,
    };
  }

  const pref = prefs[0];
  const categories = pref.preferredCategories as CategoryCount;
  const ignored = pref.ignoredAlertTypes as AlertIgnoreCount;

  return {
    preferredCategories: Object.entries(categories)
      .sort((a, b) => b[1] - a[1])
      .map(([cat]) => cat),
    ignoredAlertTypes: Object.entries(ignored)
      .filter(([, count]) => count >= 3)
      .map(([type]) => type),
    avgShutdownHour: pref.avgShutdownHour,
    totalStops: pref.totalStops,
  };
}

export function rankPOIsByPreference<T extends { facilityKind?: string | null }>(
  pois: T[],
  preferredCategories: string[]
): T[] {
  if (preferredCategories.length === 0) return pois;

  return [...pois].sort((a, b) => {
    const aKind = a.facilityKind?.toLowerCase() || "";
    const bKind = b.facilityKind?.toLowerCase() || "";

    const aIndex = preferredCategories.findIndex(cat => aKind.includes(cat.toLowerCase()));
    const bIndex = preferredCategories.findIndex(cat => bKind.includes(cat.toLowerCase()));

    const aScore = aIndex === -1 ? 999 : aIndex;
    const bScore = bIndex === -1 ? 999 : bIndex;

    return aScore - bScore;
  });
}

export function shouldShowAlert(
  alertType: string,
  ignoredAlertTypes: string[]
): boolean {
  return !ignoredAlertTypes.includes(alertType);
}
