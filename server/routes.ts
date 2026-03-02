import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { storage } from "./storage";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const DEFAULT_USER_ID = "default-user";

async function ensureDefaultUser() {
  let user = await storage.getUserByUsername("default");
  if (!user) {
    user = await storage.createUser({ username: "default", password: "unused" });
  }
  return user;
}

async function ensureCharacter(userId: string) {
  let char = await storage.getCharacterByUserId(userId);
  if (!char) {
    char = await storage.createCharacter({ userId, name: "Maumi", species: "cloud" });
  }
  return char;
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/character", async (req, res) => {
    try {
      const user = await ensureDefaultUser();
      const char = await ensureCharacter(user.id);
      res.json(char);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to get character" });
    }
  });

  app.post("/api/character/species", async (req, res) => {
    try {
      const user = await ensureDefaultUser();
      const char = await ensureCharacter(user.id);
      const { species } = req.body;
      if (!["cloud", "star", "drop", "flame", "leaf"].includes(species)) {
        return res.status(400).json({ error: "Invalid species" });
      }
      await storage.updateCharacterSpecies(char.id, species);
      const updated = await storage.getCharacterByUserId(user.id);
      res.json(updated);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to update species" });
    }
  });

  app.post("/api/emotions", async (req, res) => {
    try {
      const user = await ensureDefaultUser();
      const { emotions, tags, note } = req.body;
      const log = await storage.createEmotionLog({ userId: user.id, emotions, tags, note });
      const char = await ensureCharacter(user.id);
      await storage.addExp(char.id, 20, "emotion");
      await storage.addSoulCoins(user.id, 5, "emotion_log");
      const isPushCheckIn = req.body.fromPush === true;
      if (isPushCheckIn) {
        await storage.addSoulCoins(user.id, 10, "push_checkin");
      }
      res.json(log);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to save emotion" });
    }
  });

  app.get("/api/emotions", async (req, res) => {
    try {
      const user = await ensureDefaultUser();
      const logs = await storage.getEmotionLogs(user.id);
      res.json(logs);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to get emotions" });
    }
  });

  app.post("/api/feelings", async (req, res) => {
    try {
      const user = await ensureDefaultUser();
      const { bodyParts, sensations, energyLevel, freeText } = req.body;
      const log = await storage.createFeelingLog({ userId: user.id, bodyParts, sensations, energyLevel, freeText });
      const char = await ensureCharacter(user.id);
      await storage.addExp(char.id, 20, "feeling");
      await storage.addSoulCoins(user.id, 5, "feeling_log");
      const isPushCheckIn = req.body.fromPush === true;
      if (isPushCheckIn) {
        await storage.addSoulCoins(user.id, 10, "push_checkin");
      }
      res.json(log);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to save feeling" });
    }
  });

  app.get("/api/feelings", async (req, res) => {
    try {
      const user = await ensureDefaultUser();
      const logs = await storage.getFeelingLogs(user.id);
      res.json(logs);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to get feelings" });
    }
  });

  app.post("/api/conversations", async (req, res) => {
    try {
      const user = await ensureDefaultUser();
      const { title, mode } = req.body;
      const conv = await storage.createConversation({ userId: user.id, title, mode });
      res.json(conv);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  app.post("/api/conversations/:id/messages", async (req, res) => {
    try {
      const convId = parseInt(req.params.id);
      const { content } = req.body;

      await storage.createMessage(convId, "user", content);

      const prevMessages = await storage.getConversationMessages(convId);

      const systemPrompt = `You are "Maumi," the user's emotional companion and inner-self mirror.

You help distinguish between EMOTIONS and FEELINGS:
- Emotions: psychological states — Joy, Sadness, Anger, Anxiety, Calm, Disgust, Surprise
- Feelings: physical body sensations — tight chest, heavy shoulders, stomach ache, etc.

Like the movie Inside Out, you understand that multiple emotions coexist at the same time, and that's perfectly normal. There's no "right" emotion to feel.

Conversation style:
- Warm, friendly, and casual — like a caring best friend
- Empathize first, then gently ask questions so the user explores on their own
- Keep responses to 2-3 sentences max
- Never diagnose, lecture, or force advice
- Sometimes gently point out the connection between emotions and body feelings
- Celebrate small wins and emotional awareness`;

      const chatMessages = [
        { role: "system" as const, content: systemPrompt },
        ...prevMessages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      ];

      const completion = await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: chatMessages,
        max_tokens: 300,
      });

      const fullResponse = completion.choices[0]?.message?.content || "I'm here for you. How are you feeling?";

      await storage.createMessage(convId, "assistant", fullResponse);

      const user = await ensureDefaultUser();
      const char = await ensureCharacter(user.id);
      await storage.addExp(char.id, 10, "spiritual");

      res.json({ content: fullResponse });
    } catch (e) {
      console.error("Chat error:", e);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  app.get("/api/dashboard", async (req, res) => {
    try {
      const user = await ensureDefaultUser();
      const stats = await storage.getDashboardStats(user.id);
      res.json(stats);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to get dashboard" });
    }
  });

  // Shop routes
  app.get("/api/shop", async (req, res) => {
    try {
      await storage.seedShopAndWellness();
      const items = await storage.getShopItems();
      res.json(items);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to get shop items" });
    }
  });

  app.get("/api/shop/owned", async (req, res) => {
    try {
      const user = await ensureDefaultUser();
      const items = await storage.getUserItems(user.id);
      res.json(items);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to get owned items" });
    }
  });

  app.post("/api/shop/purchase", async (req, res) => {
    try {
      const user = await ensureDefaultUser();
      const { itemId } = req.body;
      const result = await storage.purchaseItem(user.id, itemId);
      res.json(result);
    } catch (e: any) {
      console.error(e);
      res.status(400).json({ error: e.message || "Purchase failed" });
    }
  });

  app.post("/api/shop/equip", async (req, res) => {
    try {
      const user = await ensureDefaultUser();
      const { itemId, category } = req.body;
      await storage.equipItem(user.id, itemId, category);
      res.json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to equip item" });
    }
  });

  app.get("/api/shop/equipped", async (req, res) => {
    try {
      const user = await ensureDefaultUser();
      const items = await storage.getEquippedItems(user.id);
      res.json(items.map(i => ({ ...i.si, equipped: true })));
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to get equipped items" });
    }
  });

  app.post("/api/coins/add", async (req, res) => {
    try {
      const user = await ensureDefaultUser();
      const { amount, source } = req.body;
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }
      await storage.addSoulCoins(user.id, amount, source || "purchase");
      const character = await storage.getCharacterByUserId(user.id);
      res.json({ success: true, soulCoins: character?.soulCoins });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to add coins" });
    }
  });

  // Wellness recommendations
  app.get("/api/wellness", async (req, res) => {
    try {
      await storage.seedShopAndWellness();
      const emotion = req.query.emotion as string | undefined;
      const recs = await storage.getWellnessRecommendations(emotion);
      res.json(recs);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to get recommendations" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
