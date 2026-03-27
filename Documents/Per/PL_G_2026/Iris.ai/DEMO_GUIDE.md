# Iris.ai — Demo Walkthrough & Video Shot List
## Submission Video Recording Guide

**Total target runtime:** 90–120 seconds
**Recording setup:** iPhone (portrait) mirrored to Mac via QuickTime + one terminal window

---

## Pre-Flight Checklist
*Do not start recording until every item here is checked.*

- [ ] `IrisBounty.cdc` deployed to Flow testnet — address saved in `flow.json`
- [ ] `VisionNFT.cdc` deployed to Flow testnet — address saved in `flow.json`
- [ ] At least one test request created on testnet (run `CreateRequest.cdc` from CLI)
- [ ] At least one bounty claimed on testnet (run `ClaimBounty.cdc` from CLI — this mints the VisionNFT)
- [ ] The claimed VisionNFT visible on `testnet.flowscan.io` for the volunteer account
- [ ] A real image uploaded to Storacha — have the CID ready to paste
- [ ] VoiceOver enabled on the iPhone (`Settings → Accessibility → VoiceOver → ON`)
- [ ] iPhone display mirroring active, Do Not Disturb ON, notifications silenced
- [ ] Flow testnet explorer open in browser, pre-loaded on the contract address
- [ ] Terminal window open with `flow.json` project directory as cwd

---

## Shot List

Each shot is labeled with the bounty track it proves.
Record them in this order — it tells a story and hits every criterion.

---

### SHOT 1 — The Problem Statement
**Type:** Presenter to camera (no screen)
**Duration:** 10 seconds
**Bounty:** All tracks (framing)

> Script: *"Two billion people can't see the world around them. Every existing solution
> depends on a company that could shut down tomorrow. Iris.ai is different —
> decentralized, permanent, and requires no seed phrase."*

**Why this shot:** Sets stakes. Judges remember human framing more than feature lists.

---

### SHOT 2 — Passkey Auth (Invisible Web3)
**Type:** Live iPhone screen recording
**Duration:** 20 seconds
**Bounty:** Flow — Account Abstraction / Passkeys

**What to show, step by step:**

1. App open on Home screen. Wallet card shows amber dot: "No Wallet / Tap to connect with Face ID"
2. Tap the **Connect** button.
3. System Face ID sheet appears. Authenticate.
4. Wallet card transitions to green dot: "Wallet Connected" + truncated address `0x1a2b…cdef`

**Proof to display on screen immediately after:**

Open `testnet.flowscan.io` in browser. Paste the wallet address.
The account exists on-chain. Show this for 3 seconds.

**Narration cue:**
> *"No seed phrase. No password. Face ID — and a real Flow account exists on-chain."*

**What this proves to judges:**
- `HybridCustody.cdc` Hybrid Custody account creation
- WebAuthn/FIDO2 passkey via `expo-local-authentication`
- `AccessibilityInfo.announceForAccessibility("Wallet connected.")` is called (VoiceOver speaks it — audible in recording)

---

### SHOT 3 — Accessibility (VoiceOver Navigation)
**Type:** Live iPhone screen recording, VoiceOver ON
**Duration:** 15 seconds
**Bounty:** Frontiers / Accessibility + Flow UX

**What to show:**

1. VoiceOver focus ring visible on screen (black outline around elements).
2. Swipe right — VoiceOver reads: *"Iris.ai — heading"*
3. Swipe right — VoiceOver reads: *"AI Vision, Flow Blockchain"*
4. Swipe right — VoiceOver reads: *"Wallet Connected — [address] — your Flow blockchain address"*
5. Swipe right — VoiceOver reads: *"Request Help — Activates the camera and connects you with an AI vision assistant — button"*

**Narration cue:**
> *"Every element is labeled for VoiceOver. The app is fully operable without looking at the screen."*

**What this proves to judges:**
- `accessibilityRole`, `accessibilityLabel`, `accessibilityHint` set on all elements (visible in `index.tsx`)
- High-contrast Yellow `#FFD600` / Black `#000000` — point this out visually
- Primary CTA is reachable in 4 swipes from app open

---

### SHOT 4 — Camera Capture + AI Description
**Type:** Live iPhone screen recording, VoiceOver ON
**Duration:** 20 seconds
**Bounty:** Frontiers (Physical AI) + Storacha

> **BUILDER NOTE:** This shot requires Phase 3 to be complete.
> If Phase 3 is not done at time of recording, use the Fallback below.

**What to show:**

1. Tap Camera tab.
2. VoiceOver announces: *"Camera active. Point your camera at what you need described,
   then double-tap the Capture button."*
3. Point camera at a real object (a cup, a book, a street scene — something recognizable).
4. Double-tap Capture.
5. VoiceOver announces: *"Photo taken. Uploading to secure storage."*
6. Then: *"Uploaded. Getting description…"*
7. Then — the key moment — VoiceOver reads the full AI description **automatically**,
   without any user navigation. This must be audible in the recording.
8. Result card appears on screen showing the description text + IPFS CID badge.

**Narration cue (over the VoiceOver announcement):**
> *"The description is read aloud the instant it arrives — no button press, no navigation."*

**What this proves to judges:**
- `AccessibilityInfo.announceForAccessibility(description)` fires automatically on result
- Image uploaded to Storacha IPFS (CID visible on result card)
- Real AI vision API call with real result

---

### SHOT 4 — FALLBACK (if Phase 3 not complete at recording time)
**Type:** Split screen — iPhone (Home screen) + Terminal
**Duration:** 20 seconds

Run the following from terminal **while iPhone is visible on screen**:

```bash
# Step 1: Upload a test image to Storacha and get a CID
# (paste a real CID you prepared earlier)
export CID="bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi"

# Step 2: Create a request on testnet
flow transactions send cadence/transactions/CreateRequest.cdc \
  --arg String:"$CID" \
  --arg UFix64:"0.01" \
  --network testnet \
  --signer requester-account
```

Show the terminal output: `IrisBounty: created request #0 | CID: bafy… | bounty: 0.01 FLOW`

**Narration cue:**
> *"The IPFS CID of the image is locked into the smart contract as an escrow request.
> The image on IPFS and the CID on-chain are now permanently linked."*

---

### SHOT 5 — Storacha Proof (Content-Addressed Storage)
**Type:** Browser recording
**Duration:** 10 seconds
**Bounty:** Storacha — Decentralized Storage

**What to show:**

1. Open `https://ipfs.io/ipfs/[YOUR_CID]` in browser.
2. The image loads from IPFS. No central server.
3. Cut to: Flow testnet explorer → the `RequestCreated` event for that request.
4. Zoom in on the `cid` field in the event. It matches the URL you just visited.

**Narration cue:**
> *"The same CID that's in the smart contract is the address of the image on IPFS.
> It cannot be swapped. It cannot be altered. Change one pixel — the hash changes —
> and the contract would reject the claim."*

**What this proves to judges:**
- Image stored on IPFS via Storacha (not a centralized server)
- CID written to `IrisBounty` contract at `createRequest` time
- Content-addressing = tamper-evidence

---

### SHOT 6 — Bounty Claim + VisionNFT (Cadence 1.0 + MetadataViews)
**Type:** Terminal + Browser
**Duration:** 20 seconds
**Bounty:** Flow — Cadence 1.0 + MetadataViews + FungibleToken

**Part A — Run the claim transaction:**

```bash
# Check volunteer FLOW balance BEFORE (write this down / show on screen)
flow scripts execute cadence/scripts/GetFlowBalance.cdc \
  --arg Address:VOLUNTEER_ADDRESS \
  --network testnet

# Send the ClaimBounty transaction
flow transactions send cadence/transactions/ClaimBounty.cdc \
  --arg UInt64:0 \
  --arg String:"A white ceramic coffee mug on a wooden desk. The handle faces right." \
  --network testnet \
  --signer volunteer-account

# Check volunteer FLOW balance AFTER
flow scripts execute cadence/scripts/GetFlowBalance.cdc \
  --arg Address:VOLUNTEER_ADDRESS \
  --network testnet
```

Show the before/after balance. The FLOW moved. One transaction. No intermediary.

**Part B — Show the VisionNFT on FlowScan:**

Open `testnet.flowscan.io/account/[VOLUNTEER_ADDRESS]/nfts`

A VisionNFT should appear. Click it. Show the metadata fields:
- `name`: "Vision #0"
- `description`: The AI description text
- `traits`: `requestID: 0`, `cid: bafy…`, `bountyAmount: 0.01`, `completedAt: [timestamp]`
- `externalURL`: The IPFS gateway link to the image

**Narration cue:**
> *"The FLOW moved atomically inside a Cadence resource — not a mapping, not a ledger entry —
> a resource. And the volunteer now holds a VisionNFT that implements MetadataViews,
> permanently encoding their contribution on-chain."*

**What this proves to judges:**
- **Cadence 1.0:** `VisionRequest` resource, `access(contract)` on `complete()`, `view` function annotations
- **MetadataViews:** `Display`, `Traits`, `ExternalURL`, `Royalties` all visible in the NFT
- **FungibleToken standard:** `FungibleToken.Receiver` deposit in `ClaimBounty.cdc`
- **Atomicity:** Balance before/after — no intermediate state, no escrow service

---

### SHOT 7 — The Closing Argument
**Type:** Presenter to camera
**Duration:** 10 seconds
**Bounty:** All tracks (closing)

> *"Decentralized storage. Trustless escrow. Walletless auth.
> And a blind user who just heard a description of their world —
> without touching a single Web3 interface.
> Iris.ai."*

---

## Full Shot Order Summary

| # | Shot | Type | Duration | Bounty Proven |
|---|---|---|---|---|
| 1 | Problem statement | Presenter | 10s | Framing |
| 2 | Face ID → wallet connected | Live app | 20s | Flow Passkeys / Account Abstraction |
| 3 | VoiceOver navigation | Live app + VoiceOver | 15s | Frontiers Accessibility |
| 4 | Camera → AI description announced | Live app + VoiceOver | 20s | Frontiers Physical AI + Storacha |
| 5 | IPFS image + CID on-chain match | Browser | 10s | Storacha Decentralized Storage |
| 6 | ClaimBounty + VisionNFT metadata | Terminal + Browser | 20s | Flow Cadence 1.0 + MetadataViews |
| 7 | Closing | Presenter | 10s | All |

**Total: ~105 seconds**

---

## Bounty Coverage Map

### Flow — Best App on Flow
| Criterion | Shot # | What the judge sees |
|---|---|---|
| Cadence 1.0 resource-oriented escrow | 6 | FLOW balance before/after one transaction |
| `view` function annotations | 6 | Script output (read-only query, no gas) |
| `access(contract)` capability model | 6 | Terminal: only volunteer can call ClaimBounty |
| FungibleToken standard | 6 | `FungibleToken.Receiver` deposit visible in tx |
| Events (RequestCreated, RequestCompleted) | 5, 6 | FlowScan event log |

### Flow — Account Abstraction
| Criterion | Shot # | What the judge sees |
|---|---|---|
| Passkey / biometric auth | 2 | Face ID prompt on real device |
| No seed phrase | 2 | Zero text input during onboarding |
| Hybrid Custody account | 2 | Address exists on testnet immediately after Face ID |
| Walletless UX | 2, 3 | User never sees a wallet UI |

### Flow — MetadataViews
| Criterion | Shot # | What the judge sees |
|---|---|---|
| NonFungibleToken standard | 6 | NFT appears in account on FlowScan |
| MetadataViews.Display | 6 | Name + description visible in NFT detail |
| MetadataViews.Traits | 6 | requestID, cid, bountyAmount, completedAt |
| MetadataViews.ExternalURL | 6 | IPFS link in NFT metadata |
| ViewResolver interface | 6 | NFT queryable by standard tooling |

### Storacha — Decentralized Storage
| Criterion | Shot # | What the judge sees |
|---|---|---|
| Image stored on IPFS | 4 / 5 | `ipfs.io/ipfs/[CID]` loads the image |
| CID anchored on-chain | 5 | CID in `RequestCreated` event matches IPFS URL |
| No central server | 5 | Image served from IPFS gateway, not iris.ai domain |
| Permanent / tamper-evident | 5 | Narration explains: change image = different CID |
| Decentralized training corpus | 7 | Closing narration |

### Frontiers — Physical AI / Accessibility
| Criterion | Shot # | What the judge sees |
|---|---|---|
| AI applied to physical world | 4 | Real camera → real scene → real description |
| Description announced automatically | 4 | VoiceOver reads description without user tap |
| Visually impaired UX | 3 | Full app navigation via VoiceOver swipes only |
| High-contrast design | 3 | Yellow #FFD600 on Black #000000 visible on screen |
| No visual-only affordances | 3 | Status communicated by label text, not just color |

---

## Recording Tips

**For Shot 2 (Face ID):**
Face ID animation is fast. Record at normal speed — do not speed up. The system biometric
sheet is visually distinctive and judges recognize it immediately.

**For Shot 3 (VoiceOver):**
The VoiceOver focus ring (black outline) must be visible. Ensure screen brightness is at max.
Speak the narration *after* VoiceOver finishes speaking — do not talk over it.
The VoiceOver voice is the proof. Let it play.

**For Shot 4 (AI announcement):**
This is the emotional peak of the video. Let there be a moment of silence just before the
VoiceOver announces the description. The contrast — silence, then a machine accurately
describing the physical world — is the demo's strongest moment.

**For Shot 6 (terminal):**
Increase terminal font size to 18pt before recording. Judges watching a compressed video
on a laptop cannot read 12pt terminal output.
Use `--filter` on the script output to show only the relevant balance line.

**General:**
- Record each shot separately. Edit in post. Do not try to do it in one take.
- The iPhone mirror (QuickTime) is cleaner than pointing a camera at the phone.
- Silence is fine. Do not fill pauses with filler words.

---

*Iris.ai Demo Guide — v1.0 — 2026-03-26*
*Update Shot 4 fallback status once Phase 3 (Camera + AI + Storacha) is complete.*
