import { db } from "./db";
import {
  users,
  characters,
  emotionLogs,
  feelingLogs,
  quests,
  conversations,
  messages,
  shopItems,
  userItems,
  coinTransactions,
  wellnessRecommendations,
  type User,
  type InsertUser,
} from "@shared/schema";
import { eq, desc, and, count } from "drizzle-orm";

export const storage = {
  async getUser(id: string) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  },

  async getUserByUsername(username: string) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  },

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  },

  async getCharacterByUserId(userId: string) {
    const [char] = await db.select().from(characters).where(eq(characters.userId, userId));
    return char || null;
  },

  async createCharacter(data: { userId: string; name: string; species: string }) {
    const [char] = await db.insert(characters).values(data).returning();
    return char;
  },

  async updateCharacterSpecies(characterId: number, species: string) {
    await db.update(characters).set({ species }).where(eq(characters.id, characterId));
  },

  async addExp(characterId: number, exp: number, dimension?: "emotion" | "feeling" | "stress" | "spiritual") {
    const [char] = await db.select().from(characters).where(eq(characters.id, characterId));
    if (!char) return null;

    const newTotalExp = char.totalExp + exp;
    const newLevel = Math.floor(newTotalExp / 100) + 1;
    const newStage = Math.min(Math.floor(newLevel / 5) + 1, 5);

    const coinReward = Math.max(Math.floor(exp / 4), 1);
    const updates: any = {
      totalExp: newTotalExp,
      level: newLevel,
      evolutionStage: newStage,
      soulCoins: (char.soulCoins || 0) + coinReward,
      updatedAt: new Date(),
    };

    if (dimension === "emotion") updates.emotionGrowth = Math.min(char.emotionGrowth + Math.floor(exp / 2), 100);
    if (dimension === "feeling") updates.feelingGrowth = Math.min(char.feelingGrowth + Math.floor(exp / 2), 100);
    if (dimension === "stress") updates.stressManagement = Math.min(char.stressManagement + Math.floor(exp / 2), 100);
    if (dimension === "spiritual") updates.spiritualGrowth = Math.min(char.spiritualGrowth + Math.floor(exp / 2), 100);

    const [updated] = await db.update(characters).set(updates).where(eq(characters.id, characterId)).returning();
    return updated;
  },

  async createEmotionLog(data: { userId: string; emotions: any; tags?: any; note?: string }) {
    const [log] = await db.insert(emotionLogs).values({
      userId: data.userId,
      emotions: data.emotions,
      tags: data.tags || [],
      note: data.note || null,
    }).returning();
    return log;
  },

  async getEmotionLogs(userId: string, limit = 50) {
    return db.select().from(emotionLogs).where(eq(emotionLogs.userId, userId)).orderBy(desc(emotionLogs.loggedAt)).limit(limit);
  },

  async createFeelingLog(data: { userId: string; bodyParts?: any; sensations?: any; energyLevel: number; freeText?: string }) {
    const [log] = await db.insert(feelingLogs).values({
      userId: data.userId,
      bodyParts: data.bodyParts || [],
      sensations: data.sensations || [],
      energyLevel: data.energyLevel,
      freeText: data.freeText || null,
    }).returning();
    return log;
  },

  async getFeelingLogs(userId: string, limit = 50) {
    return db.select().from(feelingLogs).where(eq(feelingLogs.userId, userId)).orderBy(desc(feelingLogs.loggedAt)).limit(limit);
  },

  async createConversation(data: { userId?: string; title: string; mode?: string }) {
    const [conv] = await db.insert(conversations).values({
      userId: data.userId || null,
      title: data.title,
      mode: data.mode || "chat",
    }).returning();
    return conv;
  },

  async getConversationMessages(conversationId: number) {
    return db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.createdAt);
  },

  async createMessage(conversationId: number, role: string, content: string) {
    const [msg] = await db.insert(messages).values({ conversationId, role, content }).returning();
    return msg;
  },

  async getDashboardStats(userId: string) {
    const [emotionCount] = await db.select({ count: count() }).from(emotionLogs).where(eq(emotionLogs.userId, userId));
    const [feelingCount] = await db.select({ count: count() }).from(feelingLogs).where(eq(feelingLogs.userId, userId));
    const [questCount] = await db.select({ count: count() }).from(quests).where(and(eq(quests.userId, userId), eq(quests.status, "completed")));

    return {
      totalEmotionLogs: emotionCount?.count || 0,
      totalFeelingLogs: feelingCount?.count || 0,
      totalQuests: questCount?.count || 0,
      streak: 0,
    };
  },

  async getShopItems() {
    return db.select().from(shopItems).where(eq(shopItems.isActive, true));
  },

  async getUserItems(userId: string) {
    return db.select().from(userItems).where(eq(userItems.userId, userId));
  },

  async purchaseItem(userId: string, itemId: number) {
    const [item] = await db.select().from(shopItems).where(eq(shopItems.id, itemId));
    if (!item) throw new Error("Item not found");

    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) throw new Error("User not found");

    const [char] = await db.select().from(characters).where(eq(characters.userId, userId));
    if (!char) throw new Error("Character not found");
    if ((char.soulCoins || 0) < item.price) throw new Error("Not enough Soul Coins");

    const [existing] = await db.select().from(userItems).where(and(eq(userItems.userId, userId), eq(userItems.itemId, itemId)));
    if (existing) throw new Error("Already owned");

    await db.update(characters).set({ soulCoins: (char.soulCoins || 0) - item.price }).where(eq(characters.id, char.id));

    await db.insert(coinTransactions).values({
      userId, amount: -item.price, type: "purchase", description: `Purchased ${item.name}`,
    });

    const [userItem] = await db.insert(userItems).values({ userId, itemId }).returning();
    return userItem;
  },

  async equipItem(userId: string, itemId: number, category: string) {
    await db.update(userItems).set({ equipped: false }).where(and(eq(userItems.userId, userId)));
    
    const items = await db.select({ ui: userItems, si: shopItems })
      .from(userItems)
      .innerJoin(shopItems, eq(userItems.itemId, shopItems.id))
      .where(and(eq(userItems.userId, userId), eq(shopItems.category, category)));
    
    for (const i of items) {
      await db.update(userItems).set({ equipped: false }).where(eq(userItems.id, i.ui.id));
    }

    await db.update(userItems).set({ equipped: true }).where(and(eq(userItems.userId, userId), eq(userItems.itemId, itemId)));
  },

  async addSoulCoins(userId: string, amount: number, source: string) {
    const [char] = await db.select().from(characters).where(eq(characters.userId, userId));
    if (!char) throw new Error("Character not found");
    await db.update(characters).set({ soulCoins: (char.soulCoins || 0) + amount }).where(eq(characters.id, char.id));
    await db.insert(coinTransactions).values({
      userId, amount, type: source, description: `Added ${amount} Soul Coins (${source})`,
    });
  },

  async getWellnessRecommendations(emotionTrigger?: string) {
    if (emotionTrigger) {
      return db.select().from(wellnessRecommendations)
        .where(and(eq(wellnessRecommendations.isActive, true), eq(wellnessRecommendations.emotionTrigger, emotionTrigger)));
    }
    return db.select().from(wellnessRecommendations).where(eq(wellnessRecommendations.isActive, true));
  },

  async seedShopAndWellness() {
    const existing = await db.select({ id: shopItems.id }).from(shopItems).limit(1);
    if (existing.length > 0) return;

    await db.insert(shopItems).values([
      { name: "Beanie", description: "cozy knit beanie", category: "hat", price: 25, imageEmoji: "🧶", imageAsset: "hat_beanie", rarity: "common" },
      { name: "Top Hat", description: "classic gentleman", category: "hat", price: 75, imageEmoji: "🎩", imageAsset: "hat_tophat", rarity: "rare" },
      { name: "Crown", description: "royal crown", category: "hat", price: 400, imageEmoji: "👑", imageAsset: "hat_crown", rarity: "legendary" },
      { name: "Baseball Cap", description: "sporty cap", category: "hat", price: 20, imageEmoji: "🧢", imageAsset: "hat_baseball", rarity: "common" },
      { name: "Wizard Hat", description: "magical hat", category: "hat", price: 150, imageEmoji: "🪄", imageAsset: "hat_wizard", rarity: "epic" },
      { name: "Party Hat", description: "celebration time", category: "hat", price: 30, imageEmoji: "🎉", imageAsset: "hat_party", rarity: "common" },
      { name: "Cowboy Hat", description: "yeehaw", category: "hat", price: 65, imageEmoji: "🤠", imageAsset: "hat_cowboy", rarity: "rare" },
      { name: "Santa Hat", description: "holiday spirit", category: "hat", price: 80, imageEmoji: "🎅", imageAsset: "hat_santa", rarity: "rare" },
      { name: "Chef Hat", description: "bon appetit", category: "hat", price: 35, imageEmoji: "👨‍🍳", imageAsset: "hat_chef", rarity: "common" },
      { name: "Beret", description: "artsy vibes", category: "hat", price: 70, imageEmoji: "🎨", imageAsset: "hat_beret", rarity: "rare" },

      { name: "Round Glasses", description: "classic round", category: "glasses", price: 20, imageEmoji: "👓", imageAsset: "glasses_round", rarity: "common" },
      { name: "Reading Glasses", description: "scholarly look", category: "glasses", price: 25, imageEmoji: "📖", rarity: "common" },
      { name: "Monocle", description: "distinguished", category: "glasses", price: 75, imageEmoji: "🧐", imageAsset: "glasses_monocle", rarity: "rare" },
      { name: "Nerd Glasses", description: "brainy style", category: "glasses", price: 30, imageEmoji: "🤓", imageAsset: "glasses_nerd", rarity: "common" },
      { name: "Rose Glasses", description: "see the world pink", category: "glasses", price: 65, imageEmoji: "🌹", rarity: "rare" },
      { name: "Crystal Glasses", description: "magical vision", category: "glasses", price: 130, imageEmoji: "✨", rarity: "epic" },
      { name: "Diamond Glasses", description: "luxury frames", category: "glasses", price: 350, imageEmoji: "💎", imageAsset: "glasses_diamond", rarity: "legendary" },
      { name: "Retro Glasses", description: "vintage vibes", category: "glasses", price: 55, imageEmoji: "📺", rarity: "rare" },
      { name: "Star Glasses", description: "star-shaped", category: "glasses", price: 35, imageEmoji: "⭐", imageAsset: "glasses_star", rarity: "common" },
      { name: "Heart Glasses", description: "lovely look", category: "glasses", price: 60, imageEmoji: "💕", imageAsset: "glasses_heart", rarity: "rare" },

      { name: "Aviator Shades", description: "classic cool", category: "sunglasses", price: 30, imageEmoji: "🕶️", imageAsset: "sunglasses_aviator", rarity: "common" },
      { name: "Mirror Shades", description: "reflective style", category: "sunglasses", price: 70, imageEmoji: "🪞", rarity: "rare" },
      { name: "Cat Eye Shades", description: "sassy cat", category: "sunglasses", price: 35, imageEmoji: "😎", rarity: "common" },
      { name: "Sport Shades", description: "athletic look", category: "sunglasses", price: 25, imageEmoji: "🏃", rarity: "common" },
      { name: "Gold Shades", description: "golden frames", category: "sunglasses", price: 140, imageEmoji: "🥇", rarity: "epic" },
      { name: "Rainbow Shades", description: "colorful vibes", category: "sunglasses", price: 80, imageEmoji: "🌈", imageAsset: "sunglasses_rainbow", rarity: "rare" },
      { name: "Pixel Shades", description: "8-bit style", category: "sunglasses", price: 65, imageEmoji: "🎮", imageAsset: "sunglasses_pixel", rarity: "rare" },
      { name: "Star Shades", description: "Hollywood", category: "sunglasses", price: 40, imageEmoji: "🌟", rarity: "common" },
      { name: "Galaxy Shades", description: "cosmic view", category: "sunglasses", price: 160, imageEmoji: "🌌", imageAsset: "sunglasses_galaxy", rarity: "epic" },
      { name: "Diamond Shades", description: "blinged out", category: "sunglasses", price: 380, imageEmoji: "💍", rarity: "legendary" },

      { name: "T-Shirt", description: "casual comfort", category: "clothes", price: 20, imageEmoji: "👕", rarity: "common" },
      { name: "Hoodie", description: "cozy hoodie", category: "clothes", price: 30, imageEmoji: "🧥", imageAsset: "clothes_hoodie", rarity: "common" },
      { name: "Tuxedo", description: "formal elegance", category: "clothes", price: 150, imageEmoji: "🤵", imageAsset: "clothes_tuxedo", rarity: "epic" },
      { name: "Superhero Cape", description: "powers activate", category: "clothes", price: 85, imageEmoji: "🦸", imageAsset: "clothes_cape", rarity: "rare" },
      { name: "Lab Coat", description: "scientist mode", category: "clothes", price: 70, imageEmoji: "🧪", imageAsset: "clothes_labcoat", rarity: "rare" },
      { name: "Kimono", description: "traditional beauty", category: "clothes", price: 130, imageEmoji: "👘", imageAsset: "clothes_kimono", rarity: "epic" },
      { name: "Sweater", description: "warm and fuzzy", category: "clothes", price: 25, imageEmoji: "🧶", rarity: "common" },
      { name: "Leather Jacket", description: "rebel style", category: "clothes", price: 90, imageEmoji: "🎸", imageAsset: "clothes_leather", rarity: "rare" },
      { name: "Royal Robe", description: "regal attire", category: "clothes", price: 450, imageEmoji: "👑", imageAsset: "clothes_robe", rarity: "legendary" },
      { name: "Space Suit", description: "astronaut ready", category: "clothes", price: 180, imageEmoji: "🚀", imageAsset: "clothes_spacesuit", rarity: "epic" },

      { name: "Backpack", description: "adventure ready", category: "bag", price: 20, imageEmoji: "🎒", imageAsset: "bag_backpack", rarity: "common" },
      { name: "Tote Bag", description: "eco friendly", category: "bag", price: 25, imageEmoji: "🛍️", rarity: "common" },
      { name: "Messenger Bag", description: "city walker", category: "bag", price: 30, imageEmoji: "📨", rarity: "common" },
      { name: "Treasure Chest", description: "pirate loot", category: "bag", price: 140, imageEmoji: "🏴‍☠️", imageAsset: "bag_treasure", rarity: "epic" },
      { name: "Gift Bag", description: "surprise inside", category: "bag", price: 60, imageEmoji: "🎁", rarity: "rare" },
      { name: "Magic Pouch", description: "enchanted bag", category: "bag", price: 75, imageEmoji: "🔮", imageAsset: "bag_magic", rarity: "rare" },
      { name: "Suitcase", description: "world traveler", category: "bag", price: 35, imageEmoji: "🧳", rarity: "common" },
      { name: "Lunch Box", description: "snack time", category: "bag", price: 22, imageEmoji: "🍱", rarity: "common" },
      { name: "Golden Bag", description: "luxury carry", category: "bag", price: 350, imageEmoji: "💰", rarity: "legendary" },
      { name: "Crystal Bag", description: "shimmering bag", category: "bag", price: 160, imageEmoji: "✨", rarity: "epic" },

      { name: "Star Badge", description: "shining star", category: "badge", price: 20, imageEmoji: "⭐", imageAsset: "badge_star", rarity: "common" },
      { name: "Heart Badge", description: "love emblem", category: "badge", price: 25, imageEmoji: "💖", imageAsset: "badge_heart", rarity: "common" },
      { name: "Shield Badge", description: "protector", category: "badge", price: 60, imageEmoji: "🛡️", imageAsset: "badge_shield", rarity: "rare" },
      { name: "Fire Badge", description: "blazing spirit", category: "badge", price: 70, imageEmoji: "🔥", rarity: "rare" },
      { name: "Lightning Badge", description: "electric power", category: "badge", price: 65, imageEmoji: "⚡", imageAsset: "badge_lightning", rarity: "rare" },
      { name: "Crown Badge", description: "royalty mark", category: "badge", price: 120, imageEmoji: "👑", rarity: "epic" },
      { name: "Diamond Badge", description: "prestige", category: "badge", price: 300, imageEmoji: "💎", rarity: "legendary" },
      { name: "Peace Badge", description: "harmony", category: "badge", price: 30, imageEmoji: "☮️", rarity: "common" },
      { name: "Music Badge", description: "melody lover", category: "badge", price: 28, imageEmoji: "🎵", rarity: "common" },
      { name: "Infinity Badge", description: "eternal", category: "badge", price: 150, imageEmoji: "♾️", rarity: "epic" },

      { name: "Fairy Wings", description: "delicate fairy", category: "wings", price: 35, imageEmoji: "🧚", imageAsset: "wings_fairy", rarity: "common" },
      { name: "Angel Wings", description: "heavenly glow", category: "wings", price: 85, imageEmoji: "👼", imageAsset: "wings_angel", rarity: "rare" },
      { name: "Butterfly Wings", description: "colorful flutter", category: "wings", price: 75, imageEmoji: "🦋", imageAsset: "wings_butterfly", rarity: "rare" },
      { name: "Dragon Wings", description: "fierce power", category: "wings", price: 170, imageEmoji: "🐉", imageAsset: "wings_dragon", rarity: "epic" },
      { name: "Phoenix Wings", description: "reborn in fire", category: "wings", price: 400, imageEmoji: "🔥", imageAsset: "wings_phoenix", rarity: "legendary" },
      { name: "Crystal Wings", description: "sparkling flight", category: "wings", price: 150, imageEmoji: "✨", rarity: "epic" },
      { name: "Cloud Wings", description: "soft and fluffy", category: "wings", price: 40, imageEmoji: "☁️", rarity: "common" },
      { name: "Rainbow Wings", description: "prismatic beauty", category: "wings", price: 90, imageEmoji: "🌈", imageAsset: "wings_rainbow", rarity: "rare" },
      { name: "Galaxy Wings", description: "cosmic wings", category: "wings", price: 450, imageEmoji: "🌌", rarity: "legendary" },
      { name: "Leaf Wings", description: "nature spirit", category: "wings", price: 30, imageEmoji: "🍃", rarity: "common" },

      { name: "Kitten", description: "tiny meow", category: "pet", price: 30, imageEmoji: "🐱", imageAsset: "pet_kitten", rarity: "common" },
      { name: "Puppy", description: "loyal friend", category: "pet", price: 30, imageEmoji: "🐶", imageAsset: "pet_puppy", rarity: "common" },
      { name: "Bunny", description: "fluffy hop", category: "pet", price: 35, imageEmoji: "🐰", imageAsset: "pet_bunny", rarity: "common" },
      { name: "Hamster", description: "tiny wheel", category: "pet", price: 25, imageEmoji: "🐹", imageAsset: "pet_hamster", rarity: "common" },
      { name: "Fox", description: "clever friend", category: "pet", price: 70, imageEmoji: "🦊", imageAsset: "pet_fox", rarity: "rare" },
      { name: "Owl", description: "wise companion", category: "pet", price: 80, imageEmoji: "🦉", imageAsset: "pet_owl", rarity: "rare" },
      { name: "Dragon Baby", description: "fire breather", category: "pet", price: 180, imageEmoji: "🐲", imageAsset: "pet_dragon", rarity: "epic" },
      { name: "Unicorn", description: "magical friend", category: "pet", price: 160, imageEmoji: "🦄", imageAsset: "pet_unicorn", rarity: "epic" },
      { name: "Phoenix Chick", description: "baby phoenix", category: "pet", price: 400, imageEmoji: "🐦‍🔥", imageAsset: "pet_phoenix", rarity: "legendary" },
      { name: "Spirit Fox", description: "ethereal guide", category: "pet", price: 380, imageEmoji: "🌟", rarity: "legendary" },
    ]);

    const existingWellness = await db.select({ id: wellnessRecommendations.id }).from(wellnessRecommendations).limit(1);
    if (existingWellness.length > 0) return;

    await db.insert(wellnessRecommendations).values([
      { title: "Magnesium Glycinate", description: "Supports calmness and muscle relaxation. Great for anxiety and sleep.", category: "supplement", emotionTrigger: "anxiety", linkUrl: "https://www.amazon.com/s?k=magnesium+glycinate", imageEmoji: "💊" },
      { title: "Omega-3 Fish Oil", description: "Supports brain health and mood stability.", category: "supplement", emotionTrigger: "sadness", linkUrl: "https://www.amazon.com/s?k=omega+3+fish+oil", imageEmoji: "🐟" },
      { title: "Vitamin D3", description: "The sunshine vitamin — helps with mood and energy.", category: "supplement", emotionTrigger: "sadness", linkUrl: "https://www.amazon.com/s?k=vitamin+d3", imageEmoji: "☀️" },
      { title: "L-Theanine", description: "Promotes calm focus without drowsiness.", category: "supplement", emotionTrigger: "anxiety", linkUrl: "https://www.amazon.com/s?k=l-theanine", imageEmoji: "🍵" },
      { title: "Ashwagandha", description: "Adaptogen that helps manage stress and cortisol levels.", category: "supplement", emotionTrigger: "anger", linkUrl: "https://www.amazon.com/s?k=ashwagandha", imageEmoji: "🌿" },
      { title: "Understanding Emotions", description: "TED Talk: How emotions are made", category: "video", emotionTrigger: null, linkUrl: "https://www.youtube.com/results?search_query=how+emotions+are+made", imageEmoji: "🎥" },
      { title: "Body Scan Meditation", description: "Guided 10-min body scan for feeling awareness", category: "video", emotionTrigger: null, linkUrl: "https://www.youtube.com/results?search_query=body+scan+meditation+10+minutes", imageEmoji: "🧘" },
      { title: "Inside Out Explained", description: "The psychology behind Inside Out", category: "video", emotionTrigger: null, linkUrl: "https://www.youtube.com/results?search_query=inside+out+psychology+explained", imageEmoji: "🎬" },
      { title: "The Body Keeps the Score", description: "Bessel van der Kolk's groundbreaking book on how the body stores trauma", category: "book", emotionTrigger: null, linkUrl: "https://www.amazon.com/s?k=the+body+keeps+the+score", imageEmoji: "📚" },
      { title: "Atlas of the Heart", description: "Brené Brown maps 87 emotions we experience", category: "book", emotionTrigger: null, linkUrl: "https://www.amazon.com/s?k=atlas+of+the+heart", imageEmoji: "📖" },
    ]);
  },

  async getEquippedItems(userId: string) {
    return db.select({ ui: userItems, si: shopItems })
      .from(userItems)
      .innerJoin(shopItems, eq(userItems.itemId, shopItems.id))
      .where(and(eq(userItems.userId, userId), eq(userItems.equipped, true)));
  },
};
