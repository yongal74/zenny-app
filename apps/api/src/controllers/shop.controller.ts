import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';

const prisma = new PrismaClient();

/**
 * GET /api/shop/items
 * Get all shop items with ownership status
 */
export const getShopItems = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { category, type } = req.query;

    // Build where clause
    const where: any = {};
    if (category) where.category = category as string;
    if (type) where.type = type as string;

    // Get all shop items
    const items = await prisma.shopItem.findMany({
      where,
      orderBy: [{ type: 'asc' }, { price: 'asc' }],
    });

    // Get user's character to check owned items
    const character = await prisma.character.findUnique({
      where: { userId },
      select: {
        ownedItems: true,
        equippedItems: true,
        level: true,
      },
    });

    // Get user's balance
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { zenCoins: true },
    });

    if (!character || !user) {
      throw new AppError('User or character not found', 404);
    }

    const equippedItems = character.equippedItems as Record<string, string>;

    // Add ownership and equipped status to items
    const itemsWithStatus = items.map((item) => ({
      ...item,
      owned: character.ownedItems.includes(item.id),
      equipped: Object.values(equippedItems).includes(item.id),
    }));

    res.status(200).json({
      items: itemsWithStatus,
      balance: user.zenCoins,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    console.error('Get shop items error:', error);
    res.status(500).json({ error: 'Failed to fetch shop items' });
  }
};

/**
 * POST /api/shop/purchase
 * Purchase an item from the shop
 */
export const purchaseItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { itemId } = req.body;

    if (!itemId) {
      throw new AppError('itemId is required', 400);
    }

    // Get shop item
    const shopItem = await prisma.shopItem.findUnique({
      where: { id: itemId },
    });

    if (!shopItem) {
      throw new AppError('Item not found', 404);
    }

    // Get user and character
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { zenCoins: true },
    });

    const character = await prisma.character.findUnique({
      where: { userId },
      select: { level: true, ownedItems: true },
    });

    if (!user || !character) {
      throw new AppError('User or character not found', 404);
    }

    // Check if already owned
    if (character.ownedItems.includes(itemId)) {
      throw new AppError('Item already owned', 400);
    }

    // Check if user has enough coins
    if (user.zenCoins < shopItem.price) {
      throw new AppError('Insufficient Zen Coins', 400);
    }

    // Check level requirement
    if (character.level < shopItem.levelRequired) {
      throw new AppError(
        `Level ${shopItem.levelRequired} required to purchase this item`,
        403
      );
    }

    // Purchase item in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Deduct coins
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          zenCoins: { decrement: shopItem.price },
        },
        select: { zenCoins: true },
      });

      // Add item to owned items
      await tx.character.update({
        where: { userId },
        data: {
          ownedItems: { push: itemId },
        },
      });

      return updatedUser;
    });

    res.status(200).json({
      success: true,
      remainingCoins: result.zenCoins,
      item: {
        id: shopItem.id,
        name: shopItem.name,
        type: shopItem.type,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    console.error('Purchase item error:', error);
    res.status(500).json({ error: 'Failed to purchase item' });
  }
};
