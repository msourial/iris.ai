# Iris.ai — Vision Assistant for the Visually Impaired

## Intensive Project Summary

---

## 1. Project Identity

| Field | Detail |
|-------|--------|
| **Name** | Iris.ai — Vision Assistant |
| **Type** | Decentralized mobile accessibility app |
| **Target Users** | Visually impaired individuals |
| **Hackathon Bounties** | Flow Best App, Storacha Best Use of Decentralized Storage, Frontiers Physical AI |
| **License** | MIT |
| **Repo** | Iris-Vision-Aid-2 (pnpm monorepo) |

---

## 2. Codebase Metrics

| Metric | Value |
|--------|-------|
| **Total Commits** | 22 |
| **Contributors** | 2 (msourial1, agent) |
| **Development Window** | 2026-03-28 → 2026-03-29 (~1.5 days) |
| **Mobile App LOC** | ~2,171 (screens: 1,330 / libs: 405 / components: 369 / context: 67) |
| **API Server LOC** | ~98 |
| **Shared Libraries LOC** | ~787 (21 files) |
| **Mockup Sandbox LOC** | ~6,105 |
| **Total Estimated LOC** | ~9,161 |
| **Mobile Dependencies** | ~59 packages |
| **Workspace Packages** | 8 (3 artifacts + 4 libs + 1 scripts) |

---

## 3. Technology Stack

### Core

| Layer | Technology | Version |
|-------|------------|---------|
| **Runtime** | Node.js | 24 |
| **Language** | TypeScript | 5.9.2 |
| **Package Manager** | pnpm (workspaces) | enforced |
| **Monorepo** | pnpm-workspace.yaml | with supply-chain security |

### Mobile App (`artifacts/mobile/`)

| Category | Technology | Version |
|----------|------------|---------|
| **Framework** | React Native | 0.81.5 |
| **Platform** | Expo (managed workflow) | 54.0.27 |
| **React** | React | 19.1.0 |
| **Routing** | Expo Router (file-based) | 6.0.17 |
| **Camera** | expo-camera | 17.0.10 |
| **Speech** | expo-speech (TTS) | 14.0.8 |
| **Haptics** | expo-haptics | 15.0.8 |
| **Image Processing** | expo-image-manipulator | 14.0.8 |
| **Blockchain** | @onflow/fcl (Flow) | 1.21.10 |
| **Server State** | TanStack React Query | 5.90.21 |
| **Validation** | Zod | 3.25.76 |
| **Gestures** | react-native-gesture-handler | 2.28.0 |
| **Animations** | react-native-reanimated | 4.1.1 |
| **Fonts** | @expo-google-fonts/inter | 0.4.0 |

### API Server (`artifacts/api-server/`)

| Category | Technology | Version |
|----------|------------|---------|
| **Framework** | Express | 5.x |
| **ORM** | Drizzle ORM | 0.45.1 |
| **Database** | PostgreSQL (pg driver) | 8.20.0 |
| **Logging** | Pino + pino-http | 9.x / 10.x |
| **Bundler** | esbuild | 0.27.3 |

### Mockup Sandbox (`artifacts/mockup-sandbox/`)

| Category | Technology | Version |
|----------|------------|---------|
| **Bundler** | Vite | 7.3.0 |
| **CSS** | Tailwind CSS | 4.1.14 |
| **Components** | Radix UI (27 primitives) + shadcn/ui | latest |
| **Animation** | Framer Motion | 12.23.24 |
| **Charts** | Recharts | 2.15.4 |
| **Icons** | Lucide React | 0.545.0 |
| **Forms** | React Hook Form + Zod | 7.66.0 |

### Shared Libraries

| Package | Purpose |
|---------|---------|
| `@workspace/api-spec` | OpenAPI 3.1 specification + Orval codegen |
| `@workspace/api-zod` | Generated Zod validation schemas |
| `@workspace/api-client-react` | Generated React Query hooks + custom fetch |
| `@workspace/db` | Drizzle ORM schema + PostgreSQL connection |

---

## 4. Architecture

### Monorepo Structure

```
Iris-Vision-Aid-2/
├── artifacts/
│   ├── mobile/                  # React Native (Expo) — primary app
│   │   ├── app/                 # Expo Router screens
│   │   │   ├── (tabs)/index.tsx # Auth screen (240 LOC)
│   │   │   ├── camera.tsx       # Camera capture (476 LOC)
│   │   │   ├── result.tsx       # Results + volunteer (503 LOC)
│   │   │   ├── _layout.tsx      # Root layout + providers (68 LOC)
│   │   │   └── +not-found.tsx   # 404 fallback
│   │   ├── components/          # ErrorBoundary, ErrorFallback, KeyboardCompat
│   │   ├── context/             # AppContext (global state)
│   │   ├── lib/                 # Integration modules
│   │   │   ├── vision.ts        # Gemini 2.0 Flash API (106 LOC)
│   │   │   ├── flow.ts          # Flow blockchain FCL (139 LOC)
│   │   │   ├── storacha.ts      # IPFS/web3.storage (88 LOC)
│   │   │   └── ai.ts           # Legacy Gemini 1.5 (deprecated)
│   │   ├── constants/           # Colors design system
│   │   └── assets/              # Images, fonts
│   ├── api-server/              # Express 5 REST API
│   │   └── src/
│   │       ├── app.ts           # Express setup (CORS, Pino, routes)
│   │       ├── index.ts         # HTTP server entry
│   │       ├── routes/          # /api/healthz endpoint
│   │       ├── lib/logger.ts    # Pino structured logging
│   │       └── middlewares/     # Express middleware
│   └── mockup-sandbox/          # Vite + shadcn/ui component library
│       └── src/
│           ├── components/ui/   # 57 Radix-based components
│           └── hooks/           # useToast, useIsMobile
├── lib/
│   ├── api-spec/                # OpenAPI spec + Orval config
│   ├── api-zod/                 # Generated Zod schemas
│   ├── api-client-react/        # Generated React Query + custom fetch
│   └── db/                      # Drizzle ORM + PostgreSQL
├── scripts/                     # post-merge.sh, utility scripts
├── pnpm-workspace.yaml          # Workspace config + security
├── tsconfig.base.json           # Shared TS config (ES2022, strict)
└── .replit                      # Deployment config (Node 24)
```

### Provider Hierarchy (Mobile)

```
SafeAreaProvider
  └─ ErrorBoundary
      └─ QueryClientProvider (React Query)
          └─ GestureHandlerRootView
              └─ AppProvider (Context API)
                  └─ Stack Navigator (Expo Router)
                      ├─ /(tabs) → Auth Screen
                      ├─ /camera → Camera Screen
                      ├─ /result → Result Screen
                      └─ /+not-found → 404
```

---

## 5. Core User Flow

```
┌─────────────────────────────────────────────────┐
│              1. AUTH SCREEN                       │
│  "Welcome to Iris" (TTS)                        │
│  [Connect Wallet] → Flow FCL authentication     │
│  Features: AI Vision, IPFS, Flow Blockchain     │
└──────────────────┬──────────────────────────────┘
                   │ isAuthenticated = true
                   ▼
┌─────────────────────────────────────────────────┐
│              2. CAMERA SCREEN                    │
│  Live camera feed (expo-camera, back-facing)    │
│  "Camera ready" (TTS) + haptic                  │
│  [Capture Button] → 100px circular              │
│     ↓                                            │
│  Image compress: 800px, 0.75 JPEG quality       │
│  "Analyzing your surroundings" (TTS)            │
│  Pulsing overlay animation during analysis      │
│     ↓                                            │
│  Gemini 2.0 Flash → describeImage(base64)       │
│  Store result in AppContext                      │
└──────────────────┬──────────────────────────────┘
                   │ navigate('/result')
                   ▼
┌─────────────────────────────────────────────────┐
│              3. RESULT SCREEN                    │
│  AI description (26px yellow text, auto-read)   │
│                                                  │
│  [Read Again] → re-speak result (rate 0.9)      │
│  [Ask a Human] → volunteer escalation workflow  │
│  [Analyze Again] → back to /camera              │
│                                                  │
│  Background: Storacha upload → Flow NFT mint    │
│  Status: idle → uploading → minting → done      │
└─────────────────────────────────────────────────┘
```

---

## 6. Volunteer Escalation System ("AI First, Human Fallback")

The signature differentiator — a 4-stage blockchain-backed volunteer workflow:

```
User taps "Ask a Human (Free – Sponsored)"
    │
    ▼ [t=0s] FREEZING
    │  Speech: "Securing community bounty for a volunteer..."
    │  UI: Pulsing card + upload-cloud icon
    │  Simulates: Storacha IPFS upload
    │
    ▼ [t=2s] ESCROW
    │  Speech: "Securing community bounty on the Flow blockchain."
    │  UI: Pulsing card + lock icon + mock tx ID "0x8f4e...3a2b"
    │  Simulates: 1 FLOW token locked in escrow
    │
    ▼ [t=5s] RESOLVED
       Haptic: Success notification
       Speech: "The expiration date is April 2026." (rate 0.85)
       UI: Yellow "Volunteer Answer" badge
       Toast: "1 FLOW token rewarded to Volunteer #429." (4s display)
```

**Currently fully mocked** but architecturally complete for real volunteer matching.

---

## 7. External Service Integrations

### Google Gemini Vision AI

| Field | Detail |
|-------|--------|
| **Model** | gemini-2.0-flash |
| **Endpoint** | generativelanguage.googleapis.com/v1beta |
| **Max Tokens** | 200 |
| **Temperature** | 0.3 |
| **Prompt** | "You are assisting a visually impaired user. Describe the primary subjects in this image clearly, concisely, and directly in 1 or 2 direct sentences. Be highly accurate. No filler words." |
| **Env Var** | `EXPO_PUBLIC_GEMINI_API_KEY` |
| **Fallback** | 7 realistic mock descriptions |

### Flow Blockchain

| Field | Detail |
|-------|--------|
| **Network** | Flow Testnet |
| **Access Node** | https://rest-testnet.onflow.org |
| **Discovery** | https://fcl-discovery.onflow.org/testnet/authn |
| **Contract** | IrisBounty.createRequest(cid: String) |
| **Gas Limit** | 999 compute units |
| **Env Var** | `EXPO_PUBLIC_IRIS_BOUNTY_ADDRESS` |
| **Fallback** | Mock user `0xf8d6e0586b0a20c7`, always mock on native |

### Storacha (IPFS / web3.storage)

| Field | Detail |
|-------|--------|
| **Endpoint** | https://api.web3.storage/upload |
| **Upload Format** | FormData with iris-capture.jpg + metadata.json |
| **Metadata** | version, timestamp, AI description, app name |
| **Env Var** | `EXPO_PUBLIC_W3_STORAGE_KEY` |
| **Fallback** | Mock CID (bafybeig + 32 random chars), 600ms delay |

---

## 8. Accessibility Implementation

### WCAG Compliance Summary

| Feature | Implementation | Standard |
|---------|---------------|----------|
| **Text-to-Speech** | Every interaction narrated (expo-speech, rate 0.85–0.9, en-US) | WCAG 1.1.1 |
| **Haptic Feedback** | Heavy/Medium/Selection/Success/Error patterns | Beyond WCAG |
| **Color Contrast** | Pure black #000 + bright yellow #FFD700 | WCAG AAA |
| **Touch Targets** | 80px minimum button height (vs 44px standard) | WCAG 2.5.5 AAA |
| **Typography** | Up to 48px headings, 26px body (Inter font) | WCAG 1.4.4 |
| **Screen Reader** | accessibilityLabel + accessibilityRole on all 15+ elements | WCAG 4.1.2 |
| **Dark Mode** | Forced dark (userInterfaceStyle: "dark") | Reduces eye strain |

### Speech Feedback Map

| Screen | Trigger | Message | Rate |
|--------|---------|---------|------|
| Auth | Page load | "Welcome to Iris. Tap the Connect Wallet button to begin." | default |
| Auth | Connect tap | "Connecting your wallet." | default |
| Auth | Success | "Wallet connected. Opening camera." | default |
| Auth | Error | "Connection failed. Please try again." | default |
| Camera | Ready | "Camera ready. Double tap bottom of screen to analyze." | default |
| Camera | Capture | "Analyzing your surroundings." | default |
| Camera | Error | "Error analyzing image. Please try again." | default |
| Result | Load | AI description auto-read | 0.9 |
| Result | Freezing | "Securing community bounty for a volunteer..." | 0.9 |
| Result | Escrow | "Securing community bounty on the Flow blockchain." | 0.9 |
| Result | Resolved | Volunteer answer | 0.85 |

### Haptic Feedback Map

| Action | Pattern | Intensity |
|--------|---------|-----------|
| Capture photo | ImpactFeedbackStyle.Heavy | Strong |
| Connect wallet | ImpactFeedbackStyle.Medium | Medium |
| Ask human | ImpactFeedbackStyle.Heavy | Strong |
| Analyze again | ImpactFeedbackStyle.Medium | Medium |
| Read again | selectionAsync() | Light |
| Volunteer resolved | NotificationFeedbackType.Success | Strong |
| Capture error | NotificationFeedbackType.Error | Strong |

---

## 9. State Management

### Global State (AppContext)

```typescript
interface AppContextType {
  isAuthenticated: boolean;
  user: FlowUser | null;           // { addr: string, loggedIn: boolean }
  login(user: FlowUser): void;
  logout(): void;
  aiResult: string | null;
  setAiResult(text: string | null): void;
  capturedImageBase64: string | null;
  setCapturedImageBase64(b64: string | null): void;
  blockchainStatus: 'idle' | 'uploading' | 'minting' | 'done' | 'error';
  setBlockchainStatus(status: BlockchainStatus): void;
}
```

### State Flow

```
Auth Screen                Camera Screen              Result Screen
───────────                ─────────────              ─────────────
login(user) ──────────►    setCapturedImageBase64() ─► reads aiResult
isAuthenticated=true       setAiResult()              reads blockchainStatus
                           setBlockchainStatus()       humanStage (local)
                                                       pulseAnim (local)
                                                       fadeAnim (local)
                                                       toastAnim (local)
```

---

## 10. Design System

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `black` | #000000 | Background (all screens) |
| `yellow` | #FFD700 | Primary accent, buttons, result text |
| `yellowDim` | #B8960A | Disabled/secondary yellow |
| `yellowLight` | #FFF176 | Highlight states |
| `white` | #FFFFFF | Primary text |
| `grayDark` | #1A1A1A | Card backgrounds |
| `grayMid` | #333333 | Borders, dividers |
| `grayLight` | #666666 | Secondary text |
| `error` | #FF4444 | Error states |
| `success` | #44FF88 | Success states |

### Typography

| Weight | Font | Usage |
|--------|------|-------|
| 700 Bold | Inter_700Bold | Headings, app title |
| 600 SemiBold | Inter_600SemiBold | Body text, result display |
| 500 Medium | Inter_500Medium | Labels, secondary text |
| 400 Regular | Inter_400Regular | Descriptions, metadata |

---

## 11. Native Platform Configuration

### iOS

| Setting | Value |
|---------|-------|
| Tablet Support | Disabled |
| Camera Permission | "Iris.ai needs camera access to describe your surroundings for the visually impaired." |
| Speech Permission | "Iris.ai uses speech to read descriptions aloud." |
| Architecture | New Architecture enabled |

### Android

| Setting | Value |
|---------|-------|
| Permissions | CAMERA, RECORD_AUDIO |
| Architecture | New Architecture enabled |

### Expo Plugins

| Plugin | Configuration |
|--------|--------------|
| expo-camera | cameraPermission custom string, microphonePermission: false |
| expo-router | origin: https://replit.com/, typedRoutes: true |
| expo-font | Inter family loaded |
| expo-web-browser | Default config |

---

## 12. Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `EXPO_PUBLIC_GEMINI_API_KEY` | For real AI | Google AI Studio API key |
| `EXPO_PUBLIC_W3_STORAGE_KEY` | For real storage | Storacha/web3.storage key |
| `EXPO_PUBLIC_IRIS_BOUNTY_ADDRESS` | For real blockchain | Flow contract address |
| `EXPO_PUBLIC_USE_MOCK_FCL` | Optional | Force mock Flow auth (true/false) |
| `EXPO_PUBLIC_USE_MOCK_VISION` | Optional | Force mock vision (true/false) |
| `EXPO_PUBLIC_USE_MOCK_STORACHA` | Optional | Force mock storage (true/false) |
| `DATABASE_URL` | For API server | PostgreSQL connection string |
| `PORT` | For API server | HTTP server port |
| `LOG_LEVEL` | Optional | Pino log level |

**All services gracefully fall back to mock mode when keys are absent.**

---

## 13. Error Handling

| Layer | Mechanism |
|-------|-----------|
| **React Tree** | ErrorBoundary class component → ErrorFallback UI |
| **ErrorFallback** | Theme-aware, "Try Again" button, dev-only stack trace modal |
| **API Services** | try/catch → console.error → mock fallback |
| **Camera** | Permission denied screen, capture error speech feedback |
| **Blockchain** | Status tracking (idle→uploading→minting→done/error) |
| **Logging** | Mobile: console with [Iris] prefix / API: Pino structured JSON |
| **Crash Reporting** | None configured (no Sentry, Crashlytics) |

---

## 14. Security

| Measure | Detail |
|---------|--------|
| **Supply Chain** | pnpm minimumReleaseAge: 1440min (1-day) for new packages |
| **Package Manager** | Enforced pnpm only (preinstall script rejects npm/yarn) |
| **API Keys** | Environment variables only, never committed |
| **Header Redaction** | Pino redacts Authorization, Cookie, Set-Cookie in logs |
| **CORS** | Enabled on API server |

---

## 15. Build & Deployment

| Target | Build Tool | Output | Platform |
|--------|-----------|--------|----------|
| **Mobile** | Custom scripts/build.js | Static Expo Go bundles (iOS + Android) | Replit |
| **API Server** | esbuild (ESM) | dist/index.mjs | Replit autoscale |
| **Sandbox** | Vite | dist/ | Replit |

**Deployment**: Replit native deployment system (no GitHub Actions, no EAS).
**Post-build**: `pnpm store prune` (cache cleanup).
**Post-merge hook**: `scripts/post-merge.sh` (20s timeout).

---

## 16. Development Timeline

| Task | Commits | Description |
|------|---------|-------------|
| **#1** | b55dbf0 | Build Iris.ai accessibility vision mobile app |
| **#2** | df4bce8 | Implement real Gemini Vision AI |
| **#3** | 0d39185–7106be2 | AI First, Human Fallback escalation workflow |
| **#4** | d07f4cb | Align camera quality, prompt text, error messages to spec |
| **#5** | 1e9c00f–ee2ce49 | Align prompt, volunteer timing (5s), toast text to spec |
| **Latest** | ab3ba62 | Fix FCL errors on native + upgrade to Gemini 2.0 Flash |

---

## 17. What's Not Yet Built

| Gap | Status |
|-----|--------|
| **Real volunteer matching** | Fully mocked (5s simulated workflow) |
| **Database schema** | Empty template (Drizzle configured, no tables) |
| **API endpoints** | Only /api/healthz exists |
| **Tests** | No test framework, no test files |
| **CI/CD** | No GitHub Actions (Replit-only deployment) |
| **Crash reporting** | No Sentry/Crashlytics |
| **State persistence** | AsyncStorage installed but unused |
| **Speech-to-text input** | Microphone permission disabled |
| **EAS builds** | No eas.json (managed workflow only) |

---

*Generated 2026-03-29 — Iris Vision Aid 2*
