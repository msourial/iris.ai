# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Contains an Express API server and the Iris.ai React Native (Expo) mobile app.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── mobile/             # Iris.ai React Native (Expo) mobile app
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
├── pnpm-workspace.yaml     # pnpm workspace
├── tsconfig.base.json      # Shared TS options
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## Iris.ai Mobile App (`artifacts/mobile`)

A decentralized, verifiable sight assistant for the visually impaired. Targets three hackathon bounties: Flow Best App, Storacha Best Use of Decentralized Storage, and Frontiers Physical AI.

### Design System
- **Colors**: Pure Black (#000000) backgrounds, Bright Yellow (#FFD700) text/buttons
- **Typography**: Inter font (700Bold for headings, 600SemiBold for body)
- **Touch targets**: Minimum 80px height for primary actions

### Screens
1. **Auth Screen** (`app/(tabs)/index.tsx`): Iris.ai logo, feature list, "Connect Wallet" button
2. **Camera Screen** (`app/camera.tsx`): Full-screen live camera feed, circular capture button
3. **Result Screen** (`app/result.tsx`): AI description in giant yellow text, read/analyze-again buttons

### Key Libraries
- `expo-camera`: Camera capture
- `expo-speech`: Text-to-speech throughout
- `expo-image-manipulator`: Compress images to 768px before AI analysis
- `@onflow/fcl`: Flow blockchain (mock by default, set `USE_MOCK_FCL = false` to enable)

### Integration Stubs (ready for real API keys)
- **`lib/flow.ts`**: `USE_MOCK_FCL = true` → flip to `false` + configure to use real Flow Testnet
- **`lib/ai.ts`**: `USE_MOCK_AI = true` → set `EXPO_PUBLIC_GEMINI_API_KEY` env var + flip flag
- **`lib/storacha.ts`**: `USE_MOCK_STORACHA = true` → set `EXPO_PUBLIC_W3_STORAGE_KEY` + flip flag

### App Flow
Auth → Camera → Capture → Analyzing overlay → Result → (background: Storacha upload → FCL mint NFT)

### Running
- `pnpm --filter @workspace/mobile run dev` — start Expo dev server
- Scan QR code in Replit URL bar to test on physical device via Expo Go

## API Server (`artifacts/api-server`)

Express 5 API server. Routes in `src/routes/` use `@workspace/api-zod` for validation.

- Entry: `src/index.ts` — reads PORT, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON parsing, routes at `/api`
- `pnpm --filter @workspace/api-server run dev` — run dev server

## Shared Libraries

### `lib/api-spec` (`@workspace/api-spec`)
OpenAPI 3.1 spec + Orval codegen config. Run: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)
Generated Zod schemas from OpenAPI spec.

### `lib/api-client-react` (`@workspace/api-client-react`)
Generated React Query hooks and fetch client.

### `lib/db` (`@workspace/db`)
Drizzle ORM schema + PostgreSQL connection.
- `pnpm --filter @workspace/db run push` — push schema to DB
