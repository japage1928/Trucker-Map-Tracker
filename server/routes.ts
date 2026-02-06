
import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth } from "./auth";
import { registerTruckerAiRoutes } from "./trucker-ai";
import { logUserEvent, getUserPreferences } from "./userMemory";
import type { User } from "@shared/schema";

// Middleware to require authentication for protected routes
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup authentication routes: /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);
  
  // Register Trucker Buddy AI routes
  await registerTruckerAiRoutes(app);
  
  // All location routes require authentication
  app.get(api.locations.list.path, requireAuth, async (req, res) => {
    const locations = await storage.getLocations();
    res.json(locations);
  });

  app.get(api.locations.get.path, requireAuth, async (req, res) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const location = await storage.getLocation(id);
    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }
    res.json(location);
  });

  app.post(api.locations.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.locations.create.input.parse(req.body);
      const location = await storage.createLocation(input);
      res.status(201).json(location);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.put(api.locations.update.path, requireAuth, async (req, res) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const input = api.locations.update.input.parse(req.body);
      const location = await storage.updateLocation(id, input);
      if (!location) {
        return res.status(404).json({ message: 'Location not found' });
      }
      res.json(location);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.locations.delete.path, requireAuth, async (req, res) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await storage.deleteLocation(id);
    res.status(204).send();
  });

  app.post("/api/user-events", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const { eventType, locationId, category, alertType, metadata } = req.body;
      
      await logUserEvent(user.id, eventType, {
        locationId,
        category,
        alertType,
        metadata,
      });
      
      res.status(201).json({ success: true });
    } catch (error) {
      console.error("Failed to log user event:", error);
      res.status(500).json({ message: "Failed to log event" });
    }
  });

  app.get("/api/user-preferences", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const preferences = await getUserPreferences(user.id);
      res.json(preferences);
    } catch (error) {
      console.error("Failed to get user preferences:", error);
      res.status(500).json({ message: "Failed to get preferences" });
    }
  });

  // Parking Insights Purchase Endpoints
  app.get("/api/purchases/parkingInsights", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const purchase = await storage.getPurchase(user.id, "parkingInsights");
      res.json({
        hasPurchase: !!purchase,
        purchasedAt: purchase?.purchasedAt,
      });
    } catch (error) {
      console.error("Failed to check purchase:", error);
      res.status(500).json({ message: "Failed to check purchase status" });
    }
  });

  app.post("/api/purchases/parkingInsights", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      
      // Check if already purchased
      const existing = await storage.getPurchase(user.id, "parkingInsights");
      if (existing) {
        return res.json({
          hasPurchase: true,
          purchasedAt: existing.purchasedAt,
        });
      }

      // In production, this is where you'd integrate with Stripe/Apple Pay/Google Pay
      // For now, we'll create the purchase record directly
      const purchase = await storage.createPurchase(user.id, "parkingInsights");
      
      res.status(201).json({
        hasPurchase: true,
        purchasedAt: purchase.purchasedAt,
      });
    } catch (error) {
      console.error("Failed to create purchase:", error);
      res.status(500).json({ message: "Failed to process purchase" });
    }
  });

  // Parking Ping Logging (anonymous aggregate data)
  app.post("/api/parking-pings", async (req, res) => {
    try {
      const { stopId, hour, dayType } = req.body;
      
      if (!stopId || typeof hour !== 'number' || !dayType) {
        return res.status(400).json({ message: "Invalid ping data" });
      }

      // Fire-and-forget logging
      storage.logParkingPing(stopId, hour, dayType).catch(err => {
        console.error("Failed to log parking ping:", err);
      });

      // Return immediately (non-blocking)
      res.status(202).json({ success: true });
    } catch (error) {
      console.error("Parking ping endpoint error:", error);
      res.status(500).json({ message: "Failed to log ping" });
    }
  });

  return httpServer;
}
