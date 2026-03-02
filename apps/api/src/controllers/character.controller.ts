import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';

const prisma = new PrismaClient();

const COIN_REWARDS = {
  feedCharacter: 5,
  playWithCharacter: 10,
};

const EXP_REWARDS = {
  feedCharacter: 10,
  playWithCharacter: 15,
};

/**
 * POST /api/character/equip
 * Equips an item to the character
 */
export const equipItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { itemId, slot } = req.body;

    if (!itemId || !slot) {
      throw new AppError('itemId and slot are required', 400);
    }

    // Get character
    const character = await prisma.character.findUnique({
      where: { userId },
    });

    if (!character) {
      throw new AppError('Character not found', 404);
    }

    // Check if user owns the item
    if (!character.ownedItems.includes(itemId)) {
      throw new AppError('Item not owned', 403);
    }

    // Get shop item to check bgTheme (for skins)
    let bgTheme = character.bgTheme;
    if (slot === 'skin') {
      const shopItem = await prisma.shopItem.findUnique({
        where: { id: itemId },
        select: { bgTheme: true },
      });

      if (shopItem?.bgTheme) {
        bgTheme = shopItem.bgTheme;
      }
    }

    // Update equipped items
    const equippedItems = character.equippedItems as Record<string, string>;
    equippedItems[slot] = itemId;

    const updatedCharacter = await prisma.character.update({
      where: { userId },
      data: {
        equippedItems,
        bgTheme,
        ...(slot === 'skin' && { equippedSkin: itemId }),
      },
      select: {
        equippedItems: true,
        bgTheme: true,
      },
    });

    res.status(200).json({
      character: updatedCharacter,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    console.error('Equip item error:', error);
    res.status(500).json({ error: 'Failed to equip item' });
  }
};

/**
 * POST /api/character/feed
 * Feed or play with character (Tamagotchi interaction)
 */
export const interactWithCharacter = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { action } = req.body;

    if (!action || !['feed', 'play'].includes(action)) {
      throw new AppError('Invalid action', 400);
    }

    const character = await prisma.character.findUnique({
      where: { userId },
    });

    if (!character) {
      throw new AppError('Character not found', 404);
    }

    let hungerChange = 0;
    let moodChange = 0;
    let expGained = 0;
    let coinsGained = 0;
    let message = '';

    if (action === 'feed') {
      hungerChange = Math.min(100 - character.hunger, 20);
      expGained = EXP_REWARDS.feedCharacter;
      coinsGained = COIN_REWARDS.feedCharacter;
      message = 'Your character is happy and full!';
    } else if (action === 'play') {
      moodChange = Math.min(100 - character.mood, 20);
      expGained = EXP_REWARDS.playWithCharacter;
      coinsGained = COIN_REWARDS.playWithCharacter;
      message = 'Your character had fun playing!';
    }

    // Update character and user in transaction
    const result = await prisma.$transaction(async (tx) => {
      const updatedCharacter = await tx.character.update({
        where: { userId },
        data: {
          hunger: { increment: hungerChange },
          mood: { increment: moodChange },
          exp: { increment: expGained },
          lastFedAt: new Date(),
        },
        select: {
          hunger: true,
          mood: true,
          exp: true,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          zenCoins: { increment: coinsGained },
        },
      });

      return updatedCharacter;
    });

    res.status(200).json({
      character: result,
      expGained,
      coinsGained,
      message,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    console.error('Character interaction error:', error);
    res.status(500).json({ error: 'Failed to interact with character' });
  }
};

/**
 * GET /api/character/wardrobe
 * Get owned and equipped items
 */
export const getWardrobe = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;

    const character = await prisma.character.findUnique({
      where: { userId },
      select: {
        ownedItems: true,
        equippedItems: true,
      },
    });

    if (!character) {
      throw new AppError('Character not found', 404);
    }

    // Get full item details for owned items
    const ownedItemDetails = await prisma.shopItem.findMany({
      where: {
        id: { in: character.ownedItems },
      },
    });

    res.status(200).json({
      owned: ownedItemDetails,
      equipped: character.equippedItems,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    console.error('Get wardrobe error:', error);
    res.status(500).json({ error: 'Failed to get wardrobe' });
  }
};
