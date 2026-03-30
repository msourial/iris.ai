# Iris.ai — Decentralized Vision Assistant

**AI-powered sight assistance for the visually impaired, verified on blockchain, stored forever on IPFS + Filecoin.**

> 285 million people worldwide live with visual impairment. Iris.ai gives them instant AI-powered scene descriptions, with the option to escalate to a real human volunteer — all backed by decentralized infrastructure.

---

## How It Works

```
Blind User captures photo
       |
       v
  Gemini 2.0 Flash describes the scene (< 2 seconds)
       |
       v
  Description hashed (SHA-256) for verifiable AI proof
       |
       v
  Image + metadata stored on IPFS (Storacha) + Filecoin
       |
       v
  User hears description via text-to-speech
       |
       v
  [Optional] "Ask a Human" — request goes to volunteer queue
       |
       v
  Sighted volunteer sees image, types answer
       |
       v
  Blind user hears volunteer's answer
       |
       v
  All proofs recorded: AI hash + IPFS CID + Flow TX + Filecoin deal
```

## The Two-Sided Marketplace

Iris.ai serves two user types in the same app:

| Role | Experience |
|------|-----------|
| **Visually Impaired User** | Capture photo → hear AI description → optionally ask a human volunteer |
| **Sighted Volunteer** | Browse request queue → view image + AI context → type a description → help someone see |

---

## Architecture

```
                    ┌──────────────────────┐
                    │   React Native App   │
                    │   (Expo 54)          │
                    ├──────────┬───────────┤
                    │ Blind    │ Volunteer │
                    │ User     │ Mode      │
                    │ Mode     │           │
                    └────┬─────┴─────┬─────┘
                         │           │
              ┌──────────▼───────────▼──────────┐
              │        Express API Server        │
              │     (In-memory request queue)     │
              └──┬──────────┬──────────┬─────────┘
                 │          │          │
        ┌────────▼──┐  ┌───▼───┐  ┌───▼────────┐
        │  Gemini   │  │ Flow  │  │  Storacha   │
        │  2.0 Flash│  │Testnet│  │  (IPFS)     │
        │  Vision AI│  │       │  │  + Filecoin │
        └───────────┘  └───────┘  └────────────┘
```

---

## Bounty Alignment

| Bounty | How Iris.ai Addresses It |
|--------|------------------------|
| **AI & Robotics** ($6K) | Verifiable AI (SHA-256 proof), human-in-the-loop oversight, safe AI deployment for real-world accessibility |
| **Infrastructure & Digital Rights** ($6K) | Digital accessibility as a human right, decentralized storage ensures permanence, censorship-resistant |
| **Flow** ($10K) | Flow wallet auth, on-chain request/resolution records, IrisBounty smart contract |
| **Storacha** ($500) | Real IPFS uploads of captured images + AI metadata via web3.storage |
| **Filecoin** ($2.5K) | Long-term archival storage via Lighthouse SDK on Calibration Testnet |
| **Community Vote** ($1K) | Compelling humanitarian use case driving social engagement |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Mobile** | React Native 0.81, Expo 54, Expo Router 6, TypeScript 5.9 |
| **AI Vision** | Google Gemini 2.0 Flash (generativelanguage API) |
| **Blockchain** | Flow Testnet via @onflow/fcl, Cadence smart contracts |
| **Storage (hot)** | Storacha / web3.storage (IPFS) |
| **Storage (cold)** | Filecoin Calibration Testnet via Lighthouse SDK |
| **Backend** | Express 5, Node.js 24, in-memory request queue |
| **Accessibility** | expo-speech (TTS), expo-haptics, WCAG AAA contrast, 80px touch targets |
| **Verification** | SHA-256 AI proof hashing via expo-crypto |

---

## Screens

### 1. Auth + Role Selection
Connect Flow wallet, then choose: "I Need Help" or "I Want to Volunteer"

### 2. Camera (Blind User)
Live camera feed with large capture button. Photo is compressed and sent to Gemini Vision.

### 3. Result (Blind User)
AI description read aloud. Verification section shows AI hash, IPFS CID, Flow TX, Filecoin CID. "Ask a Human" submits to volunteer queue with real-time polling.

### 4. Volunteer Queue
Auto-refreshing list of pending help requests. Each card shows AI description preview and time ago.

### 5. Volunteer Response
View full AI description + image. Type your answer in a large text input. Submit sends answer back to the blind user instantly.

---

## Accessibility Features

- **Text-to-Speech**: Every interaction narrated (expo-speech, rate 0.85-0.9)
- **Haptic Feedback**: Heavy/Medium/Selection/Success/Error patterns
- **High Contrast**: Pure black (#000) + bright yellow (#FFD700) — WCAG AAA
- **Large Touch Targets**: 80px minimum button height
- **Large Typography**: Up to 48px headings, 26px body (Inter font)
- **Screen Reader Labels**: All interactive elements labeled with accessibilityRole

---

## Running Locally

### Prerequisites
- Node.js 24+
- pnpm (enforced via preinstall script)
- Expo Go app on your phone (for camera testing)

### Setup

```bash
# Install dependencies
pnpm install

# Start the API server
pnpm --filter @workspace/api-server run dev

# Start the mobile app (in another terminal)
pnpm --filter @workspace/mobile run dev
```

Scan the QR code with Expo Go to run on your device.

### Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `EXPO_PUBLIC_GEMINI_API_KEY` | For real AI | Google AI Studio key |
| `EXPO_PUBLIC_W3_STORAGE_KEY` | For real IPFS | Storacha API key |
| `LIGHTHOUSE_API_KEY` | For Filecoin | Lighthouse free key |
| `EXPO_PUBLIC_API_URL` | For API | Express server URL |

All services gracefully fall back to mock mode when keys are absent.

---

## Project Structure

```
Iris-Vision-Aid-2/
├── artifacts/
│   ├── mobile/              # React Native (Expo) app
│   │   ├── app/             # Screens (auth, camera, result, volunteer)
│   │   ├── lib/             # Integrations (vision, flow, storacha, api)
│   │   ├── context/         # Global state (AppContext)
│   │   └── constants/       # Design system (colors)
│   └── api-server/          # Express 5 backend
│       └── src/
│           ├── routes/      # API endpoints (requests, health)
│           └── lib/         # Store, Filecoin, logging
├── lib/                     # Shared packages (db, api-spec, zod)
└── pnpm-workspace.yaml      # Monorepo config
```

---

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/requests` | Blind user submits help request |
| GET | `/api/requests?status=pending` | Volunteer fetches queue |
| GET | `/api/requests/:id` | Poll request status |
| POST | `/api/requests/:id/claim` | Volunteer claims request |
| POST | `/api/requests/:id/resolve` | Volunteer submits answer |
| GET | `/api/stats` | Impact metrics |
| GET | `/api/healthz` | Health check |

---

## Verifiable AI

Every AI inference is cryptographically verified:

1. Gemini 2.0 Flash generates a scene description
2. SHA-256 hash computed: `hash(prompt + "|" + response + "|" + timestamp)`
3. Hash stored alongside the IPFS CID on Flow blockchain
4. Image + metadata archived on Filecoin for permanence
5. Any third party can re-run the prompt and compare hashes

---

## Team

Built for **PL_Genesis: Frontiers of Collaboration Hackathon** (February - March 2026)

---

## License

MIT
