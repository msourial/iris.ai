# Iris.ai — Gap Analysis: Current State vs. Target State

## Hackathon: PL_Genesis: Frontiers of Collaboration
## Deadline: March 31, 2026 | Winners: April 10, 2026

---

## Target Bounties

| # | Bounty | Prize | Priority |
|---|--------|-------|----------|
| 1 | AI & Robotics | $6,000 (1st: $3K) | PRIMARY |
| 2 | Infrastructure & Digital Rights | $6,000 (1st: $3K) | PRIMARY |
| 3 | Flow: Future of Finance | $10,000 (top 10 × $1K) | PRIMARY |
| 4 | Filecoin | $2,500 (1st: $1.25K) | SECONDARY |
| 5 | Storacha | $500 + credits | SECONDARY |
| 6 | Community Vote | $1,000 | BONUS |
| 7 | Hypercerts | $2,500 (1st: $1.5K) | STRETCH |

**Maximum potential: ~$28,500**

---

## Executive Summary

| Area | Current | Target | Gap Severity |
|------|---------|--------|-------------|
| AI Vision | Real Gemini 2.0 Flash API | Same + verifiable proofs | LOW |
| Flow Blockchain | Mock-only (placeholder contract) | Real deployed contract + escrow | CRITICAL |
| Storacha/IPFS | Mock-only (fake CIDs) | Real uploads with retrievable CIDs | HIGH |
| Volunteer System | Fully hardcoded mock | Real two-sided marketplace | CRITICAL |
| API Server | Health endpoint only | Full request/response routing | HIGH |
| Database | Empty schema | Tables for requests, volunteers, responses | HIGH |
| Filecoin | Not integrated | Synapse SDK on Calibration Testnet | MEDIUM |
| Hypercerts | Not integrated | Impact tracking + cert minting | MEDIUM |
| Demo/Submission | No video, no docs | Video + GitHub + demo link | HIGH |

---

## Detailed Gap Analysis by Component

---

### 1. FLOW BLOCKCHAIN INTEGRATION

**File**: `artifacts/mobile/lib/flow.ts` (139 LOC)

#### What We Have

| Feature | Status | Detail |
|---------|--------|--------|
| FCL import + config | Done | Testnet config: `rest-testnet.onflow.org` |
| `authenticate()` | Mock on native | Returns `MOCK_USER { addr: "0xf8d6e0586b0a20c7" }` after 1s delay |
| `unauthenticate()` | Implemented | Calls `fcl.unauthenticate()` or no-op in mock |
| `mintVisionNFT(cid)` | Mock | Returns fake tx `tx_` + random string after 800ms |
| `formatAddr()` | Real | Truncates address for display |
| Cadence transaction | Written | `IrisBounty.createRequest(cid: String)` script exists |
| Contract address | Placeholder | `0xYOUR_CONTRACT_ADDRESS` (line 110) |

#### What We Need

| Feature | Why | Bounty Impact |
|---------|-----|--------------|
| Deploy IrisBounty.cdc to Flow Testnet | Without a real contract, Flow bounty is disqualified | Flow ($10K) |
| Real `createRequest(cid)` transaction | Judges will check on-chain activity | Flow, AI&Robotics |
| Escrow mechanism (lock + release FLOW) | Core volunteer reward flow | Flow, AI&Robotics |
| `resolveRequest(id, answer)` transaction | Volunteer resolution + payout | Flow |
| Real auth on native (Blocto/WalletConnect) | Mock auth won't impress judges | Flow |
| Transaction receipt display | Show real tx hash + flowscan link | Flow |

#### Gap Severity: CRITICAL

**How to Tackle**:
1. Write + deploy `IrisBounty.cdc` contract on Flow Testnet with `createRequest`, `resolveRequest`, `getRequest` functions
2. Update `flow.ts` to use real contract address
3. Add `resolveRequest()` function for volunteer payout
4. For native auth: use deep-link wallet (Blocto mobile SDK) OR keep mock auth but make all on-chain calls real via API server proxy

---

### 2. STORACHA / IPFS STORAGE

**File**: `artifacts/mobile/lib/storacha.ts` (88 LOC)

#### What We Have

| Feature | Status | Detail |
|---------|--------|--------|
| `uploadToStoracha()` | Code exists | Posts to `api.web3.storage/upload` |
| `base64ToBlob()` | Implemented | Converts image for FormData |
| Metadata JSON | Built | `{ version, timestamp, description, app }` |
| Mock CID generation | Active | Returns `bafybeig` + random chars |
| Real upload logic | Written but inactive | Requires `EXPO_PUBLIC_W3_STORAGE_KEY` |

#### What We Need

| Feature | Why | Bounty Impact |
|---------|-----|--------------|
| Set real W3 Storage API key | Enable actual IPFS uploads | Storacha ($500) |
| Verify CID retrieval | Prove images are actually stored and retrievable | Storacha, Digital Rights |
| History screen showing past CIDs | Demonstrates persistent storage value | Storacha |
| Link CID to Flow transaction | Connect storage proof to blockchain | Flow + Storacha |
| IPFS gateway verification | Show judges the stored image via `ipfs.io/ipfs/{cid}` | All |

#### Gap Severity: HIGH (but quick fix if we have API key)

**How to Tackle**:
1. Get Storacha API key (free tier: 5GB)
2. Set `EXPO_PUBLIC_W3_STORAGE_KEY` in env
3. Set `EXPO_PUBLIC_USE_MOCK_STORACHA=false`
4. Add a "History" screen listing past uploads with IPFS links
5. Verify CID retrieval in demo video

---

### 3. AI VISION (GEMINI)

**File**: `artifacts/mobile/lib/vision.ts` (106 LOC)

#### What We Have

| Feature | Status | Detail |
|---------|--------|--------|
| `describeImage(base64)` | Real API ready | Gemini 2.0 Flash endpoint |
| Accessibility prompt | Optimized | "1-2 direct sentences, no filler words" |
| Mock fallback | 7 descriptions | Realistic demo descriptions |
| Error handling | Complete | HTTP errors, empty responses, network errors |
| Image compression | Real | 800px, 0.75 quality before API call |

#### What We Need

| Feature | Why | Bounty Impact |
|---------|-----|--------------|
| Verifiable AI proof | Hash prompt+response, store on-chain | AI&Robotics ($6K) |
| Multi-language prompts | Global impact story | AI&Robotics, Digital Rights |
| Confidence score | AI self-assessment triggers human fallback | AI&Robotics |
| Prompt versioning | Track which prompt generated which description | AI&Robotics |

#### Gap Severity: LOW (core works, enhancements are polish)

**How to Tackle**:
1. After Gemini returns description, SHA-256 hash the `prompt + response + timestamp`
2. Store hash on Flow alongside the CID in `createRequest()`
3. Add language parameter to `describeImage()` for multi-language TTS
4. Add confidence heuristic (response length < 10 chars = low confidence → trigger human)

---

### 4. VOLUNTEER SYSTEM

**File**: `artifacts/mobile/app/result.tsx` (503 LOC)

#### What We Have

| Feature | Status | Detail |
|---------|--------|--------|
| "Ask a Human" button | UI exists | Large yellow CTA with accessibility label |
| Stage state machine | Implemented | `idle → freezing → escrow → resolved` |
| Pulsing animation | Real | During freezing/escrow stages |
| Toast notification | Real | "1 FLOW token rewarded to Volunteer #429." |
| Speech feedback | Real | Narrates each stage transition |
| Haptic feedback | Real | Heavy impact on tap, success on resolve |

#### What's Hardcoded (ALL of the actual logic)

| Element | Hardcoded Value | Line |
|---------|----------------|------|
| Volunteer answer | `"The expiration date is April 2026."` | result.tsx |
| Transaction ID | `"0x8f4e...3a2b"` | result.tsx |
| Volunteer ID | `#429` | result.tsx |
| Reward amount | `1 FLOW token` | result.tsx |
| Freezing delay | `2000ms` setTimeout | result.tsx |
| Escrow delay | `3000ms` setTimeout | result.tsx |
| Total wait | `5000ms` fixed | result.tsx |

#### What We Need

| Feature | Why | Bounty Impact |
|---------|-----|--------------|
| API endpoint: `POST /api/requests` | Submit image + AI text for human review | AI&Robotics, Digital Rights |
| API endpoint: `GET /api/requests/:id` | Poll for volunteer response | AI&Robotics |
| API endpoint: `POST /api/requests/:id/respond` | Volunteer submits answer | AI&Robotics |
| Volunteer mode in app | Second persona for sighted users | AI&Robotics ($6K) |
| Real-time notification | Push/WebSocket when volunteer responds | AI&Robotics |
| Flow escrow: lock on request, release on response | Real blockchain reward | Flow ($10K) |
| Request queue UI | Volunteer sees pending requests | AI&Robotics, Digital Rights |

#### Gap Severity: CRITICAL (the core differentiator is fake)

**How to Tackle**:
1. **Database**: Create `requests` + `responses` tables in Drizzle schema
2. **API**: Add request CRUD endpoints to Express server
3. **Mobile**: Replace setTimeout mock with real API polling
4. **Volunteer screen**: New screen showing pending requests queue
5. **Flow**: `createRequest` locks 1 FLOW → `resolveRequest` releases to volunteer
6. **Minimum viable**: Even text-based async Q&A through the API would be 10x better than the mock

---

### 5. API SERVER

**File**: `artifacts/api-server/src/` (98 LOC total)

#### What We Have

| Feature | Status | Detail |
|---------|--------|--------|
| Express 5 app | Running | CORS, JSON parsing, Pino logging |
| `GET /api/healthz` | Implemented | Returns `{ status: "ok" }` |
| Pino HTTP logging | Configured | Request/response serialization, header redaction |
| Route structure | Scaffolded | `routes/index.ts` aggregates route modules |
| Drizzle ORM | Configured | Connection pool ready, no schema |
| esbuild | Working | ESM bundle with source maps |

#### What We Need

| Endpoint | Method | Purpose | Priority |
|----------|--------|---------|----------|
| `/api/requests` | POST | Blind user submits image request | CRITICAL |
| `/api/requests` | GET | List pending requests (for volunteers) | CRITICAL |
| `/api/requests/:id` | GET | Get specific request + status | HIGH |
| `/api/requests/:id/respond` | POST | Volunteer submits answer | CRITICAL |
| `/api/requests/:id/status` | GET | Poll request status (for blind user) | HIGH |
| `/api/users` | POST | Register user (blind/volunteer role) | MEDIUM |
| `/api/stats` | GET | Impact stats (total helped, etc.) | MEDIUM |

#### Gap Severity: HIGH

**How to Tackle**:
1. Define DB schema (requests, users, responses tables)
2. Add route files: `requests.ts`, `users.ts`, `stats.ts`
3. Implement CRUD with Drizzle ORM queries
4. Add Zod validation for request/response bodies
5. Update OpenAPI spec + regenerate client hooks

---

### 6. DATABASE

**File**: `lib/db/src/schema/index.ts` (empty template)

#### What We Have

| Feature | Status |
|---------|--------|
| Drizzle ORM configured | Yes |
| PostgreSQL driver (pg) | Installed |
| drizzle-kit push command | Ready |
| Schema file | Empty (commented example only) |
| Tables defined | ZERO |

#### What We Need

```
requests table:
  - id (uuid, primary key)
  - blind_user_addr (text, Flow address)
  - image_cid (text, IPFS CID)
  - ai_description (text)
  - ai_description_hash (text, SHA-256 for verifiable AI)
  - status (enum: pending, claimed, resolved, expired)
  - flow_tx_id (text, escrow transaction)
  - created_at (timestamp)
  - updated_at (timestamp)

responses table:
  - id (uuid, primary key)
  - request_id (uuid, foreign key → requests)
  - volunteer_addr (text, Flow address)
  - answer (text)
  - flow_reward_tx_id (text, payout transaction)
  - created_at (timestamp)

users table:
  - id (uuid, primary key)
  - flow_addr (text, unique)
  - role (enum: blind, volunteer, both)
  - display_name (text)
  - total_requests (integer, default 0)
  - total_responses (integer, default 0)
  - created_at (timestamp)
```

#### Gap Severity: HIGH

**How to Tackle**:
1. Define tables in `lib/db/src/schema/index.ts` using Drizzle pgTable
2. Run `pnpm --filter @workspace/db run push` to sync to PostgreSQL
3. Export schema for use in API server routes

---

### 7. FILECOIN INTEGRATION

#### What We Have

**Nothing.** Filecoin is not referenced anywhere in the codebase.

#### What We Need

| Feature | Why | Bounty Requirement |
|---------|-----|-------------------|
| Synapse SDK or Filecoin Pin | Required by bounty rules | Must use meaningfully |
| Filecoin Calibration Testnet deployment | Required by bounty | Must deploy to testnet |
| Working demo | Required | Show file stored on Filecoin |
| Image archival pipeline | Store images on Filecoin for long-term persistence | Alongside Storacha |

#### Gap Severity: MEDIUM (new integration, but bounty is $2,500)

**How to Tackle**:
1. Install `@lighthouse-web3/sdk` or Synapse SDK
2. Create `lib/filecoin.ts` module (same pattern as storacha.ts)
3. After Storacha upload, also push to Filecoin Calibration Testnet
4. Store Filecoin deal ID alongside IPFS CID
5. Display both storage proofs in result screen

---

### 8. HYPERCERTS INTEGRATION

#### What We Have

**Nothing.** Hypercerts is not referenced anywhere in the codebase.

#### What We Need

| Feature | Why |
|---------|-----|
| Hypercert minting for impact proof | "This app helped X users, Y volunteers responded" |
| Impact data aggregation | Total requests, responses, avg response time |
| Connect to hypercerts SDK | Mint certificates on resolution |

#### Gap Severity: MEDIUM (stretch goal, but $2,500)

**How to Tackle**:
1. Install `@hypercerts-org/sdk`
2. After volunteer resolves request, mint a hypercert recording the impact
3. Add impact dashboard screen showing cumulative stats
4. Link hypercerts to Flow transactions for cross-chain verification

---

### 9. MOBILE APP — MISSING SCREENS

#### What We Have: 3 screens

| Screen | Route | Status |
|--------|-------|--------|
| Auth | `/(tabs)` | Complete |
| Camera | `/camera` | Complete |
| Result | `/result` | Partially mocked |

#### What We Need: 6-7 screens

| Screen | Route | Purpose | Priority |
|--------|-------|---------|----------|
| **Volunteer Queue** | `/volunteer` | Sighted users see pending requests | CRITICAL |
| **Volunteer Response** | `/volunteer/[id]` | View image + type answer | CRITICAL |
| **History** | `/history` | Past captures with IPFS links + status | HIGH |
| **Impact Dashboard** | `/impact` | Stats, hypercerts, community metrics | MEDIUM |
| **Onboarding** | `/onboarding` | Audio-guided tutorial (3 slides) | MEDIUM |
| **Settings** | `/settings` | Language, role toggle, wallet info | LOW |

---

### 10. SUBMISSION REQUIREMENTS

#### What We Have

| Requirement | Status |
|-------------|--------|
| GitHub repo | Exists (but private?) |
| Working demo | Partially (mocked features) |
| Video demo | NOT CREATED |
| Documentation | PROJECT_SUMMARY.md exists |
| Open source | Unclear |

#### What We Need (per bounty rules)

| Deliverable | Status | Priority |
|-------------|--------|----------|
| Summary/description | Needs hackathon-specific writeup | HIGH |
| Demo video (2-3 min) | NOT STARTED | CRITICAL |
| GitHub link (public) | Needs to be made public | HIGH |
| Live demo URL | Replit deployment exists | MEDIUM |
| Documentation | Needs submission-ready README | HIGH |
| Social post (Community Vote) | NOT STARTED | MEDIUM |

---

## Gap Summary Matrix

```
                        CURRENT STATE          TARGET STATE           GAP
                        ─────────────          ────────────           ───
AI Vision           ██████████████████░░   ████████████████████   [90%] LOW
                    Real Gemini 2.0 Flash   + verifiable proofs

Flow Blockchain     ███░░░░░░░░░░░░░░░░░   ████████████████████   [15%] CRITICAL
                    Mock auth + fake tx     Real contract + escrow

Storacha/IPFS       ████░░░░░░░░░░░░░░░░   ████████████████████   [20%] HIGH
                    Code written, mock CIDs  Real uploads + history

Volunteer System    ██░░░░░░░░░░░░░░░░░░   ████████████████████   [10%] CRITICAL
                    UI only, all hardcoded   Real 2-sided marketplace

API Server          █░░░░░░░░░░░░░░░░░░░   ████████████████████   [5%]  HIGH
                    Health endpoint only     Full request routing

Database            ░░░░░░░░░░░░░░░░░░░░   ████████████████████   [0%]  HIGH
                    Empty schema             3+ tables with relations

Filecoin            ░░░░░░░░░░░░░░░░░░░░   ████████████████████   [0%]  MEDIUM
                    Not integrated           Synapse SDK + testnet

Hypercerts          ░░░░░░░░░░░░░░░░░░░░   ████████████████████   [0%]  MEDIUM
                    Not integrated           Impact tracking + minting

App Screens         ██████░░░░░░░░░░░░░░   ████████████████████   [30%] HIGH
                    3 screens (1 mocked)     6-7 screens

Submission          ██░░░░░░░░░░░░░░░░░░   ████████████████████   [10%] CRITICAL
                    No video, no submission  Video + public repo + docs
```

---

## Implementation Priority (by ROI)

### Phase 1: Foundation (Hours 0-8) — Unlocks Flow + AI&Robotics + Storacha

| Task | Unlocks | Effort |
|------|---------|--------|
| 1.1 Define DB schema (requests, responses, users) | API server | 1h |
| 1.2 Build API endpoints (create/list/get/respond requests) | Volunteer system | 3h |
| 1.3 Activate real Storacha uploads (set API key) | Storacha bounty | 0.5h |
| 1.4 Write + deploy IrisBounty.cdc to Flow Testnet | Flow bounty | 2h |
| 1.5 Update flow.ts with real contract address | Flow bounty | 0.5h |
| 1.6 Replace result.tsx mock with real API polling | Core app | 1h |

### Phase 2: Volunteer Mode (Hours 8-14) — Completes the marketplace

| Task | Unlocks | Effort |
|------|---------|--------|
| 2.1 Add role selection (blind user / volunteer) to auth | Two-sided app | 1h |
| 2.2 Build volunteer queue screen (`/volunteer`) | Volunteer UX | 2h |
| 2.3 Build volunteer response screen (`/volunteer/[id]`) | Complete flow | 2h |
| 2.4 Connect Flow escrow (lock on request, release on resolve) | Real rewards | 1h |

### Phase 3: Storage + Verification (Hours 14-18) — Hits Filecoin + verifiable AI

| Task | Unlocks | Effort |
|------|---------|--------|
| 3.1 Add Filecoin integration (Synapse SDK) | Filecoin bounty ($2.5K) | 2h |
| 3.2 Add AI proof hashing (SHA-256 on-chain) | Verifiable AI narrative | 1h |
| 3.3 Build history screen with IPFS + Filecoin links | Storage proof | 1h |

### Phase 4: Polish + Submit (Hours 18-24) — Submission-ready

| Task | Unlocks | Effort |
|------|---------|--------|
| 4.1 Record 2-3 min demo video | All bounty submissions | 1h |
| 4.2 Write submission-ready README | All bounties | 1h |
| 4.3 Make GitHub repo public | Required | 0.1h |
| 4.4 Post on X for Community Vote | Community Vote ($1K) | 0.5h |
| 4.5 Add onboarding flow (3 audio slides) | Polish | 1h |
| 4.6 Multi-language TTS (Arabic, Spanish) | Global impact story | 1h |
| 4.7 Impact stats endpoint + basic dashboard | Hypercerts narrative | 1.5h |

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Flow contract deployment fails | Medium | Critical | Pre-test on Flow Playground first |
| Storacha API key issues | Low | High | Free tier is instant, test upload early |
| No time for Filecoin | High | Medium | Skip if Phase 1-2 take too long ($2.5K sacrifice) |
| Volunteer system too complex | Medium | Critical | MVP: text-only async Q&A, no real-time |
| Demo video quality | Low | High | Screen record with voiceover, keep it simple |
| PostgreSQL not available | Low | High | Replit provides DB, verify connection early |

---

## Decision Points

1. **Flow auth on native**: Real wallet SDK (Blocto) vs. proxy through API server?
   - Recommendation: Proxy through API server (faster, more reliable)

2. **Volunteer matching**: Real-time WebSocket vs. polling?
   - Recommendation: Polling every 3s (simpler, sufficient for demo)

3. **Filecoin**: Worth the $2,500 or skip for time?
   - Recommendation: Attempt if Phase 1-2 finish in <14 hours

4. **Hypercerts**: Worth the $2,500 or skip?
   - Recommendation: Skip unless Phase 3 completes early — narrative alone may suffice

---

*Generated 2026-03-29 — Iris Vision Aid 2 Gap Analysis*
