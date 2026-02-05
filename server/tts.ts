import type { Express } from "express";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export type TTSVoice = "nova" | "onyx" | "alloy" | "echo" | "fable" | "shimmer";

export function registerTTSRoutes(app: Express) {
  app.post("/api/tts", async (req, res) => {
    try {
      const { text, voice = "nova" } = req.body as { text: string; voice?: TTSVoice };

      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "Text is required" });
      }

      const truncatedText = text.slice(0, 4096);

      const response = await openai.audio.speech.create({
        model: "tts-1",
        voice: voice,
        input: truncatedText,
        response_format: "mp3",
      });

      const buffer = Buffer.from(await response.arrayBuffer());

      res.set({
        "Content-Type": "audio/mpeg",
        "Content-Length": buffer.length.toString(),
      });

      res.send(buffer);
    } catch (error) {
      console.error("TTS error:", error);
      res.status(500).json({ error: "Failed to generate speech" });
    }
  });
}
