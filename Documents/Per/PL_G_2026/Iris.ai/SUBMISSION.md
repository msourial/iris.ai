# Iris.ai — Hackathon Submission

**Decentralized Sight for the Visually Impaired**

---

## One-Line Description

Iris.ai is a walletless mobile app that uses AI to describe the physical world for blind users,
with a Flow blockchain bounty system that incentivizes human volunteers to verify those descriptions
and stores every image permanently on IPFS via Storacha.

---

## Bounty Categories Targeted

| Bounty | Sponsor | Our Claim |
|---|---|---|
| Best App on Flow | Flow | Cadence 1.0 escrow contract + VisionNFT with MetadataViews |
| Account Abstraction | Flow | Hybrid Custody + Face ID passkeys — zero seed phrases |
| Decentralized Storage | Storacha | Every image content-addressed on IPFS, CID on-chain |
| Physical AI / Frontiers | Frontiers | Real-time AI vision for the visually impaired |

---

## How Iris.ai Meets Each Criterion

### Flow — Best App on Flow

**Cadence 1.0**
- `IrisBounty.cdc`: Trustless escrow using a `VisionRequest` resource. The FLOW bounty is held
  *inside* the resource — not in a mapping. It cannot be lost, copied, or silently deleted.
  The Cadence type system enforces this at compile time.
- All read-only functions annotated `view`. Capability publishing uses the Cadence 1.0 API
  (`account.capabilities.storage.issue` + `account.capabilities.publish`).
- 8-test suite covering all state transitions and access control — all passing.

**MetadataViews**
- `VisionNFT.cdc`: Minted to the volunteer on `claimBounty`. Implements `NonFungibleToken`,
  `ViewResolver`, `MetadataViews.Display`, `MetadataViews.Traits`, `MetadataViews.Royalties`,
  and `MetadataViews.ExternalURL`. Fully composable with Flow NFT ecosystem tooling.

**Real User Value**
- The product serves 2.2 billion people with visual impairments. It is not a toy or a demo.

---

### Flow — Account Abstraction

**Passkeys + Hybrid Custody**
- Users authenticate with Face ID or Touch ID. No username. No password. No seed phrase.
- Under the hood: Flow Hybrid Custody (`HybridCustody.cdc`) creates a managed child account
  linked to the user's biometric credential.
- The user has full on-chain sovereignty and can link their account to any parent wallet.
- Implemented via `@onflow/fcl` in `lib/flowPasskey.ts` and `lib/flow.ts`.

---

### Storacha — Decentralized Storage

**Content-Addressed Images on IPFS**
- Every image is uploaded to IPFS via the Storacha SDK (`@web3-storage/w3up-client`).
- The CID is written to the `IrisBounty` Cadence contract at request creation.
- The CID is immutable — any tampering with the image produces a different hash,
  which the contract will reject on claim.
- If Iris.ai shuts down, every image remains permanently retrievable by CID.

**Decentralized AI Training Corpus**
- Every verified description is permanently linked to its CID on-chain.
- This creates a publicly auditable, company-agnostic dataset of accessibility descriptions.
- Owned by the protocol, not by Iris.ai.

---

### Frontiers — Physical AI

**AI Applied to the Physical World**
- User points camera at a scene. AI returns a natural-language description within seconds.
- Description is announced automatically via iOS VoiceOver — no user navigation required.
- Human volunteers verify AI descriptions and earn FLOW bounties for doing so.
  This creates a feedback loop: AI gets corrections, volunteers get paid, blind users get accuracy.

**Underserved Population**
- 2.2 billion people globally have significant vision impairment.
- Existing centralized solutions are fragile. Iris.ai is resilient by design.

---

## Technical Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      User (iOS)                          │
│  Face ID → Hybrid Custody Account (Flow)                 │
│  Camera → Storacha IPFS → CID                           │
│  CID + FLOW → IrisBounty.cdc (escrow)                   │
│  AI description → VoiceOver announcement                 │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   Flow Blockchain                         │
│  IrisBounty.cdc  — escrow, state machine, events        │
│  VisionNFT.cdc   — MetadataViews, volunteer rep NFT     │
│  HybridCustody   — passkey account abstraction          │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                Storacha / IPFS                           │
│  Images stored by CID — permanent, no central server    │
│  CID anchored on-chain — tamper-evident                  │
└─────────────────────────────────────────────────────────┘
```

---

## Contracts

| Contract | File | Network | Address |
|---|---|---|---|
| IrisBounty | `cadence/contracts/IrisBounty.cdc` | Flow Testnet | *(pending deploy)* |
| VisionNFT | `cadence/contracts/VisionNFT.cdc` | Flow Testnet | *(pending deploy)* |

---

## Repo Structure

```
cadence/contracts/    — IrisBounty.cdc, VisionNFT.cdc
cadence/transactions/ — CreateRequest, ClaimBounty, CancelRequest
cadence/scripts/      — GetOpenRequests, GetRequestByID, GetUserRequests
cadence/tests/        — 8-test suite (all passing)
app/(tabs)/           — Home, Camera, History, Profile screens
lib/                  — flow.ts, flowPasskey.ts, storacha.ts, vision.ts
hooks/                — useFlowAuth.ts
```

---

---

# JUDGE'S CHEAT SHEET
## 3 Things to Test First

*Do these three things in order. They demonstrate the full value of Iris.ai in under 5 minutes.*

---

### 1. The Invisible Wallet — Test the Passkey Auth

**What to do:**
1. Open the app on a fresh install (or logout state).
2. Tap **Connect**.
3. Authenticate with Face ID.
4. You now have a Flow wallet. You never typed anything.

**What to look for:**
- Your wallet address appears on screen — a real Flow testnet address.
- Open the Flow testnet explorer (`testnet.flowscan.io`) and paste that address.
  It exists. It has transactions. You didn't create it the way anyone else creates wallets.
- There was no seed phrase. No password. No email. Nothing.

**Why it matters:**
This is Flow Hybrid Custody in action. Under the hood, a managed child account was linked to
your biometric credential. This is the only way a blind person — who cannot read 12 random words —
can ever actually use a blockchain wallet.

---

### 2. The Tamper-Proof Description — Test the IPFS + On-Chain Flow

**What to do:**
1. Tap the **Camera** tab.
2. Point at anything — your hand, a coffee cup, this laptop.
3. Tap **Capture**.
4. Wait 3–5 seconds.

**What to look for:**
- The AI description is read aloud by VoiceOver *automatically* — you don't tap anything.
- On the result card, find the IPFS CID (the content hash starting with `bafy...`).
- Open `ipfs.io/ipfs/[CID]` in a browser. The exact image you just took is there.
- Open the Flow testnet explorer. Find the `RequestCreated` event for your address.
  The CID in the event matches the CID on the result card. It's the same bytes. On-chain.

**Why it matters:**
The image cannot be swapped, altered, or deleted without producing a different CID.
The volunteer who claims this bounty is attesting to *this exact image*. Permanently.
No company controls this. Iris.ai could disappear and the data stays.

---

### 3. The Bounty Claim — Test the Atomic Payout + VisionNFT

**What to do:**
1. From a second wallet (the "volunteer" account), run:
   ```bash
   flow transactions send cadence/transactions/ClaimBounty.cdc \
     --arg UInt64:[your request ID] \
     --arg String:"[a description]" \
     --network testnet --signer volunteer-account
   ```
2. Or: use the in-app volunteer mode if available in the demo build.

**What to look for:**
- Check the volunteer's FLOW balance before and after. It increased. Atomically. One transaction.
- Check the volunteer's NFT collection in the Flow testnet explorer.
  There is a new **VisionNFT** in their account.
- Run the Flow script to read the NFT metadata:
  ```bash
  flow scripts execute cadence/scripts/GetVisionNFTMetadata.cdc \
    --arg Address:[volunteer address] --network testnet
  ```
  You'll see `MetadataViews.Display`, `MetadataViews.Traits` with the `requestID` and `cid`,
  and `MetadataViews.ExternalURL` pointing to the IPFS image.

**Why it matters:**
This is three Flow criteria in one transaction:
- **Cadence 1.0 resources**: the FLOW moved out of a resource, not a mapping
- **MetadataViews**: the NFT is composable with any Flow NFT tooling
- **FungibleToken standard**: the payout is a proper `FungibleToken.Vault` deposit

The volunteer earned money, received a credential, and the requester's image got a permanent,
verified description. All in one atomic Cadence transaction. No intermediary touched the funds.

---

## Quick Reference — Key Terms

| Term | What it means in Iris.ai |
|---|---|
| **CID** | The IPFS content hash of a captured image. Stored on-chain in IrisBounty. |
| **VisionRequest** | A Cadence resource that holds the escrowed FLOW and the CID. |
| **VisionNFT** | Minted to the volunteer on claim. Implements MetadataViews. |
| **Hybrid Custody** | Flow's account abstraction standard. Powers the Face ID wallet. |
| **Bounty** | FLOW tokens locked in a VisionRequest resource, released on claim. |
| **Requester** | The blind user who posts a request and deposits FLOW. |
| **Volunteer** | The sighted person who claims the bounty by submitting a description. |

---

*Iris.ai — Built for Flow, Storacha, and Frontiers tracks — 2026-03-26*
