# Iris.ai — Build Tasks

Web3 "Be My Eyes" app: real-time AI vision assistance, passkey auth on Flow Blockchain, and decentralized image storage via Storacha/IPFS.

---

## Phase 1 — Expo + NativeWind Scaffold

Goal: Working blank app with routing, styling system, and folder structure in place.

- [x] Initialize Expo project with TypeScript template
- [x] Install and configure NativeWind (Tailwind CSS for React Native)
- [x] Set up `tailwind.config.js`, `babel.config.js`, `metro.config.js` for NativeWind
- [x] Create base folder structure: `app/`, `components/`, `hooks/`, `lib/`, `contracts/`
- [x] Configure Expo Router for file-based navigation
- [x] Create placeholder screens: `Home`, `Camera`, `History`, `Profile`
- [x] Set up `.env` file and `expo-constants` for environment variable access
- [ ] Verify `npm run ios` runs cleanly on simulator

---

## Phase 2 — Flow Passkey Auth

Goal: Users can create and authenticate a Flow account using passkeys (no seed phrases).

- [ ] Install Flow FCL (`@onflow/fcl`) and configure for testnet
- [ ] Set up FCL config (`fcl.config`) in `lib/flow.ts` with testnet endpoints
- [ ] Integrate Flow's WebAuthn/passkey wallet discovery (WalletConnect or native FCL Discovery)
- [ ] Build `AuthProvider` context to hold wallet address and session state
- [ ] Create `useAuth` hook exposing `logIn`, `logOut`, `currentUser`
- [ ] Build `LoginScreen` component — high-contrast, accessible, single CTA
- [ ] Gate app navigation behind auth state (redirect unauthenticated users to `LoginScreen`)
- [ ] Store FCL session securely (no raw keys in `.env` or AsyncStorage plain text)
- [ ] Test auth flow end-to-end on Flow testnet

---

## Phase 3 — Camera & AI Vision via Storacha

Goal: User points camera at scene → image uploaded to IPFS via Storacha → AI returns description.

- [ ] Install `expo-camera` and request camera permissions
- [ ] Build `CameraScreen` with capture button, accessible contrast, and live viewfinder
- [ ] Install Storacha SDK (`@web3-storage/w3up-client`) and configure with `.env` API key
- [ ] Create `lib/storacha.ts` — upload image blob to Storacha, return IPFS CID
- [ ] Create `lib/vision.ts` — send IPFS URL (or raw image) to AI vision API, return text description
- [ ] Wire up: capture → upload → AI call → display result to user
- [ ] Build `ResultCard` component to render AI description accessibly (large text, high contrast)
- [ ] Create `History` screen listing past CIDs and their descriptions (stored locally or on-chain)
- [ ] Handle errors (camera denied, upload failed, AI timeout) with clear user messaging

---

## Phase 4 — Flow Smart Contracts (Cadence)

Goal: Bounty escrow — User deposits FLOW for a vision request; Volunteer claims it on completion.

- [x] Set up Flow CLI (`flow-cli`) and `flow.json` project config
- [x] Write `IrisBounty.cdc` Cadence contract:
  - `VisionRequest` resource: holds escrowed `@{FungibleToken.Vault}`, CID, status, timestamps
  - `RequestStatus` enum: `open`, `completed`, `cancelled`
  - `RequestInfo` struct: read-only snapshot returned by scripts
  - `RequestManagerPublic` interface: public surface for all interactions
  - `RequestManager` resource: central escrow manager stored in contract account
  - `createRequest()` — user deposits FLOW bounty and opens a request
  - `claimBounty()` — volunteer submits description, receives FLOW atomically
  - `cancelRequest()` — requester cancels, full refund returned
  - Read views: `getOpenRequests()`, `getRequestInfo()`, `getRequestsByRequester()`
- [x] Write transactions: `CreateRequest.cdc`, `ClaimBounty.cdc`, `CancelRequest.cdc`
- [x] Write scripts: `GetOpenRequests.cdc`, `GetRequestByID.cdc`, `GetUserRequests.cdc`
- [x] Write Cadence test suite (8 tests covering all happy paths and access control — all passing)
- [ ] Deploy contract to Flow testnet (replace PLACEHOLDER_DEPLOY_ADDRESS in flow.json)
- [ ] Create `lib/contracts.ts` — FCL wrappers for transactions and scripts (Phase UI integration)
- [ ] Document deployed contract address in `contracts/README.md`

---

## Notes

- Do not write app code until each phase's tasks are explicitly started.
- Test on iOS simulator with `npm run ios` at the end of each phase.
- All API keys (Storacha, AI vision service) go in `.env` only.
