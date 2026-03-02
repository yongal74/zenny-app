import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { AppError } from '../middleware/error.middleware';

const prisma = new PrismaClient();

/**
 * POST /api/auth/login
 * Login or register user and return JWT token
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, provider } = req.body;

    if (!email || !provider) {
      throw new AppError('Email and provider are required', 400);
    }

    if (!['email', 'apple', 'google'].includes(provider)) {
      throw new AppError('Invalid provider', 400);
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Create new user with default character
      user = await prisma.user.create({
        data: {
          email,
          provider,
          zenCoins: 100,
          streak: 0,
          lang: 'en',
          character: {
            create: {
              characterType: 'hana',
              level: 1,
              exp: 0,
              hunger: 100,
              mood: 100,
              equippedSkin: 'starlight',
              equippedItems: {},
              ownedItems: [],
              bgTheme: 'starlight',
            },
          },
        },
      });
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new AppError('Server configuration error', 500);
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      jwtSecret,
      { expiresIn: '30d' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, email: user.email, type: 'refresh' },
      jwtSecret,
      { expiresIn: '90d' }
    );

    res.status(200).json({
      userId: user.id,
      token,
      refreshToken,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

/**
 * POST /api/auth/onboarding
 * Save onboarding quiz answers
 */
export const onboarding = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, quizAnswers } = req.body;

    if (!userId || !quizAnswers) {
      throw new AppError('userId and quizAnswers are required', 400);
    }

    // For now, just acknowledge the onboarding
    // In a full implementation, you might save these to a profile table

    res.status(200).json({
      userId,
      profile: {
        persona: 'mindful-explorer',
        preferences: quizAnswers,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    console.error('Onboarding error:', error);
    res.status(500).json({ error: 'Onboarding failed' });
  }
};
