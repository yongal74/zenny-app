# replit.md

## Overview

**Zenny** — A gamified mental wellness app for the North American market, built as a cross-platform mobile application using Expo (React Native) with an Express backend. The core concept is a character-companion (Tamagotchi-style) that evolves as users practice mindfulness, meditation, and emotional check-ins. Users earn Zen Coins, level up their character, and unlock accessories through daily wellness habits.

The app is **bilingual (EN/KO)**, targeting the North American market with the "Starlight" dark theme. **Cost minimization is critical** — button-driven flows are used instead of constant AI API calls.

## User Preferences

- Preferred communication style: Simple, everyday language
- User speaks Korean, prefers Korean communication
- Design: "Starlight" dark theme — bg `#09090F`, surface `#19191F`, accent `#B8B8D8`, gold `#C8A860`, muted gray/silver palette
- Bilingual (EN/KO) with language toggle
- Conversational UI is a secondary feature — main flow is button/quest-driven
- Minimize Replit development and operational costs

## Project Structure (Monorepo)

```
zenny/
├── gateway.js              # Reverse proxy (port 5000) → API (3000) + Metro (8080)
├── apps/
│   ├── mobile/              # Expo React Native app
│   │   ├── App.tsx          # Entry point (registerRootComponent)
│   │   ├── src/
│   │   │   ├── screens/     # Home, Auth, AI Coach, Meditation, Quest, Shop
│   │   │   ├── components/
│   │   │   ├── navigation/  # RootNavigator (splash → auth → main tabs)
│   │   │   ├── stores/      # Zustand state management (authStore, characterStore)
│   │   │   ├── services/    # API calls, AI coach
│   │   │   ├── utils/       # api.ts (API_BASE URL helper)
│   │   │   ├── constants/   # Colors (Starlight theme), fonts
│   │   │   └── types/
│   │   └── package.json
│   └── api/                 # Express backend
│       ├── src/
│       │   ├── server.ts    # Express app (0.0.0.0:3000)
│       │   ├── replit-auth/  # Replit Auth (OIDC via passport)
│       │   ├── routes/      # API routes
│       │   └── middleware/   # JWT auth, error handler
│       ├── prisma/          # Prisma ORM + PostgreSQL
│       └── package.json
├── server/replit_integrations/  # Replit Auth blueprint (reference files)
├── shared/models/           # Shared Drizzle schema for sessions
├── packages/                # Shared types
├── .replit                  # Replit config
└── package.json             # Root scripts
```

## Authentication

- **Social Login**: Replit Auth (OIDC) — supports Google, Apple, GitHub, email
  - Frontend redirects to `/api/login` → Replit handles OAuth → callback to `/api/callback` → session-based auth
  - User data stored in Prisma `User` model + sessions in PostgreSQL `sessions` table
  - `setupAuth()` from `apps/api/src/replit-auth/replitAuth.ts` wires passport + session
- **Guest Login**: JWT-based one-click login via `POST /api/auth/guest`
- **Session**: express-session with connect-pg-simple (PostgreSQL store)
- **Environment**: `SESSION_SECRET`, `REPL_ID` (auto-set by Replit)

## Color System (Starlight Theme)

- bg: `#09090F`, bg2: `#111118`
- surface: `#19191F`, surface2: `#222230`
- text: `#E0E0E8`, text2: `#8888A0`, text3: `#505068`
- primary: `#3A3A55`, accent: `#B8B8D8`, gold: `#C8A860`, teal: `#8888B8`
- border: `#28283A`, bottomBar: `#060608`
- charGlow: rgba(180-200, 180-200, 220-240) layers
- Gradients: splash/header/card defined in COLORS.gradient

## App Structure — 5 Tabs

1. **Home** — Character display (Tamagotchi), Zen Coins, daily quests, mood check-in CTA
2. **AI Coach** — Conversational AI coach with button-driven flows
3. **Meditation** — Guided meditation sessions with audio
4. **Quest** — Daily/weekly quests earning Zen Coins
5. **Shop** — Cosmetic items purchasable with Zen Coins

## System Architecture

### Frontend (Expo/React Native)

- **Framework**: Expo ~51 with React Native 0.74
- **Routing**: React Navigation v6 (native-stack + Bottom Tabs)
- **State Management**: Zustand + TanStack React Query
- **Fonts**: DM Sans (UI), Fraunces (display)
- **Key Libraries**: expo-linear-gradient, expo-av, expo-haptics, expo-notifications
- **Web**: Requires `registerRootComponent(App)` — `export default` alone does not mount on web
- **Frontend install**: Uses `--legacy-peer-deps` due to Expo SDK 51 peer dependency constraints

### Backend (Express + Node.js)

- **Runtime**: Express 4, TypeScript (ts-node for dev, moduleResolution: node16)
- **ORM**: Prisma with PostgreSQL
- **AI**: OpenAI API (lazy-loaded, only fails when AI endpoint is called)
- **Auth**: Replit Auth (OIDC/passport) for social login + JWT for guest login
- **Key Endpoints**:
  - `GET /api/login` — Redirect to Replit OIDC (social login)
  - `GET /api/callback` — OIDC callback
  - `GET /api/logout` — Logout
  - `GET /api/auth/user` — Get current authenticated user (session-based)
  - `POST /api/auth/guest` — One-click guest login (JWT)
  - `GET /api/character` — Get character state
  - `POST /api/coach/chat` — AI coach message
  - `GET /api/quests` — Daily quests list
  - `POST /api/quests/:id/complete` — Complete quest

### Build & Deployment

- **Architecture**: Gateway proxy pattern
  - `Gateway` (port 5000, webview) — Reverse proxy routing `/api/*` to backend, everything else to Metro
  - `Start Backend` (port 3000, console) — Express API server
  - `Start Frontend` (port 8080, console) — Expo Metro bundler
- **Environment Variables**:
  - `DATABASE_URL` — PostgreSQL connection (Replit provisioned)
  - `JWT_SECRET` — JWT signing key
  - `SESSION_SECRET` — Session signing key (Replit provisioned)
  - `OPENAI_API_KEY` — Optional, lazy-loaded for AI coach
- **API URL**: Frontend uses `window.location.origin + '/api'` on web (routed through gateway)

## Important Notes

- Expo web requires `registerRootComponent(App)` in App.tsx
- `@react-navigation/native-stack` works on web but `@react-navigation/stack` (v7) has `useLocale` compatibility issue with React Navigation v6
- Splash screen is managed by RootNavigator state (2s timer), not by navigation
- Backend must bind to `0.0.0.0` (not localhost) for Replit accessibility
- openid-client v6 requires `moduleResolution: "node16"` in tsconfig for passport submodule

## Recent Changes (Mar 2026)

- Replit Auth integration for social login (Google, Apple, GitHub, email)
- "Starlight" dark theme: near-black #09090F bg, muted gray/silver accents, gradient backgrounds
- Login screen redesigned: social login button + guest option
- Splash screen updated with Starlight theme rings
- All screens updated to use COLORS.gradient and muted gray/silver palette
- Sessions table created for Replit Auth (PostgreSQL)
- Removed old manual OIDC route (replit-auth.routes.ts)
