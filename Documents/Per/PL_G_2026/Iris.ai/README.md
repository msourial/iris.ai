# Iris.ai

### Decentralized Sight for the Visually Impaired

> Point your camera. Get a description. Trust the result.
> No app store account. No seed phrase. No middleman.

---

## The Mission

Every day, 2.2 billion people with visual impairments navigate a world that wasn't designed for them.
Existing solutions — like Be My Eyes — depend on centralized volunteers, centralized servers, and a
single company's continued goodwill. If that company shuts down, the service disappears.

**Iris.ai is different.**

We use AI to describe the physical world instantly, and Flow Blockchain to create a self-sustaining,
decentralized economy that incentivizes human volunteers to verify and improve those descriptions.
The data is stored permanently on IPFS via Storacha. The incentive layer runs on Cadence smart
contracts. The user touches none of it — they just see.

This is what we call **Invisible Web3**: blockchain doing real work, completely hidden from the
person who needs help.

---

## How It Works

```
User points camera
       │
       ▼
Image captured → uploaded to IPFS via Storacha
       │
       ▼
CID (content hash) written to Flow Blockchain escrow
       │
       ▼
AI returns instant description → read aloud via VoiceOver
       │
       ▼
Human volunteer verifies/improves description → claims FLOW bounty
       │
       ▼
Volunteer receives FLOW. CID + description permanently on-chain.
```

No image ever touches a centralized server. No description can be silently altered.
Every transaction is publicly verifiable on Flow.

---

## The Invisible Web3

The hardest problem in Web3 adoption isn't technology — it's the wallet.

Seed phrases are 12 random words that a blind person must memorize and never lose.
That is not an acceptable user experience for anyone, let alone someone with a visual impairment.

**Iris.ai uses Flow's Hybrid Custody + Passkeys to eliminate the wallet entirely.**

- The user authenticates with Face ID or Touch ID — the same gesture they use to unlock their phone.
- Under the hood, Flow creates a Hybrid Custody account: a managed child account linked to the
  user's biometric identity.
- The user's FLOW balance, transaction history, and earned reputation exist on-chain.
- They will never see a private key, a seed phrase, or a gas fee UI.

This is real account abstraction — not a custodial workaround, but Flow's native
`HybridCustody.cdc` standard, giving users full self-sovereignty behind a Face ID prompt.

---

## Verifiable Data

When a volunteer describes what your camera sees, how do you know they told the truth?

With Iris.ai, every image is stored on IPFS via **Storacha**. The CID (content-addressed hash)
is written into the `IrisBounty` Cadence contract at the moment of the request. This means:

- The image cannot be altered after upload — any change produces a different CID.
- The volunteer's description is linked to that exact CID, on-chain, permanently.
- Anyone can re-verify: fetch the image from IPFS by CID, re-run the AI, compare.
- Over time, this creates a **decentralized training corpus** — a publicly auditable dataset
  of real-world accessibility descriptions, owned by no single company.

---

## Flow Ecosystem Criteria — Explicit Callout

*This section exists for judges. Each Flow bounty criterion is addressed directly.*

### Cadence 1.0
IrisBounty is written entirely in **Cadence 1.0**. It uses:
- `access(all)` / `access(self)` / `access(contract)` capability-based access control
- `view` function annotations on all read-only methods (`toInfo()`, `getRequestInfo()`, `getTotalRequests()`)
- Resource destruction via `<-` move semantics — escrowed FLOW cannot be silently lost
- Pre-conditions (`pre { ... }`) for all state-mutating functions
- Cadence 1.0 capability publishing (`account.capabilities.storage.issue` + `account.capabilities.publish`)

### MetadataViews
When a volunteer claims a bounty, a **VisionNFT** is minted to their account. This NFT implements:
- `NonFungibleToken` (Flow NFT standard)
- `ViewResolver` interface
- `MetadataViews.Display` — name, description, thumbnail
- `MetadataViews.Traits` — `requestID`, `cid`, `bountyAmount`, `completedAt`
- `MetadataViews.Royalties` — set to 0% (non-commercial public-good asset)
- `MetadataViews.ExternalURL` — links to the IPFS-hosted image

This makes every volunteer contribution queryable and composable within the Flow NFT ecosystem.

### Passkeys / Account Abstraction
Iris.ai uses **Flow's Hybrid Custody standard** (`HybridCustody.cdc`) for walletless onboarding:
- Authentication: WebAuthn/FIDO2 passkey via iOS Face ID or Touch ID
- Account creation: managed child account linked to the user's biometric credential
- No seed phrase, no private key exposure, no gas fee UI
- Full on-chain sovereignty: the user owns their account and can link it to any parent wallet
- Implementation: `lib/flowPasskey.ts` + `lib/flow.ts` using `@onflow/fcl` with Hybrid Custody transactions

---

## Smart Contract: IrisBounty

Built in **Cadence 1.0** — Flow's resource-oriented programming language.

```cadence
// VisionRequest is a Cadence Resource — it physically holds the FLOW escrow.
// It cannot be copied, lost, or silently deleted. The language enforces this.

access(all) resource VisionRequest {
    access(self) var escrow: @{FungibleToken.Vault}  // FLOW locked here
    access(all) let cid: String                       // IPFS content hash
    access(all) var status: RequestStatus             // open → completed/cancelled
}
```

Key properties of the contract:

| Property | Implementation |
|---|---|
| Trustless escrow | FLOW locked inside `VisionRequest` resource — not in a mapping |
| Atomic payout | `claimBounty` withdraws and deposits in one transaction |
| No self-claims | Pre-condition: `volunteer != requester` |
| Full refunds | `cancelRequest` returns 100% of escrowed FLOW |
| Immutable history | Completed/cancelled requests remain on-chain |
| Standard compliance | `FungibleToken`, `MetadataViews`, `ViewResolver` |

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Mobile | React Native + Expo | Cross-platform, fast iteration |
| Styling | NativeWind (Tailwind) | High-contrast, accessible design system |
| Auth | Flow FCL + Hybrid Custody | Walletless passkey onboarding |
| Blockchain | Flow (Cadence 1.0) | Resource-oriented, human-scale gas fees |
| Storage | Storacha + IPFS | Permanent, content-addressed, decentralized |
| AI | Vision API (configurable) | Instant scene description |
| Accessibility | iOS VoiceOver + ARIA | First-class, not an afterthought |

---

## Accessibility Design Principles

Iris.ai is built accessibility-first — not accessibility-added.

- **High contrast everywhere:** Yellow `#FFD600` on Black `#000000`. WCAG AAA compliant.
- **No time pressure:** No auto-dismissing toasts. Descriptions stay on screen until dismissed.
- **VoiceOver-native:** Every interactive element has an `accessibilityLabel`. AI descriptions
  are announced immediately via `AccessibilityInfo.announceForAccessibility()`.
- **Large touch targets:** Minimum 60×60pt tap areas. Primary CTA is full-width.
- **No visual-only affordances:** Status is communicated by text and haptics, not color alone.
- **No seed phrases, ever:** The auth flow requires zero text input from a blind user.

See [ACCESSIBILITY_GUIDE.md](ACCESSIBILITY_GUIDE.md) for the full VoiceOver specification.

---

## Project Structure

```
iris.ai/
├── app/                    # Expo Router screens
│   └── (tabs)/
│       ├── index.tsx       # Home — passkey auth + request CTA
│       ├── camera.tsx      # Camera capture + AI description
│       ├── history.tsx     # Past requests (CID + description)
│       └── profile.tsx     # Wallet address + reputation score
├── cadence/
│   ├── contracts/
│   │   ├── IrisBounty.cdc  # Bounty escrow contract
│   │   └── VisionNFT.cdc   # Volunteer proof-of-contribution NFT
│   ├── transactions/       # CreateRequest, ClaimBounty, CancelRequest
│   ├── scripts/            # GetOpenRequests, GetRequestByID, GetUserRequests
│   └── tests/              # 8-test suite (all passing)
├── lib/
│   ├── flow.ts             # FCL configuration + Hybrid Custody
│   ├── flowPasskey.ts      # Biometric account management
│   ├── storacha.ts         # IPFS upload via Storacha SDK
│   └── vision.ts           # AI vision API wrapper
└── hooks/
    └── useFlowAuth.ts      # Auth state machine
```

---

## Deployed Contracts

| Network | Contract | Address |
|---|---|---|
| Flow Testnet | IrisBounty | *(deploy in progress)* |
| Flow Testnet | VisionNFT | *(deploy in progress)* |

---

## Run Locally

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Add: EXPO_PUBLIC_STORACHA_API_KEY, EXPO_PUBLIC_VISION_API_KEY

# Run on iOS simulator
npm run ios
```

---

## The Bigger Picture

The FLOW bounty system does more than pay volunteers. It creates a public good:

1. Every verified description is linked to a content-addressed image on IPFS.
2. This corpus is owned by no company — it's a public dataset on a decentralized network.
3. Future AI models can be trained on it. Researchers can audit it. Advocates can cite it.
4. Volunteers are compensated for their contribution to this dataset in real time.

Iris.ai is not just an app. It is infrastructure for decentralized accessibility.

---

*Built with Flow Blockchain, Storacha, and the conviction that the internet should be accessible to everyone.*
