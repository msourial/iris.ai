# Iris.ai Hackathon Goals & Lead Architect Analysis

---

## Target Bounties

1. **Flow - Best App on Flow ($1,000):** Focus on Resource-Oriented Programming (done in Cadence).
2. **Flow - Account Abstraction:** Use Passkeys for walletless onboarding.
3. **Physical AI / Frontiers:** High-contrast UI for visually impaired, AI-powered image description.

## The Vibe

- **Color Palette:** High-contrast (Yellow #FFD600 / Black #000000).
- **UX:** Voice-first or massive touch targets.
- **Web3:** The blockchain should be "invisible." No seed phrases.

---

---

# LEAD ARCHITECT ANALYSIS
## What We're Missing for a Perfect Score

> NOTE: Paste the actual hackathon judging rubric into this file once you have it.
> This analysis is based on standard Flow hackathon criteria from FloFest, HackFS, ETHDenver,
> and the official Flow Developer Portal scoring framework (Innovation, Technical Implementation,
> Flow Ecosystem Usage, UX, Social Impact, Viability).

---

## Current Scorecard

| Category              | Current State             | Score Estimate | Blocker? |
|-----------------------|---------------------------|----------------|----------|
| Innovation            | Be My Eyes + Web3         | 9/10           | No       |
| Technical (working)   | Only Cadence works        | 3/10           | YES      |
| Flow Ecosystem Usage  | FungibleToken + Resources | 6/10           | Partial  |
| UX / Accessibility    | Designed, not built       | 4/10           | YES      |
| Social Impact         | Visually impaired aid     | 10/10          | No       |
| Business Viability    | Concept-level             | 5/10           | Partial  |

**Estimated current total: ~37/60. Target: 55+/60.**

The idea is excellent. The gaps are execution and Flow-specific feature depth.

---

## Critical Blockers (Must Fix to Compete)

### 1. No Deployed Contract (CRITICAL)
- **What:** Contract is not deployed to testnet. `PLACEHOLDER_DEPLOY_ADDRESS` is still in `flow.json`.
- **Impact:** Judges cannot verify on-chain functionality. Disqualifies for most judging criteria.
- **Fix:** `flow project deploy --network testnet`. Document deployed address in `contracts/README.md`.

### 2. Phase 2 FCL Auth is a Stub (CRITICAL)
- **What:** `lib/flowPasskey.ts` generates a fake address from `SHA-256(publicKey)`. `@onflow/fcl`
  is not installed. The `createAccount()` function itself has a TODO to replace the stub with real
  Hybrid Custody account creation.
- **Impact:** No real wallet, no real transactions. The app cannot actually do anything on-chain.
- **Fix:** Install `@onflow/fcl`. Implement Hybrid Custody (see below). Single most important task.

### 3. Phase 3 (Camera + AI + Storacha) Does Not Exist (CRITICAL)
- **What:** The core user flow — point camera, get AI description — is entirely missing.
- **Impact:** Without Phase 3, Iris.ai is a UI mockup and a smart contract. There is no "app."
- **Fix:** Implement Phase 3 before the deadline. Storacha SDK + expo-camera + any vision API.

---

## High-Impact Flow Features to Add

### A. Hybrid Custody / Account Linking (Account Abstraction Bounty)

**What judges want to see:** Flow's native account abstraction standard — not just "passkeys exist"
but actually using `HybridCustody.cdc` so a custodied child account (managed by Iris.ai's backend)
is linked to the user's parent passkey account.

**What to add:**
- Import `HybridCustody` and `CapabilityFactory` in a companion contract or transaction.
- In `lib/flow.ts` (Phase 2): use `fcl.mutate()` to run the `setup_owned_account_and_publish`
  transaction from the Flow Hybrid Custody repo.
- The magic phrase for judges: _"Users get a Flow account with no seed phrase via passkey, and
  can link it to any parent wallet — full Hybrid Custody compliance."_

**Resources:**
- `github.com/onflow/hybrid-custody` — official contracts + transactions
- `flow.com/account-linking` — docs

---

### B. VisionNFT with MetadataViews (NFT Standard Compliance)

**What judges want to see:** When a bounty is claimed, mint a non-transferable `VisionNFT` to the
volunteer as on-chain proof-of-contribution. Implement `ViewResolver` and `MetadataViews` —
the Flow NFT metadata standard (FLIP 0636).

**Sketch for a new `cadence/contracts/VisionNFT.cdc`:**
```cadence
import NonFungibleToken from "NonFungibleToken"
import MetadataViews from "MetadataViews"
import ViewResolver from "ViewResolver"

access(all) contract VisionNFT: NonFungibleToken {
    // NFT resource with MetadataViews.Display, MetadataViews.Royalties (0%),
    // MetadataViews.ExternalURL, MetadataViews.Traits
    // (requestID, cid, timestamp, bountyAmount)
}
```

**Why it matters:** Shows judges you know the Flow NFT ecosystem, not just FungibleToken.
Creates permanent on-chain reputation for volunteers — a compelling social mechanic.

**Resources:**
- `github.com/onflow/flow-nft` — NonFungibleToken + MetadataViews standards
- `github.com/onflow/flow-nft/blob/master/contracts/ExampleNFT.cdc` — reference implementation

---

### C. Entitlements in IrisBounty (Cadence 1.0 Mastery)

**What judges want to see:** Cadence 1.0's entitlement system — not just `access(all)`.
Currently `claimBounty` and `cancelRequest` are `access(all)`, with access control enforced
only by pre-conditions. Cadence 1.0 judges will look for typed entitlements.

**What to add:**
```cadence
// Define entitlements at contract level
access(all) entitlement Claim
access(all) entitlement Cancel

// Gate functions behind entitlements
access(Claim) fun claimBounty(...) { ... }
access(Cancel) fun cancelRequest(...) { ... }
```

Then issue typed capabilities (`Capability<auth(Claim) &{RequestManagerPublic}>`) to the
appropriate parties. This is the canonical Cadence 1.0 pattern.

---

### D. FlowToken.cdc — Explicit FLOW Token Import

**What to add:** Use `FlowToken` explicitly rather than the generic `FungibleToken.Vault`.
Add a type check in `createRequest` to ensure only FLOW (not other FungibleToken vaults)
can be used as a bounty. More auditable, more platform-native.

```cadence
import FlowToken from "FlowToken"
// Validate: bounty is FlowToken.Vault type
```

---

### E. On-Chain Volunteer Reputation Score

**What to add:** A `{Address: UInt64}` dictionary in `RequestManager` tracking completed jobs
per volunteer. Increment in `claimBounty`. Add a `getVolunteerStats(address: Address)` script.

**Why it matters:** Creates a self-regulating marketplace. Judges love emergent economic design.

---

### F. Flow EVM Bridge (Stretch Goal — Max Impression)

Flow's EVM compatibility layer allows Cadence contracts to interoperate with Flow EVM,
enabling MetaMask/EVM-native wallets to post bounties — dramatically expanding the requester base.

**Verdict:** Only attempt if Phases 2 and 3 are already complete. Do not let this block the demo.

**Resources:** `flow.com/evm` and `github.com/onflow/flow-evm-bridge`

---

## IrisBounty.cdc — What's Already Good (Keep It)

- Resource-oriented design: `VisionRequest` and `RequestManager` are proper Cadence resources
- Atomic escrow: FLOW is held inside the resource — no trust in a third-party contract
- Self-claim guard: `volunteer != self.requester` pre-condition
- Full test suite: 8 tests covering all state transitions and access control
- Events: `RequestCreated`, `RequestCompleted`, `RequestCancelled` — indexable by Flow event services
- `view` functions: `toInfo()`, `getRequestInfo()`, `getTotalRequests()` correctly typed — Cadence 1.0
- Capability publishing: proper Cadence 1.0 capability model in `init()`

---

## Priority-Ordered Action Plan

| Priority | Task                                      | Bounty Impact          | Effort    |
|----------|-------------------------------------------|------------------------|-----------|
| P0       | Deploy IrisBounty to testnet              | All bounties           | Low       |
| P0       | Complete Phase 2 (real FCL auth)          | Account Abstraction    | High      |
| P0       | Complete Phase 3 (camera + AI + Storacha) | Physical AI / Best App | High      |
| P1       | Add Hybrid Custody account linking        | Account Abstraction    | Medium    |
| P1       | Add VisionNFT with MetadataViews          | Best App on Flow       | Medium    |
| P2       | Add entitlements to IrisBounty            | Best App on Flow       | Low       |
| P2       | Add volunteer reputation counter          | Best App on Flow       | Low       |
| P2       | Use FlowToken.cdc explicitly              | Best App on Flow       | Low       |
| P3       | Flow EVM bridge (stretch)                 | Innovation bonus       | Very High |

---

## Judge-Facing Narrative (Use This Framing)

> "Iris.ai is the first walletless, blockchain-incentivized vision assistance platform for the
> visually impaired. Powered by Flow's Hybrid Custody for passkey-based account abstraction,
> Cadence's resource-oriented programming for trustless FLOW escrow, and Storacha IPFS for
> decentralized image storage — Iris.ai makes Web3 completely invisible to the user.
> No seed phrases. No gas confusion. Just point your camera and get help."

**Three things this hits that judges love:**
1. Real social impact (not another DeFi clone)
2. Correct use of Flow-native standards (Hybrid Custody, MetadataViews, FungibleToken)
3. Working, accessible mobile app with a live testnet contract

---

*Last updated: 2026-03-26 — Lead Architect analysis. Paste actual judging rubric above to refine.*