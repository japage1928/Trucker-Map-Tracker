
import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, isAuthenticated, registerAuthRoutes } from "./replit_integrations/auth";
import { registerTruckerAiRoutes } from "./trucker-ai";
import { logUserEvent, getUserPreferences } from "./userMemory";

function getUserId(req: Request): string {
  return (req.user as any)?.claims?.sub;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);
  
  await registerTruckerAiRoutes(app);
  
  app.get(api.locations.list.path, isAuthenticated, async (req, res) => {
    const locations = await storage.getLocations();
    res.json(locations);
  });

  app.get(api.locations.get.path, isAuthenticated, async (req, res) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const location = await storage.getLocation(id);
    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }
    res.json(location);
  });

  app.post(api.locations.create.path, isAuthenticated, async (req, res) => {
    return res.status(403).json({
      message: "Creating new facilities is disabled.",
    });
  });

  app.put(api.locations.update.path, isAuthenticated, async (req, res) => {
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

  app.delete(api.locations.delete.path, isAuthenticated, async (req, res) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await storage.deleteLocation(id);
    res.status(204).send();
  });

  app.post("/api/user-events", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { eventType, locationId, category, alertType, metadata } = req.body;
      
      await logUserEvent(userId, eventType, {
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

  app.get("/api/user-preferences", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const preferences = await getUserPreferences(userId);
      res.json(preferences);
    } catch (error) {
      console.error("Failed to get user preferences:", error);
      res.status(500).json({ message: "Failed to get preferences" });
    }
  });

  app.get("/api/purchases/parkingInsights", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const purchase = await storage.getPurchase(userId, "parkingInsights");
      res.json({
        hasPurchase: !!purchase,
        purchasedAt: purchase?.purchasedAt,
      });
    } catch (error) {
      console.error("Failed to check purchase:", error);
      res.status(500).json({ message: "Failed to check purchase status" });
    }
  });

  app.post("/api/purchases/parkingInsights", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      
      const existing = await storage.getPurchase(userId, "parkingInsights");
      if (existing) {
        return res.json({
          hasPurchase: true,
          purchasedAt: existing.purchasedAt,
        });
      }

      const purchase = await storage.createPurchase(userId, "parkingInsights");
      
      res.status(201).json({
        hasPurchase: true,
        purchasedAt: purchase.purchasedAt,
      });
    } catch (error) {
      console.error("Failed to create purchase:", error);
      res.status(500).json({ message: "Failed to process purchase" });
    }
  });

  app.post("/api/parking-pings", async (req, res) => {
    try {
      const { stopId, hour, dayType } = req.body;
      
      if (!stopId || typeof hour !== 'number' || !dayType) {
        return res.status(400).json({ message: "Invalid ping data" });
      }

      storage.logParkingPing(stopId, hour, dayType).catch(err => {
        console.error("Failed to log parking ping:", err);
      });

      res.status(202).json({ success: true });
    } catch (error) {
      console.error("Parking ping endpoint error:", error);
      res.status(500).json({ message: "Failed to log ping" });
    }
  });

  return httpServer;
}
