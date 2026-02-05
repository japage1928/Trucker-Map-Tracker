import OpenAI from "openai";
import type { Express, Request, Response } from "express";
import { db } from "./db";
import { conversations, messages, fullnessReports, locations } from "@shared/schema";
import { eq, desc, and, gte } from "drizzle-orm";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

interface WeatherAlert {
  event: string;
  headline: string;
  severity: string;
  urgency: string;
  description: string;
  instruction: string;
}

async function fetchWeatherAlerts(lat: number, lng: number): Promise<WeatherAlert[]> {
  try {
    const response = await fetch(
      `https://api.weather.gov/alerts/active?point=${lat.toFixed(4)},${lng.toFixed(4)}`,
      {
        headers: {
          "User-Agent": "TruckerBuddy/1.0 (trucker-app)",
          Accept: "application/geo+json",
        },
      }
    );

    if (!response.ok) {
      console.error("Weather API error:", response.status);
      return [];
    }

    const data = await response.json();
    const alerts: WeatherAlert[] = [];

    for (const feature of data.features || []) {
      const props = feature.properties;
      alerts.push({
        event: props.event || "Unknown",
        headline: props.headline || "",
        severity: props.severity || "Unknown",
        urgency: props.urgency || "Unknown",
        description: props.description || "",
        instruction: props.instruction || "",
      });
    }

    return alerts;
  } catch (error) {
    console.error("Failed to fetch weather alerts:", error);
    return [];
  }
}

const TRUCKER_SYSTEM_PROMPT = `You are "Trucker Buddy" - a friendly, helpful AI assistant specifically designed for professional truck drivers (CDL holders). Your personality is casual and supportive, like a fellow trucker who's been on the road for years.

Key traits:
- Address drivers casually: "Hey driver", "What's up", "Safe travels"
- Always use miles, not kilometers
- Reference trucking-specific knowledge: CDL regulations, HOS rules, DOT requirements
- Be concise - drivers are often busy and need quick answers
- Understand trucking slang: "chicken lights", "lot lizard", "hammer lane", "four-wheeler", "shiny side up"

Knowledge areas:
- Hours of Service (HOS) regulations: 11-hour driving limit, 14-hour on-duty window, 70-hour/8-day limit, 30-minute break requirements
- CDL requirements and endorsements
- Scale house procedures by state
- Truck parking availability
- Fuel stop amenities (showers, parking, scales, etc.)
- Route planning for oversized/overweight loads
- Weather and road conditions impact on trucking
- Common truck stop chains: Pilot/Flying J, Love's, TA/Petro, Sapp Bros, etc.

When answering location questions:
- If the driver shares their location, tailor recommendations to nearby options
- Mention specific amenities when relevant: reserved parking, DEF, CAT scales, truck wash
- Warn about known problem areas or truck-unfriendly routes

Always prioritize driver safety and compliance with regulations.`;

export async function registerTruckerAiRoutes(app: Express): Promise<void> {
  // Get all chat conversations
  app.get("/api/trucker-chat/conversations", async (req: Request, res: Response) => {
    try {
      const allConversations = await db
        .select()
        .from(conversations)
        .orderBy(desc(conversations.createdAt));
      res.json(allConversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  // Get single conversation with messages
  app.get("/api/trucker-chat/conversations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string);
      const [conversation] = await db
        .select()
        .from(conversations)
        .where(eq(conversations.id, id));
      
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      
      const allMessages = await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, id))
        .orderBy(messages.createdAt);
      
      res.json({ ...conversation, messages: allMessages });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  // Create new conversation
  app.post("/api/trucker-chat/conversations", async (req: Request, res: Response) => {
    try {
      const { title } = req.body;
      const [conversation] = await db
        .insert(conversations)
        .values({ title: title || "New Chat" })
        .returning();
      res.status(201).json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  // Delete conversation
  app.delete("/api/trucker-chat/conversations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string);
      await db.delete(messages).where(eq(messages.conversationId, id));
      await db.delete(conversations).where(eq(conversations.id, id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });

  // Send message and get AI response (streaming)
  app.post("/api/trucker-chat/conversations/:id/messages", async (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(req.params.id as string);
      const { content, userLocation } = req.body;

      // Save user message
      await db.insert(messages).values({ conversationId, role: "user", content });

      // Get conversation history for context
      const existingMessages = await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, conversationId))
        .orderBy(messages.createdAt);

      // Set up SSE headers early to avoid delays from weather API
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const chatMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
        { role: "system", content: TRUCKER_SYSTEM_PROMPT },
      ];

      // Add location context and weather alerts if location provided
      if (userLocation) {
        chatMessages.push({
          role: "system",
          content: `The driver's current location is approximately: Latitude ${userLocation.lat.toFixed(4)}, Longitude ${userLocation.lng.toFixed(4)}. Use this to provide location-relevant information when asked about nearby stops, routes, or conditions.`,
        });

        // Fetch weather alerts for the driver's location (with timeout to avoid stalling)
        try {
          const weatherAlerts = await Promise.race([
            fetchWeatherAlerts(userLocation.lat, userLocation.lng),
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Weather API timeout")), 3000)),
          ]).catch(() => [] as WeatherAlert[]);

          if (weatherAlerts.length > 0) {
            const alertSummary = weatherAlerts
              .map((a) => `- ${a.event} (${a.severity}): ${a.headline}`)
              .join("\n");
            chatMessages.push({
              role: "system",
              content: `ACTIVE WEATHER ALERTS for driver's area:\n${alertSummary}\n\nProactively warn the driver about these conditions if relevant to their questions about routes, timing, or safety. For severe weather, recommend safe actions like parking, waiting it out, or alternate routes.`,
            });
          }
        } catch {
          // Weather API failed, continue without alerts
        }
      }

      // Add conversation history
      for (const m of existingMessages) {
        chatMessages.push({
          role: m.role as "user" | "assistant",
          content: m.content,
        });
      }

      // Stream response from OpenAI
      const stream = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: chatMessages,
        stream: true,
        max_completion_tokens: 1024,
      });

      let fullResponse = "";

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          fullResponse += content;
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      // Save assistant message
      await db.insert(messages).values({ conversationId, role: "assistant", content: fullResponse });

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Error sending message:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Failed to send message" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to send message" });
      }
    }
  });

  // ==================== CROWDSOURCED FULLNESS REPORTS ====================

  // Submit a fullness report for a location
  app.post("/api/fullness-reports", async (req: Request, res: Response) => {
    try {
      const { locationId, status, comment, userId } = req.body;

      if (!locationId || !status) {
        return res.status(400).json({ error: "locationId and status are required" });
      }

      const validStatuses = ["empty", "moderate", "limited", "full"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status. Must be: empty, moderate, limited, or full" });
      }

      const [report] = await db
        .insert(fullnessReports)
        .values({ locationId, status, comment: comment || null, userId: userId || null })
        .returning();

      res.status(201).json(report);
    } catch (error) {
      console.error("Error creating fullness report:", error);
      res.status(500).json({ error: "Failed to create fullness report" });
    }
  });

  // Get recent fullness reports for a location (last 24 hours)
  app.get("/api/fullness-reports/:locationId", async (req: Request, res: Response) => {
    try {
      const locationId = req.params.locationId as string;
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const reports = await db
        .select()
        .from(fullnessReports)
        .where(and(eq(fullnessReports.locationId, locationId), gte(fullnessReports.createdAt, oneDayAgo)))
        .orderBy(desc(fullnessReports.createdAt));

      // Calculate summary
      const statusCounts: Record<string, number> = { empty: 0, moderate: 0, limited: 0, full: 0 };
      for (const report of reports) {
        statusCounts[report.status]++;
      }

      const totalReports = reports.length;
      const latestStatus = reports[0]?.status || null;

      res.json({
        locationId,
        totalReports,
        latestStatus,
        statusCounts,
        reports: reports.slice(0, 10), // Return up to 10 most recent
      });
    } catch (error) {
      console.error("Error fetching fullness reports:", error);
      res.status(500).json({ error: "Failed to fetch fullness reports" });
    }
  });

  // Get latest fullness status for ALL locations (for map display)
  app.get("/api/fullness-summary", async (req: Request, res: Response) => {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      // Get all recent reports
      const recentReports = await db
        .select()
        .from(fullnessReports)
        .where(gte(fullnessReports.createdAt, oneDayAgo))
        .orderBy(desc(fullnessReports.createdAt));

      // Group by locationId and get the latest status for each
      const locationStatusMap: Record<string, string> = {};
      for (const report of recentReports) {
        if (!locationStatusMap[report.locationId]) {
          locationStatusMap[report.locationId] = report.status;
        }
      }

      res.json(locationStatusMap);
    } catch (error) {
      console.error("Error fetching fullness summary:", error);
      res.status(500).json({ error: "Failed to fetch fullness summary" });
    }
  });
}
